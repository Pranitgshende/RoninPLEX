use std::collections::HashMap;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::net::{IpAddr, Ipv4Addr, Ipv6Addr, ToSocketAddrs};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadItem {
    pub id: String,
    pub title: String,
    pub media_type: String, // "movie" | "tv" | "anime"
    pub season_number: Option<u32>,
    pub episode_number: Option<u32>,
    pub source_url: String,
    pub target_path: String,
    pub file_name: String,
    pub total_bytes: u64,
    pub downloaded_bytes: u64,
    pub status: String, // "queued" | "downloading" | "paused" | "completed" | "failed" | "cancelled"
    pub speed_bytes_per_sec: u64,
    pub eta_seconds: Option<u64>,
    pub created_at: String,
    pub completed_at: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadSettings {
    pub download_dir: String,
    pub max_concurrent_downloads: u32,
    pub auto_resume_on_startup: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StartDownloadPayload {
    pub title: String,
    pub media_type: String,
    pub season_number: Option<u32>,
    pub episode_number: Option<u32>,
    pub direct_url: String,
    pub file_name: String,
    pub safe_extension: Option<String>,
}

pub struct DownloadState {
    pub items: Arc<Mutex<HashMap<String, DownloadItem>>>,
    pub settings: Arc<Mutex<DownloadSettings>>,
    pub cancel_channels: Arc<Mutex<HashMap<String, tokio::sync::broadcast::Sender<()>>>>,
}

impl DownloadState {
    pub fn new() -> Self {
        let default_dir = get_default_download_dir();
        let settings = load_persisted_settings(&default_dir);
        let items = load_persisted_downloads();

        Self {
            items: Arc::new(Mutex::new(items)),
            settings: Arc::new(Mutex::new(settings)),
            cancel_channels: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

fn get_app_data_dir() -> PathBuf {
    if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") {
        let dir = Path::new(&local_app_data).join("RoninPLEX");
        let _ = fs::create_dir_all(&dir);
        dir
    } else {
        PathBuf::from(".")
    }
}

fn get_default_download_dir() -> String {
    if let Some(user_profile) = std::env::var_os("USERPROFILE") {
        let videos_dir = Path::new(&user_profile).join("Videos").join("RoninPLEX");
        if fs::create_dir_all(&videos_dir).is_ok() {
            return videos_dir.to_string_lossy().to_string();
        }
    }
    let fallback = get_app_data_dir().join("Downloads");
    let _ = fs::create_dir_all(&fallback);
    fallback.to_string_lossy().to_string()
}

fn get_state_file_path() -> PathBuf {
    get_app_data_dir().join("downloads.json")
}

fn get_settings_file_path() -> PathBuf {
    get_app_data_dir().join("download_settings.json")
}

fn load_persisted_downloads() -> HashMap<String, DownloadItem> {
    let path = get_state_file_path();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(mut items) = serde_json::from_str::<HashMap<String, DownloadItem>>(&content) {
                // If the app was closed while downloading, reset status to paused
                for item in items.values_mut() {
                    if item.status == "downloading" || item.status == "queued" {
                        item.status = "paused".to_string();
                        item.speed_bytes_per_sec = 0;
                        item.eta_seconds = None;
                    }
                }
                return items;
            }
        }
    }
    HashMap::new()
}

fn save_persisted_downloads(items: &HashMap<String, DownloadItem>) {
    let path = get_state_file_path();
    if let Ok(content) = serde_json::to_string_pretty(items) {
        let _ = fs::write(path, content);
    }
}

fn load_persisted_settings(default_dir: &str) -> DownloadSettings {
    let path = get_settings_file_path();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(settings) = serde_json::from_str::<DownloadSettings>(&content) {
                return settings;
            }
        }
    }
    DownloadSettings {
        download_dir: default_dir.to_string(),
        max_concurrent_downloads: 3,
        auto_resume_on_startup: true,
    }
}

