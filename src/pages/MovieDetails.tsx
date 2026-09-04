import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGoBack } from '../hooks/useGoBack';
import { Play, Bookmark, BookmarkCheck, Check, ThumbsUp, ThumbsDown, Clock, Calendar, Film, ChevronLeft, PlayCircle, MonitorPlay, Download, ExternalLink } from 'lucide-react';
import { tmdb, WatchProvidersData } from '../services/tmdb';
import { Movie } from '../types/tmdb';
import { RatingBadge } from '../components/common/RatingBadge';
import { TrailerModal } from '../components/common/TrailerModal';
import { MediaRow } from '../components/common/MediaRow';
import { AmbientTrailerHero } from '../components/common/AmbientTrailerHero';
import { getBackdropUrl, getPosterUrl, getProfileUrl, extractBestTrailerKey } from '../utils/helpers';
import { formatRuntime, formatDate, formatCurrency, formatYear } from '../utils/formatting';
import { useUser } from '../context/UserContext';
import { streamingManager } from '../services/streaming/StreamingManager';
import { ScrambleText } from '../animation/components/ScrambleText';
import { DownloadResolver } from '../services/download/DownloadResolver';
import { downloadService } from '../services/download/downloadService';
import { DownloadCenterModal } from '../components/downloads/DownloadCenterModal';
import { invoke } from '@tauri-apps/api/core';

