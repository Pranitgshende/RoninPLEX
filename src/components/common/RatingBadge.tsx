import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { formatRating } from '../../utils/formatting';

interface RatingBadgeProps {
  rating?: number | null;
  className?: string;
  showStar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  className,
  showStar = true,
  size = 'md',
}) => {
  const num = rating || 0;

  // Color mapping based on score
  let colorStyles = 'bg-slate-800/80 text-slate-300 border-slate-700/50';
  let starColor = 'text-slate-400';

  if (num >= 8.0) {
    colorStyles = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-900/30';
    starColor = 'text-emerald-400 fill-emerald-400';
  } else if (num >= 7.0) {
    colorStyles = 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-900/30';
    starColor = 'text-indigo-400 fill-indigo-400';
  } else if (num >= 5.5) {
    colorStyles = 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-900/30';
    starColor = 'text-amber-400 fill-amber-400';
  } else if (num > 0) {
    colorStyles = 'bg-rose-950/80 text-rose-300 border-rose-500/40';
    starColor = 'text-rose-400 fill-rose-400';
  }

  const sizeStyles = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2 py-0.5 gap-1.5',
    lg: 'text-sm font-bold px-2.5 py-1 gap-2',
  };

  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border backdrop-blur-md transition-colors',
        sizeStyles[size],
        colorStyles,
        className
      )}
    >
      {showStar && <Star className={cn(starSizes[size], starColor)} />}
      <span>{formatRating(num)}</span>
    </div>
  );
};
