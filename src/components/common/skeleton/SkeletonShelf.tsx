import React from 'react';
import { GlassSkeleton } from './GlassSkeleton';
import { SkeletonCard } from './SkeletonCard';

interface SkeletonShelfProps {
  variant?: 'poster' | 'backdrop';
  count?: number;
  hasHeader?: boolean;
  className?: string;
}

export const SkeletonShelf: React.FC<SkeletonShelfProps> = ({
  variant = 'poster',
  count = 6,
  hasHeader = true,
  className = ''
}) => {
  return (
    <section className={`py-6 space-y-3.5 ${className}`}>
      {hasHeader && (
        <div className="flex items-end justify-between px-4 sm:px-8 md:px-12">
          <div className="space-y-1.5">
            <GlassSkeleton className="h-6 w-40 sm:w-56 rounded-lg" />
            <GlassSkeleton className="h-3.5 w-28 sm:w-36 rounded-md" />
          </div>
          <GlassSkeleton className="h-4 w-16 rounded-md hidden sm:block" />
        </div>
      )}

      <div className="flex gap-4 overflow-hidden px-4 sm:px-8 md:px-12 py-1">
        {Array.from({ length: count }).map((_, idx) => (
          <SkeletonCard key={idx} variant={variant} />
        ))}
      </div>
    </section>
  );
};