fn save_persisted_settings(settings: &DownloadSettings) {
    let path = get_settings_file_path();
    if let Ok(content) = serde_json::to_string_pretty(settings) {
        let _ = fs::write(path, content);
    }
}

// ============================================================================
// SSRF & URL VALIDATION
// ============================================================================

pub fn is_forbidden_ipv4(ipv4: Ipv4Addr) -> bool {
    let octets = ipv4.octets();

    // Loopback: 127.0.0.0/8
    if ipv4.is_loopback() || octets[0] == 127 {
        return true;
    }
    // Unspecified / Current network: 0.0.0.0/8
    if ipv4.is_unspecified() || octets[0] == 0 {
        return true;
    }
    // Broadcast: 255.255.255.255
    if ipv4.is_broadcast() || octets == [255, 255, 255, 255] {
        return true;
    }
    // Private RFC1918:
    // 10.0.0.0/8
    if octets[0] == 10 {
        return true;
    }
    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if octets[0] == 172 && (16..=31).contains(&octets[1]) {
        return true;
    }
    // 192.168.0.0/16
    if octets[0] == 192 && octets[1] == 168 {
        return true;
    }
    // Link-local / Cloud metadata: 169.254.0.0/16
    if ipv4.is_link_local() || (octets[0] == 169 && octets[1] == 254) {
        return true;
    }
    // Carrier-Grade NAT (RFC 6598): 100.64.0.0/10
    if octets[0] == 100 && (octets[1] & 0xC0) == 64 {
        return true;
    }
    // IETF Protocol Assignments (RFC 6890): 192.0.0.0/24
    if octets[0] == 192 && octets[1] == 0 && octets[2] == 0 {
        return true;
    }
    // TEST-NET-1 (RFC 5737): 192.0.2.0/24
    if octets[0] == 192 && octets[1] == 0 && octets[2] == 2 {
        return true;
    }
    // 6to4 relay anycast (RFC 7526): 192.88.99.0/24
    if octets[0] == 192 && octets[1] == 88 && octets[2] == 99 {
        return true;
    }
    // Network Interconnect Device Benchmark (RFC 2544): 198.18.0.0/15
    if octets[0] == 198 && (octets[1] & 0xFE) == 18 {
        return true;
    }
    // TEST-NET-2 (RFC 5737): 198.51.100.0/24
    if octets[0] == 198 && octets[1] == 51 && octets[2] == 100 {
        return true;
    }
    // TEST-NET-3 (RFC 5737): 203.0.113.0/24
    if octets[0] == 203 && octets[1] == 0 && octets[2] == 113 {
        return true;
    }
    // Multicast (RFC 5771): 224.0.0.0/4
    if ipv4.is_multicast() || (octets[0] >= 224 && octets[0] <= 239) {
        return true;
    }
    // Reserved for future use (RFC 1112): 240.0.0.0/4
    if octets[0] >= 240 {
        return true;
    }

    false
}

pub fn is_forbidden_ipv6(ipv6: Ipv6Addr) -> bool {
    let seg = ipv6.segments();

    // Loopback: ::1
    if ipv6.is_loopback() || (seg == [0, 0, 0, 0, 0, 0, 0, 1]) {
        return true;
    }
    // Unspecified: ::
    if ipv6.is_unspecified() || (seg == [0, 0, 0, 0, 0, 0, 0, 0]) {
        return true;
    }
    // Multicast: ff00::/8
    if ipv6.is_multicast() || (seg[0] & 0xff00) == 0xff00 {
        return true;
    }
    // Unique Local Address (ULA): fc00::/7
    if (seg[0] & 0xfe00) == 0xfc00 {
        return true;
    }
    // Link-Local Unicast: fe80::/10
    if (seg[0] & 0xffc0) == 0xfe80 {
        return true;
    }
    // IPv4-mapped IPv6: ::ffff:x.x.x.x
    if seg[0] == 0 && seg[1] == 0 && seg[2] == 0 && seg[3] == 0 && seg[4] == 0 && seg[5] == 0xffff {
        let ip4 = Ipv4Addr::new(
            (seg[6] >> 8) as u8,
            (seg[6] & 0xff) as u8,
            (seg[7] >> 8) as u8,
            (seg[7] & 0xff) as u8,
        );
        return is_forbidden_ipv4(ip4);
    }
    // IPv4-compatible IPv6 (deprecated): ::x.x.x.x
    if seg[0] == 0 && seg[1] == 0 && seg[2] == 0 && seg[3] == 0 && seg[4] == 0 && seg[5] == 0 {
        let ip4 = Ipv4Addr::new(
            (seg[6] >> 8) as u8,
            (seg[6] & 0xff) as u8,
            (seg[7] >> 8) as u8,
            (seg[7] & 0xff) as u8,
        );
        return is_forbidden_ipv4(ip4);
    }

    false
}

