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
  duration = 4.5,
  chars = DEFAULT_CHARS,
  className = '',
  delay = 0,
  autoStart = false,
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
      tweenRef.current = null;
    }

    const obj = { p: 0 };
    const originalLength = text.length;
    let frameCount = 0;
    const charBuffer: string[] = [];
    for (let i = 0; i < originalLength; i++) {
      charBuffer.push(chars[Math.floor(Math.random() * chars.length)]);
    }

    tweenRef.current = gsap.to(obj, {
      p: 1,
      duration,
      delay,
      ease: "none", // Constant linear resolution across the full duration
      onUpdate: () => {
        if (!elRef.current) return;
        frameCount++;
        // Rapid character shimmer for crisp cyberpunk glyphs
        const shouldMutate = frameCount % 3 === 0;
        const solvedCount = Math.floor(obj.p * originalLength);

        let result = "";
        for (let i = 0; i < originalLength; i++) {
          if (text[i] === ' ') {
            result += ' ';
          } else if (i < solvedCount) {
            result += text[i];
          } else {
            if (shouldMutate) {
              charBuffer[i] = chars[Math.floor(Math.random() * chars.length)];
            }
            result += charBuffer[i];
          }
        }
        elRef.current.innerText = result;
      },
      onComplete: () => {
        if (elRef.current) elRef.current.innerText = text;
        tweenRef.current = null;
        onComplete?.();
      }
    });
  };

  const reset = () => {
    if (tweenRef.current) {
      tweenRef.current.kill();
      tweenRef.current = null;
    }
    if (elRef.current) elRef.current.innerText = text;
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

  return (
    <span 
      aria-label={text} 
      className={`relative inline-block whitespace-nowrap select-none ${className}`}
      onMouseEnter={start}
    >
      <span className="invisible pointer-events-none select-none whitespace-nowrap" aria-hidden="true">
        {text}
      </span>
      <span ref={elRef} className="absolute inset-0 whitespace-nowrap overflow-hidden" aria-hidden="true">
        {reducedMotion || !autoStart ? text : ''}
      </span>
    </span>
  );
});

ScrambleText.displayName = 'ScrambleText';

