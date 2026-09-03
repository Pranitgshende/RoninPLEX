import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGoBack } from '../hooks/useGoBack';
import { Play, Bookmark, BookmarkCheck, Check, ThumbsUp, ThumbsDown, Clock, Calendar, Film, ChevronLeft, PlayCircle, MonitorPlay } from 'lucide-react';
import { tmdb } from '../services/tmdb';
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

export const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const movieId = id ? parseInt(id, 10) : null;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState<boolean>(false);
  const [isStreamAvailable, setIsStreamAvailable] = useState<boolean>(false);

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
    ]).then(([data, avail]) => {
      if (isMounted) {
        setMovie(data);
        setIsStreamAvailable(avail);
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
                onClick={() => navigate(`/watch/movie/${movie.id}`)}
                className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>WATCH NOW</span>
              </button>

              {trailerKey && (
                <button
                  onClick={() => setIsTrailerModalOpen(true)}
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition-colors flex items-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Watch Trailer</span>
                </button>
              )}

              <button
                onClick={handleWatchlistClick}
                className={`px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors border flex items-center gap-2 ${
                  inWatchlist
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/50'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                {inWatchlist ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-brand-400 fill-current" />
                    <span>In Watchlist</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Add to Watchlist</span>
                  </>
                )}
              </button>

              <button
                onClick={handleWatchedClick}
                className={`px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors border flex items-center gap-2 ${
                  isWatchedItem
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                <Check className={`w-4 h-4 ${isWatchedItem ? 'text-emerald-400 font-bold' : ''}`} />
                <span>{isWatchedItem ? 'Watched' : 'Mark Watched'}</span>
              </button>

              <div className="flex items-center gap-1 bg-surface-100 p-1.5 rounded-xl border border-white/10">
                <button
                  onClick={() => toggleLike(movie.id, 'movie', {
                    title: movie.title,
                    posterPath: movie.poster_path,
                    backdropPath: movie.backdrop_path,
                    rating: movie.vote_average,
                    releaseYear: formatYear(movie.release_date),
                  })}
                  className={`p-2 rounded-lg transition-colors ${
                    isLiked ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Thumbs Up"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleDislike(movie.id, 'movie', {
                    title: movie.title,
                    posterPath: movie.poster_path,
                    backdropPath: movie.backdrop_path,
                    rating: movie.vote_average,
                    releaseYear: formatYear(movie.release_date),
                  })}
                  className={`p-2 rounded-lg transition-colors ${
                    isDisliked ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Thumbs Down"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

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
    </div>
  );
};
