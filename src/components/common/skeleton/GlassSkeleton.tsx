import React from 'react';

interface GlassSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const GlassSkeleton: React.FC<GlassSkeletonProps> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      aria-hidden="true"
      className={`bg-surface-200/40 backdrop-blur-md rounded-xl border border-white/5 animate-shimmer ${className}`}
      {...props}
    />
  );
};
