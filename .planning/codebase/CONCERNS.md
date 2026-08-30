# Codebase Concerns

**Analysis Date:** 2026-08-30

## Tech Debt

**Monolithic UI Components:**
- Issue: `Settings.tsx` (66KB, 1400+ lines) and `VideoPlayer.tsx` (65KB, 1500+ lines) contain significant embedded logic, diagnostics, and layout within single files.
- Files: `src/pages/Settings.tsx`, `src/components/player/VideoPlayer.tsx`
- Impact: Increases cognitive load when maintaining player controls or settings tabs; makes unit testing isolated player sub-features difficult.
- Fix approach: Decompose `Settings.tsx` into modular tab components (`GeneralSettings.tsx`, `PlaybackSettings.tsx`, `ApiKeySettings.tsx`); extract player controls and diagnostics from `VideoPlayer.tsx` into dedicated hooks and subcomponents.

**Duplicate Shims for Node Builtins:**
- Issue: Multiple manual browser shims exist in `src/shims/` for Node builtins (`buffer.ts`, `crypto.ts`, `fs.ts`, etc.).
- Files: `src/shims/*`
- Impact: Code maintenance overhead for stubbing unused Node.js APIs in the frontend webview.
- Fix approach: Audit which shims are truly required by browserified dependencies and replace with standard Vite polyfills or eliminate unused imports.

## Known Bugs

**External Embed Provider Uptime Fluctuation:**
- Symptoms: Occasional 404s or connection timeouts when loading certain third-party video iframe embeds.
- Files: `src/services/streaming/StreamingManager.ts`, `src/services/streaming/providerConfig.ts`
- Trigger: Third-party video hosting providers rotating domains or blocking automated referrers.
- Workaround: Automatic provider fallback cascade implemented in `StreamingManager.ts`; manual provider selector available in `VideoPlayer.tsx`.

## Security Considerations

**Third-Party Embed Iframes:**
- Risk: Third-party streaming embed hosts may attempt unauthorized redirects, popups, or malicious script execution.
- Files: `src/components/player/VideoPlayer.tsx`, `src-tauri/src/lib.rs`
- Current mitigation: Iframe `sandbox` attributes restrict top-level navigation; Tauri 2 custom `navigation-guard` plugin in `lib.rs` intercepts and blocks unauthorized webview navigation away from localhost.
- Recommendations: Maintain strict Content Security Policy (CSP) headers and audit iframe sandboxing flags.

**Client-Side API Key Storage:**
- Risk: Custom TMDB API keys entered by users are stored in plaintext in browser `localStorage`.
- Files: `src/services/storage.ts`, `src/context/ApiKeyContext.tsx`
- Current mitigation: Keys reside only within the user's local profile on their machine.
- Recommendations: For desktop builds, consider leveraging Tauri's secure OS keychain storage plugin for sensitive user tokens.

## Performance Bottlenecks

**Large Episode List Rendering (1000+ Episodes):**
- Problem: Anime series like One Piece have 1100+ episodes, which can degrade DOM rendering performance if rendered simultaneously.
- Files: `src/pages/AnimeDetails.tsx`
- Cause: Rendering thousands of episode cards with thumbnails and badges creates heavy DOM trees.
- Improvement path: Chunked pagination via `CHUNK_SIZE` is implemented; virtualized scrolling (e.g. `react-window`) can be added if episode counts grow further.

**Image Asset Preloading:**
- Problem: Navigating between media carousels can cause brief image loading flickers on slower connections.
- Files: `src/components/common/MovieCard.tsx`, `src/components/hero/HeroBanner.tsx`
- Cause: Uncached high-resolution backdrop and poster images from TMDB and AniList.
- Improvement path: Implement skeleton placeholders and lazy loading attributes on non-hero images.

## Fragile Areas

**External Scrapers in `anime-sdk`:**
- Files: `backend/server.js`, `src/services/anime/AnimeSdkAdapter.ts`
- Why fragile: Web scraping providers (Gogoanime, Allmanga) rely on HTML structures that third-party sites can change at any time without notice.
- Safe modification: Encapsulate scraper calls behind `AnimeSdkAdapter` with comprehensive try/catch blocks and fallback to AniList metadata.
- Test coverage: Tested via `tests/v2-suite.test.mjs` contract tests and runtime health checks.

## Scaling Limits

**Local Storage Limit:**
- Current capacity: ~5MB browser `localStorage` quota
- Limit: Watch history with hundreds of thousands of items could approach storage limits.
- Scaling path: Implement LRU eviction policy in `src/services/storage.ts` capping watch history to the 500 most recent items.

## Dependencies at Risk

**Third-Party Embed Endpoints:**
- Risk: Domain bans and IP rate limits on free embed hosts.
- Impact: Certain streams fail to load for specific regional users.
- Migration plan: Expand `providerConfig.ts` with additional alternative providers and direct HLS stream sources.

## Missing Critical Features

**None for Current Milestones:**
- Core v2.0.0 specifications (VLC eradication, Anime isolation, Dedicated Anime player, 1100+ episode support, Airing countdown, Unified Discover, Adult badge, Glass UI tokens, Ronin AI multi-turn, Universal search) are fully implemented and verified.

## Test Coverage Gaps

**Component-Level Unit Tests:**
- What's not tested: Individual React component render states and interaction events currently rely on master architecture integration tests (`tests/v2-suite.test.mjs`) rather than component-level test suites.
- Files: `src/components/**/*.tsx`
- Risk: UI regressions in smaller components could go unnoticed until manual or E2E testing.
- Priority: Medium

---

*Concerns audit: 2026-08-30*
