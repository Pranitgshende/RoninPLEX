# Product Requirements

**Source:** PRD-v2.0.0.md

## Anime Isolation & Metadata
- **ANIM-01**: Anime catalog must query AniList GraphQL API independently without TMDB dependencies.
- **ANIM-02**: Anime metadata must include romaji, english, and native titles, banner, cover image, format, status, season, and genres.
- **ANIM-03**: Latest and upcoming airing schedule must calculate live countdowns.
- **ANIM-04**: Episode selector must support 1100+ episodes without 500-cap limitation, with chunking and jump-to-episode controls.

## Video Playback & Failover
- **PLAY-01**: Dedicated AnimeVideoPlayer for anime streams with subtitle track selection and server switcher.
- **PLAY-02**: Movie and TV VideoPlayer with Hls.js native streaming and embed iframe fallbacks.
- **PLAY-03**: Multi-provider streaming cascade with automatic failover on error.
- **PLAY-04**: Streaming diagnostics overlay (GSD) showing latency, buffer health, and active provider.

## Unified Discovery & Search
- **DISC-01**: Unified Discover page supporting Movies, TV Shows, Anime, and All Media.
- **DISC-02**: Compound key deduplication (mediaType:id) to prevent duplicate media cards.
- **DISC-03**: Request cancellation on filter changes (requestIdRef) to eliminate stale response races.
- **DISC-04**: Universal Search querying Movies, TV, and Anime with grouped tab filtering.

## 18+ Content Classification & Accessibility
- **ADLT-01**: Explicit 18+ adult content classification and genre filtering.
- **ADLT-02**: Accessible AdultBadge with explicit `aria-label="18+ Adult Content"`.

## Ronin AI & Conversational Experience
- **AI-01**: Multi-turn conversational recommendations with franchise depth (Marvel, Anime Dojo, etc.).
- **AI-02**: Session memory tracking recommended IDs to avoid repeating recommendations.
- **AI-03**: 9-state reactive Ronin avatar with SVG animations responding to chat events.
- **AI-04**: Poetic Ronin tone generator grounded in real media overviews.

## UI Design & Glassmorphism
- **UI-01**: Cohesive glassmorphism styling (.glass-card, .glass-nav, backdrop-filter blur).
- **UI-02**: Responsive navigation bar with direct link to Ronin AI.
- **UI-03**: Reduced motion media query support for accessibility.
- **UI-04**: Fluid hover, focus, and transition effects across all media cards.

## Security & Architecture Integrity
- **SEC-01**: Tauri 2 navigation guard preventing iframe webview hijacking.
- **SEC-02**: Zero VLC libraries or mentions across frontend and backend.
- **SEC-03**: Offline mock data fallback when TMDB API key is missing.
