# RoninPLEX v2.1.0 — FILE MAP

**Generated:** 2026-09-01
**Purpose:** Map of inspected files/directories with responsibilities and risk assessment.

---

## Root Configuration

| Path | Responsibility | State Owner | Dependencies | v2.1.0 Relevance | Risk |
|------|---------------|-------------|--------------|-------------------|------|
| `package.json` | Project config, scripts, dependencies | — | npm | HIGH — version bump, possible new deps | LOW |
| `tsconfig.json` | TypeScript compilation config | — | typescript | LOW | LOW |
| `vite.config.ts` | Vite build config, dev server | — | vite, react plugin | LOW | LOW |
| `tailwind.config.js` | Tailwind CSS theme, colors, fonts | — | tailwindcss | MEDIUM — UI refinements | LOW |
| `postcss.config.js` | PostCSS plugin chain | — | postcss, tailwind, autoprefixer | LOW | LOW |
| `index.html` | HTML entry, root div, meta tags | — | — | LOW | LOW |
| `.env.example` | Environment variable template | — | — | LOW | LOW |
| `.gitignore` | Git ignore rules | — | — | LOW | LOW |

---

## Source — Entry & Shell (`src/`)

| Path | Responsibility | State Owner | Dependencies | v2.1.0 Relevance | Risk |
|------|---------------|-------------|--------------|-------------------|------|
| `src/main.tsx` | React entry, provider wrappers, HashRouter | — | react, react-router-dom, contexts | HIGH — provider order matters | LOW |
| `src/App.tsx` | Route definitions, layout shell (Navbar/Footer toggle) | — | react-router-dom, all pages | HIGH — new routes possible | MEDIUM |
| `src/index.css` | Global styles, Tailwind directives | — | tailwindcss | MEDIUM | LOW |
| `src/shims.ts` | Runtime shims | — | — | LOW | LOW |

---

## Source — Context (`src/context/`)

| Path | Responsibility | State Owner | Dependencies | v2.1.0 Relevance | Risk |
|------|---------------|-------------|--------------|-------------------|------|
| `src/context/UserContext.tsx` | All user state: watchlist, watched, progress, prefs, toasts, modals | **PRIMARY STATE OWNER** | storage service | HIGH — performance risk from monolithic context | HIGH |
| `src/context/ApiKeyContext.tsx` | TMDB API key validation and management | ApiKeyContext | tmdb service, storage | MEDIUM | LOW |

---

## Source — Hooks (`src/hooks/`)

| Path | Responsibility | State Owner | Dependencies | v2.1.0 Relevance | Risk |
|------|---------------|-------------|--------------|-------------------|------|
| `src/hooks/useDebounce.ts` | Debounce utility hook | — | — | LOW | LOW |
| `src/hooks/useIntersectionObserver.ts` | Lazy loading / intersection observer | — | — | MEDIUM | LOW |
| `src/hooks/useMediaQuery.ts` | Responsive media query hook | — | — | MEDIUM | LOW |
| `src/hooks/useTrailer.ts` | Trailer video fetching/playback | — | tmdb service | MEDIUM | LOW |

---

## Source — Pages (`src/pages/`)

| Path | Responsibility | Size | v2.1.0 Relevance | Risk |
|------|---------------|------|-------------------|------|
| `src/pages/Home.tsx` | Home page, dynamic sections, TMDB fetching | 22KB | HIGH — startup perf | MEDIUM |
| `src/pages/Movies.tsx` | Movie browse/filter | 15KB | MEDIUM | LOW |
| `src/pages/TvShows.tsx` | TV show browse/filter | 15KB | MEDIUM | LOW |
| `src/pages/Anime.tsx` | Anime browse (AniList) | 26KB | HIGH — P0 protected | MEDIUM |
| `src/pages/AnimeDetails.tsx` | Anime detail page | 17KB | HIGH — P0 protected | MEDIUM |
| `src/pages/MovieDetails.tsx` | Movie detail page | 16KB | MEDIUM | LOW |
| `src/pages/TvDetails.tsx` | TV detail page | 21KB | MEDIUM | LOW |
| `src/pages/Watch.tsx` | Unified watch page (movie/tv/anime) | 25KB | HIGH — playback orchestration | HIGH |
| `src/pages/Settings.tsx` | Settings page (7 tabs) | 66KB | MEDIUM — new settings possible | MEDIUM |
| `src/pages/Search.tsx` | Global search | 9KB | LOW | LOW |
| `src/pages/Discover.tsx` | Discovery/browse | 30KB | LOW | LOW |
| `src/pages/DecisionHelper.tsx` | AI decision helper | 18KB | LOW | LOW |
| `src/pages/Watchlist.tsx` | Watchlist management | 26KB | LOW | LOW |
| `src/pages/NotFound.tsx` | 404 page | 1KB | LOW | LOW |

