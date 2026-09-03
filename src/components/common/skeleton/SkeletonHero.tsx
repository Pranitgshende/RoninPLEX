import React from 'react';
import { GlassSkeleton } from './GlassSkeleton';

interface SkeletonHeroProps {
  className?: string;
}

export const SkeletonHero: React.FC<SkeletonHeroProps> = ({
  className = ''
}) => {
  return (
    <div className={`relative w-full h-[70vh] sm:h-[80vh] min-h-[500px] max-h-[850px] overflow-hidden bg-surface-100/40 ${className}`}>
      {/* Background shimmer placeholder */}
      <GlassSkeleton className="absolute inset-0 rounded-none border-none" />

      {/* Dark gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      {/* Content skeleton aligned to bottom-left */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 max-w-2xl space-y-4">
        {/* Genre / Tag badges */}
        <div className="flex gap-2">
          <GlassSkeleton className="h-5 w-16 rounded-md" />
          <GlassSkeleton className="h-5 w-20 rounded-md" />
        </div>

        {/* Title placeholder */}
        <GlassSkeleton className="h-10 sm:h-14 w-3/4 rounded-xl" />

        {/* Overview lines */}
        <div className="space-y-2 pt-1">
          <GlassSkeleton className="h-3.5 w-full rounded-md" />
          <GlassSkeleton className="h-3.5 w-5/6 rounded-md" />
          <GlassSkeleton className="h-3.5 w-2/3 rounded-md" />
        </div>

        {/* Buttons */}
        <div className="flex gap-3.5 pt-2">
          <GlassSkeleton className="h-11 w-32 rounded-xl" />
          <GlassSkeleton className="h-11 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
