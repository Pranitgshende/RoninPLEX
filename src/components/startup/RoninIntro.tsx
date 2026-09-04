import React, { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '../../animation/hooks/useReducedMotion';
import { createRoninIntroTimeline } from '../../animation/timelines/roninIntroTimeline';
import { RoninIntroScene } from '../../graphics/three/scenes/RoninIntroScene';
import { ScrambleText, ScrambleTextRef } from '../../animation/components/ScrambleText';
import { SlidingMediaWall } from './SlidingMediaWall';

interface RoninIntroProps {
  onComplete: () => void;
  isAppReady: boolean;
}

import logoUrl from '../../assets/logo.png';
import brandMarkUrl from '../../assets/brand-mark.png';

export const RoninIntro: React.FC<RoninIntroProps> = ({ onComplete, isAppReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const scrambleRef = useRef<ScrambleTextRef>(null);
  
  const sceneRef = useRef<RoninIntroScene | null>(null);
  const reducedMotion = useReducedMotion();
  const isAppReadyRef = useRef(isAppReady);

  useEffect(() => {
    isAppReadyRef.current = isAppReady;
  }, [isAppReady]);

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
        scrambleRef,
        onComplete,
        () => isAppReadyRef.current, // Use a getter so the timeline checks current state
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
      {/* Full-Screen Sliding Media-Wall Background */}
      <SlidingMediaWall />

      {/* Three.js Canvas Container */}
      {!reducedMotion && (
        <div ref={canvasContainerRef} className="absolute inset-0 z-[1]" />
      )}

      {/* CSS Fallback / Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/80 z-[2] pointer-events-none" />

      {/* Logo Mark - Strictly Fixed at Center */}
      <div ref={logoRef} className="relative z-10 flex flex-col items-center select-none">
        <img 
          src={brandMarkUrl} 
          alt="RoninPLEX Logo" 
          className="w-32 sm:w-44 md:w-52 h-auto drop-shadow-2xl opacity-90 rounded-full"
        />
        <div className="mt-6 text-2xl sm:text-3xl md:text-4xl font-display font-black tracking-[0.15em] text-white/95 drop-shadow-lg">
          <ScrambleText text="RoninPLEX" duration={4.5} autoStart={false} ref={scrambleRef} />
        </div>
      </div>
    </div>
  );
};