---

## Source — Components (`src/components/`)

| Path | Responsibility | v2.1.0 Relevance | Risk |
|------|---------------|-------------------|------|
| `src/components/common/Navbar.tsx` | Navigation bar | MEDIUM | LOW |
| `src/components/common/Footer.tsx` | Footer | LOW | LOW |
| `src/components/common/Toast.tsx` | Toast notification system | LOW | LOW |
| `src/components/modals/OnboardingModal.tsx` | First-run onboarding | LOW | LOW |
| `src/components/modals/PreferencesModal.tsx` | Quick preferences modal | LOW | LOW |
| `src/components/modals/ApiKeyModal.tsx` | API key entry modal | LOW | LOW |
| `src/components/hero/` | Hero/banner components | MEDIUM | LOW |
| `src/components/decision/` | Decision helper UI | LOW | LOW |
| `src/components/ronin/` | Ronin AI components | LOW | LOW |

---

## Source — Player (`src/components/player/`)

| Path | Responsibility | Size | State Owner | v2.1.0 Relevance | Risk |
|------|---------------|------|-------------|-------------------|------|
| `src/components/player/VideoPlayer.tsx` | Main player: HLS, MP4, embed, watchdog, controls, PiP | 67KB | Local refs + context | HIGH | HIGH |
| `src/components/player/TrailerPlayer.tsx` | Trailer playback in modals | 2KB | Local | LOW | LOW |
| `src/components/player/anime/AnimeVideoPlayer.tsx` | Anime-specific player: HLS, subs, lang, auto-next | 36KB | Local refs | HIGH — P0 | HIGH |
| `src/components/player/anime/AnimeEpisodeController.ts` | Episode prev/next logic | 1KB | — | HIGH — P0 | LOW |
| `src/components/player/anime/AnimePlaybackController.ts` | Playback control helpers | 2KB | — | HIGH — P0 | LOW |
| `src/components/player/anime/AnimeSubtitleManager.ts` | Subtitle track management | 1KB | — | HIGH — P0 | LOW |

---

## Source — Services (`src/services/`)

| Path | Responsibility | Size | v2.1.0 Relevance | Risk |
|------|---------------|------|-------------------|------|
| `src/services/storage.ts` | localStorage persistence, migration | 13KB | HIGH | MEDIUM |
| `src/services/tmdb.ts` | TMDB API client, caching, dedup | 13KB | HIGH | MEDIUM |
| `src/services/recommendation.ts` | Recommendation engine | 10KB | LOW | LOW |
| `src/services/mockData.ts` | Fallback mock data | 31KB | LOW | LOW |
| `src/services/ai/` | AI/Gemini integration | — | LOW | LOW |

---

## Source — Streaming Services (`src/services/streaming/`)

| Path | Responsibility | Size | v2.1.0 Relevance | Risk |
|------|---------------|------|-------------------|------|
| `StreamingManager.ts` | Provider orchestration, health, fallback, caching | 21KB | HIGH | HIGH |
| `StreamingProvider.ts` | Provider interface definition | 1KB | MEDIUM | LOW |
| `StreamingHttpClient.ts` | HTTP client for provider requests | 4KB | MEDIUM | LOW |
| `providerConfig.ts` | Provider config persistence | 4KB | MEDIUM | LOW |
| `types.ts` | Streaming types, embed policies, defaults | 3KB | MEDIUM | LOW |
| `providers/VidSrcMeProvider.ts` | VidSrc.me embed provider | 3KB | MEDIUM | LOW |
| `providers/VidSrcToProvider.ts` | VidSrc.to embed provider | 3KB | MEDIUM | LOW |
| `providers/TwoEmbedProvider.ts` | 2embed embed provider | 2KB | MEDIUM | LOW |
| `providers/VidLinkProProvider.ts` | VidLink embed provider | 2KB | MEDIUM | LOW |
| `providers/VidSrcDevProvider.ts` | VidSrc.dev (dead/parked) | 3KB | LOW | LOW |
| `providers/CustomConfigProvider.ts` | User-configurable provider | 8KB | MEDIUM | MEDIUM |
| `providers/VidSrcProvider.ts` | Alias (90 bytes) | 0.1KB | LOW | LOW |
| `providers/ProviderTemplate.ts` | Template for new providers | 8KB | LOW | LOW |

