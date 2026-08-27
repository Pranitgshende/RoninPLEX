// Tauri 2 Application Logic
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let navigation_guard = tauri::plugin::Builder::<tauri::Wry>::new("navigation-guard")
        .on_navigation(|_webview, url| {
            let is_allowed = url.scheme() == "tauri"
                || (url.scheme() == "http" && url.host_str() == Some("localhost"))
                || (url.scheme() == "https" && url.host_str() == Some("localhost"));
            if !is_allowed {
                eprintln!("[Security] Prevented top-level navigation to: {}", url);
            }
            is_allowed
        })
        .build();

    tauri::Builder::default()
        .plugin(navigation_guard)
        .run(tauri::generate_context!())
        .expect("error while running RoninPLEX application");
}
