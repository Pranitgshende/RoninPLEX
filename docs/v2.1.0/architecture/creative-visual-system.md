# RoninPLEX v2.1.0 — Creative Visual System Architecture

**Generated:** 2026-09-01
**Status:** Architecture Design (Phase 2)

---

## 1. System Role

Three.js is the designated **selective visual subsystem**. It is NOT a replacement for the UI framework. It is strictly reserved for instances where GPU rendering adds cinematic value that CSS/DOM cannot efficiently achieve.

### Allowed Use Cases
- Atmospheric backgrounds (e.g., volumetric lighting, fog)
- Cinematic intro sequences (RoninPLEX mark formation, depth effects)
- Shader distortion and spatial effects
- Advanced particles

### Prohibited Use Cases
- Standard UI (buttons, menus, cards, forms)
- Layout orchestration
- Text rendering (unless part of a specific 3D logo effect)

---

## 2. Directory Structure

The visual system integrates into the repository under `src/graphics/`:

```text
src/
└── graphics/
    └── three/
        ├── core/           # Renderer setup, global scene manager, loop orchestration
        ├── scenes/         # Specific scene implementations (e.g., RoninIntroScene.ts)
        ├── materials/      # Reusable custom ShaderMaterials
        ├── shaders/        # GLSL code (vert/frag)
        ├── postprocessing/ # Configured post-process chains (if used)
        └── lifecycle/      # Base classes/interfaces for strict resource management
```

---

## 3. Strict Resource Lifecycle

Three.js does not garbage collect WebGL resources automatically when references are lost. Every visual implementation MUST implement a strict lifecycle.

### The `VisualScene` Interface
Every distinct Three.js visual must implement an interface ensuring explicit lifecycle control:

```typescript
interface VisualScene {
  initialize(container: HTMLElement): void; // Setup renderer, scene, camera, meshes
  resize(width: number, height: number, pixelRatio: number): void;
  start(): void; // Begin render loop
  pause(): void; // Halt render loop (e.g., when obscured or tab inactive)
  resume(): void; // Resume render loop
  setQuality(level: 'high' | 'medium' | 'low'): void; // Adjust fidelity
  dispose(): void; // MANDATORY: clear geometries, materials, textures, renderer
}
```

---

## 4. Performance & Guardrails

The system is designed for **60 FPS target** with minimal idle overhead.

### Render Loop Management
- **No idle rendering:** If the scene is not visible or no animation is actively changing, the render loop must pause.
- **Single Renderer:** Avoid instantiating multiple `WebGLRenderer` instances across the app. Use a single context (or limited managed contexts) if multiple 3D elements exist.

### Adaptive Quality & Scale
The visual system must be capable of degrading gracefully:
- **High:** Full resolution, complex shaders, high particle count.
- **Medium:** Capped pixel ratio (e.g., `Math.min(window.devicePixelRatio, 1.5)`), simplified shaders.
- **Low (Fallback):** Render loop halted, replaced by CSS fallback (gradient or static image).

### Fallback Behavior
- If WebGL initialization fails (due to driver issues or lack of support), the system MUST catch the error silently.
- The UI MUST fall back to a safe CSS state.
- The application MUST continue to load and remain fully usable.

---

## 5. Integration with GSAP

- **State Syncing:** GSAP drives the animation values. Three.js scenes expose animatable properties (e.g., `uniforms.uProgress.value`, `camera.position.z`).
- GSAP timelines directly tween these exposed properties. Three.js merely renders the current state of these properties in its `requestAnimationFrame` loop.
- Avoid building internal timer-based animations within `requestAnimationFrame`. Let GSAP handle the easing and orchestration.

---

## 6. The Cinematic Intro Vision

The RoninPLEX intro is a choreographic sequence integrating React, GSAP, and Three.js.

### Sequence
1. **STATE 1:** Black / atmospheric base (React mounts Canvas).
2. **STATE 2:** Subtle visual environment emerges (Three.js fade-in via GSAP).
3. **STATE 3:** RoninPLEX mark begins to form (Spatial depth treatment).
4. **STATE 4:** Controlled visual reveal / distortion (Shader uniforms tweened).
5. **STATE 5:** Logo resolves cleanly.
6. **STATE 6:** Application environment (Home page) begins appearing in background.
7. **STATE 7:** Intro transitions out and hands off to the usable application.

### Handoff
Once the startup sequence is complete and the UI is revealed, the Three.js intro scene MUST call its `dispose()` method. It should not continue consuming memory or GPU cycles in the background while the user is browsing or watching content.
