// @ts-ignore
import * as THREE from 'three';
import { VisualScene } from '../lifecycle/VisualScene';

export class RoninIntroScene implements VisualScene {
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private animationFrameId?: number;
  private isPlaying: boolean = false;

  // Visual elements
  private particles?: THREE.Points;
  private particleMaterial?: THREE.PointsMaterial;
  private particleGeometry?: THREE.BufferGeometry;

  // Exposed for GSAP to animate
  public uniforms = {
    opacity: { value: 0 },
    particleSpread: { value: 0 },
  };

  public initialize(container: HTMLElement): void {
    if (this.renderer) return; // Prevent double init

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x090a0f, 0.002);

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 30;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0); // Transparent to blend with CSS background
    container.appendChild(this.renderer.domElement);

    // Create minimal particles
    this.createParticles();

    this.resize(width, height, Math.min(window.devicePixelRatio, 2));
  }

  private createParticles() {
    if (!this.scene) return;
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      // Brand colors: blues and purples
      color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  public resize(width: number, height: number, pixelRatio: number): void {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.renderLoop();
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  public resume(): void {
    this.start();
  }

  public setQuality(level: 'high' | 'medium' | 'low'): void {
    if (!this.renderer) return;
    if (level === 'high') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } else if (level === 'medium') {
      this.renderer.setPixelRatio(1);
    } else {
      // low: might pause entirely
      this.renderer.setPixelRatio(0.5);
    }
  }

  private renderLoop = () => {
    if (!this.isPlaying || !this.renderer || !this.scene || !this.camera) return;

    // Apply GSAP-driven uniforms to materials
    if (this.particleMaterial && this.particles) {
      this.particleMaterial.opacity = this.uniforms.opacity.value;
      // Gentle idle rotation
      this.particles.rotation.y += 0.001;
      this.particles.rotation.x += 0.0005;
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  public dispose(): void {
    this.pause();
    
    // Dispose resources
    if (this.particleGeometry) this.particleGeometry.dispose();
    if (this.particleMaterial) this.particleMaterial.dispose();
    if (this.particles && this.scene) this.scene.remove(this.particles);

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = undefined;
    }
    
    this.scene = undefined;
    this.camera = undefined;
  }
}
