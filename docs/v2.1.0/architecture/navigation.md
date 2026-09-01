# RoninPLEX v2.1.0 — Navigation Architecture

**Generated:** 2026-09-01
**Status:** CURRENT architecture (pre-v2.1.0)

---

## Current Architecture

### Router

- **Library:** `react-router-dom` ^7.3.0
- **Router type:** `HashRouter` (uses `#/path` URLs)
- **Entry:** Wraps entire app in `src/main.tsx`

### Route Definitions (`src/App.tsx:35-52`)

| Path | Component | Category | Notes |
|------|-----------|----------|-------|
| `/` | `Home` | Browse | Dynamic sections from TMDB |
| `/movies` | `Movies` | Browse | Genre filtering |
| `/tv` | `TvShows` | Browse | Genre filtering |
| `/anime` | `Anime` | Browse | AniList-based |
| `/discover` | `Discover` | Browse | Advanced discovery |
| `/decision` | `DecisionHelper` | Feature | AI decision helper |
| `/search` | `Search` | Browse | Global search |
| `/movie/:id` | `MovieDetails` | Detail | TMDB movie details |
| `/tv/:id` | `TvDetails` | Detail | TMDB TV details + seasons |
| `/anime/:id` | `AnimeDetails` | Detail | AniList anime details + episodes |
| `/watch/movie/:id` | `Watch` | Player | Movie playback |
| `/watch/tv/:id/:season/:episode` | `Watch` | Player | TV episode playback |
| `/watch/anime/:id/:episode` | `Watch` | Player | Anime episode playback |
| `/watchlist` | `Watchlist` | Feature | Saved items management |
| `/settings` | `Settings` | Feature | App settings (7 tabs) |
| `*` | `NotFound` | Error | 404 fallback |

### Navigation Shell

```
App.tsx
  ├─ {!isWatchPage && <Navbar />}    ← Hidden during playback
  ├─ <main>
  │   └─ <Routes>...</Routes>
  ├─ {!isWatchPage && <Footer />}    ← Hidden during playback
  ├─ <OnboardingModal />             ← Global, always rendered
  ├─ <PreferencesModal />            ← Global, always rendered
  ├─ <ApiKeyModal />                 ← Global, always rendered
  └─ <ToastContainer />             ← Global, always rendered
```

**Watch page detection:** `location.pathname.startsWith('/watch')` hides Navbar/Footer.

### Modals

| Modal | Trigger | Controlled By |
|-------|---------|--------------|
| OnboardingModal | First launch (`!prefs.onboardingCompleted`) | UserContext `isOnboardingOpen` |
| PreferencesModal | User action (navbar/settings) | UserContext `isPreferencesOpen` |
| ApiKeyModal | Missing/invalid API key | ApiKeyContext `isModalOpen` |

All modals are rendered globally in App.tsx — not route-based.

### History / Back-Forward

- Standard React Router browser history (via HashRouter)
- No custom history manipulation found
- No programmatic back/forward override
- Watch page navigates via `useNavigate()` for episode transitions

---

## Important Dependencies

| Component | Depends On |
|-----------|-----------|
| App.tsx | react-router-dom, all page components |
| Navbar | react-router-dom `useNavigate`, `useLocation` |
| Watch.tsx | Route params (`useParams`), navigate for episodes |
| All detail pages | Route params for ID |

---

## State Ownership

| State | Owner |
|-------|-------|
| Current route | React Router |
| Watch page detection | `App.tsx` via `useLocation` |
| Modal visibility | UserContext / ApiKeyContext |
| Navigation UI | Navbar component (local state for mobile menu, etc.) |

---

## Known Risks

1. **HashRouter** — Uses `#/` prefix; may complicate future deep linking or server-side rendering
2. **No route-level code splitting** — All pages imported eagerly in App.tsx; increases bundle size
3. **Watch page detection is string-based** — `startsWith('/watch')` could false-positive on future routes
4. **No navigation guards** — No auth checks or route guards (aside from Tauri-level nav guard for external URLs)
5. **No animated transitions** — Route changes are instant; no page transitions
6. **Global modal rendering** — All modals render on every route; slight overhead

---

## Target v2.1.0 Direction

*Not implemented. Observations for future phases:*

- Consider lazy loading page components for reduced initial bundle
- Consider route-based code splitting
- Consider navigation animations/transitions
- Touch/swipe navigation integration point exists at router level
- Deep linking support would require migrating from HashRouter to BrowserRouter
