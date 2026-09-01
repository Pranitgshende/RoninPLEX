# RoninPLEX v2.1.0 — Motion System Architecture

**Generated:** 2026-09-02
**Status:** IMPLEMENTED (Phase 6)

---

## 1. Core Principles

1. **GSAP is the primary orchestrator** for complex UI motion.
2. **CSS handles simple interactions** (hover states, focus, simple color/transform transitions).
3. **React owns state and DOM structure**, not frame-by-frame animation values.
4. **Motion must be interruptible and safe** (cleanup on unmount).
5. **Reduced motion is mandatory** and must maintain application usability.

---

## 2. Motion Ownership Matrix

| Technology | Responsibility | Usage Rules |
|------------|----------------|-------------|
| **React** | Component structure, state, visibility, configuration | Mounts/unmounts elements. Triggers GSAP effects via useGSAP or lifecycle hooks. Does NOT use setState for per-frame animation. |
| **GSAP** | DOM/UI animation, complex timelines, orchestration | Owns complex sequences, layout reveals, text animation. Must be cleaned up on unmount. |
| **Three.js** | GPU visual scene, 3D effects | Confined to designated canvases. Only for spatial/cinematic depth effects. |
| **CSS/Tailwind**| Static styling, inexpensive transitions | Used for hover:, ocus:, ctive: pseudo-classes and simple class-toggle transitions. |

---

## 3. Directory Structure

`	ext
src/
+-- animation/
¦   +-- components/       # Reusable GSAP-driven React components (e.g., ScrambleText)
¦   +-- hooks/            # React hooks for motion (useReducedMotion, useMotionPresence)
¦   +-- timelines/        # Reusable GSAP timeline factories (roninIntroTimeline)
¦   +-- presets/          # Reusable single-element animations (fade)
¦
+-- design/tokens/
    +-- motion.ts         # Centralized motion tokens
`

---

## 4. Reusable Motion Primitives (Phase 6)

Instead of scattering custom GSAP timelines throughout UI components, RoninPLEX uses specialized, reusable primitives:

### useMotionPresence (Hook)
Used to smoothly animate React components that mount and unmount (e.g., Modals, Overlays). 
- **API:** const { ref, shouldRender } = useMotionPresence(isOpen, 'slideUp' | 'fade' | 'scale');
- **Behavior:** Delays the actual React unmount (shouldRender) until the exit GSAP timeline completes.
- **Used In:** ApiKeyModal, PreferencesModal, OnboardingModal.

### ScrambleText (Component)
Provides a cinematic, deterministic text-scramble reveal effect.
- **API:** <ScrambleText text="RoninPLEX" duration={1.2} />
- **Behavior:** Binds to the GSAP ticker to update a React ef.current.innerText directly, completely avoiding expensive React render cycles during the animation.
- **Used In:** HeroBanner.

---

## 5. Animation Lifecycle & Cleanup

Every animated component MUST respect the lifecycle to prevent memory leaks and ghost animations.
Use @gsap/react useGSAP() or gsap.context() inside useEffect (as demonstrated in useMotionPresence).

* **DISPOSE**: **Mandatory.** Kill the GSAP context (ctx.revert()) and clear references when the React component unmounts.

---

## 6. Motion Tokens (Design System)

### Durations
- instant: 0ms
- micro: 150ms
- short: 300ms
- medium: 500ms
- long: 800ms
- cinematic: 1500ms+

### Easing Curves
- ease.standard: power2.out
- ease.emphasized: power4.out
- ease.cinematic: expo.inOut
- ease.bounce: ack.out(1.5)

---

## 7. Reduced Motion Support

- **Detection:** useReducedMotion() hook.
- **Strategy:** If prefers-reduced-motion is true:
  - ScrambleText bypasses GSAP completely and renders the full text immediately.
  - useMotionPresence reduces duration to instant (0ms), making modals snap in and out immediately.
  - The cinematic intro replaces the 3D WebGL background with a static CSS gradient.

---

## 8. Intro Branding Integration
The RoninPLEX cinematic intro (RoninIntro.tsx) utilizes the project's official graphical asset (logo.png) rather than CSS typography. It scales responsively, retains drop shadows, and integrates seamlessly into the GSAP timeline without modifying the core startup state handoff.
