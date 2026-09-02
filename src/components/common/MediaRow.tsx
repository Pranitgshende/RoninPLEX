import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie, TVShow, MediaItem } from '../../types/tmdb';
import { ScoredMediaItem } from '../../types/recommendation';
import { MovieCard } from './MovieCard';
import { SkeletonCard } from './SkeletonCard';
import { ScrambleText } from '../../animation/components/ScrambleText';
import { useAppLifecycle } from '../../context/AppLifecycleContext';

interface MediaRowProps {
  title: string;
  subtitle?: string;
  items: (Movie | TVShow | MediaItem | ScoredMediaItem)[];
  isLoading?: boolean;
  viewAllLink?: string;
  mediaType?: 'movie' | 'tv';
  badge?: string;
  index?: number;
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  subtitle,
  items,
  isLoading = false,
  viewAllLink,
  mediaType,
  badge,
  index = 0,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const { isIntroComplete } = useAppLifecycle();

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-6 space-y-3.5 relative group/row">
      {/* Row Header */}
      <div className="flex items-end justify-between px-4 sm:px-8 md:px-12">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
              <ScrambleText text={title} autoStart={isIntroComplete} />
            </h2>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-xs sm:text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
          >
            <span>Explore all</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-brand-600/90 text-white backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl focus:opacity-100 disabled:hidden"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          ref={rowRef}
          className="flex items-stretch gap-3.5 sm:gap-4.5 overflow-x-auto no-scrollbar px-4 sm:px-8 md:px-12 py-2"
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex-shrink-0 w-36 sm:w-44 md:w-52">
                <SkeletonCard />
              </div>
            ))
          ) : items.length > 0 ? (
            items.map((item) => (
              <div key={`${item.id}-${mediaType || ''}`} className="flex-shrink-0 w-36 sm:w-44 md:w-52">
                <MovieCard item={item} mediaType={mediaType} />
              </div>
            ))
          ) : (
            <div className="w-full py-8 text-center text-slate-500 text-sm">
              No titles found in this category.
            </div>
          )}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-brand-600/90 text-white backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl focus:opacity-100 disabled:hidden"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
};
