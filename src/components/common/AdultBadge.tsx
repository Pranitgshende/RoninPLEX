import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AdultBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const AdultBadge: React.FC<AdultBadgeProps> = ({
  className = '',
  size = 'sm',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-0.5',
    md: 'text-[10px] px-2 py-0.5 gap-1',
    lg: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider uppercase rounded bg-rose-950/90 text-rose-200 border border-rose-500/50 shadow-sm backdrop-blur-sm select-none ${sizeClasses[size]} ${className}`}
      title="18+ Adult Content: Contains mature themes or adult content"
      aria-label="18+ Adult Content"
    >
      {showIcon && <AlertTriangle className="w-2.5 h-2.5 text-rose-400 flex-shrink-0" aria-hidden="true" />}
      <span className="font-mono font-extrabold">18+</span>
    </span>
  );
};
