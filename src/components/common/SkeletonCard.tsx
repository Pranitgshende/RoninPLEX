import React from 'react';
import { SkeletonCard as NewSkeletonCard } from './skeleton/SkeletonCard';

export interface SkeletonCardProps {
  className?: string;
  aspectRatio?: 'poster' | 'backdrop';
  variant?: 'poster' | 'backdrop';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className,
  aspectRatio = 'poster',
  variant,
}) => {
  return (
    <NewSkeletonCard
      variant={variant || aspectRatio}
      className={className}
    />
  );
};
