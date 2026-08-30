# External Integrations

**Analysis Date:** 2026-08-30

## APIs & External Services

**Movie & TV Metadata:**
- The Movie Database (TMDB) API - Primary metadata provider for movies, TV series, cast, genres, trailers, and trending feeds
  - Endpoint: `https://api.themoviedb.org/3`
  - Client: `src/services/tmdb.ts`
  - Auth: `VITE_TMDB_API_KEY` (env) or user custom key in localStorage via `storage.getCustomApiKey()`

**Anime Metadata & Schedules:**
- AniList GraphQL API - Dedicated anime metadata, trending lists, seasonal catalog, and upcoming airing countdown schedules
  - Endpoint: `https://graphql.anilist.co`
  - Client: `src/services/anime/AnimeRepository.ts`
  - Auth: Public GraphQL endpoint (no API key required)

**Anime Streaming Engine:**
- anime-sdk Local HTTP Sidecar - Scrapes and resolves direct streaming sources and mirrors (Gogoanime, Allmanga)
  - Endpoint: `http://localhost:4173`
  - Client: `src/services/anime/AnimeSdkAdapter.ts`
  - Server implementation: `backend/server.js`
  - Spawned by: Tauri sidecar in `src-tauri/src/lib.rs` or Node backend process

**Video Streaming Embed Providers:**
- Multi-provider embed cascade - Fallback streaming providers for Movies and TV shows
  - Endpoints: Vidsrc cluster (`vidsrc.to`, `vidsrc.me`, `vidsrc.xyz`, `vidsrc.cc`, `vidsrc.in`, `vidsrc.pm`, `vidsrc.net`), SuperEmbed, AutoEmbed, SmashyStream
  - Client: `src/services/streaming/StreamingManager.ts`
  - Configuration: `src/services/streaming/providerConfig.ts`

## Data Storage

**Databases:**
- None (Serverless / Local desktop architecture)

**Client-Side Persistence:**
- Browser `localStorage` via `src/services/storage.ts`
  - Storage keys: `roninplex_watchlist`, `roninplex_history`, `roninplex_settings`, `roninplex_custom_api_key`, `roninplex_user_preferences`, `roninplex_search_history`
  - Schema: Typed JSON serializable records with automatic versioning and fallback defaults

**File Storage:**
- Runtime Log File: `%LOCALAPPDATA%/RoninPLEX/playback_runtime.log`
  - Written via Tauri IPC command `log_runtime_event` (`src-tauri/src/lib.rs`)

**Caching:**
- In-memory TTL Cache:
  - TMDB Service: `src/services/tmdb.ts` (5-minute TTL, in-flight request deduplication map)
  - Anime Service: `src/services/anime/AnimeCache.ts` (TTL-based query and metadata caching)

## Authentication & Identity

**Auth Provider:**
- Client-side Local User Profile (`src/context/UserContext.tsx`)
  - Implementation: Local guest profiles with configurable avatars, usernames, and viewing preferences stored in `localStorage`

## Monitoring & Observability

**Error Tracking:**
- Structured frontend console logger (`src/utils/logger.ts`)
- Streaming Diagnostics (GSD) overlay in `src/components/player/VideoPlayer.tsx` showing live latency, provider health, and buffer state

**Logs:**
- Tauri native desktop logging writing to `%LOCALAPPDATA%/RoninPLEX/playback_runtime.log`

## CI/CD & Deployment

**Hosting:**
- Desktop Application (Windows NSIS installer, portable binaries)
- Vite Static Web build (`dist/`)

**CI Pipeline:**
- Local automated test verification: `node --test tests/*.test.mjs`
- Build verification: `npm run build` and `npm run tauri:build`

## Environment Configuration

**Required env vars:**
- `VITE_TMDB_API_KEY`: TMDB API v3 authentication token

**Secrets location:**
- `.env` file in repository root (not committed, excluded via `.gitignore`)
- User-provided custom keys stored in browser `localStorage` under `roninplex_custom_api_key`

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2026-08-30*
