# RoninPLEX v2.1.0 — Motion Implementation

**Generated:** 2026-09-02
**Status:** Verified (Phase 6)

## 1. Overview
The RoninPLEX v2.1.0 motion system has been successfully implemented, establishing a robust foundation for cinematic visual effects without compromising application readiness or performance. In Phase 6, this foundation was extended to standard application surfaces (Modals, Heros) via reusable primitives.

## 2. Architecture & Ownership
- **GSAP** owns layout reveals, transitions, and the orchestration timeline (oninIntroTimeline).
- **Three.js** owns cinematic visual depth, particles, and shader contexts (RoninIntroScene).
- **React** owns component lifecycles, global state, and readiness checks.
- **CSS** continues to handle inexpensive :hover and :focus states.

## 3. Tokens
Centralized tokens are defined in src/design/tokens/motion.ts:
- **Durations:** instant, micro, short, medium, long, cinematic
- **Easings:** standard, emphasized, cinematic, bounce, linear
- **Scales:** hover, active

## 4. Reusable Primitives (Phase 6)
- **useMotionPresence:** A hook bridging React component unmount lifecycles with GSAP exit animations, applied to all Modals.
- **ScrambleText:** A GSAP ticker-driven component that directly mutates innerText to avoid React re-renders during high-frequency cinematic text reveals.

## 5. GSAP Usage
GSAP is used via @gsap/react useGSAP hook, which provides automatic scope binding and guaranteed context cleanup (ctx.revert()) upon component unmount.
- Timeline: createRoninIntroTimeline defined in src/animation/timelines/.
- Presets: Extensible presets added under src/animation/presets/.

## 6. Three.js Usage & Lifecycle
All Three.js elements must implement the VisualScene interface.
- RoninIntroScene.ts implements initialization, resize, render loop, pause, resume, quality fallback, and mandatory dispose().
- Three.js is restricted to the Intro overlay; it completely removes itself and forces WebGL context loss when the Intro unmounts.

## 7. Cleanup Strategy
- The VisualScene interface mandates a dispose() method.
- Memory leaks are prevented by explicitly disposing of geometries, materials, and forcing context loss on the WebGLRenderer.
- The render loop halts immediately when the pause() method is called.

## 8. Performance Safeguards
- Single WebGLRenderer context instantiated.
- Render scale dynamically capped via Math.min(window.devicePixelRatio, 2).
- If WebGL initialization fails, the application catches the error silently and relies on a styled CSS background.

## 9. Reduced Motion
- useReducedMotion hook (src/animation/hooks/useReducedMotion.ts) dynamically detects OS-level user preference.
- When enabled, GSAP timeline instantly completes. Three.js initialization is completely skipped. ScrambleText renders instantly without processing.
- The UI falls back to an instant transition to maintain full usability.

## 10. Intro Integration & Branding
- The intro overlay uses the official RoninPLEX graphical logo asset (logo.png), scaling responsively and preserving branding dimensions.
- The intro overlay is rendered in App.tsx concurrently with normal route rendering.
- It receives an isAppReady flag.
- Timeline finishes its visual sequence, polls readiness, and orchestrates the CSS fade-out before unmounting itself.
