# Architectural & Design Decisions

**Source:** PRD-v2.0.0.md

## DEC-01: Complete VLC Eradication
- source: PRD-v2.0.0.md (Section 2, 55)
- status: locked (PRD architectural rule)
- decision: Zero VLC dependencies, zero libvlc bindings, zero VLC mentions across Rust and frontend codebases. Use native HTML5 video and hls.js for all playback.
- scope: Video playback, Tauri desktop shell

## DEC-02: Strict Anime Domain Isolation
- source: PRD-v2.0.0.md (Section 2.1, 4)
- status: locked (PRD architectural rule)
- decision: Anime domain is completely isolated from TMDB. AnimeService must never import from tmdb.ts. Uses AniList GraphQL API for metadata and anime-sdk for streaming.
- scope: Anime catalog, metadata, services

## DEC-03: Dual Player Architecture
- source: PRD-v2.0.0.md (Section 9, 10)
- status: locked (PRD architectural rule)
- decision: Dedicated AnimeVideoPlayer component separate from generic movie/TV VideoPlayer to handle anime-specific subtitle tracks, episode pagination, and stream servers.
- scope: Playback, video components

## DEC-04: Support 1100+ Episodes Without Artificial Caps
- source: PRD-v2.0.0.md (Section 5, 8)
- status: locked (PRD architectural rule)
- decision: Remove Math.min(count, 500) limit. Paginate and chunk episode list rendering (CHUNK_SIZE) to support long-running series like One Piece smoothly.
- scope: Anime details, episode navigation

## DEC-05: Ronin AI Conversational Branding & Mascot
- source: PRD-v2.0.0.md (Section 25, 27)
- status: locked (PRD architectural rule)
- decision: Rebrand Decision Helper to Ronin AI. Implement 9 reactive character states (idle, thinking, talking, happy, curious, recommending, surprised, sword-practice, celebrating) with multi-turn session memory.
- scope: AI recommendation, mascot avatar, navigation

## DEC-06: Unified Multi-Media Discover with Compound Keys
- source: PRD-v2.0.0.md (Section 12, 13, 14)
- status: locked (PRD architectural rule)
- decision: Discover page unifies Movies, TV, and Anime with compound deduplication keys (mediaType:id) and request ID cancellation to prevent race conditions.
- scope: Discovery, search, filtering

## DEC-07: Real Glassmorphism UI Design System
- source: PRD-v2.0.0.md (Section 20, 21, 22)
- status: locked (PRD architectural rule)
- decision: Implement authentic glass tokens (.glass-card, .glass-nav, .glass-panel) using CSS backdrop-filter blur and semi-transparent borders.
- scope: Styling, components, theme

## DEC-08: Tauri Navigation Security Guard
- source: PRD-v2.0.0.md (Section 51)
- status: locked (PRD architectural rule)
- decision: Implement native Rust navigation guard intercepting webview navigation to block unauthorized external redirects and ad popups from embed hosts.
- scope: Desktop shell, security
