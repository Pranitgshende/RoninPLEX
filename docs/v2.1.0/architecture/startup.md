# RoninPLEX v2.1.0 — Startup Architecture

**Generated:** 2026-09-01
**Status:** CURRENT architecture (pre-v2.1.0)

---

## Current Architecture

### Entry Chain

```
index.html
  └─ Vite bundle loads
     └─ src/main.tsx
        ├─ import './shims'
        ├─ React.StrictMode
        │   └─ HashRouter
        │       └─ ApiKeyProvider
        │           └─ UserProvider
        │               └─ App
        │                   ├─ Navbar (hidden on /watch*)
        │                   ├─ Routes (16 routes)
        │                   ├─ Footer (hidden on /watch*)
        │                   ├─ OnboardingModal
        │                   ├─ PreferencesModal
        │                   ├─ ApiKeyModal
        │                   └─ ToastContainer
        └─ import './index.css'
```

### Initialization Sequence

1. **Vite bundle** loads from `index.html` (`<div id="root">`)
2. **Shims** imported (`src/shims.ts`)
3. **StorageService** singleton created — runs `migrateLegacyStorage()` **synchronously**
   - Copies `cinepulse_*` localStorage keys to `roninplex_*` if not already present
   - Removes legacy keys
4. **ApiKeyProvider** mounts:
   - `useState(() => tmdb.getApiKey())` — sync read from localStorage/env
   - `useEffect` → validates API key in background (async TMDB request)
5. **UserProvider** mounts:
   - 6 `useState` calls with lazy initializers reading from StorageService:
     - `watchlist`, `watched`, `continueWatching`, `preferences`, `homeLayout`, `isOnboardingOpen`
   - All reads are **synchronous** (localStorage)
   - Registers `roninplex_storage_change` and `roninplex_home_layout_change` event listeners
6. **App** renders — routes available immediately
7. **Home page** (if active route) fires `Promise.all` with up to 8 TMDB API calls

### Tauri-Side Startup (parallel)

```
main.rs → roninplex_lib::run()
  ├─ plugin: tauri-plugin-shell
  ├─ plugin: navigation-guard (custom, restricts top-level nav)
  ├─ setup:
  │   └─ spawn anime-server sidecar on port 4173
  └─ invoke_handler: [log_runtime_event]
```

---

## Important Dependencies

| Component | Depends On |
|-----------|-----------|
| StorageService | `localStorage`, browser environment |
| UserProvider | StorageService (sync), window events |
| ApiKeyProvider | tmdb service, StorageService |
| Home page | TMDB API (async), UserContext |
| Tauri setup | tauri-plugin-shell, sidecar binary |

---

## State Ownership

| State | Owner | Persistence |
|-------|-------|-------------|
| Watchlist | UserContext | localStorage (`roninplex_watchlist`) |
| Watched | UserContext | localStorage (`roninplex_watched`) |
| Playback Progress | UserContext | localStorage (`roninplex_playback_progress`) |
| Preferences | UserContext | localStorage (`roninplex_preferences`) |
| Home Layout | UserContext | localStorage (`roninplex_home_layout`) |
| API Key | ApiKeyContext | localStorage (`roninplex_tmdb_api_key`) / env |
| Toast notifications | UserContext | Memory only |
| Modal states | UserContext | Memory only |

---

## Lifecycle

1. **Boot** — Synchronous: shims, StorageService migration, context state hydration
2. **Render** — Immediate: no loading gate, no splash screen
3. **Background** — API key validation, sidecar spawn
4. **Page** — Home fetches TMDB data on mount

---

## Known Risks

1. **No loading gate** — UI renders before TMDB data arrives; Home shows loading spinners per-section
2. **Monolithic UserContext** — All user state in single context; playback progress updates during video cause broad re-renders of unrelated components
3. **Home over-fetching** — Up to 8 concurrent TMDB requests on mount; potential for 429 rate limiting
4. **Sidecar startup race** — No confirmation that anime-server is ready before UI renders; AnimeStreamService may fail if sidecar hasn't started
5. **No error boundary** — No React error boundaries found wrapping the app
6. **StrictMode double-init** — React.StrictMode in dev causes double mounting/effects

---

## Startup Questions Answered

| Question | Answer |
|----------|--------|
| What blocks first usable UI? | **Nothing** — UI renders immediately after sync context init |
| What initializes sequentially? | Shims → StorageService → ApiKeyProvider → UserProvider → App |
| What initializes in parallel? | API key validation + sidecar spawn + Home TMDB fetches |
| Is cache used? | Yes — TMDBService has 5-min in-memory cache; localStorage persists state |
| Is Home coupled to one request chain? | No — uses `Promise.all` for independent sections |
| Is startup state-driven or timer-driven? | **State-driven** — no timers in startup path |
| What can produce a frozen-feeling startup? | Slow TMDB responses delaying Home content appearance |
| What owns startup readiness? | No single readiness owner; implicit via React mount lifecycle |

---

## Target v2.1.0 Direction

*Phase 0–1 does not implement changes. These are observations for future phases:*

- Consider splitting UserContext to reduce re-render scope
- Consider adding startup loading gate or skeleton UI for perceived performance
- Consider adding React error boundaries
- Consider explicit sidecar readiness check before rendering anime routes
