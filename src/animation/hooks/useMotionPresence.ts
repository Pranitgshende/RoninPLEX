import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from './useReducedMotion';
import { motionTokens } from '../../design/tokens/motion';

export const useMotionPresence = (show: boolean, animation: 'fade' | 'slideUp' | 'scale' = 'fade') => {
  const [shouldRender, setShouldRender] = useState(show);
  const ref = useRef<any>(null);
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? motionTokens.duration.instant : motionTokens.duration.medium;

  useEffect(() => {
    if (show) setShouldRender(true);
  }, [show]);

  useEffect(() => {
    if (!ref.current) return;
    
    if (show) {
      const ctx = gsap.context(() => {
        gsap.killTweensOf(ref.current);
        const fromVars: gsap.TweenVars = { opacity: 0 };
        const toVars: gsap.TweenVars = { opacity: 1, duration, ease: motionTokens.ease.standard };
        if (animation === 'slideUp') { fromVars.y = 20; toVars.y = 0; }
        else if (animation === 'scale') { fromVars.scale = 0.95; toVars.scale = 1; }
        gsap.fromTo(ref.current, fromVars, toVars);
      });
      return () => ctx.revert();
    } else if (shouldRender) {
      const ctx = gsap.context(() => {
        gsap.killTweensOf(ref.current);
        const toVars: gsap.TweenVars = { 
          opacity: 0, 
          duration: reducedMotion ? motionTokens.duration.instant : motionTokens.duration.short, 
          ease: motionTokens.ease.standard,
          onComplete: () => setShouldRender(false)
        };
        if (animation === 'slideUp') toVars.y = 10;
        else if (animation === 'scale') toVars.scale = 0.95;
        gsap.to(ref.current, toVars);
      });
      return () => ctx.revert();
    }
  }, [show, shouldRender, animation, duration, reducedMotion]);

  return { ref, shouldRender };
};
