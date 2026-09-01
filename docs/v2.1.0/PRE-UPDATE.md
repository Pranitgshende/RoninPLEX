# RoninPLEX v2.1.0 — PRE-UPDATE Document

**Generated:** 2026-09-01
**Purpose:** Baseline state before any v2.1.0 implementation changes.

---

## Project

| Field | Value |
|-------|-------|
| Project | RoninPLEX |
| Starting Version | 2.0.1 |
| Branch | `development/v2.1.0` |
| Commit | `67ae300` — `fix(anime): restore tauri playback` |
| Working Tree | Clean (no staged or modified tracked files) |
| Untracked Files | `logger.cjs`, `package-release-portable.ps1`, `package-release.ps1`, `release-artifacts/`, `test-anime.cjs`, `test-playwright*.mjs` |

---

## Environment Snapshot

| Tool | Version |
|------|---------|
| Node.js | v24.18.0 |
| npm | 11.16.0 |
| Rust | 1.98.0 (88d9e12ae 2026-08-18) |
| Cargo | 1.98.0 (797e8a9bc 2026-08-05) |
| Package Manager | npm (package-lock.json) |

## Dependency Snapshot (from package.json)

### Runtime Dependencies
| Package | Version Range |
|---------|---------------|
| @tauri-apps/api | ^2.11.1 |
| anime-sdk | ^1.1.0 |
| clsx | ^2.1.1 |
| hls.js | ^1.7.1 |
| lucide-react | ^1.16.0 |
| react | ^19.0.0 |
| react-dom | ^19.0.0 |
| react-router-dom | ^7.3.0 |
| tailwind-merge | ^3.0.2 |

### Dev Dependencies
| Package | Version Range |
|---------|---------------|
| @tauri-apps/cli | ^2.11.4 |
| @types/node | ^22.13.10 |
| @types/react | ^19.0.10 |
| @types/react-dom | ^19.0.4 |
| @vercel/ncc | ^0.45.0 |
| @vitejs/plugin-react | ^4.3.4 |
| autoprefixer | ^10.4.20 |
| pkg | ^5.8.1 |
| postcss | ^8.5.3 |
| tailwindcss | ^3.4.17 |
| typescript | ^5.7.3 |
| vite | ^6.2.1 |

### Rust Dependencies (Cargo.toml)
| Crate | Version |
|-------|---------|
| tauri | 2 |
| serde | 1 (with derive) |
| serde_json | 1 |
| tauri-plugin-shell | 2.3.5 |
| tauri-build (build) | 2 |

---

## Build Commands (Verified from package.json / tauri.conf.json)

| Purpose | Command |
|---------|---------|
| Dev (frontend only) | `npm run dev` → `vite` |
| Build sidecar | `npm run build:sidecar` → `node scripts/build-sidecar.cjs` |
| Build (frontend) | `npm run build` → `npm run build:sidecar && tsc -b && vite build` |
| Lint | `npm run lint` → `oxlint` |
| Test | `npm run test` → `node --test tests/*.test.mjs` |
| Tauri dev | `npm run tauri:dev` → `tauri dev` |
| Tauri build | `npm run tauri:build` → `tauri build` |
| Tauri before-dev | `npm run dev` (configured in tauri.conf.json) |
| Tauri before-build | `npm.cmd run build` (configured in tauri.conf.json) |

---

## Release Configuration

- **Bundle targets:** all
- **NSIS installer:** currentUser install mode
- **External binary (sidecar):** `bin/anime-server`
- **Icons:** 32x32.png, 128x128.png, icon.ico, icon.png
- **Packaging scripts:** `package-release.ps1`, `package-release-portable.ps1` (untracked)

---

## Critical Files

| File | Responsibility |
|------|---------------|
| `src/main.tsx` | React entry, context wrappers, router |
| `src/App.tsx` | Route definitions, layout shell |
| `src/context/UserContext.tsx` | All user state (watchlist, watched, progress, prefs) |
| `src/context/ApiKeyContext.tsx` | TMDB API key management |
| `src/services/storage.ts` | localStorage persistence, migration |
| `src/services/tmdb.ts` | TMDB API client with in-memory cache |
| `src/services/streaming/StreamingManager.ts` | Provider orchestration, health, fallback |
| `src/components/player/VideoPlayer.tsx` | Main video player (66KB, HLS/MP4/embed) |
| `src/components/player/anime/AnimeVideoPlayer.tsx` | Anime-specific player (35KB) |
| `src/services/anime/AnimeStreamService.ts` | Anime stream resolution via sidecar |
| `src-tauri/src/lib.rs` | Tauri app setup, sidecar spawn, navigation guard |
| `backend/server.js` | Anime proxy sidecar (anime-sdk) |

---

## Critical Systems

1. **Playback Engine** — VideoPlayer.tsx handles HLS/MP4/embed with watchdog, fallback
2. **Anime Subsystem** — AnimeVideoPlayer, AnimeStreamService, sidecar proxy
3. **Provider Pipeline** — StreamingManager with 6 providers, health tracking, fallback chain
4. **Storage** — localStorage with `roninplex_*` keys and CinePulse migration
5. **Tauri Shell** — Navigation guard, sidecar lifecycle, runtime logging IPC

---

## Known Issues (from Git History)

Recent commits indicate multiple anime playback regressions that were fixed:
- `67ae300` fix(anime): restore tauri playback
- `29a55a3` fix(anime): intercept proxy headers for Tauri WebView2 compatibility
- `820788b` hotfix: anime playback regression, performance, and UI bleeding
- `02c88e6` fix(anime): finalize v2.0.1 playback and performance
- `bb0fe38` fix(anime): resolve tv leakage and playback regression

---

## Current Risks

1. **CSP disabled** — `tauri.conf.json` sets CSP to `null`
2. **Single-context bottleneck** — `UserContext` owns all user state; playback progress updates trigger broad re-renders
3. **No CI/CD** — No `.github` directory or automated pipeline
4. **No frontend unit/component tests** — Only integration-level test file exists
5. **Sidecar uses `pkg` + node18** — Legacy packaging approach
6. **Capabilities minimal** — Only `core:default` permission; no explicit `shell:allow-*` for sidecar
