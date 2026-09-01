/**
 * Standard lifecycle interface for all Three.js scenes to ensure proper resource management
 * and memory cleanup.
 */
export interface VisualScene {
  /** Sets up the renderer, scene, camera, meshes, and binds to the container. */
  initialize(container: HTMLElement): void;
  
  /** Updates camera aspect ratio and renderer size. */
  resize(width: number, height: number, pixelRatio: number): void;
  
  /** Begins the animation loop. */
  start(): void;
  
  /** Halts the animation loop to save CPU/GPU. */
  pause(): void;
  
  /** Resumes the animation loop. */
  resume(): void;
  
  /** Adjusts rendering fidelity dynamically. */
  setQuality(level: 'high' | 'medium' | 'low'): void;
  
  /** Cleans up all geometries, materials, textures, and the renderer. Mandatory. */
  dispose(): void;
}
