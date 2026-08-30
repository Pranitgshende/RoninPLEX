<!-- refreshed: 2026-08-30 -->
# Architecture

**Analysis Date:** 2026-08-30

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             RoninPLEX UI Layer                              │
│  React 19, React Router DOM 7 (HashRouter), Tailwind Glass Design System     │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│    Pages Layer    │  Component Layer  │   Context Layer   │  Custom Hooks   │
│   `src/pages/`    │ `src/components/` │  `src/context/`   │  `src/hooks/`   │
└─────────┬─────────┴─────────┬─────────┴─────────┬─────────┴────────┬────────┘
          │                   │                   │                  │
          ▼                   ▼                   ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Domain & Services Layer                          │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│   TMDB Service    │   Anime Domain    │ Streaming Engine  │    Ronin AI     │
│ `src/services/`   │  (Clean Isolated) │ `src/services/    │ `src/services/  │
│   `tmdb.ts`       │  `anime/*.ts`     │   streaming/`     │   ai/AIService` │
└─────────┬─────────┴─────────┬─────────┴─────────┬─────────┴────────┬────────┘
          │                   │                   │                  │
          ▼                   ▼                   ▼                  ▼
┌───────────────────────────────────────────────┬─────────────────────────────┐
│               External Data & APIs            │       Persistence Layer     │
│  - TMDB REST API (https://api.themoviedb.org) │  - Browser localStorage     │
│  - AniList GraphQL (https://graphql.anilist)  │    (`src/services/storage`) │
│  - Video Embed Providers (Vidsrc, etc.)       │  - Runtime desktop log      │
│  - Local anime-server sidecar (Port 4173)     │    (`LOCALAPPDATA/RoninPLEX`)│
└───────────────────────────────────────────────┴─────────────────────────────┘
          ▲
          │ Sidecar management & Webview Container
┌─────────┴───────────────────────────────────────────────────────────────────┐
│                    Desktop Native Layer (Tauri 2 / Rust)                    │
│  - Security Navigation Guard: Prevents iframe webview hijacking             │
│  - Sidecar Supervisor: Runs `bin/anime-server` process on port 4173        │
│  - Local Logging IPC: `log_runtime_event` writes to playback_runtime.log    │
│    `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | Main application layout, route definitions, global modal hosts | `src/App.tsx` |
| `Navbar` | Primary top navigation, brand link to Ronin AI, responsive menus | `src/components/common/Navbar.tsx` |
| `VideoPlayer` | Dedicated HLS & iframe video player for Movies & TV with failover | `src/components/player/VideoPlayer.tsx` |
| `AnimeVideoPlayer` | Dedicated Anime video player isolated from generic movie player | `src/components/player/anime/AnimeVideoPlayer.tsx` |
| `AnimeSubtitleManager` | Manages subtitle track loading and cue selection for anime streams | `src/components/player/anime/AnimeSubtitleManager.ts` |
| `AnimeEpisodeController`| Handles episode sequence, prev/next transitions, and jump targets | `src/components/player/anime/AnimeEpisodeController.ts` |
| `AnimePlaybackController`| Manages playback rate, quality levels, volume, and fullscreen | `src/components/player/anime/AnimePlaybackController.ts` |
| `RoninAvatar` | 9-state reactive samurai mascot with animated SVG moods | `src/components/ronin/RoninAvatar.tsx` |
| `TonightPicker` | Interactive AI recommendation picker for indecisive viewers | `src/components/decision/TonightPicker.tsx` |
| `AdultBadge` | Accessible badge with aria-label for 18+ adult classified content | `src/components/common/AdultBadge.tsx` |
| `TMDBService` | In-memory cached client for The Movie Database API | `src/services/tmdb.ts` |
| `AnimeRepository` | AniList GraphQL client for metadata, schedules, and pagination | `src/services/anime/AnimeRepository.ts` |
| `AnimeService` | Public anime domain facade aggregating repository and streams | `src/services/anime/AnimeService.ts` |
| `AnimeSdkAdapter` | Adapter connecting to `anime-sdk` and backend sidecar | `src/services/anime/AnimeSdkAdapter.ts` |
| `StreamingManager` | Orchestrates multi-provider embed fallbacks and HLS streams | `src/services/streaming/StreamingManager.ts` |
| `AIService` | Multi-turn conversational AI engine with session memory | `src/services/ai/AIService.ts` |
| `StorageService` | Typed `localStorage` wrapper with schema integrity | `src/services/storage.ts` |

## Pattern Overview

**Overall:** Layered Architecture with Domain Isolation, Repository Pattern, and Strategy Pattern.

**Key Characteristics:**
- **Anime Isolation:** Anime domain is completely isolated from TMDB (`src/services/anime/AnimeService.ts` has zero imports from `../tmdb`).
- **Dual Player Separation:** Dedicated `AnimeVideoPlayer` for anime episodes separate from generic `VideoPlayer`.
- **Zero VLC Dependency:** Complete removal of legacy VLC bindings; uses native HTML5 video, `hls.js`, and secured iframes.
- **Failover Strategy:** Video playback cascades across configured providers when streams stall or 404.
- **Tauri Security Guard:** Rust navigation guard prevents external ad scripts from redirecting the primary desktop window.

## Layers

**UI & Pages Layer:**
- Purpose: Present data, capture user interactions, manage view transitions
- Location: `src/pages/`, `src/components/`
- Contains: React components, modals, carousels, responsive grids
- Depends on: `src/services/`, `src/context/`, `src/hooks/`, `src/utils/`
- Used by: Browser and Tauri webview

**State & Context Layer:**
- Purpose: Provide global access to user preferences and API key state
- Location: `src/context/`
- Contains: `UserContext.tsx`, `ApiKeyContext.tsx`
- Depends on: `src/services/storage.ts`
- Used by: Application pages and header controls

**Domain Services Layer:**
- Purpose: Encapsulate business logic, data fetching, transformation, caching
- Location: `src/services/`
- Contains: `tmdb.ts`, `anime/`, `streaming/`, `ai/`, `storage.ts`
- Depends on: External HTTP APIs, `anime-sdk`, browser storage
- Used by: Pages and UI components

**Native Desktop Shell Layer:**
- Purpose: Provide window management, local system integration, sidecar execution
- Location: `src-tauri/`
- Contains: Rust binary, Cargo configuration, security navigation guards
- Depends on: Tauri 2 runtime, Windows WebView2
- Used by: End user desktop operating system

## Data Flow

### Primary Request Path (Movies/TV)

1. User navigates to `/movies` or `/tv` (`src/pages/Movies.tsx`, `src/pages/TvShows.tsx`)
2. Component invokes `tmdb.getTrendingMovies()` or `tmdb.getTrendingTVShows()` (`src/services/tmdb.ts`)
3. Cache check: returns memory cache if fresh, otherwise dispatches HTTP GET to `https://api.themoviedb.org/3`
4. If API key missing, gracefully returns offline fallback catalog (`src/services/mockData.ts`)
5. View renders cards in responsive grid with glassmorphism styling (`src/components/common/MovieCard.tsx`)

### Anime Discovery & Playback Path

1. User opens `/anime` or `/anime/:id` (`src/pages/Anime.tsx`, `src/pages/AnimeDetails.tsx`)
2. Page calls `animeService.getAnimeDetails(id)` (`src/services/anime/AnimeService.ts`)
3. `AnimeRepository.ts` fetches AniList GraphQL details and normalizes without 500-cap limitation
4. User clicks an episode → routes to `/watch/anime/:id/:episode` (`src/pages/Watch.tsx`)
5. `Watch.tsx` detects `isAnime === true` and mounts `AnimeVideoPlayer` (`src/components/player/anime/AnimeVideoPlayer.tsx`)
6. Player requests stream via `AnimeStreamService.ts` and `AnimeSdkAdapter.ts` from `anime-server` sidecar on port 4173
7. Subtitle tracks and stream URLs load with adaptive `hls.js` playback

### Conversational Ronin AI Path

1. User navigates to `/decision` or opens Ronin AI modal
2. User submits query (e.g. "Recommend gritty samurai anime")
3. `AIService.ts` evaluates session turn count, analyzes intent, searches `AnimeService` or `TMDB`
4. Filters out previously recommended IDs in `session.recommendedIds` to prevent duplicate recommendations
5. Formats poetic Ronin tone response and updates `RoninAvatar` state (`idle`, `thinking`, `talking`, `recommending`, etc.)

**State Management:**
- `UserContext.tsx` stores watchlist, history, favorites, theme
- `ApiKeyContext.tsx` manages TMDB API key state and triggers cache invalidation events
- `storage.ts` syncs changes directly with `localStorage`

## Key Abstractions

**Repository Pattern:**
- `AnimeRepository` (`src/services/anime/AnimeRepository.ts`): Abstracts GraphQL queries and data normalization away from UI components.

**Adapter Pattern:**
- `AnimeSdkAdapter` (`src/services/anime/AnimeSdkAdapter.ts`): Normalizes third-party `anime-sdk` methods into RoninPLEX domain interfaces.

**Strategy Pattern:**
- `StreamingManager` (`src/services/streaming/StreamingManager.ts`): Selects and cascades between HLS streams and iframe embed providers based on availability.

## Entry Points

**Frontend Webview Entry:**
- Location: `src/main.tsx`
- Triggers: Browser/Webview load of `index.html`
- Responsibilities: Initializes React DOM root, mounts `HashRouter`, wraps global providers (`ApiKeyProvider`, `UserProvider`), mounts `App`.

**Native Desktop Entry:**
- Location: `src-tauri/src/main.rs` & `src-tauri/src/lib.rs`
- Triggers: Desktop executable launch
- Responsibilities: Configures Tauri 2 window, registers security navigation guard plugin, spawns `anime-server` sidecar process, binds `log_runtime_event` command.

**Sidecar Server Entry:**
- Location: `backend/server.js`
- Triggers: Spawned by Tauri on launch or manual start
- Responsibilities: Hosts local HTTP server on port 4173 bridging Gogoanime and Allmanga scrapers.

## Architectural Constraints

- **Single-threaded Event Loop:** Frontend runs in a single webview thread; computationally heavy episode chunking and mapping must not block main thread.
- **Anime Domain Isolation:** `src/services/anime/` must never import `src/services/tmdb.ts` or leak TMDB data models.
- **Dual Player Separation:** Anime player logic and controls must remain separate from generic movie player to support episode lists and subtitle tracks.
- **Iframe Navigation Containment:** Embed providers must run with strict sandbox attributes and Tauri Rust navigation guards to prevent parent window redirection.

## Anti-Patterns

### Mixing TMDB IDs and AniList IDs in Anime Views

**What happens:** Treating anime IDs as TMDB numerical IDs caused 404s and incorrect metadata lookups.
**Why it's wrong:** AniList uses a distinct ID namespace and richer anime-specific metadata (seasons, episodes, romanized titles).
**Do this instead:** Route all anime pages exclusively through `AnimeService` (`src/services/anime/AnimeService.ts`) and use `stableKey` compound keys (`src/pages/Discover.tsx`).

### Capping Anime Episodes at 500

**What happens:** Hardcoding `Math.min(totalEpisodes, 500)` truncated long-running anime like One Piece.
**Why it's wrong:** Modern anime catalogs contain shows exceeding 1000+ episodes.
**Do this instead:** Paginate and chunk episode rendering dynamically in `src/pages/AnimeDetails.tsx` using `CHUNK_SIZE` blocks without artificial caps.

## Error Handling

**Strategy:** Non-blocking progressive degradation with user-friendly notices.

**Patterns:**
- **Offline Mock Fallback:** When TMDB API key is unset or unreachable, `tmdb.ts` serves cached mock catalog (`src/services/mockData.ts`) without throwing unhandled exceptions.
- **Provider Cascade:** When a streaming provider fails or times out, `StreamingManager.ts` automatically rotates to the next priority source.
- **Toast Notifications:** User-facing alerts displayed via `ToastContainer` (`src/components/common/Toast.tsx`).

## Cross-Cutting Concerns

**Logging:** `src/utils/logger.ts` for client-side diagnostic levels; `log_runtime_event` IPC for persistent desktop playback logs.
**Validation:** Prop validation via TypeScript strict types; runtime validation on localStorage parsing.
**Authentication:** Client-side local profile isolation; API keys managed in memory and user-local storage only.

---

*Architecture analysis: 2026-08-30*
