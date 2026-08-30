import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Bookmark, BookmarkCheck, Check, ThumbsUp, Film, Tv, PlayCircle, Info, Sparkles } from 'lucide-react';
import { Movie, TVShow, MediaItem } from '../../types/tmdb';
import { ScoredMediaItem } from '../../types/recommendation';
import { RatingBadge } from './RatingBadge';
import { AdultBadge } from './AdultBadge';
import { TrailerModal } from './TrailerModal';
import { TrailerPlayer } from '../player/TrailerPlayer';
import { getPosterUrl, getBackdropUrl, normalizeMedia } from '../../utils/helpers';
import { useUser } from '../../context/UserContext';
import { useTrailer } from '../../hooks/useTrailer';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { streamingManager } from '../../services/streaming/StreamingManager';

interface MovieCardProps {
  item: Movie | TVShow | MediaItem | ScoredMediaItem | any;
  mediaType?: 'movie' | 'tv' | 'anime';
  showTypeBadge?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  item,
  mediaType: explicitMediaType,
  showTypeBadge = true,
}) => {
  const navigate = useNavigate();
  const normalized = normalizeMedia(item, explicitMediaType);
  const { isInWatchlist, toggleWatchlist, isWatched, toggleWatched, toggleLike, watched, preferences } = useUser();

  const [isHovered, setIsHovered] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isStreamAvailable, setIsStreamAvailable] = useState<boolean | null>(null);

  const hoverTimeoutRef = useRef<number | null>(null);
  
  // Eagerly preload data when within 400px of viewport
  const { ref: cardRef, hasIntersected } = useIntersectionObserver({ rootMargin: '400px', threshold: 0 });

  const isAnime = explicitMediaType === "anime" || (normalized.media_type as string) === "anime";
  const effectiveType: "movie" | "tv" | "anime" = isAnime ? "anime" : (normalized.media_type as "movie" | "tv");
  const inWatchlist = isInWatchlist(normalized.id, effectiveType);
  const watchedStatus = isWatched(normalized.id, effectiveType);
  const watchedRecord = watched.find(w => w.id === normalized.id && w.mediaType === effectiveType);
  const isLiked = watchedRecord?.userLiked ?? false;

  const initialVideos = ('videos' in item && item.videos) ? item.videos.results : undefined;
  const { trailerKey } = useTrailer(normalized.id, effectiveType, initialVideos, hasIntersected);

  // Check stream availability lazily when card is near viewport
  // Skip for anime — anime streams are resolved by AnimeStreamService, not TMDB providers
  useEffect(() => {
    if (effectiveType === 'anime' || !hasIntersected) return;
    let isMounted = true;
    if (isStreamAvailable === null) {
      streamingManager.checkAvailability(normalized.id, effectiveType).then(avail => {
        if (isMounted) setIsStreamAvailable(avail);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [hasIntersected, normalized.id, effectiveType, isStreamAvailable]);

  // Handle 400ms debounce hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (preferences.enableHoverTrailers !== false && trailerKey) {
      hoverTimeoutRef.current = window.setTimeout(() => {
        setIsPlayingTrailer(true);
      }, 400);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPlayingTrailer(false);
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  // Clean up on unmount or scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isPlayingTrailer) {
        setIsPlayingTrailer(false);
        setIsHovered(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    };
  }, [isPlayingTrailer]);

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist({
      id: normalized.id,
      mediaType: effectiveType,
      title: normalized.displayTitle,
      posterPath: normalized.poster_path,
      backdropPath: normalized.backdrop_path,
      rating: normalized.vote_average || 0,
      releaseYear: normalized.displayYear,
      genres: normalized.genres?.map(g => g.name) || [],
      addedAt: new Date().toISOString(),
    });
  };

  const handleWatchedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatched({
      id: normalized.id,
      mediaType: normalized.media_type,
      title: normalized.displayTitle,
      posterPath: normalized.poster_path,
      backdropPath: normalized.backdrop_path,
      rating: normalized.vote_average || 0,
      releaseYear: normalized.displayYear,
      genres: normalized.genres?.map(g => g.name) || [],
      watchedAt: new Date().toISOString(),
    });
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(normalized.id, normalized.media_type, {
      title: normalized.displayTitle,
      posterPath: normalized.poster_path,
      backdropPath: normalized.backdrop_path,
      rating: normalized.vote_average,
      releaseYear: normalized.displayYear,
    });
  };

  const handleTrailerModalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTrailerModalOpen(true);
  };

  const handleWatchNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((normalized.media_type as string) === 'anime') {
      navigate(`/watch/anime/${normalized.id}/1`);
    } else if (normalized.media_type === 'movie') {
      navigate(`/watch/movie/${normalized.id}`);
    } else {
      navigate(`/watch/tv/${normalized.id}/1/1`);
    }
  };

  const detailsUrl =
    (normalized.media_type as string) === 'anime'
      ? `/anime/${normalized.id}`
      : normalized.media_type === 'movie'
      ? `/movie/${normalized.id}`
      : `/tv/${normalized.id}`;

  return (
    <>
      <div
        ref={cardRef as any}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative rounded-xl glass-card glass-card-hover p-2 flex flex-col h-full"
      >
        <Link to={detailsUrl} className="block aspect-[2/3] relative rounded-lg overflow-hidden bg-surface-300/50 shrink-0">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-surface-200/50 animate-pulse" />
          )}

          {/* If playing hover trailer, show trailer player */}
          {isPlayingTrailer && trailerKey ? (
            <div className="absolute inset-0 z-10">
              <TrailerPlayer
                trailerKey={trailerKey}
                title={normalized.displayTitle}
                fallbackBackdrop={getBackdropUrl(normalized.backdrop_path, 'medium')}
                className="w-full h-full"
              />
            </div>
          ) : (
            <img
              src={getPosterUrl(normalized.poster_path, 'large')}
              alt={normalized.displayTitle}
              loading={hasIntersected ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Type Badge (Top Left) */}
          <div className="absolute top-2 left-2 flex items-center justify-between z-20 pointer-events-none">
            {showTypeBadge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-slate-200 border border-white/10 shadow-md">
                {(normalized.media_type as string) === 'anime' ? (
                  <>
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    Anime
                  </>
                ) : normalized.media_type === 'movie' ? (
                  <>
                    <Film className="w-3 h-3 text-brand-400" />
                    Movie
                  </>
                ) : (
                  <>
                    <Tv className="w-3 h-3 text-cyan-400" />
                    TV
                  </>
                )}
              </span>
            )}
          </div>
          
          {/* Rating/Adult Badges (Top Right) */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 pointer-events-none z-20">
            {(('adult' in item && Boolean((item as any).adult)) || ('adult' in normalized && Boolean((normalized as any).adult))) && (
              <AdultBadge size="sm" />
            )}
            <RatingBadge rating={normalized.vote_average} size="sm" />
          </div>

          {/* Hover Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 flex flex-col justify-end p-3.5 z-20 ${
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 mb-2.5">
              {/* Watch Now Button */}
              <button
                onClick={handleWatchNow}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-transform active:scale-95"
                title="Watch Now"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Watch</span>
              </button>

              {/* Watch Trailer Button */}
              {trailerKey && (
                <button
                  onClick={handleTrailerModalClick}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors"
                  title="Watch Official Trailer"
                >
                  <PlayCircle className="w-4 h-4 text-slate-300" />
                </button>
              )}

              {/* Watchlist Toggle */}
              <button
                onClick={handleWatchlistClick}
                className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
                  inWatchlist
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/50'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
                title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                {inWatchlist ? <BookmarkCheck className="w-4 h-4 text-brand-400 fill-current" /> : <Bookmark className="w-4 h-4" />}
              </button>

              {/* Watched Toggle */}
              <button
                onClick={handleWatchedClick}
                className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
                  watchedStatus
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
                title={watchedStatus ? 'Marked as Watched' : 'Mark as Watched'}
              >
                <Check className={`w-4 h-4 ${watchedStatus ? 'text-emerald-400 font-bold' : ''}`} />
              </button>

              {/* Thumbs Up / Like */}
              <button
                onClick={handleLikeClick}
                className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
                  isLiked
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
                title={isLiked ? 'Liked' : 'Like'}
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked ? 'text-rose-400 fill-current' : ''}`} />
              </button>
            </div>

            {/* Quick Title & Year */}
            <h4 className="text-sm font-semibold text-white line-clamp-1 leading-snug">
              {normalized.displayTitle}
            </h4>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
              <span>{normalized.displayYear || 'TBA'}</span>
              <span className="text-brand-300 font-medium hover:underline inline-flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>Details</span>
              </span>
            </div>
          </div>
        </Link>

        {/* Info Section (outside poster, inside glass card) */}
        <div className="pt-2 px-1 flex-1 flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-slate-100 line-clamp-1 group-hover:text-brand-300 transition-colors drop-shadow-md">
            {normalized.displayTitle}
          </h3>
          <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
            <span>{normalized.displayYear || 'TBA'}</span>
            {normalized.vote_average > 0 && (
              <span className="text-xs font-medium text-brand-200 bg-brand-900/40 px-1.5 py-0.5 rounded border border-brand-500/20">
                ★ {normalized.vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
        trailerKey={trailerKey}
        title={normalized.displayTitle}
      />
    </>
  );
};