---

## Source — Anime Services (`src/services/anime/`)

| Path | Responsibility | Size | v2.1.0 Relevance | Risk |
|------|---------------|------|-------------------|------|
| `AnimeStreamService.ts` | Stream resolution via sidecar | 8KB | HIGH — P0 | HIGH |
| `AnimeRepository.ts` | AniList data access, caching | 27KB | HIGH — P0 | MEDIUM |
| `AnimeService.ts` | Anime business logic | 5KB | HIGH — P0 | LOW |
| `AnimeSdkAdapter.ts` | SDK API adapter | 3KB | HIGH — P0 | LOW |
| `AnimeMapper.ts` | Data mapping/transformation | 7KB | MEDIUM | LOW |
| `AnimeCache.ts` | In-memory cache | 2KB | MEDIUM | LOW |
| `AnimeTypes.ts` | Type definitions | 3KB | MEDIUM | LOW |

---

## Source — Types (`src/types/`)

| Path | Responsibility | v2.1.0 Relevance | Risk |
|------|---------------|-------------------|------|
| `src/types/user.ts` | User/prefs/progress types + defaults | HIGH | MEDIUM |
| `src/types/tmdb.ts` | TMDB response types | MEDIUM | LOW |
| `src/types/recommendation.ts` | Recommendation types | LOW | LOW |

---

## Source — Utils (`src/utils/`)

| Path | Responsibility | v2.1.0 Relevance | Risk |
|------|---------------|-------------------|------|
| `src/utils/logger.ts` | Runtime logging via Tauri IPC | MEDIUM | LOW |
| `src/utils/helpers.ts` | Utility functions | MEDIUM | LOW |
| `src/utils/formatting.ts` | Display formatting | LOW | LOW |

---

## Tauri / Rust (`src-tauri/`)

| Path | Responsibility | v2.1.0 Relevance | Risk |
|------|---------------|-------------------|------|
| `src-tauri/src/main.rs` | Rust entry point | LOW | LOW |
| `src-tauri/src/lib.rs` | App setup: sidecar, nav guard, IPC, logging | HIGH | MEDIUM |
| `src-tauri/Cargo.toml` | Rust dependencies | MEDIUM | LOW |
| `src-tauri/tauri.conf.json` | Tauri app config, window, bundle, security | HIGH | MEDIUM |
| `src-tauri/capabilities/default.json` | Permission grants (core:default only) | HIGH — security | MEDIUM |
| `src-tauri/build.rs` | Tauri build hook | LOW | LOW |

---

## Backend / Sidecar (`backend/`)

| Path | Responsibility | v2.1.0 Relevance | Risk |
|------|---------------|-------------------|------|
| `backend/server.js` | Anime proxy server (anime-sdk) | HIGH — P0 | MEDIUM |
| `backend/package.json` | Sidecar dependencies | MEDIUM | LOW |

---

## Scripts (`scripts/`)

| Path | Responsibility | v2.1.0 Relevance | Risk |
|------|---------------|-------------------|------|
| `scripts/build-sidecar.cjs` | ncc + pkg sidecar build | HIGH | MEDIUM |
| `scripts/test-providers.mjs` | Provider connectivity tests | MEDIUM | LOW |
| `scripts/generate-icons.js` | Icon generation utility | LOW | LOW |

---

## Tests

| Path | Responsibility | Status | v2.1.0 Relevance |
|------|---------------|--------|-------------------|
| `tests/v2-suite.test.mjs` | Integration/architecture test suite | EXISTS — NOT RUN | HIGH |
| `test-anime.cjs` | Anime SDK proxy tests (root, untracked) | EXISTS — NOT RUN | MEDIUM |
| `test-validate.cjs` | Validation tests (root) | EXISTS — NOT RUN | LOW |
| `test-playwright*.mjs` | Playwright E2E tests (root, untracked) | EXISTS — NOT RUN | MEDIUM |
