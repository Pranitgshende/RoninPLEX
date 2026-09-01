# RoninPLEX v2.1.0 — Tauri / Rust Boundary Architecture

**Generated:** 2026-09-01
**Status:** CURRENT architecture (pre-v2.1.0)

---

## Current Architecture

### Overview

```
React (WebView2)
  │
  ├─ invoke('log_runtime_event', { tag, message })
  │   └─ Rust: writes to %LOCALAPPDATA%/RoninPLEX/playback_runtime.log
  │
  ├─ getCurrentWindow().setFullscreen(bool)
  │   └─ Tauri core: window management
  │
  └─ (no other custom commands)

Tauri Rust (Host)
  ├─ Navigation guard plugin (custom)
  ├─ tauri-plugin-shell (sidecar support)
  ├─ Sidecar: anime-server on port 4173
  └─ invoke_handler: [log_runtime_event]
```

### Tauri Commands (IPC)

| Command | Parameters | Action | Source |
|---------|-----------|--------|--------|
| `log_runtime_event` | `tag: String, message: String` | Writes `[tag] message` to stderr + log file | `src-tauri/src/lib.rs:4-16` |

**Frontend usage:** `src/utils/logger.ts` — calls `invoke('log_runtime_event', { tag, message })` with Tauri detection guard.

### Plugins

| Plugin | Purpose | Config |
|--------|---------|--------|
| `tauri-plugin-shell` (v2.3.5) | Sidecar process management | Cargo.toml |
| `navigation-guard` (custom) | Prevent top-level navigation to external URLs | Built inline in `lib.rs` |

### Navigation Guard

**Location:** `src-tauri/src/lib.rs:21-33`

```rust
// Allowed navigation targets:
- scheme == "tauri" (tauri:// protocol)
- host == "localhost"
- host == "tauri.localhost"
- host ends with ".localhost"

// All other URLs: BLOCKED with stderr warning
```

This prevents the main webview from navigating away to external sites. Note: iframes are not affected by this guard (they use their own sandboxing).

### Sidecar (anime-server)

**Spawn location:** `src-tauri/src/lib.rs:43-60`

```rust
app.shell().sidecar("anime-server")
  → env("PORT", "4173")
  → spawn()
  → async task reads stdout
```

**Binary:** `src-tauri/bin/anime-server-x86_64-pc-windows-msvc.exe`
**Built by:** `scripts/build-sidecar.cjs` (ncc + pkg)
**Registered:** `tauri.conf.json` → `bundle.externalBin: ["bin/anime-server"]`

### Capabilities / Permissions

**File:** `src-tauri/capabilities/default.json`

```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": ["core:default"]
}
```

**Only `core:default` is granted.** This means:
- Basic window operations (resize, fullscreen, minimize, etc.)
- No explicit `shell:allow-*` permissions listed
- Sidecar spawning works because it's initiated from Rust setup, not from frontend invoke

### Security Configuration

| Setting | Value | Location |
|---------|-------|----------|
| CSP | `null` (disabled) | `tauri.conf.json:30` |
| Navigation guard | Custom Rust plugin | `lib.rs:21-33` |
| Capabilities | `core:default` only | `capabilities/default.json` |
| Window decorations | Enabled | `tauri.conf.json:25` |
| Sandbox tokens (iframes) | `allow-scripts allow-same-origin allow-forms allow-presentation` | `streaming/types.ts:27` |
| Top-nav in iframes | **Prohibited** | By omission of `allow-top-navigation` |

### Window Configuration

```json
{
  "label": "main",
  "title": "RoninPLEX",
  "width": 1280, "height": 800,
  "minWidth": 960, "minHeight": 600,
  "resizable": true,
  "fullscreen": false,
  "maximized": true,
  "center": true,
  "decorations": true,
  "backgroundColor": "#090a0f"
}
```

Single window — no secondary windows created.

### Build Configuration

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm.cmd run build",
    "frontendDist": "../dist"
  }
}
```

### Bundle Configuration

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico", "icons/icon.png"],
    "category": "Entertainment",
    "windows": { "nsis": { "installMode": "currentUser" } },
    "externalBin": ["bin/anime-server"]
  }
}
```

### Filesystem Access

| Purpose | Path | Access |
|---------|------|--------|
| Runtime logging | `%LOCALAPPDATA%/RoninPLEX/playback_runtime.log` | Write (append) |
| Log directory | `%LOCALAPPDATA%/RoninPLEX/` | Create + write |

No other filesystem access from Rust code.

---

## Important Dependencies

| Component | Depends On |
|-----------|-----------|
| Rust app | tauri 2, serde 1, serde_json 1, tauri-plugin-shell 2.3.5 |
| Build | tauri-build 2 |
| Sidecar | anime-sdk (npm), @vercel/ncc, pkg |

---

## Security Risks

| Risk | Severity | Details |
|------|----------|---------|
| CSP disabled | **MEDIUM** | `null` CSP allows all content loading; mitigated by navigation guard |
| Minimal capabilities | LOW | Only `core:default`; limited attack surface |
| Sidecar localhost binding | LOW | anime-server on `0.0.0.0:4173` could be accessible on LAN |
| No shell permissions in capabilities | LOW | Sidecar spawned from Rust, not frontend; acceptable |
| API key in localStorage | **MEDIUM** | TMDB key stored in localStorage; accessible to any JS in webview |
| API key in URL query params | **MEDIUM** | TMDB API key sent as `api_key=` query parameter; visible in network logs |
| No certificate pinning | LOW | Standard HTTPS; no custom cert validation |

### API Key Exposure Check

| Location | Risk | Details |
|----------|------|---------|
| `src/services/tmdb.ts:48` | MEDIUM | API key appended as `api_key` query param |
| `src/services/storage.ts:305` | LOW | Key read from localStorage |
| `.env.example` | NONE | Template only, no actual key |
| `src-tauri/` | NONE | No secrets in Rust code |
| `backend/server.js` | NONE | No API keys |
| Error messages | LOW | `console.warn` on failures; doesn't log key values |

---

## Rust Tests

| Test | Location | Purpose |
|------|----------|---------|
| `test_runtime_logging` | `src-tauri/src/lib.rs:74-77` | Verifies `log_runtime_event` doesn't panic |

---

## Known Risks

1. **CSP is null** — No Content Security Policy; any injected script could execute
2. **Single IPC command** — Very limited Tauri boundary; most logic runs in WebView
3. **Sidecar port collision** — Hard-coded port 4173; no fallback if port is in use
4. **Sidecar lifecycle** — No graceful shutdown; no restart-on-crash; no health monitoring from Rust
5. **`npm.cmd` in beforeBuildCommand** — Windows-specific; could break cross-platform builds

---

## Target v2.1.0 Direction

*Not implemented. Observations for future phases:*

- Consider enabling CSP with appropriate directives
- Consider adding sidecar health check IPC command
- Consider adding explicit shell permissions in capabilities
- Consider sidecar restart logic
- Consider cross-platform build command handling
