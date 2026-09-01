# RoninPLEX v2.1.0 — REGRESSION BASELINE

**Generated:** 2026-09-01
**Version:** 2.0.1 on `development/v2.1.0` branch
**Purpose:** Document current (pre-v2.1.0) application behavior for regression comparison.

> **Note:** This baseline was created by source-code inspection during Phase 0–1.
> Runtime testing was NOT performed for most items because the application was not
> launched. Items are marked accordingly.

---

## Status Key

| Status | Meaning |
|--------|---------|
| PASS | Verified working by actual execution |
| FAIL | Verified broken by actual execution |
| NOT TESTED | Not executed; behavior inferred from code only |
| CODE PRESENT | Implementation exists but runtime not verified |
| UNKNOWN | Cannot determine from available evidence |

---

## 1. Startup

| Behavior | Status | Evidence |
|----------|--------|----------|
| Application launch | NOT TESTED | `main.rs` calls `roninplex_lib::run()` which builds Tauri app |
| First usable UI | NOT TESTED | No loading gate or splash screen in code; UI renders immediately after context init |
| Startup animation | CODE PRESENT | No explicit splash/animation found; startup is state-driven |
| Apparent freezes | NOT TESTED | Risk: Home fetches up to 8 TMDB sections concurrently on mount |
| Cache behavior | CODE PRESENT | TMDBService has 5-minute in-memory cache; StorageService reads localStorage sync |
| Home loading | CODE PRESENT | `Home.tsx` fires `Promise.all` for enabled sections on mount |
| Background requests | CODE PRESENT | ApiKeyContext validates stored key; Home fetches TMDB data |
| Sidecar startup | CODE PRESENT | anime-server sidecar spawned in `lib.rs` setup, listening on port 4173 |

### Startup Flow (from code)
1. `index.html` loads Vite bundle
2. `main.tsx` creates React root with `HashRouter > ApiKeyProvider > UserProvider > App`
3. `StorageService` constructor runs `migrateLegacyStorage()` synchronously
4. `UserContext` initializes all state from localStorage synchronously via `useState(() => ...)`
5. `ApiKeyContext` validates stored TMDB key in background `useEffect`
6. `App.tsx` renders routes; no loading gate blocks render
7. Home page fetches TMDB data via `Promise.all` for enabled sections

---

## 2. Movies

| Behavior | Status | Evidence |
|----------|--------|----------|
| Discovery (Movies page) | NOT TESTED | `Movies.tsx` (14KB) exists with genre filtering |
| Movie details | NOT TESTED | `MovieDetails.tsx` (16KB) fetches TMDB details |
| Playback initiation | CODE PRESENT | `Watch.tsx` resolves stream via StreamingManager |
| Provider resolution | CODE PRESENT | StreamingManager builds eligible provider list with health/priority |
| Fullscreen | CODE PRESENT | Uses `getCurrentWindow().setFullscreen()` Tauri API |
| Resume | CODE PRESENT | Saved progress restored on `MANIFEST_PARSED` event |
| Error/fallback | CODE PRESENT | Watchdog detects stalls; `getNextStream()` provides fallback |

---

## 3. TV Shows

| Behavior | Status | Evidence |
|----------|--------|----------|
| TV details | NOT TESTED | `TvDetails.tsx` (21KB) exists |
| Season listing | NOT TESTED | TMDB season data fetched in TvDetails |
| Episode listing | NOT TESTED | Route: `/watch/tv/:id/:season/:episode` |
| Playback | CODE PRESENT | Same VideoPlayer as movies, TV episode stream via provider |
| Resume | CODE PRESENT | Progress keyed by id + mediaType + season + episode |
| Episode switching | CODE PRESENT | Watch page handles season/episode params |
| Next episode | CODE PRESENT | Auto-next countdown timer in VideoPlayer |

---

## 4. Anime (P0 Protected Subsystem)

| Behavior | Status | Evidence |
|----------|--------|----------|
| Anime page | NOT TESTED | `Anime.tsx` (26KB) — AniList-based browse/search |
| Detail page | NOT TESTED | `AnimeDetails.tsx` (17KB) — AniList metadata + episode list |
| Season selection | CODE PRESENT | Episode drawer with chunked pagination |
| Episode selection | CODE PRESENT | Episode drawer in AnimeVideoPlayer |
| Loading | CODE PRESENT | Loading states during source resolution |
| Source resolution | CODE PRESENT | AnimeStreamService queries sidecar API at `127.0.0.1:4173` |
| Playback | CODE PRESENT | AnimeVideoPlayer.tsx (35KB) — HLS.js based |
| Subtitles | CODE PRESENT | AnimeSubtitleManager handles VTT/ASS tracks |
| Language (Sub/Dub) | CODE PRESENT | Language preference selection in AnimeVideoPlayer |
| Quality | CODE PRESENT | Quality selection based on available HLS streams |
| Seek | CODE PRESENT | Configurable seek amount (5/10/15/30s) from preferences |
| Fullscreen | CODE PRESENT | Same Tauri fullscreen API as main player |
| Previous/Next episode | CODE PRESENT | AnimeEpisodeController provides prev/next navigation |
| Auto-next | CODE PRESENT | 10s countdown in last segment; timer properly cleaned up |
| Resume | CODE PRESENT | Progress saved to localStorage with anime mediaType |
| Player exit | CODE PRESENT | Cleanup effects dispose HLS, clear timers |
| Return to playback | NOT TESTED | Route: `/watch/anime/:id/:episode` |

