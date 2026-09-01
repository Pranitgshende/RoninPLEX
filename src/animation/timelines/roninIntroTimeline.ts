import gsap from 'gsap';
import { motionTokens } from '../../design/tokens/motion';

/**
 * Orchestrates the RoninPLEX cinematic intro sequence.
 */
export const createRoninIntroTimeline = (
  container: HTMLElement,
  logoRef: HTMLElement,
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

  // STATE 3 & 4: Logo begins to form and gains depth
  tl.fromTo(
    logoRef,
    { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
    {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: motionTokens.duration.long,
      ease: motionTokens.ease.cinematic,
    },
    '-=0.5'
  );

  // STATE 5 & 6: Controlled visual reveal & Logo resolves cleanly
  // A subtle glow or spatial shift can happen here
  tl.to(
    logoRef,
    {
      scale: 1.02,
      duration: motionTokens.duration.long,
      ease: motionTokens.ease.standard,
    },
    '+=0.2'
  );

  // Timeline ends, onComplete handles STATE 7 & 8 (transition out)
  return tl;
};