pub fn is_forbidden_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => is_forbidden_ipv4(v4),
        IpAddr::V6(v6) => is_forbidden_ipv6(v6),
    }
}

pub fn validate_parsed_url(url: &reqwest::Url) -> Result<(), String> {
    let scheme = url.scheme();
    if scheme != "http" && scheme != "https" {
        return Err(format!("Disallowed URL scheme '{}'. Only HTTP and HTTPS are permitted.", scheme));
    }

    let host = url.host_str().ok_or_else(|| "URL is missing a valid host".to_string())?;
    let lower_host = host.to_ascii_lowercase();

    // Rejection of localhost variants, link-local, and internal domain names
    if lower_host == "localhost"
        || lower_host.ends_with(".localhost")
        || lower_host == "local"
        || lower_host.ends_with(".local")
        || lower_host == "internal"
        || lower_host.ends_with(".internal")
        || lower_host == "lan"
        || lower_host.ends_with(".lan")
        || lower_host == "home"
        || lower_host.ends_with(".home")
        || lower_host == "corp"
        || lower_host.ends_with(".corp")
        || lower_host == "metadata.google.internal"
        || lower_host == "instance-data"
    {
        return Err(format!("Access to local, internal, or metadata hostname '{}' is prohibited.", host));
    }

    // Check if host is an IP literal (IPv4 or IPv6)
    let ip_str = lower_host.trim_start_matches('[').trim_end_matches(']');
    if let Ok(ip) = ip_str.parse::<IpAddr>() {
        if is_forbidden_ip(ip) {
            return Err(format!("Access to private, loopback, or restricted IP '{}' is prohibited.", ip));
        }
        return Ok(());
    }

    // Reject single-label hostnames without a dot (e.g. "nas", "router", "printer")
    if !host.contains('.') {
        return Err(format!("Single-label hostname '{}' is not permitted.", host));
    }

    // DNS resolution: inspect resolved IPs to protect against DNS rebinding
    let port = url.port_or_known_default().unwrap_or(if scheme == "https" { 443 } else { 80 });
    if let Ok(socket_addrs) = format!("{}:{}", host, port).to_socket_addrs() {
        for saddr in socket_addrs {
            if is_forbidden_ip(saddr.ip()) {
                return Err(format!("Host '{}' resolved to restricted IP '{}'. Access blocked.", host, saddr.ip()));
            }
        }
    }

    Ok(())
}

