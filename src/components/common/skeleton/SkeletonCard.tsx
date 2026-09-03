import React from 'react';
import { GlassSkeleton } from './GlassSkeleton';

interface SkeletonCardProps {
  variant?: 'poster' | 'backdrop';
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  variant = 'poster',
  className = ''
}) => {
  const hasCustomWidth = /\bw-\S+/.test(className);

  if (variant === 'backdrop') {
    const widthClass = hasCustomWidth ? '' : 'flex-shrink-0 w-60 sm:w-72 md:w-80';
    return (
      <div className={`${widthClass} space-y-2.5 ${className}`}>
        <GlassSkeleton className="aspect-video w-full rounded-2xl" />
        <div className="space-y-1.5 px-0.5">
          <GlassSkeleton className="h-3.5 w-3/4 rounded-md" />
          <GlassSkeleton className="h-2.5 w-1/3 rounded-md" />
        </div>
      </div>
    );
  }

  const widthClass = hasCustomWidth ? '' : 'flex-shrink-0 w-36 sm:w-44 md:w-48 lg:w-52';
  return (
    <div className={`${widthClass} space-y-2.5 ${className}`}>
      <GlassSkeleton className="aspect-[2/3] w-full rounded-2xl" />
      <div className="space-y-1.5 px-0.5">
        <GlassSkeleton className="h-3.5 w-4/5 rounded-md" />
        <GlassSkeleton className="h-2.5 w-1/2 rounded-md" />
      </div>
    </div>
  );
};
