# RoninPLEX v2.1.0 — CHANGE MANIFEST

**Generated:** 2026-09-01
**Phase:** 0–1 (Documentation / Inspection only)
**Purpose:** Track all changes made during this phase.

---

> **Phase 0–1 produced documentation changes only. No production code was modified.**

---

## Changes Made

| File | Action | Reason | Risk | Affected Subsystem |
|------|--------|--------|------|--------------------|
| `docs/v2.1.0/PRE-UPDATE.md` | CREATED | Phase 0 baseline document | NONE | Documentation |
| `docs/v2.1.0/REGRESSION-BASELINE.md` | CREATED | Regression behavior baseline | NONE | Documentation |
| `docs/v2.1.0/FILE-MAP.md` | CREATED | Repository file map | NONE | Documentation |
| `docs/v2.1.0/CHANGE-MANIFEST.md` | CREATED | This change tracking document | NONE | Documentation |
| `docs/v2.1.0/architecture/startup.md` | CREATED | Startup architecture documentation | NONE | Documentation |
| `docs/v2.1.0/architecture/playback.md` | CREATED | Playback architecture documentation | NONE | Documentation |
| `docs/v2.1.0/architecture/anime-playback.md` | CREATED | Anime playback architecture documentation | NONE | Documentation |
| `docs/v2.1.0/architecture/streaming-providers.md` | CREATED | Provider architecture documentation | NONE | Documentation |
| `docs/v2.1.0/architecture/state-and-storage.md` | CREATED | State/storage architecture documentation | NONE | Documentation |
| `docs/v2.1.0/architecture/navigation.md` | CREATED | Navigation architecture documentation | NONE | Documentation |
| `docs/v2.1.0/architecture/tauri-boundary.md` | CREATED | Tauri/Rust boundary documentation | NONE | Documentation |

---

## Production Code Changes

**NONE.** No source code, configuration, dependencies, or build files were modified during Phase 0–1.

## Git State After Phase 0–1

- No tracked files modified
- New documentation files created in `docs/v2.1.0/`
- No commits made by this process
- No branches created or switched

---

## Phase 2 Changes Made

| File | Action | Reason | Risk | Affected Subsystem | Verification Required |
|------|--------|--------|------|--------------------|-----------------------|
| `docs/v2.1.0/architecture/motion-system.md` | CREATED | Defined motion architecture | NONE | Architecture | No |
| `docs/v2.1.0/architecture/creative-visual-system.md` | CREATED | Defined visual architecture | NONE | Architecture | No |
| `docs/v2.1.0/MOTION-IMPLEMENTATION.md` | CREATED | Documented Phase 2 implementation | NONE | Documentation | No |
| `src/design/tokens/motion.ts` | CREATED | Centralized motion tokens | LOW | UI | No |
| `src/animation/hooks/useReducedMotion.ts` | CREATED | Added reduced motion hook | LOW | Animation | Browser Test |
| `src/animation/presets/fade.ts` | CREATED | Added GSAP fade preset | LOW | Animation | Browser Test |
| `src/animation/timelines/roninIntroTimeline.ts` | CREATED | Created Intro timeline | LOW | Startup/Animation | Browser Test |
| `src/graphics/three/lifecycle/VisualScene.ts` | CREATED | Defined Three.js lifecycle | LOW | Graphics | No |
| `src/graphics/three/scenes/RoninIntroScene.ts` | CREATED | Created Three.js intro visual | MED | Graphics/Memory | Browser Test, Memory Profile |
| `src/components/startup/RoninIntro.tsx` | CREATED | Built the intro React component | LOW | Startup/UI | Browser Test |
| `src/App.tsx` | MODIFIED | Integrated `RoninIntro` at startup | HIGH | App Bootstrap | Verify app starts and is usable |

### Phase 3 - Playback Reliability
- `VideoPlayer.tsx` - Integrated session lifecycle hook and error boundary.
- `AnimeVideoPlayer.tsx` - Integrated session lifecycle hook and error boundary.
- `usePlaybackSession.ts` - Added new hook to isolate and manage playback sessions,
- `PlayerErrorBoundary.tsx` - Added new React error boundary to prevent app crashes during fatal player errors.
- `phase3-playback.test.mjs` - Added static analysis tests for session safeguards.
- Watch.tsx` - Wrapped players in error boundaries and provided retryCount in key to guarantee fresh mounts on retry.

### Phase 4 - Anime Player UX & Architecture
| File | Action | Reason | Risk | Affected Subsystem | Verification Required |
|------|--------|--------|------|--------------------|-----------------------|
| src/components/player/anime/AnimeVideoPlayer.tsx | MODIFIED | Implemented ctiveQuality stream resolution, subtitle track UI mapping, and auto-next cancellation on reverse seek. Replaced ctiveQuality UI-only state with handleQualityChange mapped to hls.currentLevel. Formatted related Anime dropdown. | MED | Anime Playback UI | Yes (Test) |
| src/pages/Watch.tsx | MODIFIED | Fixed double remounting issue by tying AnimeVideoPlayer key to deterministic mediaId/episodeNumber/
etryCount instead of sourceUrl. Added missing
etryCount to
esolveEpisodeStream call to fix provider retry loop. | MED | Navigation & Playback | Yes (Test) |
| src/services/anime/AnimeStreamService.ts | MODIFIED | Added fallback logic to re-try with SUB stream when preferredLanguage DUB fails to resolve. | LOW | Anime Stream Resolution | Yes (Test) |
| 	ests/phase4-anime.test.mjs | CREATED | Added dedicated regression suite to enforce deterministic keys, retry counting, auto-next logic, language fallbacks, and quality switching logic. | LOW | Tests | Yes |

### Phase 5: Startup + Unified Loading Architecture (2026-09-02)
* **AppLifecycleContext introduced:** Centralized application readiness tracking.
* **useAppReadyWhen hook created:** Declarative route-level readiness signaling.
* **Parallel Intro Synchronization:** RoninIntro GSAP timeline bound to ppState, hiding network latency.
* **Unified Route Wiring:** 14 top-level routes wired to useAppReadyWhen for stale-safe cancellation and loading unification.
* **Architecture Documentation:** docs/v2.1.0/architecture/startup.md updated and loading.md created.
