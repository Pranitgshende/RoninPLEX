# RoninPLEX v2.0.0 — Authoritative Project Documentation & Technical Specification

> **Document Version**: 2.0.0  
> **Release Date**: August 30, 2026  
> **Target Platform**: Windows 10 / 11 (x64)  
> **Classification**: Authoritative Engineering & Operational Specification  
> **Architecture**: Tauri 2 (Rust Backend + WebView2) + React 19 + TypeScript + Vite + Tailwind CSS

---

## Table of Contents
1. [Project Overview & Mission](#1-project-overview--mission)
2. [Architecture & Design Principles](#2-architecture--design-principles)
3. [Complete Directory Structure](#3-complete-directory-structure)
4. [Technical Stack & Dependencies](#4-technical-stack--dependencies)
5. [Configuration System](#5-configuration-system)
6. [Data Models & Type Definitions](#6-data-models--type-definitions)
7. [Storage Architecture & Local Persistence](#7-storage-architecture--local-persistence)
8. [Video Player Engine](#8-video-player-engine)
9. [Seek System & Gesture Navigation](#9-seek-system--gesture-navigation)
10. [TV Auto-Next Episode System](#10-tv-auto-next-episode-system)
11. [External Player Integration (VLC)](#11-external-player-integration-vlc)
12. [Streaming Architecture & Multi-Provider System](#12-streaming-architecture--multi-provider-system)
13. [Provider Health Tracking & Fast-Fail Strategy](#13-provider-health-tracking--fast-fail-strategy)
14. [TMDB Metadata Service & Discovery Architecture](#14-tmdb-metadata-service--discovery-architecture)
15. [Recommendation Engine & Decision Helper](#15-recommendation-engine--decision-helper)
16. [Home Page Layout Customization System](#16-home-page-layout-customization-system)
17. [Settings & Configuration Center](#17-settings--configuration-center)
18. [Security Architecture & Navigation Protection](#18-security-architecture--navigation-protection)
19. [Window Management & Desktop Shell Integration](#19-window-management--desktop-shell-integration)
20. [Styling System & Visual Design Language](#20-styling-system--visual-design-language)
21. [Error Handling, Resilience & Fallback Strategies](#21-error-handling-resilience--fallback-strategies)
22. [Build System, Compilation & Bundling Pipeline](#22-build-system-compilation--bundling-pipeline)
23. [Packaging & Windows Installer Architecture](#23-packaging--windows-installer-architecture)
24. [Installation & Deployment Guide](#24-installation--deployment-guide)
25. [Quality Assurance, Testing & Release Verification](#25-quality-assurance-testing--release-verification)
26. [Troubleshooting Guide](#26-troubleshooting-guide)
27. [Version History & v1.2.0 Changelog](#27-version-history--v120-changelog)

---

## 1. Project Overview & Mission

**RoninPLEX** is a sovereign desktop cinema discovery and streaming application developed exclusively for personal Windows usage. Combining the rich metadata, cast profiles, and discovery intelligence of The Movie Database (TMDB) with a modular, decoupled streaming engine, RoninPLEX delivers a home theater desktop experience with zero remote telemetry, tracking, or cloud surveillance.

### Core Mission Pillars
1. **Sovereignty & Privacy**: All watchlists, viewing history, resume positions, and API keys reside exclusively on the user's local disk in encrypted or user-owned application data structures. No telemetry, usage tracking, or behavioral profiling is ever transmitted.
2. **Resilience Through Multi-Provider Failover**: Free streaming endpoints are inherently volatile. RoninPLEX abstracts stream resolution through a decoupled provider layer equipped with health tracking, failure penalty expiration, and automated fallback chains.
3. **Desktop-Grade Performance**: Built on Tauri 2 with a lightweight Rust backend and WebView2 renderer, RoninPLEX uses under 50 MB of memory at idle—a fraction of the footprint consumed by Electron-based counterparts.
4. **Cinematic Immersion**: Inspired by dark modern theater interfaces, featuring ambient backdrop artwork, 400ms debounced trailer previews, instant keyboard scrubbing, interactive timelines, and seamless external media player handoff.

---

## 2. Architecture & Design Principles

RoninPLEX adheres to a strict separation of concerns across its native Rust shell, React presentation layer, and modular service infrastructure:

```
+-----------------------------------------------------------------------+
|                           RoninPLEX Desktop                           |
+-----------------------------------------------------------------------+
|  [Tauri 2 Core Runtime / Rust 1.85]                                   |
|   - Window Lifecycle & Native Chrome                                  |
|   - Webview2 Host & Navigation Guard (tauri.localhost enforcement)    |
|   - Process Spawning Security (VLC interop with arg sanitization)     |
+-----------------------------------------------------------------------+
                                  | IPC (invoke)
+-----------------------------------------------------------------------+
|  [Frontend Presentation Layer / React 19 + TypeScript + Tailwind]     |
|   - Router: Hash / Web history navigation (react-router-dom v7)       |
|   - Contexts: UserContext (layout/history), ApiKeyContext (TMDB key)  |
|   - Pages: Home, Discover, Library, Watch, Settings                   |
|   - Player: HLS.js, HTML5 native engine, Sandboxed embed iframes      |
+-----------------------------------------------------------------------+
                                  |
+-----------------------------------------------------------------------+
|  [Service & Business Logic Tier]                                      |
|   - StreamingManager: Multi-provider failover, health tracking, TTL   |
|   - TMDB Service: Deduplicated in-flight queries, LRU cache           |
|   - Storage Service: Safe schema migrations, LocalStorage abstraction |
|   - Recommendation Engine: Genre vector matching & scoring            |
+-----------------------------------------------------------------------+
```

### Design Principles
- **Decoupling**: The presentation UI never communicates directly with raw streaming URLs; all resolutions pass through the `StreamingManager` contract.
- **Fail-Safe Fallbacks**: Every critical flow (stream resolution, trailer fetching, metadata lookups) contains multi-tiered fallback handlers.
- **Defensive Sandboxing**: Embedded third-party streaming iframes are strictly isolated to prevent top-level navigation, tab popups, or intrusive script injection.

---

## 3. Complete Directory Structure

```
RoninPLEX/
├── CHANGELOG.md                          # Release notes and version changelog
├── package.json                          # Frontend package configuration (v1.2.0)
├── README.md                             # Repository introductory documentation
├── RONINPLEX_PROJECT_DOCUMENTATION.md    # Authoritative master specification
├── tsconfig.json                         # TypeScript compiler configuration
├── tsconfig.app.json                     # App-specific TS options
├── tsconfig.node.json                    # Tooling TS options
├── vite.config.ts                        # Vite build and dev server config
├── tailwind.config.js                    # Tailwind styling themes and color tokens
├── postcss.config.js                     # PostCSS processor config
├── dist/                                 # Production frontend bundle
│   ├── index.html
│   └── assets/                           # Compressed CSS and JavaScript chunks
├── src-tauri/                            # Rust / Tauri 2 native desktop backend
│   ├── Cargo.toml                        # Rust manifest (roninplex v1.2.0)
│   ├── tauri.conf.json                   # Tauri 2 app and bundle configuration
│   ├── capabilities/
│   │   └── default.json                  # Tauri permission capabilities
│   ├── icons/                            # Multi-resolution application icons
│   │   ├── 32x32.png
│   │   ├── 128x128.png
│   │   ├── icon.ico
│   │   └── icon.png
│   ├── src/
│   │   ├── lib.rs                        # Rust application logic & IPC handlers
│   │   └── main.rs                       # Native executable entrypoint
│   └── target/                           # Rust build outputs (debug / release)
└── src/                                  # React 19 / TypeScript frontend
    ├── App.tsx                           # Root app component and layout shell
    ├── main.tsx                          # DOM bootstrap and context providers
    ├── index.css                         # Global CSS & Tailwind layers
    ├── components/
    │   ├── common/                       # Shared UI widgets (MediaRow, Navbar, etc.)
    │   ├── decision/                     # TonightPicker decision assistant
    │   ├── details/                      # Movie and TV detail modals
    │   ├── hero/                         # Homepage dynamic hero banner
    │   ├── player/                       # VideoPlayer engine & control overlays
    │   └── toast/                        # Notification toast container
    ├── context/
    │   ├── ApiKeyContext.tsx             # TMDB API key state and validation
    │   └── UserContext.tsx               # Library, layout, and preferences provider
    ├── pages/
    │   ├── Discover.tsx                  # Browse and advanced filter engine
    │   ├── Home.tsx                      # Customizable dynamic shelf home feed
    │   ├── Library.tsx                   # Watchlist, history, and continue watching
    │   ├── Settings.tsx                  # 7-category desktop settings center
    │   └── Watch.tsx                     # Video playback and route coordinator
    ├── services/
    │   ├── recommendation.ts             # Recommendation scoring algorithm
    │   ├── storage.ts                    # Local storage persistence & schema fallback
    │   ├── tmdb.ts                       # TMDB API client with request deduplication
    │   └── streaming/                    # Modular decoupled streaming subsystem
    │       ├── StreamingManager.ts       # Central multi-provider orchestrator
    │       ├── types.ts                  # Provider interfaces & health models
    │       ├── providerConfig.ts         # User provider persistence
    │       └── providers/                # Concrete streaming providers
    │           ├── VidSrcToProvider.ts   # vidsrc.to provider
    │           ├── VidLinkProvider.ts    # vidlink.pro provider
    │           ├── VidSrcMeProvider.ts   # vidsrcme.ru provider
    │           ├── VidSrcDevProvider.ts  # vidsrc.dev provider (fast-failed)
    │           └── CustomProvider.ts     # User-defined custom REST/embed provider
    ├── types/
    │   ├── recommendation.ts             # Recommendation algorithm types
    │   ├── tmdb.ts                       # TMDB entity definitions
    │   └── user.ts                       # Preferences, layout, and library models
    └── utils/
        └── helpers.ts                    # Formatting, URL generation, and math helpers
```

---

## 4. Technical Stack & Dependencies

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **OS Host** | Windows 10 / 11 | x64 | Target execution platform |
| **Desktop Shell** | Tauri 2 | `^2.11.1` | Native Rust window, IPC, and security architecture |
| **System Webview** | Microsoft WebView2 | Evergreen | Chromium-based rendering engine embedded on Windows |
| **Backend Language**| Rust | 1.85+ | High-performance native process management |
| **Frontend Core** | React | `^19.0.0` | Component-driven UI framework |
| **Language** | TypeScript | `^5.7.3` | Strict type safety across the entire application |
| **Build Tool** | Vite | `^6.2.1` | High-speed frontend development server and bundler |
| **Styling** | Tailwind CSS | `^3.4.17` | Utility-first responsive dark cinematic design |
| **Icons** | Lucide React | `^1.16.0` | Comprehensive visual icon system |
| **Streaming** | HLS.js | `^1.7.1` | Client-side HTTP Live Streaming playback engine |
| **Routing** | React Router DOM | `^7.3.0` | Client-side declarative route management |
| **Packaging** | NSIS / WiX | 3.x / 4.x | Windows Setup executable and MSI installer packaging |

---

## 5. Configuration System

### Tauri Configuration (`src-tauri/tauri.conf.json`)
- **Product Details**: Product Name `RoninPLEX`, Version `1.2.0`, Bundle Identifier `com.roninplex.desktop`.
- **Window Specs**: Default dimensions 1280x800, minimum bounds 960x600, centered on display with native Windows decorations and custom background `#090a0f`.
- **Build Hooks**: Runs `npm.cmd run build` ahead of packaging; maps `frontendDist` to `../dist`.
- **NSIS Customizer**: `"installMode": "currentUser"` ensuring unprompted installation into `%LOCALAPPDATA%\RoninPLEX` without administrative privilege barriers.

### Vite Bundling Pipeline (`vite.config.ts`)
- Configured with separate chunk strategies for optimized caching:
  - `vendor-react`: `react`, `react-dom`, `react-router-dom`
  - `vendor-hls`: `hls.js`
  - `vendor-icons`: `lucide-react`

---

## 6. Data Models & Type Definitions

Located in `src/types/`, the core data contracts provide strict safety:

### User Preferences (`src/types/user.ts`)
```typescript
export type SeekAmount = 5 | 10 | 15 | 30;

export type HomeSectionId =
  | 'hero'
  | 'continue_watching'
  | 'watchlist'
  | 'decision_helper'
  | 'recommended'
  | 'trending'
  | 'popular_movies'
  | 'top_rated_movies'
  | 'popular_tv'
  | 'action_movies'
  | 'scifi_movies'
  | 'comedy_movies';

export interface HomeSectionItem {
  id: HomeSectionId;
  label: string;
  enabled: boolean;
}

export interface UserPreferences {
  favoriteGenreIds: number[];
  favoriteActors: string[];
  favoriteDirectors: string[];
  preferredLanguages: string[];
  minRatingThreshold: number;
  onboardingCompleted: boolean;
  autoplayTrailer: boolean;
  enableHoverTrailers: boolean;
  reduceMotion: boolean;
  adultContent: boolean;
  useVlc: boolean;
  seekAmount: SeekAmount;
  autoNextEpisode: boolean;
  autoNextCountdown: number; // in seconds (5, 10, 15)
  defaultPlaybackSpeed: number;
  defaultVolume: number;
}
```

### Playback Progress & Library Items
```typescript
export interface PlaybackProgress {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  currentTime: number;
  duration: number;
  progressPercent: number;
  lastWatchedAt: string;
}
```

---

## 7. Storage Architecture & Local Persistence

The storage service (`src/services/storage.ts`) abstracts local browser storage, enforcing key namespaces and version resilience:

### Storage Keys
- `roninplex_watchlist`: Array of saved media titles.
- `roninplex_watched`: Array of finished media items with personal ratings and dates.
- `roninplex_playback_progress`: Playback progress map for movies and individual TV episodes.
- `roninplex_preferences`: Serialized `UserPreferences`.
- `roninplex_home_layout`: Ordered array of `HomeSectionItem` models.
- `roninplex_provider_config`: User-configured custom streaming providers.

### Migration & Backward Compatibility
- **Safe Fallback**: If a user runs v1.2.0 on top of v1.1.0 data, missing preference fields (`useVlc`, `seekAmount`, `autoNextEpisode`, `autoNextCountdown`) are cleanly populated using `DEFAULT_USER_PREFERENCES` without overwriting established preferences.
- **Storage Event Synchronization**: Cross-tab/window updates trigger native storage event listeners in `UserContext`, maintaining UI synchronicity.

---

## 8. Video Player Engine

The custom player component (`src/components/player/VideoPlayer.tsx`) supports multiple playback backends:

1. **HLS Direct Streams**: Powered by `HLS.js` for high-definition adaptive bitrate streaming.
2. **Native HTML5 MP4**: Direct hardware-accelerated video decoding.
3. **Embed Provider Iframes**: Sandboxed frames providing maximum compatibility with third-party streaming engines.

### Timeline Scrubbing & Buffer Management
- Drag-and-seek timeline displaying buffered video ranges, live scrub position, and hover timestamp tooltip.
- Visual stall assistance bar: Appears when video has been buffering continuously for >7 seconds, giving the user immediate options to reload the stream, switch providers, or inspect the diagnostics HUD.

---

## 9. Seek System & Gesture Navigation

RoninPLEX v1.2.0 features a centralized seek engine:

### Configurable Jump Steps
Users can configure their preferred jump interval to **5s**, **10s** (Default), **15s**, or **30s**. This duration is bound across all seek modalities:
- **Keyboard Controls**: `ArrowLeft` (jump backward by seekStep), `ArrowRight` (jump forward by seekStep).
- **Control Bar Skip Buttons**: Dedicated `-10s` and `+10s` skip buttons reflect the configured interval.

### Edge Double-Click Gestures
- Clicking the left 1/3 of the video window seeks backward by `seekStep`.
- Clicking the right 1/3 of the video window seeks forward by `seekStep`.
- **Single-Click Coordination**: Single clicks and double clicks are reconciled using a 250ms debounced click coordinator. If a double-click is registered, the initial single-click (play/pause toggle) is cancelled, guaranteeing that seeking does not accidentally pause playback.

### Animated Seek Feedback Badge
When seeking occurs via keyboard or gestures, an animated floating badge appears:
- **Backward**: Displays `−[seekStep]s` with an animated `RotateCcw` icon.
- **Forward**: Displays `+[seekStep]s` with an animated `RotateCw` icon.
- Features a smooth CSS keyframe pulse and 800ms fadeout.

---

## 10. TV Auto-Next Episode System

To deliver an authentic streaming service experience, RoninPLEX automatically detects when an episodic television installment concludes:

1. **Trigger Condition**: Triggered on native HTML5 `onEnded` event.
2. **Countdown Card Overlay**:
   - Renders a floating modal card showing the next episode's title, episode number, and still preview.
   - An animated radial and linear SVG progress bar counts down from the configured duration (5s, 10s, or 15s).
3. **Action Controls**:
   - **Play Now**: Immediately cancels the countdown and routes to the next episode.
   - **Cancel**: Dismisses the overlay, leaving the user on the completed episode.
4. **State Machine Safety**: Unmounting the player or switching media routes completely disposes the countdown intervals, preventing ghost navigation.

---

## 11. External Player Integration (VLC)

For users who prefer local native decoding, RoninPLEX offers seamless VLC media player integration for direct media streams:

### Rust Native Backend Commands (`src-tauri/src/lib.rs`)
- `check_vlc_installed() -> Result<bool, String>`:
  Probes:
  - `C:\Program Files\VideoLAN\VLC\vlc.exe`
  - `C:\Program Files (x86)\VideoLAN\VLC\vlc.exe`
  - System `PATH` via `where.exe vlc`
- `open_stream_in_vlc(url: String) -> Result<(), String>`:
  Spawns VLC using `std::process::Command`.

### Command Injection & Process Security
- **No Shell Interpreter**: Executes `vlc.exe` directly without invoking `cmd.exe` or PowerShell, completely eliminating shell argument injection risks.
- **Sanitization**: Validates that URLs strictly start with `http://` or `https://`. Rejects quotes, null bytes, and newline characters.

### User Interface Interaction
- Video player header displays a prominent **Play in VLC** button whenever the stream is a direct HLS or MP4 source.
- If VLC is not found on the machine, a helpful modal is presented providing a direct official link to download VLC from VideoLAN (`https://www.videolan.org/vlc/`).

---

## 12. Streaming Architecture & Multi-Provider System

The streaming layer is completely decoupled through `StreamingManager` (`src/services/streaming/StreamingManager.ts`), supporting multiple interchangeable providers:

1. **VidSrc To (`vidsrc-to`)**: High-reliability primary provider.
2. **VidLink Pro (`vidlink`)**: High-definition secondary provider.
3. **VidSrc Me (`vidsrc-me`)**: Alternate fallback endpoint.
4. **Custom Provider (`custom`)**: User-configured private REST or embed media server.
5. **VidSrc Dev (`vidsrc-dev`)**: Known parked domain, fast-failed automatically.

---

## 13. Provider Health Tracking & Fast-Fail Strategy

Streaming endpoints periodically experience downtime. RoninPLEX tracks provider health dynamically:

- **Failure Penalty Tracking**: Each failed attempt increments a failure count on the provider's health record.
- **5-Minute Health Expiration**: Penalties expire after 5 minutes (`HEALTH_EXPIRATION_MS = 300000`). A degraded provider is automatically re-eligible for fallback attempts once the recovery window passes.
- **Fast-Fail Known Dead Hosts**: Parked or defunct providers (such as `vidsrc.dev`) are immediately fast-failed, preventing UI stalls.
- **Health Diagnostics HUD**: Live health metrics (success count, failure count, last failure timestamp) are accessible via the Diagnostics HUD (`D` key) and the Settings Streaming tab.

---

## 14. TMDB Metadata Service & Discovery Architecture

The TMDB service (`src/services/tmdb.ts`) serves as the metadata backbone:

- **Deduplication**: In-flight promises are tracked in a Map, coalescing duplicate concurrent requests for the same endpoint into a single network transmission.
- **LRU In-Memory Caching**: Media responses, trailers, and cast profiles are cached in memory for rapid repeated access.
- **Custom Key Override**: Users can supply their own personal TMDB API key in Settings, which is validated before persistent storage.

---

## 15. Recommendation Engine & Decision Helper

RoninPLEX features an intelligent offline recommendation algorithm:

- **Taste Profile Vectoring**: Weights titles based on user favorite genres (+35 pts), matching directors (+25 pts), TMDB popularity (+15 pts), and critical ratings (+25 pts).
- **Deduplication against History**: Automatically penalizes already-watched titles to surface fresh discoveries.
- **Tonight Decision Helper**: A 3-question interactive wizard analyzing user mood, time constraints, and format preferences to deliver an instant recommendation with an auto-playing trailer.

---

## 16. Home Page Layout Customization System

In RoninPLEX v1.2.0, the home page is completely dynamic:

- **User-Defined Order**: Shelves can be reordered up or down according to personal viewing priorities.
- **Toggle Visibility**: Any shelf can be toggled on or off.
- **Bandwidth & Network Optimization**: Disabled sections are skipped during initial data loading. TMDB endpoints for hidden sections are not called, saving bandwidth and accelerating page rendering.
- **Remaining Time Display**: Continue Watching cards calculate exact remaining watch time (e.g. `24m left (65%)`).

---

## 17. Settings & Configuration Center

The Settings page (`src/pages/Settings.tsx`) features a tabbed desktop interface:

1. **Home Page**: Reorder shelves with Up/Down buttons, toggle section visibility, and restore default layout.
2. **Playback & VLC**: Configure VLC external player toggle, central seek step (5s/10s/15s/30s), TV auto-next episode toggle, countdown duration, and default playback speed.
3. **Streaming**: Select preferred provider, test connections, view the Provider Health Diagnostics table, and configure custom API endpoints.
4. **TMDB Metadata**: Manage custom API key with masked input and connection validation.
5. **Appearance**: Reduced motion toggle, hover trailer previews, autoplay hero trailer, and favorite genres picker.
6. **Storage & Privacy**: Local storage usage statistics, clear watchlist/history/progress, purge stream URL cache, and complete factory reset.
7. **About RoninPLEX**: Application version (v1.2.0), stack architecture details, and release highlights.

---

## 18. Security Architecture & Navigation Protection

### The Production Navigation Guard Fix
In Tauri 2 on Windows, the embedded webview serves production assets over `http://tauri.localhost/`.
A previous release had an issue where `on_navigation` strictly checked:
```rust
url.scheme() == "http" && url.host_str() == Some("localhost")
```
Because `host_str()` for `http://tauri.localhost/` is `"tauri.localhost"`, top-level navigation to the bundled frontend was blocked, causing the installed application to fail on startup.

**The Authoritative Resolution** in `src-tauri/src/lib.rs`:
```rust
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
```
This permits local application assets while continuing to block malicious iframe breakout attempts to external phishing or advertising websites.

---

## 19. Window Management & Desktop Shell Integration

- **Native Controls**: Standard Windows minimize, maximize/restore, and close buttons integrated with the dark chrome theme.
- **Position Memory**: Centers automatically on primary display and enforces minimum dimensions (960x600) to prevent UI truncation.
- **Picture-in-Picture Support**: Native HTML5 PiP and Document PiP for floating player workflows.

---

## 20. Styling System & Visual Design Language

- **Design System**: Dark cinematic theme utilizing deep obsidian backgrounds (`#090a0f`), rich slate surfaces, and vibrant brand violet/amber accents.
- **Glassmorphism**: Subtle backdrop blur filters (`backdrop-blur-md`) applied across headers, player controls, and floating modal shelves.
- **Micro-Interactions**: Smooth card hover expansions, debounced trailer transitions, and seek feedback badges.

---

## 21. Error Handling, Resilience & Fallback Strategies

- **Stream Failover**: Automated fallback through provider hierarchy if an error occurs during playback.
- **Image Fallbacks**: Broken poster and backdrop paths automatically fall back to styled gradients and placeholder icons.
- **Offline Mode**: If TMDB network calls fail, cached local watchlist and continue watching items remain fully browsable.

---

## 22. Build System, Compilation & Bundling Pipeline

### Step 1: Frontend Typecheck & Bundle
```powershell
npm.cmd run build
```
Executes `tsc -b` for TypeScript type validation followed by `vite build`, writing optimized production assets to `dist/`.

### Step 2: Native Rust Release Compilation
```powershell
npm.cmd run tauri:build
```
Compiles the Rust backend in release mode (`--release`) with optimizations, generating the native binary `roninplex.exe`.

---

## 23. Packaging & Windows Installer Architecture

Tauri produces two production distribution packages:

1. **NSIS Graphical Setup Installer**:
   - File: `RoninPLEX_1.2.0_x64-setup.exe`
   - Size: ~2.1 MB
   - Mode: `currentUser` (installs to `%LOCALAPPDATA%\RoninPLEX` without requiring administrative privileges).
   - Creates Desktop and Start Menu shortcuts, registers clean uninstaller in Windows Control Panel.
2. **Microsoft Windows Installer (MSI)**:
   - File: `RoninPLEX_1.2.0_x64_en-US.msi`
   - WiX-based enterprise installation package.

---

## 24. Installation & Deployment Guide

### Clean Installation
Run the NSIS installer:
```powershell
RoninPLEX_1.2.0_x64-setup.exe
```
For silent unprompted deployment:
```powershell
RoninPLEX_1.2.0_x64-setup.exe /S
```

### Uninstallation
Uninstall via Windows Settings &rarr; Installed Apps &rarr; **RoninPLEX** &rarr; Uninstall, or run:
```powershell
%LOCALAPPDATA%\RoninPLEX\uninstall.exe /S
```

---

## 25. Quality Assurance, Testing & Release Verification

| Verification Phase | Test Performed | Result |
|---|---|---|
| **Frontend Compilation** | `npm.cmd run build` (TypeScript + Vite) | **PASSED** (0 errors) |
| **Backend Compilation** | `cargo check` & `cargo test` in `src-tauri` | **PASSED** (0 warnings, 0 errors) |
| **Packaging Pipeline** | `npm.cmd run tauri:build` (NSIS bundle) | **PASSED** (`RoninPLEX_1.2.0_x64-setup.exe`) |
| **Silent Installation** | Executed installer with `/S` | **PASSED** (installed to LocalAppData) |
| **Installed App Launch** | Launched `%LOCALAPPDATA%\RoninPLEX\roninplex.exe` | **PASSED** (responsive, 0 errors) |
| **WebView2 Verification** | Inspected `msedgewebview2` child processes | **PASSED** (active rendering, ~46MB RAM) |
| **VLC Interop** | Validated path probing & argument sanitization | **PASSED** (no shell injection) |
| **Seek System** | Configurable steps (5s/10s/15s/30s) + badge | **PASSED** (clamped bounds) |
| **TV Auto-Next** | Countdown card on `onEnded` with cancel/skip | **PASSED** (timer cleanups verified) |
| **Home Layout** | Section reordering & lazy API queries | **PASSED** (verified in React state) |

---

## 26. Troubleshooting Guide

### Issue 1: Application window opens to a blank screen
- **Cause**: Outdated navigation guard blocking `tauri.localhost` in production.
- **Resolution**: Verify you are running v1.2.0, where the navigation guard explicitly permits `tauri.localhost` and `*.localhost`.

### Issue 2: VLC media player does not launch when clicking "Play in VLC"
- **Cause**: VLC is not installed in standard Windows directories (`Program Files\VideoLAN\VLC`) or added to system `PATH`.
- **Resolution**: Install VLC from `https://www.videolan.org/vlc/` or verify that `vlc.exe` is accessible from the command line.

### Issue 3: Streaming video fails or buffers continuously
- **Cause**: Upstream provider endpoint is degraded or temporarily blocked.
- **Resolution**: Press `D` to inspect the Streaming Diagnostics HUD. RoninPLEX will automatically fall back to the next healthy provider in the rotation. Alternatively, switch your preferred provider in Settings.

---

## 27. Version History & v1.2.0 Changelog

### v1.2.0 (August 28, 2026)
- **External VLC Player Interop**: Direct stream playback via local VLC installation.
- **Central Seek Engine**: 5s/10s/15s/30s jump intervals, edge double-click gestures, animated feedback badge.
- **TV Auto-Next Episode**: Automated countdown card on episode completion with skip and cancel options.
- **Home Page Customization**: Shelf reordering, visibility toggling, lazy TMDB endpoint loading, and remaining time display.
- **Multi-Provider Health Manager**: 5-minute fast-fail penalty expiration and automated fallback chains.
- **Settings Redesign**: 7-tab desktop navigation center with cache purge and factory reset tools.
- **Release Startup Fix**: Resolved Tauri 2 `on_navigation` guard to allow `tauri.localhost` in production builds.

### v1.1.0 (August 27, 2026)
- Multi-provider architecture with automatic failover (VidSrc To, VidLink Pro, VidSrc Me).
- Single-click play/pause player engine with scrub timeline and PiP support.
- Continue Watching series consolidation and in-flight request deduplication.

### v1.0.0 (August 27, 2026)
- Initial release of RoninPLEX personal cinema discovery desktop application.
