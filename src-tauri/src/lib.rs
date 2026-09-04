use std::path::Path;

pub mod download;

#[tauri::command]
fn log_runtime_event(tag: String, message: String) {
    let line = format!("[{}] {}", tag, message);
    eprintln!("{}", line);
    if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") {
        let log_dir = Path::new(&local_app_data).join("RoninPLEX");
        let _ = std::fs::create_dir_all(&log_dir);
        let log_path = log_dir.join("playback_runtime.log");
        if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(log_path) {
            use std::io::Write;
            let _ = writeln!(file, "{}", line);
        }
    }
}

use keyring::Entry;

const SERVICE_NAME: &str = "RoninPLEX_TMDB";
const USER_NAME: &str = "api_key";

#[tauri::command]
fn store_tmdb_credential(key: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, USER_NAME).map_err(|e| e.to_string())?;
    entry.set_password(&key).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn is_tmdb_credential_configured() -> bool {
    if let Ok(entry) = Entry::new(SERVICE_NAME, USER_NAME) {
        return entry.get_password().is_ok();
    }
    false
}

#[tauri::command]
fn remove_tmdb_credential() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, USER_NAME).map_err(|e| e.to_string())?;
    let _ = entry.delete_credential(); // ignore error if not exists
    Ok(())
}

#[tauri::command]
fn get_tmdb_credential() -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, USER_NAME).map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

use std::sync::{Arc, Mutex};
use tauri::Manager;
use tauri_plugin_shell::process::CommandChild;

pub struct SidecarState {
    pub child: Arc<Mutex<Option<CommandChild>>>,
}

#[tauri::command]
fn exit_application(app: tauri::AppHandle) {
    kill_sidecar(&app);
    app.exit(0);
}

#[tauri::command]
fn open_in_browser(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let trimmed = url.trim();
    if !trimmed.starts_with("http://") && !trimmed.starts_with("https://") {
        return Err("Security Error: Only http:// and https:// URLs are allowed".to_string());
    }
    use tauri_plugin_shell::ShellExt;
    app.shell().open(trimmed, None).map_err(|e| format!("Failed to open browser: {}", e))?;
    Ok(())
}

fn kill_sidecar(app: &tauri::AppHandle) {
    if let Some(state) = app.try_state::<SidecarState>() {
        if let Ok(mut lock) = state.child.lock() {
            if let Some(child) = lock.take() {
                let _ = child.kill();
                eprintln!("[Sidecar] Terminated anime-server child process cleanly");
            }
        }
    }
}

// Tauri 2 Application Logic
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let navigation_guard = tauri::plugin::Builder::<tauri::Wry>::new("navigation-guard")
        .on_navigation(|_webview, url| {
            let is_allowed = url.scheme() == "tauri"
                || match url.host_str() {
                    Some(host) => host == "localhost" || host == "tauri.localhost" || host.ends_with(".localhost"),
                    None => false,
                };
            if !is_allowed {
                eprintln!("[Security] Prevented top-level navigation to: {}", url);
            }
            is_allowed
        })
        .build();

    let child_holder = Arc::new(Mutex::new(None));
    let child_holder_setup = child_holder.clone();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(navigation_guard)
        .setup(move |app| {
            use tauri_plugin_shell::ShellExt;
            use tauri_plugin_shell::process::CommandEvent;

            app.manage(SidecarState {
                child: child_holder_setup.clone(),
            });

            app.manage(download::DownloadState::new());

            // Run anime-server sidecar
            match app.shell().sidecar("anime-server") {
                Ok(cmd) => {
                    let sidecar_command = cmd.env("PORT", "4173");
                    match sidecar_command.spawn() {
                        Ok((mut rx, child)) => {
                            if let Ok(mut lock) = child_holder_setup.lock() {
                                *lock = Some(child);
                            }
                            tauri::async_runtime::spawn(async move {
                                while let Some(event) = rx.recv().await {
                                    if let CommandEvent::Stdout(line) = event {
                                        println!("[anime-server] {}", String::from_utf8_lossy(&line));
                                    }
                                }
                            });
                        }
                        Err(e) => eprintln!("[Warning] Failed to spawn anime-server sidecar: {}", e),
                    }
                }
                Err(e) => eprintln!("[Warning] Failed to create anime-server binary command: {}", e),
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            log_runtime_event,
            store_tmdb_credential,
            is_tmdb_credential_configured,
            remove_tmdb_credential,
            get_tmdb_credential,
            exit_application,
            open_in_browser,
            download::start_download,
            download::pause_download,
            download::resume_download,
            download::cancel_download,
            download::delete_download,
            download::get_downloads,
            download::get_download_settings,
            download::update_download_settings,
            download::open_download_folder,
            download::open_download_file
        ])
        .build(tauri::generate_context!())
        .expect("error while building RoninPLEX application");

    app.run(|app_handle, event| {
        match &event {
            tauri::RunEvent::WindowEvent { label, event: tauri::WindowEvent::Destroyed, .. } => {
                if label == "main" {
                    let has_pip = app_handle.get_webview_window("pip-window").is_some();
                    if !has_pip {
                        kill_sidecar(app_handle);
                        app_handle.exit(0);
                    }
                } else if label == "pip-window" {
                    if let Some(main) = app_handle.get_webview_window("main") {
                        if let Ok(false) = main.is_visible() {
                            let _ = main.show();
                            let _ = main.set_focus();
                        }
                    }
                }
            }
            tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
                kill_sidecar(app_handle);
            }
            _ => {}
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_runtime_logging() {
        log_runtime_event("TEST".to_string(), "Test event logging verification".to_string());
    }

    #[test]
    fn test_download_state_init() {
        let state = download::DownloadState::new();
        let items = state.items.lock().unwrap();
        let _ = items.len();
        let settings = state.settings.lock().unwrap();
        assert!(settings.max_concurrent_downloads > 0);
        assert!(!settings.download_dir.is_empty());
    }
}
