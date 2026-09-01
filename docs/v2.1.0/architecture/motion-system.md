# RoninPLEX v2.1.0 — Motion System Architecture

**Generated:** 2026-09-01
**Status:** Architecture Design (Phase 2)

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
| **React** | Component structure, state, visibility, configuration | Mounts/unmounts elements. Triggers GSAP effects via `useGSAP` or lifecycle hooks. Does NOT use `setState` for per-frame animation. |
| **GSAP** | DOM/UI animation, complex timelines, orchestration | Owns complex sequences, layout reveals, text animation. Must be cleaned up on unmount. |
| **Three.js** | GPU visual scene, 3D effects | Confined to designated canvases. Only for spatial/cinematic depth effects. |
| **CSS/Tailwind**| Static styling, inexpensive transitions | Used for `hover:`, `focus:`, `active:` pseudo-classes and simple class-toggle transitions. |

---

## 3. Directory Structure

The motion system will integrate into the existing repository layout under a centralized directory:

```text
src/
├── animation/
│   ├── core/           # GSAP plugins, global config, context registration
│   ├── timelines/      # Reusable GSAP timeline factories (e.g., roninIntroTimeline)
│   ├── presets/        # Reusable single-element animations (fade, scale)
│   └── hooks/          # React hooks for motion (e.g., useReducedMotion)
│
├── design/
│   └── tokens/         # Centralized motion tokens (durations, easings, scales)
```

---

## 4. Animation Lifecycle

Every animated component MUST respect the following lifecycle to prevent memory leaks and ghost animations:

1. **CREATE**: Define timeline structure without playing.
2. **INITIALIZE**: Calculate starting positions and bind to DOM nodes.
3. **RUN**: Execute the animation.
4. **PAUSE / RESUME**: Handle visibility changes (e.g., tab backgrounded) to save CPU.
5. **REVERSE**: (Optional) For exit animations before unmount.
6. **DISPOSE**: **Mandatory.** Kill the GSAP context (`ctx.revert()`) and clear references when the React component unmounts.

*Implementation Note: Use `@gsap/react` `useGSAP()` hook which automatically handles scope and cleanup (revert on unmount).*

---

## 5. Motion Tokens (Design System)

To prevent arbitrary animation values, we use centralized tokens.

### Durations
- `instant`: 0ms (fallback for reduced motion)
- `micro`: 150ms (hover states, simple toggles)
- `short`: 300ms (menus, simple enters/exits)
- `medium`: 500ms (page transitions, complex elements)
- `long`: 800ms (prominent reveals)
- `cinematic`: 1500ms+ (intro sequences)

### Easing Curves
- `ease.standard`: `power2.out`
- `ease.emphasized`: `power4.out`
- `ease.cinematic`: `expo.inOut`
- `ease.bounce`: `back.out(1.5)`

### Spatial Tokens
- `distance.sm`: 10px
- `distance.md`: 24px
- `distance.lg`: 48px
- `scale.hover`: 1.05
- `scale.active`: 0.95

---

## 6. GSAP Rules & Guardrails

- **No unmanaged global timelines:** All animations must be scoped to a component (via `useGSAP` `scope` ref).
- **No mixing systems:** Do not apply a CSS `transition-all` class to an element being animated by GSAP. This causes visual stutter.
- **Transform & Opacity over Layout:** Animate `x`, `y`, `scale`, and `opacity`. Avoid animating `width`, `height`, `margin`, or `padding` unless absolutely necessary for performance reasons.
- **Use Contexts:** Always wrap GSAP creations in a context (handled implicitly by `useGSAP()`).

---

## 7. Reduced Motion Support

- **Detection:** Use `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- **Strategy:** Provide an architecture allowing animations to reduce to:
  - Immediate state change (duration = 0)
  - Simple fade-in instead of complex transforms
  - Disabled background effects
- **Usability:** The application must remain 100% functional when motion is reduced.

---

## 8. Startup Integration & The RoninPLEX Intro

- The intro must NOT use `setTimeout` or arbitrary delays to block the app.
- The intro sequence runs concurrently with actual app bootstrap (context hydration, initial TMDB fetches).
- GSAP owns the visual synchronization of the intro. React owns the readiness state.
- When the application is "ready", the intro transitions seamlessly into the usable application.
