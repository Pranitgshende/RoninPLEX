import gsap from 'gsap';
import { motionTokens } from '../../design/tokens/motion';

/**
 * Orchestrates the RoninPLEX cinematic intro sequence.
 */
export const createRoninIntroTimeline = (
  container: HTMLElement,
  logoRef: HTMLElement,
  scrambleRef: React.RefObject<{ start: () => void } | null>,
  onComplete: () => void,
  isReady: () => boolean,
  reducedMotion: boolean,
  sceneUniforms?: { opacity: { value: number }; particleSpread: { value: number } }
) => {
  const tl = gsap.timeline({
    onComplete: () => {
      // Ensure we wait for readiness before fully completing
      const checkReady = () => {
        if (isReady()) {
          gsap.to(container, {
            opacity: 0,
            duration: motionTokens.duration.medium,
            ease: motionTokens.ease.standard,
            onComplete,
          });
        } else {
          setTimeout(checkReady, 100); // Polling fallback if not ready
        }
      };
      checkReady();
    },
  });

  if (reducedMotion) {
    // Instant completion for reduced motion
    tl.to(container, { opacity: 0, duration: 0, onComplete });
    if (scrambleRef.current) scrambleRef.current.start();
    return tl;
  }

  // STATE 1: Black base (initial CSS)
  
  // STATE 2: Subtle visual environment emerges
  if (sceneUniforms) {
    tl.to(sceneUniforms.opacity, {
      value: 1,
      duration: motionTokens.duration.cinematic,
      ease: motionTokens.ease.standard,
    }, 0);
  }

  // STATE 3 & 4: Logo begins to form and gains depth; scale locked at exactly 2.0s
  tl.fromTo(
    logoRef,
    { opacity: 0, scale: 0.85, filter: 'blur(10px)' },
    {
      opacity: 1,
      scale: 1.0,
      filter: 'blur(0px)',
      duration: 2.0,
      ease: motionTokens.ease.cinematic,
      onStart: () => {
        if (scrambleRef.current) scrambleRef.current.start();
      }
    },
    0.0
  );

  // Logo scale is LOCKED after 2.0s (no further scale tweens).
  // Scramble runs for 4.5s (0.0s to 4.5s).
  // Hold final readable "RONINPLEX" state for 0.5s before transitioning out (total 5.0s).
  tl.to({}, { duration: 5.0 }, 0);

  // Timeline ends, onComplete handles STATE 7 & 8 (transition out)
  return tl;
};