pub fn validate_download_url(url_str: &str) -> Result<(), String> {
    let parsed = reqwest::Url::parse(url_str)
        .map_err(|e| format!("Invalid download URL '{}': {}", url_str, e))?;
    validate_parsed_url(&parsed)
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
pub async fn start_download(
    app: AppHandle,
    payload: StartDownloadPayload,
) -> Result<DownloadItem, String> {
    // Independent Rust-side SSRF validation before allocating state or creating files
    validate_download_url(&payload.direct_url)?;

    let state = app.state::<DownloadState>();
    let id = Uuid::new_v4().to_string();

    let download_dir = {
        let s = state.settings.lock().map_err(|e| e.to_string())?;
        s.download_dir.clone()
    };

    let target_dir = PathBuf::from(&download_dir);
    let _ = fs::create_dir_all(&target_dir);

    // Sanitize filename and prevent collisions
    let mut file_name = payload.file_name.trim().to_string();
    if file_name.is_empty() {
        let ext = payload.safe_extension.as_deref().unwrap_or(".mp4");
        file_name = format!("{}_{}{}", payload.title.replace(' ', "_"), id[..8].to_string(), ext);
    }

    let mut target_path = target_dir.join(&file_name);
    let mut counter = 1;
    while target_path.exists() {
        let stem = Path::new(&file_name).file_stem().and_then(|s| s.to_str()).unwrap_or("media");
        let ext = Path::new(&file_name).extension().and_then(|s| s.to_str()).unwrap_or("mp4");
        let new_name = format!("{}_{}.{}", stem, counter, ext);
        target_path = target_dir.join(&new_name);
        counter += 1;
    }

    let now = chrono::Utc::now().to_rfc3339();

    let item = DownloadItem {
        id: id.clone(),
        title: payload.title,
        media_type: payload.media_type,
        season_number: payload.season_number,
        episode_number: payload.episode_number,
        source_url: payload.direct_url,
        target_path: target_path.to_string_lossy().to_string(),
        file_name: target_path.file_name().unwrap_or_default().to_string_lossy().to_string(),
        total_bytes: 0,
        downloaded_bytes: 0,
        status: "downloading".to_string(),
        speed_bytes_per_sec: 0,
        eta_seconds: None,
        created_at: now,
        completed_at: None,
        error_message: None,
    };

    {
        let mut items = state.items.lock().map_err(|e| e.to_string())?;
        items.insert(id.clone(), item.clone());
        save_persisted_downloads(&items);
    }

    let _ = app.emit("download-status-changed", &item);

    // Launch worker task
    spawn_download_worker(app.clone(), id.clone());

    Ok(item)
}

#[tauri::command]
pub async fn pause_download(app: AppHandle, id: String) -> Result<bool, String> {
    let state = app.state::<DownloadState>();

    // Signal cancellation channel
    {
        let channels = state.cancel_channels.lock().map_err(|e| e.to_string())?;
        if let Some(tx) = channels.get(&id) {
            let _ = tx.send(());
        }
    }

    // Update status in state
    let mut updated_item: Option<DownloadItem> = None;
    {
        let mut items = state.items.lock().map_err(|e| e.to_string())?;
        if let Some(item) = items.get_mut(&id) {
            if item.status == "downloading" || item.status == "queued" {
                item.status = "paused".to_string();
                item.speed_bytes_per_sec = 0;
                item.eta_seconds = None;
                updated_item = Some(item.clone());
            }
        }
        save_persisted_downloads(&items);
    }

    if let Some(item) = updated_item {
        let _ = app.emit("download-status-changed", &item);
        return Ok(true);
    }

    Ok(false)
}

#[tauri::command]
pub async fn resume_download(app: AppHandle, id: String) -> Result<bool, String> {
    let state = app.state::<DownloadState>();

    let mut should_spawn = false;
    let mut updated_item: Option<DownloadItem> = None;
    {
        let mut items = state.items.lock().map_err(|e| e.to_string())?;
        if let Some(item) = items.get_mut(&id) {
            if item.status == "paused" || item.status == "failed" {
                item.status = "downloading".to_string();
                item.error_message = None;
                should_spawn = true;
                updated_item = Some(item.clone());
            }
        }
        save_persisted_downloads(&items);
    }

    if let Some(item) = updated_item {
        let _ = app.emit("download-status-changed", &item);
    }

    if should_spawn {
        spawn_download_worker(app.clone(), id);
        return Ok(true);
    }

    Ok(false)
}

#[tauri::command]
pub async fn cancel_download(app: AppHandle, id: String) -> Result<bool, String> {
    let state = app.state::<DownloadState>();

    // Send abort signal
    {
        let channels = state.cancel_channels.lock().map_err(|e| e.to_string())?;
        if let Some(tx) = channels.get(&id) {
            let _ = tx.send(());
        }
    }

    let mut updated_item: Option<DownloadItem> = None;
    {
        let mut items = state.items.lock().map_err(|e| e.to_string())?;
        if let Some(item) = items.get_mut(&id) {
            item.status = "cancelled".to_string();
            item.speed_bytes_per_sec = 0;
            item.eta_seconds = None;
            updated_item = Some(item.clone());
        }
        save_persisted_downloads(&items);
    }

    if let Some(item) = updated_item {
        let _ = app.emit("download-status-changed", &item);
        return Ok(true);
    }

    Ok(false)
}

#[tauri::command]
pub async fn delete_download(app: AppHandle, id: String, delete_file: Option<bool>) -> Result<bool, String> {
    let state = app.state::<DownloadState>();

    // Send abort signal if downloading
    {
        let channels = state.cancel_channels.lock().map_err(|e| e.to_string())?;
        if let Some(tx) = channels.get(&id) {
            let _ = tx.send(());
        }
    }

    let removed = {
        let mut items = state.items.lock().map_err(|e| e.to_string())?;
        let res = items.remove(&id);
        save_persisted_downloads(&items);
        res
    };

    if let Some(item) = removed {
        if delete_file.unwrap_or(false) {
            let path = PathBuf::from(&item.target_path);
            if path.exists() {
                let _ = fs::remove_file(path);
            }
        }
        let _ = app.emit("download-status-changed", &item);
        return Ok(true);
    }

    Ok(false)
}

#[tauri::command]
pub async fn get_downloads(app: AppHandle) -> Result<Vec<DownloadItem>, String> {
    let state = app.state::<DownloadState>();
    let items = state.items.lock().map_err(|e| e.to_string())?;
    let mut list: Vec<DownloadItem> = items.values().cloned().collect();
    list.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(list)
}

#[tauri::command]
pub async fn get_download_settings(app: AppHandle) -> Result<DownloadSettings, String> {
    let state = app.state::<DownloadState>();
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub async fn update_download_settings(app: AppHandle, settings: DownloadSettings) -> Result<(), String> {
    let state = app.state::<DownloadState>();
    {
        let mut s = state.settings.lock().map_err(|e| e.to_string())?;
        *s = settings.clone();
        save_persisted_settings(&s);
    }
    Ok(())
}

#[tauri::command]
pub async fn open_download_folder(app: AppHandle, id_or_path: Option<String>) -> Result<(), String> {
    let folder_to_open: PathBuf = if let Some(arg) = id_or_path {
        let state = app.state::<DownloadState>();
        let items = state.items.lock().map_err(|e| e.to_string())?;
        if let Some(item) = items.get(&arg) {
            PathBuf::from(&item.target_path).parent().unwrap_or(Path::new(".")).to_path_buf()
        } else {
            PathBuf::from(&arg)
        }
    } else {
        let state = app.state::<DownloadState>();
        let s = state.settings.lock().map_err(|e| e.to_string())?;
        PathBuf::from(&s.download_dir)
    };

    if folder_to_open.exists() {
        let _ = std::process::Command::new("explorer")
            .arg(folder_to_open)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn open_download_file(app: AppHandle, id: String) -> Result<(), String> {
    let state = app.state::<DownloadState>();
    let items = state.items.lock().map_err(|e| e.to_string())?;
    if let Some(item) = items.get(&id) {
        let path = PathBuf::from(&item.target_path);
        if path.exists() {
            let _ = std::process::Command::new("explorer")
                .arg(format!("/select,{}", path.to_string_lossy()))
                .spawn()
                .map_err(|e| e.to_string())?;
            return Ok(());
        }
    }
    Err("File not found".to_string())
}

// ============================================================================
// WORKER ENGINE
// ============================================================================

fn spawn_download_worker(app: AppHandle, id: String) {
    tauri::async_runtime::spawn(async move {
        let state = app.state::<DownloadState>();

        // Setup cancellation channel
        let (cancel_tx, mut cancel_rx) = tokio::sync::broadcast::channel::<()>(2);
        {
            if let Ok(mut channels) = state.cancel_channels.lock() {
                channels.insert(id.clone(), cancel_tx);
            }
        }

        let item_snapshot = {
            if let Ok(items) = state.items.lock() {
                items.get(&id).cloned()
            } else {
                None
            }
        };

        let item = match item_snapshot {
            Some(i) => i,
            None => return,
        };

        // Independent Rust-side SSRF re-check before connecting
        if let Err(e) = validate_download_url(&item.source_url) {
            fail_download(&app, &id, format!("SSRF validation rejected download URL: {}", e));
            return;
        }

        let target_path = PathBuf::from(&item.target_path);
        let existing_bytes = if target_path.exists() {
            fs::metadata(&target_path).map(|m| m.len()).unwrap_or(0)
        } else {
            0
        };

        let redirect_policy = reqwest::redirect::Policy::custom(|attempt| {
            if attempt.previous().len() >= 10 {
                return attempt.error("Too many redirects (max 10)");
            }
            if let Err(e) = validate_parsed_url(attempt.url()) {
                return attempt.error(std::io::Error::new(std::io::ErrorKind::PermissionDenied, e));
            }
            attempt.follow()
        });

        let client = reqwest::Client::builder()
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .redirect(redirect_policy)
            .build();

        let client = match client {
            Ok(c) => c,
            Err(e) => {
                fail_download(&app, &id, format!("HTTP client initialization failed: {}", e));
                return;
            }
        };

        let mut req = client.get(&item.source_url);
        let mut is_resume = false;

        if existing_bytes > 0 {
            req = req.header("Range", format!("bytes={}-", existing_bytes));
            is_resume = true;
        }

        let resp_res = req.send().await;
        let resp = match resp_res {
            Ok(r) => r,
            Err(e) => {
                fail_download(&app, &id, format!("Connection failed: {}", e));
                return;
            }
        };

        let status = resp.status();
        let (mut file, mut current_bytes, total_bytes) = if status == reqwest::StatusCode::PARTIAL_CONTENT && is_resume {
            // Range request accepted
            let file = match OpenOptions::new().write(true).append(true).open(&target_path) {
                Ok(f) => f,
                Err(e) => {
                    fail_download(&app, &id, format!("Failed to open file for resume: {}", e));
                    return;
                }
            };
            let content_len = resp.content_length().unwrap_or(0);
            let total = existing_bytes + content_len;
            (file, existing_bytes, total)
        } else if status.is_success() {
            // Full content returned (or server ignored Range)
            let file = match OpenOptions::new().write(true).create(true).truncate(true).open(&target_path) {
                Ok(f) => f,
                Err(e) => {
                    fail_download(&app, &id, format!("Failed to create download file: {}", e));
                    return;
                }
            };
            let total = resp.content_length().unwrap_or(0);
            (file, 0, total)
        } else {
            fail_download(&app, &id, format!("Server returned HTTP status {}", status));
            return;
        };

        // Update total bytes in state
        {
            if let Ok(mut items) = state.items.lock() {
                if let Some(item_ref) = items.get_mut(&id) {
                    item_ref.total_bytes = total_bytes;
                    item_ref.downloaded_bytes = current_bytes;
                }
            }
        }

        let mut stream = resp.bytes_stream();
        let mut last_progress_time = Instant::now();
        let mut bytes_since_last_calc = 0u64;

        loop {
            tokio::select! {
                _ = cancel_rx.recv() => {
                    // Download was paused or cancelled by user
                    let _ = file.flush();
                    return;
                }
                chunk_res = stream.next() => {
                    match chunk_res {
                        Some(Ok(bytes)) => {
                            if let Err(e) = file.write_all(&bytes) {
                                fail_download(&app, &id, format!("Disk write error: {}", e));
                                return;
                            }

                            let len = bytes.len() as u64;
                            current_bytes += len;
                            bytes_since_last_calc += len;

                            let now = Instant::now();
                            let elapsed = now.duration_since(last_progress_time).as_secs_f64();

                            if elapsed >= 0.5 {
                                let speed = (bytes_since_last_calc as f64 / elapsed) as u64;
                                let remaining = if total_bytes > current_bytes { total_bytes - current_bytes } else { 0 };
                                let eta = if speed > 0 && remaining > 0 { Some(remaining / speed) } else { None };

                                let item_to_emit = {
                                    if let Ok(mut items) = state.items.lock() {
                                        if let Some(item_ref) = items.get_mut(&id) {
                                            item_ref.downloaded_bytes = current_bytes;
                                            item_ref.speed_bytes_per_sec = speed;
                                            item_ref.eta_seconds = eta;
                                            Some(item_ref.clone())
                                        } else {
                                            None
                                        }
                                    } else {
                                        None
                                    }
                                };

                                if let Some(item_data) = item_to_emit {
                                    let _ = app.emit("download-progress", &item_data);
                                }

                                last_progress_time = now;
                                bytes_since_last_calc = 0;
                            }
                        }
                        Some(Err(e)) => {
                            fail_download(&app, &id, format!("Stream read error: {}", e));
                            return;
                        }
                        None => {
                            // Stream completed!
                            let _ = file.flush();

                            let item_completed = {
                                if let Ok(mut items) = state.items.lock() {
                                    let maybe_cloned = if let Some(item_ref) = items.get_mut(&id) {
                                        item_ref.status = "completed".to_string();
                                        item_ref.downloaded_bytes = current_bytes;
                                        if item_ref.total_bytes == 0 {
                                            item_ref.total_bytes = current_bytes;
                                        }
                                        item_ref.speed_bytes_per_sec = 0;
                                        item_ref.eta_seconds = None;
                                        item_ref.completed_at = Some(chrono::Utc::now().to_rfc3339());
                                        Some(item_ref.clone())
                                    } else {
                                        None
                                    };
                                    if maybe_cloned.is_some() {
                                        save_persisted_downloads(&items);
                                    }
                                    maybe_cloned
                                } else {
                                    None
                                }
                            };

                            if let Some(item_data) = item_completed {
                                let _ = app.emit("download-status-changed", &item_data);
                                let _ = app.emit("download-progress", &item_data);
                            }

                            return;
                        }
                    }
                }
            }
        }
    });
}

fn fail_download(app: &AppHandle, id: &str, error: String) {
    let state = app.state::<DownloadState>();
    let mut failed_item: Option<DownloadItem> = None;
    if let Ok(mut items) = state.items.lock() {
        if let Some(item_ref) = items.get_mut(id) {
            item_ref.status = "failed".to_string();
            item_ref.speed_bytes_per_sec = 0;
            item_ref.eta_seconds = None;
            item_ref.error_message = Some(error);
            failed_item = Some(item_ref.clone());
        }
        if failed_item.is_some() {
            save_persisted_downloads(&items);
        }
    }
    if let Some(item_data) = failed_item {
        let _ = app.emit("download-status-changed", &item_data);
    }
}

// ============================================================================
// UNIT TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ssrf_rejects_localhost() {
        assert!(validate_download_url("http://localhost:8080/movie.mp4").is_err());
        assert!(validate_download_url("https://localhost/movie.mp4").is_err());
        assert!(validate_download_url("http://sub.localhost:8000/movie.mp4").is_err());
    }

    #[test]
    fn test_ssrf_rejects_loopback_v4() {
        assert!(validate_download_url("http://127.0.0.1/video.mp4").is_err());
        assert!(validate_download_url("http://127.1.2.3:8080/stream.mp4").is_err());
        assert!(validate_download_url("https://127.0.0.1:4173/file.m3u8").is_err());
    }

    #[test]
    fn test_ssrf_rejects_private_v4() {
        assert!(validate_download_url("http://10.0.0.1/video.mp4").is_err());
        assert!(validate_download_url("http://172.16.0.5:8080/video.mp4").is_err());
        assert!(validate_download_url("http://172.31.255.254/video.mp4").is_err());
        assert!(validate_download_url("http://192.168.1.1/video.mp4").is_err());
        assert!(validate_download_url("http://192.168.0.254:3000/video.mp4").is_err());
    }

    #[test]
    fn test_ssrf_rejects_link_local() {
        // Cloud metadata service (AWS/GCP/Azure/OpenStack)
        assert!(validate_download_url("http://169.254.169.254/latest/meta-data").is_err());
        assert!(validate_download_url("https://169.254.10.20/video.mp4").is_err());
    }

    #[test]
    fn test_ssrf_rejects_cgnat_and_benchmarking() {
        // CGNAT (100.64.0.0/10)
        assert!(validate_download_url("http://100.64.0.1/video.mp4").is_err());
        assert!(validate_download_url("http://100.127.255.255/video.mp4").is_err());
        // Documentation/Benchmarking
        assert!(validate_download_url("http://192.0.2.1/video.mp4").is_err());
        assert!(validate_download_url("http://198.51.100.1/video.mp4").is_err());
        assert!(validate_download_url("http://203.0.113.1/video.mp4").is_err());
    }

    #[test]
    fn test_ssrf_rejects_loopback_v6() {
        assert!(validate_download_url("http://[::1]/video.mp4").is_err());
        assert!(validate_download_url("http://[::1]:8080/video.mp4").is_err());
    }

    #[test]
    fn test_ssrf_rejects_ula_and_link_local_v6() {
        // Unique local address fc00::/7
        assert!(validate_download_url("http://[fc00::1]/video.mp4").is_err());
        assert!(validate_download_url("http://[fd12:3456:789a::1]/video.mp4").is_err());
        // Link-local unicast fe80::/10
        assert!(validate_download_url("http://[fe80::1]/video.mp4").is_err());
    }

    #[test]
    fn test_ssrf_rejects_ipv4_mapped_v6() {
        // IPv4-mapped 127.0.0.1
        assert!(validate_download_url("http://[::ffff:127.0.0.1]/video.mp4").is_err());
        // IPv4-mapped 192.168.1.1
        assert!(validate_download_url("http://[::ffff:192.168.1.1]/video.mp4").is_err());
        // IPv4-mapped 169.254.169.254
        assert!(validate_download_url("http://[::ffff:169.254.169.254]/video.mp4").is_err());
    }

    #[test]
    fn test_ssrf_rejects_disallowed_schemes() {
        assert!(validate_download_url("file:///C:/Windows/System32/drivers/etc/hosts").is_err());
        assert!(validate_download_url("data:text/plain;base64,SGVsbG8=").is_err());
        assert!(validate_download_url("ftp://example.com/video.mp4").is_err());
        assert!(validate_download_url("javascript:alert(1)").is_err());
        assert!(validate_download_url("ws://example.com/stream").is_err());
    }

    #[test]
    fn test_ssrf_rejects_internal_hostnames() {
        assert!(validate_download_url("http://router/firmware.bin").is_err());
        assert!(validate_download_url("http://nas/movie.mp4").is_err());
        assert!(validate_download_url("http://gateway.local/test").is_err());
        assert!(validate_download_url("http://cluster.internal/test").is_err());
        assert!(validate_download_url("http://metadata.google.internal/computeMetadata/v1/").is_err());
    }

    #[test]
    fn test_ssrf_allows_public_https() {
        assert!(validate_download_url("https://example.com/media/sample.mp4").is_ok());
        assert!(validate_download_url("https://cdn.example.com/video.mp4?token=xyz").is_ok());
        assert!(validate_download_url("http://example.com/public.mp4").is_ok());
    }
}
