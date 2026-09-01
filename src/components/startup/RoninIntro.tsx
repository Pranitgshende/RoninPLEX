import React, { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '../../animation/hooks/useReducedMotion';
import { createRoninIntroTimeline } from '../../animation/timelines/roninIntroTimeline';
import { RoninIntroScene } from '../../graphics/three/scenes/RoninIntroScene';

interface RoninIntroProps {
  onComplete: () => void;
  isAppReady: boolean;
}

export const RoninIntro: React.FC<RoninIntroProps> = ({ onComplete, isAppReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  
  const sceneRef = useRef<RoninIntroScene | null>(null);
  const reducedMotion = useReducedMotion();

  // Initialize Three.js scene
  useEffect(() => {
    if (reducedMotion || !canvasContainerRef.current) return;

    try {
      sceneRef.current = new RoninIntroScene();
      sceneRef.current.initialize(canvasContainerRef.current);
      sceneRef.current.start();

      const handleResize = () => {
        if (sceneRef.current && canvasContainerRef.current) {
          sceneRef.current.resize(
            canvasContainerRef.current.clientWidth,
            canvasContainerRef.current.clientHeight,
            Math.min(window.devicePixelRatio, 2)
          );
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (sceneRef.current) {
          sceneRef.current.dispose();
          sceneRef.current = null;
        }
      };
    } catch (error) {
      console.warn('RoninIntro: Failed to initialize WebGL fallback applied.', error);
      // Failsafe: app will just continue without Three.js background
    }
  }, [reducedMotion]);

  // GSAP Orchestration
  useGSAP(
    () => {
      if (!containerRef.current || !logoRef.current) return;

      createRoninIntroTimeline(
        containerRef.current,
        logoRef.current,
        onComplete,
        () => isAppReady, // Use a getter so the timeline checks current state
        reducedMotion,
        sceneRef.current?.uniforms
      );
    },
    { scope: containerRef, dependencies: [reducedMotion] }
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Three.js Canvas Container */}
      {!reducedMotion && (
        <div ref={canvasContainerRef} className="absolute inset-0" />
      )}

      {/* CSS Fallback / Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80" />

      {/* Logo Mark */}
      <div ref={logoRef} className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-2xl shadow-brand-600/40 mb-4">
          <span className="text-3xl sm:text-4xl font-black text-white">R</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
          RoninPLEX
        </h1>
      </div>
    </div>
  );
};
