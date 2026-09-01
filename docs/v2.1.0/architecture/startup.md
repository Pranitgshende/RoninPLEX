# RoninPLEX v2.1.0 — Startup Architecture

**Generated:** 2026-09-02
**Status:** CURRENT architecture (v2.1.0 Phase 5)

---

## Current Architecture

### Entry Chain

`
index.html
  +-- Vite bundle loads
     +-- src/main.tsx
        +-- import './shims'
        +-- React.StrictMode
        ¦   +-- HashRouter
        ¦       +-- ApiKeyProvider
        ¦           +-- UserProvider
        ¦               +-- AppLifecycleProvider (Phase 5)
        ¦                   +-- App
        ¦                       +-- RoninIntro (Phase 5 orchestration)
        ¦                       +-- Navbar (hidden on /watch*)
        ¦                       +-- Routes (16 routes)
        ¦                       +-- Footer (hidden on /watch*)
        ¦                       +-- OnboardingModal
        ¦                       +-- PreferencesModal
        ¦                       +-- ApiKeyModal
        ¦                       +-- ToastContainer
        +-- import './index.css'
`

### Initialization Sequence

1. **Vite bundle** loads from index.html (<div id="root">)
2. **Shims** imported (src/shims.ts)
3. **StorageService** singleton created — runs migrateLegacyStorage() **synchronously**
4. **ApiKeyProvider** mounts (sync read, async validation)
5. **UserProvider** mounts (sync read)
6. **AppLifecycleProvider** mounts — initializes ppState to 'initializing'
7. **App** renders — immediately renders both <RoninIntro> and <Routes> concurrently.
8. **Active Route** mounts and fetches data, signaling readiness via useAppReadyWhen(!isLoading).
9. **RoninIntro** waits for ppState === 'ready' before finally fading out.

### Tauri-Side Startup (parallel)

`
main.rs -? roninplex_lib::run()
  +-- plugin: tauri-plugin-shell
  +-- plugin: navigation-guard
  +-- setup:
  ¦   +-- spawn anime-server sidecar on port 4173
  +-- invoke_handler: [log_runtime_event]
`

---

## State Ownership

| State | Owner | Persistence |
|-------|-------|-------------|
| Watchlist | UserContext | localStorage (oninplex_watchlist) |
| Watched | UserContext | localStorage (oninplex_watched) |
| Playback Progress | UserContext | localStorage (oninplex_playback_progress) |
| Preferences | UserContext | localStorage (oninplex_preferences) |
| Home Layout | UserContext | localStorage (oninplex_home_layout) |
| API Key | ApiKeyContext | localStorage (oninplex_tmdb_api_key) / env |
| App Readiness | AppLifecycleContext | Memory only (ppState, isIntroComplete) |

---

## Lifecycle

1. **Boot** — Synchronous: shims, StorageService migration, context state hydration.
2. **Background Fetching** — App route (e.g., Home) initiates its TMDB fetches concurrently with the Intro animation.
3. **Synchronization Gate** — AppLifecycleContext ensures the intro animation only dismisses once initial data has resolved, hiding network latency.

---

## Startup Questions Answered

| Question | Answer |
|----------|--------|
| What blocks first usable UI? | **Route Readiness** — useAppReadyWhen delays intro completion until the active route resolves data. |
| What initializes sequentially? | Shims -? StorageService -? ApiKeyProvider -? UserProvider -? AppLifecycleProvider -? App |
| What initializes in parallel? | API key validation + Sidecar spawn + Initial route TMDB fetches + Intro GSAP animation |
| Is Home coupled to one request chain? | No — uses Promise.all for independent sections. |
| Is startup state-driven or timer-driven? | **State-driven** — intro GSAP timeline is minimum duration, but state completion is fully data-driven. |
| What owns startup readiness? | AppLifecycleContext |
