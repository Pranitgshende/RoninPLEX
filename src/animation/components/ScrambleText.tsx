import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface ScrambleTextProps {
  text: string;
  duration?: number;
  chars?: string;
  className?: string;
  delay?: number;
  autoStart?: boolean;
  onComplete?: () => void;
}

export interface ScrambleTextRef {
  start: () => void;
  reset: () => void;
}

const DEFAULT_CHARS = '!<>-_\\/[]{}—=+*^?#________';

export const ScrambleText = forwardRef<ScrambleTextRef, ScrambleTextProps>(({
  text,
  duration = 0.8,
  chars = DEFAULT_CHARS,
  className = '',
  delay = 0,
  autoStart = true,
  onComplete
}, ref) => {
  const elRef = useRef<HTMLSpanElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const reducedMotion = useReducedMotion();

  const start = () => {
    if (!elRef.current) return;
    if (reducedMotion) {
      elRef.current.innerText = text;
      onComplete?.();
      return;
    }

    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    const obj = { p: 0 };
    const originalLength = text.length;

    tweenRef.current = gsap.to(obj, {
      p: 1,
      duration,
      delay,
      ease: "power2.out",
      onUpdate: () => {
        if (!elRef.current) return;
        let result = "";
        for (let i = 0; i < originalLength; i++) {
          if (i < obj.p * originalLength) {
            result += text[i];
          } else {
            result += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        elRef.current.innerText = result;
      },
      onComplete: () => {
        if (elRef.current) elRef.current.innerText = text;
        onComplete?.();
      }
    });
  };

  const reset = () => {
    if (tweenRef.current) tweenRef.current.kill();
    if (elRef.current) elRef.current.innerText = reducedMotion ? text : "";
  };

  useImperativeHandle(ref, () => ({
    start,
    reset
  }), [text, reducedMotion, duration, delay, chars]);

  useEffect(() => {
    if (autoStart) {
      start();
    }
    return () => {
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, [text, autoStart, reducedMotion, duration, delay, chars]);

  // Initial render: if autoStart and motion is allowed, render empty so it scrambles in.
  // Otherwise render the full text.
  return (
    <span aria-label={text} className={className}><span ref={elRef} aria-hidden="true">{reducedMotion || !autoStart ? text : ''}</span></span>
  );
});

ScrambleText.displayName = 'ScrambleText';

