# RoninPLEX v2.1.0 — Motion Implementation

**Generated:** 2026-09-01
**Status:** Implementation (Phase 2)

## 1. Overview
The RoninPLEX v2.1.0 motion system has been successfully implemented, establishing a robust foundation for cinematic visual effects without compromising application readiness or performance.

## 2. Architecture & Ownership
- **GSAP** owns layout reveals, transitions, and the orchestration timeline (`roninIntroTimeline`).
- **Three.js** owns cinematic visual depth, particles, and shader contexts (`RoninIntroScene`).
- **React** owns component lifecycles, global state, and readiness checks.
- **CSS** continues to handle inexpensive `:hover` and `:focus` states.

## 3. Tokens
Centralized tokens are defined in `src/design/tokens/motion.ts`:
- **Durations:** instant, micro, short, medium, long, cinematic
- **Easings:** standard, emphasized, cinematic, bounce, linear
- **Scales:** hover, active

## 4. GSAP Usage
GSAP is used via `@gsap/react` `useGSAP` hook, which provides automatic scope binding and guaranteed context cleanup (`ctx.revert()`) upon component unmount.
- Timeline: `createRoninIntroTimeline` defined in `src/animation/timelines/`.
- Presets: Extensible presets added under `src/animation/presets/`.

## 5. Three.js Usage & Lifecycle
All Three.js elements must implement the `VisualScene` interface.
- `RoninIntroScene.ts` implements initialization, resize, render loop, pause, resume, quality fallback, and mandatory `dispose()`.
- Three.js is restricted to the Intro overlay; it completely removes itself and forces WebGL context loss when the Intro unmounts.

## 6. Cleanup Strategy
- The `VisualScene` interface mandates a `dispose()` method.
- Memory leaks are prevented by explicitly disposing of geometries, materials, and forcing context loss on the WebGLRenderer.
- The render loop halts immediately when the `pause()` method is called.

## 7. Performance Safeguards
- Single WebGLRenderer context instantiated.
- Render scale dynamically capped via `Math.min(window.devicePixelRatio, 2)`.
- If WebGL initialization fails, the application catches the error silently and relies on a styled CSS background.

## 8. Reduced Motion
- `useReducedMotion` hook (`src/animation/hooks/useReducedMotion.ts`) dynamically detects OS-level user preference.
- When enabled, GSAP timeline instantly completes. Three.js initialization is completely skipped.
- The UI falls back to an instant transition to maintain full usability.

## 9. Intro Integration
- The intro overlay is rendered in `App.tsx` concurrently with normal route rendering.
- It receives an `isAppReady` flag.
- Timeline finishes its visual sequence, polls readiness, and orchestrates the CSS fade-out before unmounting itself.
- Application readiness is not artificially delayed; if the network responds slowly, the intro gracefully transitions into the standard loading state of the application.
