import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Bookmark, BookmarkCheck, Check, ThumbsUp, ThumbsDown, Tv, Calendar, Layers, ChevronLeft, PlayCircle, MonitorPlay } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { TVShow, Season } from '../types/tmdb';
import { RatingBadge } from '../components/common/RatingBadge';
import { TrailerModal } from '../components/common/TrailerModal';
import { MediaRow } from '../components/common/MediaRow';
import { getBackdropUrl, getPosterUrl, getProfileUrl, getStillUrl, extractBestTrailerKey } from '../utils/helpers';
import { formatDate, formatYear, formatRuntime } from '../utils/formatting';
import { useUser } from '../context/UserContext';
import { streamingManager } from '../services/streaming/StreamingManager';

export const TvDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tvId = id ? parseInt(id, 10) : null;

  const [tvShow, setTvShow] = useState<TVShow | null>(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [seasonData, setSeasonData] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingSeason, setIsLoadingSeason] = useState<boolean>(false);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState<boolean>(false);
  const [isStreamAvailable, setIsStreamAvailable] = useState<boolean>(false);

  const { isInWatchlist, toggleWatchlist, isWatched, toggleWatched, toggleLike, toggleDislike, watched } = useUser();
  useAppReadyWhen(!isLoading);


  useEffect(() => {
    if (!tvId) return;

    let isMounted = true;
    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    Promise.all([
      tmdb.getTVDetails(tvId),
      streamingManager.checkAvailability(tvId, 'tv'),
    ]).then(([data, avail]) => {
      if (isMounted) {
        setTvShow(data);
        setIsStreamAvailable(avail);
        setIsLoading(false);
        if (data?.seasons && data.seasons.length > 0) {
          const firstValidSeason = data.seasons.find(s => s.season_number > 0) || data.seasons[0];
          setSelectedSeasonNumber(firstValidSeason.season_number);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [tvId]);

  useEffect(() => {
    if (!tvId || selectedSeasonNumber === undefined) return;

    let isMounted = true;
    setIsLoadingSeason(true);

    tmdb.getTVSeason(tvId, selectedSeasonNumber).then(season => {
      if (isMounted) {
        setSeasonData(season);
        setIsLoadingSeason(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [tvId, selectedSeasonNumber]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading series details...</p>
        </div>
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20 px-4">
        <div className="text-center space-y-4 max-w-md">
          <Tv className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Show Not Found</h2>
          <p className="text-xs text-slate-400">
            We couldn't retrieve the details for this series. It may have been removed or TMDB is temporarily unavailable.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const trailerKey = extractBestTrailerKey(tvShow.videos?.results);
  const inWatchlist = isInWatchlist(tvShow.id, 'tv');
  const isWatchedItem = isWatched(tvShow.id, 'tv');
  const watchedRecord = watched.find(w => w.id === tvShow.id && w.mediaType === 'tv');
  const isLiked = watchedRecord?.userLiked ?? false;
  const isDisliked = watchedRecord?.userDisliked ?? false;

  const creators = tvShow.credits?.crew.filter(c => c.job === 'Creator' || c.job === 'Executive Producer').slice(0, 2) || [];
  const cast = tvShow.credits?.cast.slice(0, 10) || [];
  const similarShows = tvShow.similar?.results || [];

  const handleWatchlistClick = () => {
    toggleWatchlist({
      id: tvShow.id,
      mediaType: 'tv',
      title: tvShow.name,
      posterPath: tvShow.poster_path,
      backdropPath: tvShow.backdrop_path,
      rating: tvShow.vote_average,
      releaseYear: formatYear(tvShow.first_air_date),
      genres: tvShow.genres?.map(g => g.name) || [],
      addedAt: new Date().toISOString(),
    });
  };

  const handleWatchedClick = () => {
    toggleWatched({
      id: tvShow.id,
      mediaType: 'tv',
      title: tvShow.name,
      posterPath: tvShow.poster_path,
      backdropPath: tvShow.backdrop_path,
      rating: tvShow.vote_average,
      releaseYear: formatYear(tvShow.first_air_date),
      genres: tvShow.genres?.map(g => g.name) || [],
      watchedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 pb-20">
      <div className="relative w-full h-[60vh] lg:h-[70vh] overflow-hidden">
        <img
          src={getBackdropUrl(tvShow.backdrop_path, 'original')}
          alt={tvShow.name}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-black/30" />
        <div className="absolute inset-0 bg-hero-side-gradient opacity-80" />

        <div className="absolute top-24 left-4 sm:left-8 md:left-12 z-20">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 -mt-36 sm:-mt-48 relative z-30 space-y-10">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          <div className="w-44 sm:w-60 md:w-72 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-surface-200 aspect-[2/3] mx-auto md:mx-0">
            <img
              src={getPosterUrl(tvShow.poster_path, 'large')}
              alt={tvShow.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-4 text-left">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                TV Series
              </span>
              <RatingBadge rating={tvShow.vote_average} size="lg" />
              {tvShow.number_of_seasons && (
                <span className="text-xs text-slate-300 font-semibold px-2.5 py-1 rounded-md bg-surface-100 border border-white/5 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  {tvShow.number_of_seasons} {tvShow.number_of_seasons === 1 ? 'Season' : 'Seasons'}
                </span>
              )}
              {tvShow.first_air_date && (
                <span className="text-xs text-slate-300 font-semibold px-2.5 py-1 rounded-md bg-surface-100 border border-white/5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(tvShow.first_air_date)}
                </span>
              )}
              {isStreamAvailable && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <MonitorPlay className="w-3.5 h-3.5" />
                  <span>Series Stream Available</span>
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-display tracking-tight leading-tight">
                {tvShow.name}
              </h1>
              {tvShow.tagline && (
                <p className="text-sm sm:text-base font-semibold text-brand-300 italic mt-1">
                  "{tvShow.tagline}"
                </p>
              )}
            </div>

            {tvShow.genres && tvShow.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tvShow.genres.map(g => (
                  <Link
                    key={g.id}
                    to={`/discover?genre=${g.id}&type=tv`}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Overview</h3>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
                {tvShow.overview || 'No synopsis provided.'}
              </p>
            </div>

            {creators.length > 0 && (
              <div className="pt-2 text-xs">
                <span className="text-slate-400 font-medium">Created by: </span>
                <span className="text-white font-semibold">{creators.map(c => c.name).join(', ')}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-4">
              {/* WATCH NOW BUTTON */}
              <button
                onClick={() => navigate(`/watch/tv/${tvShow.id}/${selectedSeasonNumber}/1`)}
                className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>WATCH EPISODE 1</span>
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
                  onClick={() => toggleLike(tvShow.id, 'tv', {
                    title: tvShow.name,
                    posterPath: tvShow.poster_path,
                    backdropPath: tvShow.backdrop_path,
                    rating: tvShow.vote_average,
                    releaseYear: formatYear(tvShow.first_air_date),
                  })}
                  className={`p-2 rounded-lg transition-colors ${
                    isLiked ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Thumbs Up"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleDislike(tvShow.id, 'tv', {
                    title: tvShow.name,
                    posterPath: tvShow.poster_path,
                    backdropPath: tvShow.backdrop_path,
                    rating: tvShow.vote_average,
                    releaseYear: formatYear(tvShow.first_air_date),
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

        {tvShow.seasons && tvShow.seasons.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                  Seasons & Episodes
                </h2>
                <p className="text-xs text-slate-400">Click any episode to stream immediately</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Season:</span>
                <select
                  value={selectedSeasonNumber}
                  onChange={(e) => setSelectedSeasonNumber(parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 rounded-xl bg-surface-100 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-brand-500"
                >
                  {tvShow.seasons.map(s => (
                    <option key={s.id} value={s.season_number}>
                      {s.name || `Season ${s.season_number}`} ({s.episode_count} eps)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingSeason ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading episodes...</div>
            ) : seasonData?.episodes && seasonData.episodes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seasonData.episodes.map(ep => (
                  <div
                    key={ep.id}
                    className="flex flex-col sm:flex-row gap-3.5 p-3.5 rounded-xl bg-surface-100/60 border border-white/5 hover:border-brand-500/40 transition-all group"
                  >
                    <div
                      onClick={() => navigate(`/watch/tv/${tvShow.id}/${selectedSeasonNumber}/${ep.episode_number}`)}
                      className="w-full sm:w-40 aspect-video rounded-lg overflow-hidden bg-surface-300 flex-shrink-0 relative cursor-pointer"
                    >
                      <img
                        src={getStillUrl(ep.still_path, 'medium')}
                        alt={ep.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white">
                        Ep {ep.episode_number}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          onClick={() => navigate(`/watch/tv/${tvShow.id}/${selectedSeasonNumber}/${ep.episode_number}`)}
                          className="text-sm font-semibold text-white truncate cursor-pointer hover:text-brand-300 transition-colors"
                        >
                          {ep.name}
                        </h4>
                        {ep.vote_average > 0 && (
                          <span className="text-[11px] font-bold text-amber-400 flex-shrink-0">
                            ★ {ep.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatDate(ep.air_date)}</span>
                        {ep.runtime && <span>• {formatRuntime(ep.runtime)}</span>}
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {ep.overview || 'No episode description available.'}
                      </p>

                      <div className="pt-1">
                        <button
                          onClick={() => navigate(`/watch/tv/${tvShow.id}/${selectedSeasonNumber}/${ep.episode_number}`)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Watch Episode</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Detailed episode guides for this season are coming soon.
              </div>
            )}
          </div>
        )}

        {cast.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-white/5">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white">Key Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {cast.map(person => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-100/60 border border-white/5"
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

        {similarShows.length > 0 && (
          <MediaRow
            title="Similar TV Shows"
            subtitle="Series with similar themes and audiences"
            items={similarShows}
            mediaType="tv"
          />
        )}
      </div>

      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
        trailerKey={trailerKey}
        title={tvShow.name}
      />
    </div>
  );
};