### Anime Stream Resolution Chain (from code)
1. `AnimeStreamService.fetchStreamingSources()` queries sidecar
2. Falls back across providers: `animeparadise` → `gogoanime` → `allmanga`
3. Validates streams via HEAD/GET request before selection
4. Returns HLS m3u8 URL + subtitles to AnimeVideoPlayer

### Anime Sidecar
- **Source:** `backend/server.js` using `anime-sdk`
- **Build:** `scripts/build-sidecar.cjs` → ncc bundle → pkg → `anime-server-x86_64-pc-windows-msvc`
- **Startup:** Spawned by Tauri Rust `setup()` on port 4173
- **Providers:** GogoanimeProvider, AllmangaProvider, AnimeParadiseProvider
- **Meta:** AnilistMeta
- **Proxy:** Content-Type rewriting for `.ts` segments (image/jpeg → video/MP2T)

---

## 5. Storage

| Feature | Status | Storage Key | Evidence |
|---------|--------|-------------|----------|
| Watchlist | CODE PRESENT | `roninplex_watchlist` | Array of `WatchlistItem` |
| Watched History | CODE PRESENT | `roninplex_watched` | Array of `WatchedItem` with ratings |
| Continue Watching | CODE PRESENT | `roninplex_playback_progress` | Array of `PlaybackProgress`, deduplicated for TV |
| Playback Progress | CODE PRESENT | `roninplex_playback_progress` | Auto-remove at >95% (→ Watched) or <15s |
| Preferences | CODE PRESENT | `roninplex_preferences` | Merged with `DEFAULT_USER_PREFERENCES` |
| Home Layout | CODE PRESENT | `roninplex_home_layout` | Array of `HomeSectionItem` with ordering |
| TMDB API Key | CODE PRESENT | `roninplex_tmdb_api_key` | String, also checked via env var |
| Provider Config | CODE PRESENT | `roninplex_streaming_provider_config` | Provider settings JSON |
| Legacy Migration | CODE PRESENT | `cinepulse_*` → `roninplex_*` | One-time copy + remove |

### Storage Compatibility
- All keys prefixed with `roninplex_*`
- Legacy `cinepulse_*` keys are auto-migrated on first load
- Data serialized as JSON in localStorage
- Cross-tab sync via `window.dispatchEvent('roninplex_storage_change')`

---

## 6. Settings

| Section | Status | Evidence |
|---------|--------|----------|
| Home Page sections | CODE PRESENT | Reorderable home shelves with enable/disable |
| Playback Engine | CODE PRESENT | Seek amount, auto-next, countdown, speed, volume |
| Streaming providers | CODE PRESENT | Active provider, custom config, connection test |
| TMDB Metadata | CODE PRESENT | API key management |
| Appearance | CODE PRESENT | Settings tab exists in Settings.tsx |
| Storage & Privacy | CODE PRESENT | Clear data options |
| About | CODE PRESENT | Version info section |

---

## 7. Navigation

| Route | Status | Component |
|-------|--------|-----------|
| `/` | CODE PRESENT | Home |
| `/movies` | CODE PRESENT | Movies |
| `/tv` | CODE PRESENT | TvShows |
| `/anime` | CODE PRESENT | Anime |
| `/discover` | CODE PRESENT | Discover |
| `/decision` | CODE PRESENT | DecisionHelper |
| `/search` | CODE PRESENT | Search |
| `/movie/:id` | CODE PRESENT | MovieDetails |
| `/tv/:id` | CODE PRESENT | TvDetails |
| `/anime/:id` | CODE PRESENT | AnimeDetails |
| `/watch/movie/:id` | CODE PRESENT | Watch |
| `/watch/tv/:id/:season/:episode` | CODE PRESENT | Watch |
| `/watch/anime/:id/:episode` | CODE PRESENT | Watch |
| `/watchlist` | CODE PRESENT | Watchlist |
| `/settings` | CODE PRESENT | Settings |
| `*` | CODE PRESENT | NotFound |

---

## 8. Previous Findings Check

| Finding | Status | Evidence |
|---------|--------|----------|
| VideoPlayer watchdogs exist & cleaned up | **VALID / ALREADY FIXED** | 5-phase watchdog is implemented and cleans up its progressInterval via clearInterval upon unmount in VideoPlayer.tsx. |
| iframe stall detection | **ALREADY FIXED** | Watchdog explicitly checks \if (effectiveStream.type === 'embed') return;\, avoiding false stalls on iframes. |
| Anime auto-next timer cleanup | **ALREADY FIXED** | \utoNextTimerRef.current\ is properly cleared in the cleanup effect in AnimeVideoPlayer.tsx. |
| Provider health tracking | **ALREADY FIXED** | Implemented in StreamingManager, tracking failures and penalizing unreliable providers. |
| Provider fallback | **ALREADY FIXED** | Multi-provider chaining is fully implemented, allowing runtime failover if a stream crashes. |

