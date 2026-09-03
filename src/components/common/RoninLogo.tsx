import React from 'react';
import brandMarkUrl from '../../assets/brand-mark.png';

export interface RoninLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const RoninLogo: React.FC<RoninLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div 
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <img 
          src={brandMarkUrl} 
          alt="RoninPLEX Brand Mark" 
          className="w-full h-full object-contain filter drop-shadow-md rounded-full" 
        />
      </div>
      {showText && (
        <span className="font-black text-lg sm:text-xl font-display tracking-tight text-white leading-none">
          Ronin<span className="text-brand-500">PLEX</span>
        </span>
      )}
    </div>
  );
};
