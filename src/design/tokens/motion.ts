export const duration = {
  instant: 0,
  micro: 0.15,
  short: 0.3,
  medium: 0.5,
  long: 0.8,
  cinematic: 1.5,
} as const;

export const ease = {
  standard: 'power2.out',
  emphasized: 'power4.out',
  cinematic: 'expo.inOut',
  bounce: 'back.out(1.5)',
  linear: 'none',
} as const;

export const scale = {
  hover: 1.05,
  active: 0.95,
} as const;

export const motionTokens = {
  duration,
  ease,
  scale,
};
