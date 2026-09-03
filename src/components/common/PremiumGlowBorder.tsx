import React from 'react';

export interface PremiumGlowBorderProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  borderRadius?: string;
  intensity?: 'subtle' | 'medium' | 'cinematic';
  as?: React.ElementType;
}

const BEAM_GRADIENT =
  'conic-gradient(from 0deg, transparent 0deg, transparent 275deg, rgba(168, 85, 247, 0.12) 295deg, rgba(168, 85, 247, 0.75) 325deg, rgba(99, 102, 241, 1) 345deg, rgba(147, 197, 253, 0.95) 355deg, transparent 360deg)';

export const PremiumGlowBorder: React.FC<PremiumGlowBorderProps> = ({
  children,
  className = '',
  innerClassName = '',
  borderRadius = 'rounded-2xl',
  intensity = 'subtle',
  as: Component = 'div',
}) => {
  // Intensity opacity maps
  const opacityMap = {
    subtle: 'opacity-50 group-hover:opacity-75',
    medium: 'opacity-70 group-hover:opacity-95',
    cinematic: 'opacity-85 group-hover:opacity-100',
  };

  return (
    <Component
      className={`relative p-[1.5px] overflow-hidden group border border-white/10 ${borderRadius} ${className}`}
    >
      {/* Soft Ambient Aura Layer behind the beam */}
      <div
        aria-hidden="true"
        className={`absolute inset-[-120%] animate-rotate-glow pointer-events-none blur-sm transition-opacity duration-700 ${opacityMap[intensity]} opacity-40`}
        style={{
          background: BEAM_GRADIENT,
          willChange: 'transform',
        }}
      />

      {/* GPU-Composited Rotating Conic Glow Beam */}
      <div
        aria-hidden="true"
        className={`absolute inset-[-150%] animate-rotate-glow pointer-events-none transition-opacity duration-700 ${opacityMap[intensity]}`}
        style={{
          background: BEAM_GRADIENT,
          willChange: 'transform',
        }}
      />

      {/* Surface Content Inner Container */}
      <div
        className={`relative z-10 w-full h-full overflow-hidden ${borderRadius} ${innerClassName}`}
      >
        {children}
      </div>
    </Component>
  );
};
