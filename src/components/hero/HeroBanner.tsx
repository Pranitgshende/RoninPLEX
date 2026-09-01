import { ScrambleText } from '../../animation/components/ScrambleText';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Info, Bookmark, BookmarkCheck, Volume2, VolumeX, Sparkles, Compass, PlayCircle } from 'lucide-react';
import { Movie, TVShow } from '../../types/tmdb';
import { RatingBadge } from '../common/RatingBadge';
import { AdultBadge } from '../common/AdultBadge';
import { TrailerModal } from '../common/TrailerModal';
import { TonightPicker } from '../decision/TonightPicker';
import { getBackdropUrl, normalizeMedia } from '../../utils/helpers';
import { formatRuntime, formatYear } from '../../utils/formatting';
import { useUser } from '../../context/UserContext';
import { useTrailer } from '../../hooks/useTrailer';

interface HeroBannerProps {
  item: Movie | TVShow;
  recommendationReason?: string;
  poolItems?: (Movie | TVShow)[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  item,
  recommendationReason = 'Top personalized recommendation for tonight',
  poolItems = [],
}) => {
  const navigate = useNavigate();
  const normalized = normalizeMedia(item);
  const { isInWatchlist, toggleWatchlist, preferences } = useUser();
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [isTonightPickerOpen, setIsTonightPickerOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [trailerError, setTrailerError] = useState(false);

  const { trailerKey } = useTrailer(normalized.id, normalized.media_type, item.videos?.results);
  const inWatchlist = isInWatchlist(normalized.id, normalized.media_type);

  const handleWatchlistToggle = () => {
    toggleWatchlist({
      id: normalized.id,
      mediaType: normalized.media_type,
      title: normalized.displayTitle,
      posterPath: normalized.poster_path,
      backdropPath: normalized.backdrop_path,
      rating: normalized.vote_average || 0,
      releaseYear: normalized.displayYear,
      genres: normalized.genres?.map(g => g.name) || [],
      addedAt: new Date().toISOString(),
    });
  };

  const handleWatchNow = () => {
    if (normalized.media_type === 'movie') {
      navigate(`/watch/movie/${normalized.id}`);
    } else {
      navigate(`/watch/tv/${normalized.id}/1/1`);
    }
  };

  const detailsUrl = normalized.media_type === 'movie' ? `/movie/${normalized.id}` : `/tv/${normalized.id}`;
  const runtime = (item as Movie).runtime;

  const showVideoBackground = Boolean(trailerKey && !trailerError && preferences.autoplayTrailer);

  return (
    <>
      <section className="relative w-full min-h-[75vh] lg:min-h-[85vh] flex items-center justify-start overflow-hidden bg-background">
        {/* Background Visual: YouTube Iframe or TMDB Backdrop */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {showVideoBackground ? (
            <div className="hero-video-wrapper">
              <iframe
                id="hero-youtube-iframe"
                src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${
                  isMuted ? 1 : 0
                }&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}&modestbranding=1&enablejsapi=1`}
                title={`${normalized.displayTitle} Trailer Background`}
                className="hero-video-frame pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                onError={() => setTrailerError(true)}
              />
            </div>
          ) : (
            <img
              src={getBackdropUrl(normalized.backdrop_path, 'original')}
              alt={normalized.displayTitle}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000"
            />
          )}

          {/* Cinematic Overlay Scrims */}
          <div className="absolute inset-0 bg-hero-side-gradient z-10" />
          <div className="absolute inset-0 bg-hero-gradient z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/40 z-10" />
        </div>

        {/* Content Container */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 py-20 lg:py-28">
          <div className="max-w-2xl space-y-4 sm:space-y-5">
            {/* Top recommendation / "Decide Tonight" launcher */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>{recommendationReason}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsTonightPickerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 backdrop-blur-md transition-all group"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
                <span>Decide Tonight</span>
              </button>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white font-display tracking-tight leading-tight drop-shadow-2xl">
              <ScrambleText text={normalized.displayTitle} duration={1.2} />
            </h1>

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium text-slate-300">
              {normalized.adult && <AdultBadge size="md" />}
              <RatingBadge rating={normalized.vote_average} size="md" />
              <span>•</span>
              <span>{formatYear(normalized.displayDate)}</span>
              {runtime ? (
                <>
                  <span>•</span>
                  <span>{formatRuntime(runtime)}</span>
                </>
              ) : null}
              {normalized.genres && normalized.genres.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-slate-300">{normalized.genres.slice(0, 3).map(g => g.name).join(', ')}</span>
                </>
              )}
            </div>

            {/* Tagline / Overview */}
            {item.tagline && (
              <p className="text-sm sm:text-base font-semibold text-brand-200 italic">
                "{item.tagline}"
              </p>
            )}
            <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed drop-shadow">
              {normalized.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Primary Watch Now Button */}
              <button
                type="button"
                onClick={handleWatchNow}
                className="px-7 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center gap-2 transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>WATCH NOW</span>
              </button>

              {/* Watch Trailer Button */}
              <button
                type="button"
                onClick={() => setIsTrailerModalOpen(true)}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/10 transition-all flex items-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                <span>WATCH TRAILER</span>
              </button>

              <Link
                to={detailsUrl}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/10 transition-all flex items-center justify-center"
                title="More Information"
              >
                <Info className="w-5 h-5" />
              </Link>

              {/* Add to My List */}
              <button
                type="button"
                onClick={handleWatchlistToggle}
                className={`p-3 rounded-xl backdrop-blur-md border transition-all ${
                  inWatchlist
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/50'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
                title={inWatchlist ? 'Remove from My List' : 'Add to My List'}
                aria-label={inWatchlist ? 'Remove from My List' : 'Add to My List'}
              >
                {inWatchlist ? (
                  <BookmarkCheck className="w-5 h-5 text-brand-400 fill-current" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </button>

              {/* Mute / Unmute Button if video is playing in background */}
              {showVideoBackground && (
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-colors ml-auto sm:ml-0"
                  title={isMuted ? 'Unmute Trailer' : 'Mute Trailer'}
                  aria-label={isMuted ? 'Unmute Trailer' : 'Mute Trailer'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-slate-300" /> : <Volume2 className="w-5 h-5 text-brand-400" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
        trailerKey={trailerKey}
        title={normalized.displayTitle}
      />

      {/* Tonight's Decision Picker Modal */}
      <TonightPicker
        isOpen={isTonightPickerOpen}
        onClose={() => setIsTonightPickerOpen(false)}
        poolItems={poolItems.length > 0 ? poolItems : [item]}
      />
    </>
  );
};
