use std::path::Path;

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

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(navigation_guard)
        .setup(|app| {
            use tauri_plugin_shell::ShellExt;
            use tauri_plugin_shell::process::CommandEvent;

            // Run anime-server sidecar
            let sidecar_command = app.shell().sidecar("anime-server")
                .expect("failed to create `anime-server` binary command")
                .env("PORT", "4173");
            let (mut rx, mut _child) = sidecar_command
                .spawn()
                .expect("Failed to spawn sidecar");

            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line) = event {
                        println!("[anime-server] {}", String::from_utf8_lossy(&line));
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![log_runtime_event])
        .run(tauri::generate_context!())
        .expect("error while running RoninPLEX application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_runtime_logging() {
        log_runtime_event("TEST".to_string(), "Test event logging verification".to_string());
    }
}
