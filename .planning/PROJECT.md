# RoninPLEX

**Version:** 2.0.0
**Target Platform:** Windows 10/11 64-bit (Tauri 2 Desktop Application)
**Analysis Date:** 2026-08-30

## Overview
RoninPLEX is a premier desktop cinema streaming and media discovery application. It unifies mainstream Hollywood movies and television with an authentic, fully isolated anime ecosystem, all brought together through an elegant glassmorphism aesthetic and Ronin AI, an interactive conversational companion.

## Core Value
Delivering a high-performance, ad-resilient desktop streaming experience that treats anime as a first-class domain with zero compromises on catalog depth, streaming stability, or design elegance.

## Locked Architectural Decisions
<decisions>
- **VLC Eradication:** Complete zero-tolerance eradication of VLC libraries and bindings. Native HTML5 video and hls.js for all streams.
- **Anime Isolation:** Anime domain is completely isolated from TMDB. Dedicated AniList GraphQL metadata queries and anime-sdk stream providers.
- **Dual Video Player Architecture:** Dedicated AnimeVideoPlayer separate from generic Movie/TV VideoPlayer to handle anime-specific subtitle tracks and episode pagination.
- **No 500-Episode Hard Cap:** Support series with 1100+ episodes via chunked pagination.
- **Ronin AI Conversational Branding:** 9-state reactive samurai avatar with multi-turn session memory avoiding duplicate recommendations.
- **Compound Key Deduplication:** Discover and search use compound mediaType:id keys and request ID cancellation.
- **Glassmorphism Design System:** Genuine CSS backdrop-filter blur tokens (.glass-card, .glass-nav).
- **Tauri Security Guard:** Rust navigation guard blocking unauthorized iframe webview hijacking.
</decisions>

## Non-Goals
- Torrenting or P2P swarm hosting
- User account sync or cloud databases (client-side local persistence only)
- Commercial monetization or ad injection

## Key Constraints
- Must run reliably offline or without API keys via mock fallback data.
- Desktop webview must prevent third-party video host popups from hijacking the main window.
