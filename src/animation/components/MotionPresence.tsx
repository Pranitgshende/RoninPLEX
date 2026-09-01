import React, { useState, useEffect, useRef } from \'react\';
import gsap from \'gsap\';
import { useReducedMotion } from \'../hooks/useReducedMotion\';
import { motionTokens } from \'../../design/tokens/motion\';

interface MotionPresenceProps {
  show: boolean;
  children: React.ReactNode;
  animation?: \'fade\' | \'slideUp\' | \'scale\';
  duration?: number;
  unmountDelay?: number; // fallback, usually duration * 1000
}

export const MotionPresence: React.FC<MotionPresenceProps> = ({
  show,
  children,
  animation = \'fade\',
  duration = motionTokens.duration.medium,
  unmountDelay
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const actualDuration = reducedMotion ? motionTokens.duration.instant : duration;

  useEffect(() => {
    if (show) {
      setShouldRender(true);
    }
  }, [show]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    if (show) {
      // Enter animation
      const ctx = gsap.context(() => {
        gsap.killTweensOf(containerRef.current);
        
        let fromVars: gsap.TweenVars = { opacity: 0 };
        let toVars: gsap.TweenVars = { opacity: 1, duration: actualDuration, ease: motionTokens.ease.standard };
        
        if (animation === \'slideUp\') {
          fromVars.y = 20;
          toVars.y = 0;
        } else if (animation === \'scale\') {
          fromVars.scale = 0.95;
          toVars.scale = 1;
        }
        
        gsap.fromTo(containerRef.current, fromVars, toVars);
      });
      return () => ctx.revert();
    } else if (shouldRender) {
      // Exit animation
      const ctx = gsap.context(() => {
        gsap.killTweensOf(containerRef.current);
        
        let toVars: gsap.TweenVars = { 
          opacity: 0, 
          duration: actualDuration, 
          ease: motionTokens.ease.standard,
          onComplete: () => setShouldRender(false)
        };
        
        if (animation === \'slideUp\') {
          toVars.y = 10;
        } else if (animation === \'scale\') {
          toVars.scale = 0.95;
        }
        
        gsap.to(containerRef.current, toVars);
      });
      return () => ctx.revert();
    }
  }, [show, shouldRender, animation, actualDuration]);

  if (!shouldRender) return null;

  return (
    <div ref={containerRef} style={{ display: \'contents\' }}>
      {children}
    </div>
  );
};
