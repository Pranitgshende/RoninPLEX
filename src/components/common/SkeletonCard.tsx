import React from 'react';
import { cn } from '../../utils/helpers';

interface SkeletonCardProps {
  className?: string;
  aspectRatio?: 'poster' | 'backdrop';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className,
  aspectRatio = 'poster',
}) => {
  const aspectClass = aspectRatio === 'poster' ? 'aspect-[2/3]' : 'aspect-video';

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden glass-subtle animate-pulse',
        aspectClass,
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="flex items-center justify-between">
          <div className="h-3 bg-white/10 rounded w-1/4" />
          <div className="h-3 bg-white/10 rounded w-1/5" />
        </div>
      </div>
    </div>
  );
};