export const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const movieId = id ? parseInt(id, 10) : null;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState<boolean>(false);
  const [isStreamAvailable, setIsStreamAvailable] = useState<boolean>(false);
  const [isDownloadCenterOpen, setIsDownloadCenterOpen] = useState<boolean>(false);
  const [isResolvingDownload, setIsResolvingDownload] = useState<boolean>(false);
  const [downloadNotice, setDownloadNotice] = useState<{ message: string; browserUrl?: string } | null>(null);
  const [watchProviders, setWatchProviders] = useState<WatchProvidersData | null>(null);

  const openSafeUrl = async (url?: string) => {
    if (!url) return;
    try {
      await invoke('open_in_browser', { url });
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const { isInWatchlist, toggleWatchlist, isWatched, toggleWatched, toggleLike, toggleDislike, watched } = useUser();
  useAppReadyWhen(!isLoading);


  useEffect(() => {
    if (!movieId) return;

    let isMounted = true;
    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    Promise.all([
      tmdb.getMovieDetails(movieId),
      streamingManager.checkAvailability(movieId, 'movie'),
      tmdb.getWatchProviders('movie', movieId),
    ]).then(([data, avail, wp]) => {
      if (isMounted) {
        setMovie(data);
        setIsStreamAvailable(avail);
        setWatchProviders(wp);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading film details...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20 px-4">
        <div className="text-center space-y-4 max-w-md">
          <Film className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Movie Not Found</h2>
          <p className="text-xs text-slate-400">
            We couldn't retrieve the details for this movie. It may have been removed or TMDB is temporarily unavailable.
          </p>
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    );
  }

  const trailerKey = extractBestTrailerKey(movie.videos?.results);
  const inWatchlist = isInWatchlist(movie.id, 'movie');
  const isWatchedItem = isWatched(movie.id, 'movie');
  const watchedRecord = watched.find(w => w.id === movie.id && w.mediaType === 'movie');
  const isLiked = watchedRecord?.userLiked ?? false;
  const isDisliked = watchedRecord?.userDisliked ?? false;

  const director = movie.credits?.crew.find(c => c.job === 'Director');
  const writers = movie.credits?.crew.filter(c => c.department === 'Writing').slice(0, 2);
  const cast = movie.credits?.cast.slice(0, 10) || [];
  const similarMovies = movie.similar?.results || [];
  const recommendedMovies = movie.recommendations?.results || [];

  const handleWatchlistClick = () => {
    toggleWatchlist({
      id: movie.id,
      mediaType: 'movie',
      title: movie.title,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      rating: movie.vote_average,
      releaseYear: formatYear(movie.release_date),
      genres: movie.genres?.map(g => g.name) || [],
      addedAt: new Date().toISOString(),
    });
  };

  const handleWatchedClick = () => {
    toggleWatched({
      id: movie.id,
      mediaType: 'movie',
      title: movie.title,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      rating: movie.vote_average,
      releaseYear: formatYear(movie.release_date),
      genres: movie.genres?.map(g => g.name) || [],
      watchedAt: new Date().toISOString(),
    });
  };

  const handleDownload = async () => {
    if (!movie) return;
    setIsResolvingDownload(true);
    setDownloadNotice(null);
    try {
      const targetUrl = DownloadResolver.getRiveDownloadUrl('movie', movie.id);
      const res = await DownloadResolver.resolveDownload(targetUrl, movie.title, 'movie');
      if (res.status === 'direct_media' && res.directUrl && res.fileName) {
        await downloadService.startDownload({
          title: movie.title,
          media_type: 'movie',
          direct_url: res.directUrl,
          file_name: res.fileName,
          safe_extension: res.extension,
        });
        setIsDownloadCenterOpen(true);
      } else if (res.status === 'requires_browser') {
        setDownloadNotice({
          message: res.message || 'Interactive browser resolution required.',
          browserUrl: res.redirectUrl || targetUrl,
        });
      } else {
        setDownloadNotice({
          message: res.message || 'Download resolution failed.',
        });
      }
    } catch (err: any) {
      setDownloadNotice({
        message: err?.message || 'Download resolution failed.',
      });
    } finally {
      setIsResolvingDownload(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 pb-20">
      <AmbientTrailerHero
        backdropPath={movie.backdrop_path}
        trailerKey={trailerKey}
        title={movie.title}
      >
        <div className="absolute top-24 left-4 sm:left-8 md:left-12 z-20">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </AmbientTrailerHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 -mt-36 sm:-mt-48 relative z-30 space-y-10">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          <div className="w-44 sm:w-60 md:w-72 flex-shrink-0 rounded-2xl overflow-hidden glass-standard aspect-[2/3] mx-auto md:mx-0">
            <img
              src={getPosterUrl(movie.poster_path, 'large')}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-4 text-left">
            <div className="flex flex-wrap items-center gap-2.5">
              <RatingBadge rating={movie.vote_average} size="lg" />
              {movie.release_date && (
                <span className="text-xs text-slate-300 font-semibold px-2.5 py-1 rounded-md glass-subtle flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(movie.release_date)}
                </span>
              )}
              {movie.runtime && (
                <span className="text-xs text-slate-300 font-semibold px-2.5 py-1 rounded-md glass-subtle flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatRuntime(movie.runtime)}
                </span>
              )}
              {isStreamAvailable && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <MonitorPlay className="w-3.5 h-3.5" />
                  <span>Stream Available</span>
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-display tracking-tight leading-tight">
                <ScrambleText text={movie.title} />
              </h1>
              {movie.tagline && (
                <p className="text-sm sm:text-base font-semibold text-brand-300 italic mt-1">
                  "{movie.tagline}"
                </p>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {movie.genres.map(g => (
                  <Link
                    key={g.id}
                    to={`/discover?genre=${g.id}`}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Synopsis</h3>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
                {movie.overview || 'No synopsis provided.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-6 pt-2 text-xs">
              {director && (
                <div>
                  <span className="text-slate-400 font-medium">Director: </span>
                  <span className="text-white font-semibold">{director.name}</span>
                </div>
              )}
              {writers && writers.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium">Screenplay: </span>
                  <span className="text-white font-semibold">{writers.map(w => w.name).join(', ')}</span>
                </div>
              )}
              {movie.budget && movie.budget > 0 ? (
                <div>
                  <span className="text-slate-400 font-medium">Budget: </span>
                  <span className="text-white font-semibold">{formatCurrency(movie.budget)}</span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              {/* WATCH NOW BUTTON */}
              <button
                type="button"
                onClick={() => navigate(`/watch/movie/${movie.id}`)}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] focus-ring"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>WATCH NOW</span>
              </button>

              {trailerKey && (
                <button
                  type="button"
                  onClick={() => setIsTrailerModalOpen(true)}
                  className="px-5 py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-xs border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 active:scale-95 focus-ring"
                >
                  <PlayCircle className="w-4 h-4 text-brand-400" />
                  <span>Watch Trailer</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleWatchlistClick}
                className={`px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border flex items-center gap-2 active:scale-95 focus-ring ${
                  inWatchlist
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 hover:bg-brand-500/30'
                    : 'bg-white/[0.08] hover:bg-white/[0.14] text-white border-white/10 hover:border-white/20'
                }`}
              >
                {inWatchlist ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-brand-400 fill-current" />
                    <span>In Watchlist</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 text-slate-300" />
                    <span>Add to Watchlist</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleWatchedClick}
                className={`px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border flex items-center gap-2 active:scale-95 focus-ring ${
                  isWatchedItem
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                    : 'bg-white/[0.08] hover:bg-white/[0.14] text-white border-white/10 hover:border-white/20'
                }`}
              >
                <Check className={`w-4 h-4 ${isWatchedItem ? 'text-emerald-400 font-bold' : 'text-slate-300'}`} />
                <span>{isWatchedItem ? 'Watched' : 'Mark Watched'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isResolvingDownload}
                className="px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border bg-white/[0.08] hover:bg-white/[0.14] text-white border-white/10 hover:border-white/20 flex items-center gap-2 active:scale-95 focus-ring disabled:opacity-50"
                title="Download Movie"
              >
                <Download className={`w-4 h-4 text-brand-400 ${isResolvingDownload ? 'animate-bounce' : ''}`} />
                <span>{isResolvingDownload ? 'Resolving...' : 'Download'}</span>
              </button>

              <div className="flex items-center gap-1 bg-surface-100/60 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => toggleLike(movie.id, 'movie', {
                    title: movie.title,
                    posterPath: movie.poster_path,
                    backdropPath: movie.backdrop_path,
                    rating: movie.vote_average,
                    releaseYear: formatYear(movie.release_date),
                  })}
                  className={`p-2 rounded-lg transition-all active:scale-95 focus-ring ${
                    isLiked
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={isLiked ? 'Liked' : 'Like'}
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-400' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleDislike(movie.id, 'movie')}
                  className={`p-2 rounded-lg transition-all active:scale-95 focus-ring ${
                    isDisliked
                      ? 'bg-slate-700 text-slate-300'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={isDisliked ? 'Disliked' : 'Dislike'}
                >
                  <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Where to Watch / Legal Streaming Options */}
        {watchProviders && (watchProviders.flatrate?.length || watchProviders.rent?.length || watchProviders.buy?.length) && (
          <div className="p-4 sm:p-5 rounded-2xl glass-subtle border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-brand-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
                  Where to Watch • Legal Streaming & Purchase
                </h3>
              </div>
              {watchProviders.link && (
                <button
                  type="button"
                  onClick={() => openSafeUrl(watchProviders.link)}
                  className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                >
                  <span>Provided by JustWatch / TMDB</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs">
              {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Stream</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {watchProviders.flatrate.map((provider) => (
                      <div
                        key={provider.provider_id}
                        onClick={() => openSafeUrl(watchProviders.link)}
                        className="group relative cursor-pointer"
                        title={provider.provider_name}
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="w-8 h-8 rounded-lg shadow-md border border-white/10 group-hover:scale-110 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {watchProviders.rent && watchProviders.rent.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Rent</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {watchProviders.rent.slice(0, 6).map((provider) => (
                      <div
                        key={provider.provider_id}
                        onClick={() => openSafeUrl(watchProviders.link)}
                        className="group relative cursor-pointer"
                        title={provider.provider_name}
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="w-8 h-8 rounded-lg shadow-md border border-white/10 group-hover:scale-110 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {watchProviders.buy && watchProviders.buy.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Buy</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {watchProviders.buy.slice(0, 6).map((provider) => (
                      <div
                        key={provider.provider_id}
                        onClick={() => openSafeUrl(watchProviders.link)}
                        className="group relative cursor-pointer"
                        title={provider.provider_name}
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="w-8 h-8 rounded-lg shadow-md border border-white/10 group-hover:scale-110 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {cast.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-white/5">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white">Top Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {cast.map(person => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl glass-subtle"
                >
                  <img
                    src={getProfileUrl(person.profile_path, 'medium')}
                    alt={person.name}
                    className="w-12 h-12 rounded-full object-cover bg-surface-300 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">{person.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{person.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {similarMovies.length > 0 && (
          <MediaRow
            title="More Like This"
            subtitle="Movies with similar themes and storytelling"
            items={similarMovies}
            mediaType="movie"
          />
        )}

        {recommendedMovies.length > 0 && (
          <MediaRow
            title="You Might Also Enjoy"
            subtitle="Recommended based on audience overlap"
            items={recommendedMovies}
            mediaType="movie"
          />
        )}
      </div>

      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
        trailerKey={trailerKey}
        title={movie.title}
      />

      {/* Download Resolution Notice Modal */}
      {downloadNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-surface-100/95 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-brand-400" />
              <span>Download Resolution Notice</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">{downloadNotice.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              {downloadNotice.browserUrl && (
                <button
                  onClick={async () => {
                    try {
                      await invoke('open_in_browser', { url: downloadNotice.browserUrl });
                    } catch {}
                    setDownloadNotice(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>Open in Browser</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setDownloadNotice(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Center Modal */}
      <DownloadCenterModal
        isOpen={isDownloadCenterOpen}
        onClose={() => setIsDownloadCenterOpen(false)}
      />
    </div>
  );
};
