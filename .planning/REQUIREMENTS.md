# Requirements

**Version:** 2.0.0
**Analysis Date:** 2026-08-30

## v1 Requirements

### Architecture & Isolation (ARCH)
- [x] **ARCH-01**: Zero VLC dependencies or mentions across Rust and frontend codebases.
- [x] **ARCH-02**: Anime domain isolated in `src/services/anime/` with zero imports from `../tmdb`.
- [x] **ARCH-03**: Tauri 2 navigation guard blocks malicious iframe webview redirects.
- [x] **ARCH-04**: Local offline mock catalog fallback when TMDB API key is missing.

### Anime Catalog & Streaming (ANIM)
- [x] **ANIM-01**: Query AniList GraphQL API for trending, popular, search, and seasonal catalog.
- [x] **ANIM-02**: Calculate live countdowns for latest and upcoming anime airing schedules.
- [x] **ANIM-03**: Support 1100+ episodes without 500-cap limitation via chunked episode selector.
- [x] **ANIM-04**: Dedicated `AnimeVideoPlayer` with subtitle track selection and server switcher.
- [x] **ANIM-05**: Connect to local `anime-server` sidecar on port 4173 via `AnimeSdkAdapter`.

### Playback & Failover (PLAY)
- [x] **PLAY-01**: Movie and TV `VideoPlayer` with HLS adaptive streaming and embed iframe fallbacks.
- [x] **PLAY-02**: Multi-provider streaming cascade with automatic failover on broken streams.
- [x] **PLAY-03**: Streaming diagnostics overlay (GSD) showing latency, buffer health, and active provider.

### Unified Discovery & Search (DISC)
- [x] **DISC-01**: Unified Discover page supporting Movies, TV Shows, Anime, and All Media.
- [x] **DISC-02**: Compound key deduplication (`mediaType:id`) preventing duplicate media cards.
- [x] **DISC-03**: Request cancellation on filter changes to eliminate stale race conditions.
- [x] **DISC-04**: Universal Search querying across Movies, TV Shows, and Anime simultaneously.

### Classification & Accessibility (ADLT)
- [x] **ADLT-01**: Explicit 18+ adult content classification and genre filtering.
- [x] **ADLT-02**: Accessible `AdultBadge` with explicit `aria-label="18+ Adult Content"`.

### Ronin AI & Design (AI & UI)
- [x] **AI-01**: Multi-turn conversational recommendations with franchise depth (Marvel, Anime Dojo).
- [x] **AI-02**: Session memory tracking recommended IDs to prevent repeat recommendations.
- [x] **AI-03**: 9-state reactive `RoninAvatar` with animated SVG expressions.
- [x] **AI-04**: Poetic Ronin tone generator grounded in real media overviews.
- [x] **UI-01**: Authentic glassmorphism tokens (`.glass-card`, `.glass-nav`, backdrop-filter blur).
- [x] **UI-02**: Accessible keyboard navigation and reduced-motion media query support.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 1 | Complete |
| ARCH-02 | Phase 1 | Complete |
| ARCH-03 | Phase 1 | Complete |
| ARCH-04 | Phase 1 | Complete |
| ANIM-01 | Phase 2 | Complete |
| ANIM-02 | Phase 2 | Complete |
| ANIM-03 | Phase 2 | Complete |
| ANIM-04 | Phase 2 | Complete |
| ANIM-05 | Phase 2 | Complete |
| PLAY-01 | Phase 2 | Complete |
| PLAY-02 | Phase 2 | Complete |
| PLAY-03 | Phase 2 | Complete |
| DISC-01 | Phase 3 | Complete |
| DISC-02 | Phase 3 | Complete |
| DISC-03 | Phase 3 | Complete |
| DISC-04 | Phase 3 | Complete |
| ADLT-01 | Phase 3 | Complete |
| ADLT-02 | Phase 3 | Complete |
| AI-01 | Phase 4 | Complete |
| AI-02 | Phase 4 | Complete |
| AI-03 | Phase 4 | Complete |
| AI-04 | Phase 4 | Complete |
| UI-01 | Phase 4 | Complete |
| UI-02 | Phase 4 | Complete |
