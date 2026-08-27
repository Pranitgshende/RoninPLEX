# Changelog

All notable changes to **RoninPLEX** will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-08-27 — Complete Development, Performance, Player & Multi-Streaming Upgrade

### Added
- **Multi-Provider Streaming Architecture & Automatic Fallback**:
  - Integrated **VidSrc Me** (`https://vidsrcme.ru/`).
  - Integrated **VidSrc Dev** (`https://vidsrc.dev/`).
  - Integrated **VidLink Pro** (`https://vidlink.pro/`).
  - Preserved **VidSrc To** (`https://vidsrc.to/`) and user-configurable Custom Provider.
  - Removed mock demo provider.
  - Implemented automatic fallback chain in `StreamingManager`: sequentially attempts configured/registered providers when one is unavailable, ensuring seamless playback without interrupting the user.
  - Added fallback attempts tracking to the Streaming Diagnostics HUD (`D` key).
- **Video Player UX Overhaul**:
  - **Single-Click Play/Pause**: Fixed viewport letterboxing and overlay click blocking; single click anywhere on native player reliably toggles play/pause.
  - **Interactive Scrubbing Timeline**: Added smooth drag-to-seek scrub bar with buffer progress and hover timestamp tooltips, clamped between 0 and duration.
  - **-10s / +10s Seek Controls**: Quick seek buttons added to player control bar with keyboard ArrowLeft/ArrowRight support.
  - **Picture-in-Picture (PiP)**: Added PiP button with standard HTML5 PiP and Chromium/WebView2 Document Picture-in-Picture support for resizable player windows.
  - **TV Episode Navigation**: Added "Previous Episode" navigation alongside "Next Episode" and auto-prompt on episode completion.
  - **Iframe Sandboxing & Redirect Prevention**: Applied sandboxing (`sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"`) to block malicious top-level redirects and unwanted external tab popups from third-party embed providers.
- **Continue Watching Improvements**:
  - Consolidated TV series on the Home shelf to display only the most recent episode watched, eliminating duplicate series cards.
  - Per-episode progress persistence and resume position tracking across sessions.
- **TMDB & API Performance**:
  - Implemented in-flight request deduplication to prevent redundant concurrent network calls.
  - Dynamic cache invalidation on TMDB API key updates.
  - Request race condition cancellation in `Watch.tsx` when rapidly switching episodes.
- **Complete Rebrand & Legacy Storage Migration**:
  - Fully eliminated legacy CinePulse branding across icons, capabilities, configs, and UI.
  - Safe one-time legacy storage migration migrating existing `cinepulse_*` keys to `roninplex_*` keys without data loss.

---

## [1.0.0] - 2026-08-27 — Initial Release

### Added
- **Dark Cinematic Netflix-Inspired UI**:
  - Hero banner with backdrop artwork, metadata chips, quick actions, and trailer modal.
  - Netflix-style horizontal media carousels with smooth arrow scrolling.
  - Custom movie cards with 400ms debounced auto-playing YouTube trailer previews and singleton audio focus.
  - Comprehensive Movie and TV Show details modals with genres, release dates, ratings, cast, and recommendations.
- **TMDB Discovery & Search Engine**:
  - Live search with instant debounced results across movies and television series.
  - Curated categories: Trending, Top Rated, Now Playing, Upcoming, and Popular TV.
  - Filter by genre, release year, and sorting criteria.
  - User-configurable TMDB API Key in Settings or modal with local storage persistence.
- **Personal Cinema Decision Engine**:
  - **Tonight Picker**: 3-step interactive mood quiz ("Quick Escape", "Deep Story", "Adrenaline") with smart randomized suggestions.
  - **Recommendations**: Dynamic matching algorithm tailored to favorite genres and watch history.
- **Cinema Vault (User Library)**:
  - **Watchlist**: Save movies and TV shows for later with one-click bookmarking.
  - **Watched History**: Keep track of completed titles with personal ratings and notes.
  - **Continue Watching**: Automatic playback progress tracking across both native video streams and embed sources.
- **Modular Decoupled Streaming Architecture**:
  - Decoupled `StreamingManager` with multi-provider abstraction layer (`StreamingProvider` interface).
  - Native **VidSrc Provider** (`vidsrc.to`) resolving movies and TV episodes with full embed support.
  - Built-in **Demo Provider** with public-domain HLS and MP4 streams (Big Buck Bunny, Sintel, Tears of Steel).
  - **Custom REST / Embed API Provider** with configurable endpoints, headers, and token authentication.
  - Dynamic runtime provider switching in Settings with live connectivity testing.
- **Integrated Video Player Engine**:
  - Supports HLS (`.m3u8` via hls.js), direct MP4 (`<video>`), and responsive iframes (`embed`).
  - Embed player configured with full permissions (`autoplay`, `fullscreen`, `picture-in-picture`), origin referrer policy, and no restrictive sandboxes blocking nested player frames.
  - TV series episode drawer and "Next Episode" button directly within player.
  - Periodic local progress saving for seamless "Continue Watching" resumption.
  - Floating 7-second buffer assistance bar with "Reload Stream" and "Open in Window" options.
  - Built-in Development Diagnostics HUD (`D` key or Terminal header button).
- **Windows Desktop Application (Tauri 2)**:
  - Native 64-bit Windows executable powered by Rust and WebView2.
  - Standalone portable binary (`roninplex.exe`).
  - Professional NSIS Graphical Setup Installer (`RoninPLEX_1.0.0_x64-setup.exe`) with custom installation directory selection (`[ Browse... ]`), Desktop shortcut creation, Start Menu entry, and clean uninstaller.
  - Microsoft Windows Installer package (`RoninPLEX_1.0.0_x64_en-US.msi`).
