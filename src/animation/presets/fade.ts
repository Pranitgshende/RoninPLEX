import gsap from 'gsap';
import { motionTokens } from '../../design/tokens/motion';

/**
 * Creates a fade-in animation for an element.
 * Respects reduced motion by defaulting to a rapid instant state change if required,
 * though normally the caller should conditionally apply this logic based on `useReducedMotion`.
 */
export const fadeIn = (
  target: gsap.DOMTarget,
  options: { duration?: number; delay?: number; ease?: string; reducedMotion?: boolean } = {}
) => {
  const {
    duration = motionTokens.duration.medium,
    delay = 0,
    ease = motionTokens.ease.standard,
    reducedMotion = false,
  } = options;

  return gsap.fromTo(
    target,
    { opacity: 0 },
    {
      opacity: 1,
      duration: reducedMotion ? motionTokens.duration.instant : duration,
      delay: reducedMotion ? 0 : delay,
      ease,
    }
  );
};
