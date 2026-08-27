# Changelog

All notable changes to **RoninPLEX** will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
