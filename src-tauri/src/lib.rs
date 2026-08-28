use std::path::{Path, PathBuf};

/// Safely locate the VLC executable on the host system without shell execution.
fn find_vlc_path() -> Option<PathBuf> {
    // 1. Direct standard Windows installation paths
    #[cfg(target_os = "windows")]
    {
        let standard_paths = [
            r"C:\Program Files\VideoLAN\VLC\vlc.exe",
            r"C:\Program Files (x86)\VideoLAN\VLC\vlc.exe",
        ];

        for path_str in &standard_paths {
            let path = Path::new(path_str);
            if path.is_file() {
                return Some(path.to_path_buf());
            }
        }

        // Check environment-based ProgramFiles / LocalAppData
        if let Ok(pf) = std::env::var("ProgramFiles") {
            let p = Path::new(&pf).join("VideoLAN").join("VLC").join("vlc.exe");
            if p.is_file() {
                return Some(p);
            }
        }

        if let Ok(pf86) = std::env::var("ProgramFiles(x86)") {
            let p = Path::new(&pf86).join("VideoLAN").join("VLC").join("vlc.exe");
            if p.is_file() {
                return Some(p);
            }
        }

        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let p = Path::new(&local_app_data).join("Programs").join("VLC").join("vlc.exe");
            if p.is_file() {
                return Some(p);
            }
        }
    }

    // 2. Fallback check across system PATH environment variable
    if let Ok(path_var) = std::env::var("PATH") {
        let separator = if cfg!(windows) { ';' } else { ':' };
        let exe_name = if cfg!(windows) { "vlc.exe" } else { "vlc" };

        for dir in path_var.split(separator) {
            let candidate = Path::new(dir.trim()).join(exe_name);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }

    // 3. Unix fallback paths
    #[cfg(not(target_os = "windows"))]
    {
        let unix_paths = [
            "/usr/bin/vlc",
            "/usr/local/bin/vlc",
            "/Applications/VLC.app/Contents/MacOS/VLC",
        ];
        for p in &unix_paths {
            let path = Path::new(p);
            if path.is_file() {
                return Some(path.to_path_buf());
            }
        }
    }

    None
}

/// Checks whether VLC is installed and reachable on this machine.
#[tauri::command]
fn check_vlc_installed() -> Result<bool, String> {
    Ok(find_vlc_path().is_some())
}

/// Validates that a media stream URL is well-formed, uses an authorized scheme,
/// and does not contain illegal control characters or shell separators.
pub fn validate_vlc_url(url: &str) -> Result<&str, String> {
    let trimmed = url.trim();

    // Security Gate 1: URL Scheme validation
    if !trimmed.starts_with("http://") && !trimmed.starts_with("https://") {
        return Err("Security Violation: Only http:// and https:// stream URLs are permitted.".to_string());
    }

    // Security Gate 2: Disallow control characters or shell separators
    if trimmed.chars().any(|c| c == '\0' || c == '\n' || c == '\r' || c == '"' || c == '\'') {
        return Err("Security Violation: Stream URL contains invalid control characters.".to_string());
    }

    Ok(trimmed)
}

/// Opens an authorized media stream directly in the external VLC media player.
/// Validates that the URL uses an authorized scheme and direct media stream protocol.
/// Never launches shell interpreters, preventing command/shell injection.
#[tauri::command]
fn open_stream_in_vlc(url: String) -> Result<(), String> {
    let safe_url = validate_vlc_url(&url)?;

    // Locate VLC binary safely
    let vlc_path = find_vlc_path().ok_or_else(|| {
        "VLC_NOT_FOUND: VLC media player was not detected on this system.".to_string()
    })?;

    eprintln!("[VLC] Executable: {:?}", vlc_path);
    eprintln!("[VLC] Arguments: [\"{}\"]", safe_url);

    // Launch VLC directly as a child process (NOT via shell cmd.exe)
    let mut command = std::process::Command::new(vlc_path);
    command.arg(safe_url);

    match command.spawn() {
        Ok(child) => {
            eprintln!("[VLC] Process started with PID: {}", child.id());
            Ok(())
        }
        Err(e) => {
            eprintln!("[VLC] Failed to spawn process: {}", e);
            Err(format!("Failed to spawn VLC process: {}", e))
        }
    }
}

#[derive(serde::Serialize)]
struct VlcInfo {
    installed: bool,
    executable: Option<String>,
}

#[tauri::command]
fn get_vlc_info() -> Result<VlcInfo, String> {
    let path = find_vlc_path();
    Ok(VlcInfo {
        installed: path.is_some(),
        executable: path.map(|p| p.to_string_lossy().to_string()),
    })
}

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
        .plugin(navigation_guard)
        .invoke_handler(tauri::generate_handler![check_vlc_installed, open_stream_in_vlc, get_vlc_info, log_runtime_event])
        .run(tauri::generate_context!())
        .expect("error while running RoninPLEX application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_vlc_urls() {
        assert!(validate_vlc_url("https://commondatastorage.googleapis.com/sample.mp4").is_ok());
        assert!(validate_vlc_url("http://localhost:8080/live/stream.m3u8").is_ok());
        assert!(validate_vlc_url("https://vidlink.pro/movie/550").is_ok());
    }

    #[test]
    fn test_invalid_scheme_rejected() {
        assert!(validate_vlc_url("file:///C:/Windows/System32/calc.exe").is_err());
        assert!(validate_vlc_url("javascript:alert(1)").is_err());
        assert!(validate_vlc_url("cmd.exe /c calc").is_err());
        assert!(validate_vlc_url("ftp://server/movie.mp4").is_err());
    }

    #[test]
    fn test_control_chars_rejected() {
        assert!(validate_vlc_url("https://example.com/test\0evil").is_err());
        assert!(validate_vlc_url("https://example.com/test\nevil").is_err());
        assert!(validate_vlc_url("https://example.com/\"evil\"").is_err());
        assert!(validate_vlc_url("https://example.com/'evil'").is_err());
    }
}
