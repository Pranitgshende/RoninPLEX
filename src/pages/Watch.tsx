import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Settings as SettingsIcon, ChevronLeft, AlertCircle, Film, Tv, PlayCircle, X, Layers } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { Movie, TVShow, Season, Episode } from '../types/tmdb';
import { streamingManager } from '../services/streaming/StreamingManager';
import { StreamingResult } from '../services/streaming/types';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { TrailerModal } from '../components/common/TrailerModal';
import { extractBestTrailerKey, getStillUrl, getPosterUrl, getBackdropUrl } from '../utils/helpers';
import { formatRuntime } from '../utils/formatting';

export const Watch: React.FC = () => {
  const { id, season: seasonParam, episode: episodeParam } = useParams<{
    id: string;
    season?: string;
    episode?: string;
  }>();
  const navigate = useNavigate();

  const mediaId = id ? parseInt(id, 10) : 0;
  const isTV = Boolean(seasonParam !== undefined && episodeParam !== undefined);
  const seasonNumber = seasonParam ? parseInt(seasonParam, 10) : 1;
  const episodeNumber = episodeParam ? parseInt(episodeParam, 10) : 1;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [tvShow, setTvShow] = useState<TVShow | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [streamResult, setStreamResult] = useState<StreamingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [isEpisodeDrawerOpen, setIsEpisodeDrawerOpen] = useState(false);

  useEffect(() => {
    if (!mediaId) return;

    let isMounted = true;
    setIsLoading(true);

    const loadContent = async () => {
      try {
        if (!isTV) {
          // Load Movie
          const [movieData, streamData] = await Promise.all([
            tmdb.getMovieDetails(mediaId),
            streamingManager.getMovie(mediaId),
          ]);

          if (!isMounted) return;
          setMovie(movieData);
          if (streamData?.stream && streamData.available) {
            setStreamResult(streamData.stream);
          } else {
            setStreamResult(null);
          }
        } else {
          // Load TV Show & Episode
          const [tvData, seasonData, epStream] = await Promise.all([
            tmdb.getTVDetails(mediaId),
            tmdb.getTVSeason(mediaId, seasonNumber),
            streamingManager.getTVEpisode(mediaId, seasonNumber, episodeNumber),
          ]);

          if (!isMounted) return;
          setTvShow(tvData);
          setCurrentSeason(seasonData);

          const ep = seasonData?.episodes?.find(e => e.episode_number === episodeNumber) || null;
          setCurrentEpisode(ep);

          if (epStream?.stream && epStream.available) {
            setStreamResult(epStream.stream);
          } else {
            setStreamResult(null);
          }
        }
      } catch (err) {
        console.error('Failed to load stream or metadata:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [mediaId, isTV, seasonNumber, episodeNumber]);

  const handleNextEpisode = () => {
    if (!currentSeason) return;
    const nextEpNum = episodeNumber + 1;
    const hasNextInSeason = currentSeason.episodes?.some(e => e.episode_number === nextEpNum) ?? false;

    if (hasNextInSeason) {
      navigate(`/watch/tv/${mediaId}/${seasonNumber}/${nextEpNum}`);
    } else if (tvShow?.seasons && tvShow.seasons.some(s => s.season_number === seasonNumber + 1)) {
      // Jump to episode 1 of next season
      navigate(`/watch/tv/${mediaId}/${seasonNumber + 1}/1`);
    }
  };

  const hasNextEpisode = Boolean(
    currentSeason &&
    (currentSeason.episodes?.some(e => e.episode_number === episodeNumber + 1) ||
     (tvShow?.seasons && tvShow.seasons.some(s => s.season_number === seasonNumber + 1)))
  );

  const trailerKey = isTV
    ? extractBestTrailerKey(tvShow?.videos?.results)
    : extractBestTrailerKey(movie?.videos?.results);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Resolving authorized stream...</p>
      </div>
    );
  }

  // Stream is available: Render VideoPlayer
  if (streamResult && streamResult.url) {
    return (
      <div className="relative w-full h-screen bg-black">
        <VideoPlayer
          stream={streamResult}
          title={isTV ? (tvShow?.name || 'TV Series') : (movie?.title || 'Movie')}
          mediaType={isTV ? 'tv' : 'movie'}
          mediaId={mediaId}
          seasonNumber={isTV ? seasonNumber : undefined}
          episodeNumber={isTV ? episodeNumber : undefined}
          episodeTitle={currentEpisode?.name}
          posterPath={isTV ? tvShow?.poster_path : movie?.poster_path}
          backdropPath={isTV ? tvShow?.backdrop_path : movie?.backdrop_path}
          onBack={() => navigate(isTV ? `/tv/${mediaId}` : `/movie/${mediaId}`)}
          onNextEpisode={handleNextEpisode}
          hasNextEpisode={hasNextEpisode}
          onOpenEpisodeDrawer={() => setIsEpisodeDrawerOpen(true)}
        />

        {/* TV Episode Selector Drawer Overlay */}
        {isTV && isEpisodeDrawerOpen && currentSeason && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fade-in">
            <div className="w-full max-w-md h-full bg-surface-200 border-l border-white/10 p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white font-display">{tvShow?.name}</h3>
                  <p className="text-xs text-slate-400">Season {seasonNumber} Episodes</p>
                </div>
                <button
                  onClick={() => setIsEpisodeDrawerOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 flex-1">
                {(currentSeason.episodes || []).map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setIsEpisodeDrawerOpen(false);
                      navigate(`/watch/tv/${mediaId}/${seasonNumber}/${ep.episode_number}`);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                      ep.episode_number === episodeNumber
                        ? 'bg-brand-600/20 border-brand-500/50 text-white'
                        : 'bg-surface-100/60 border-white/5 text-slate-300 hover:bg-surface-100'
                    }`}
                  >
                    <div className="w-20 aspect-video rounded bg-surface-300 overflow-hidden flex-shrink-0 relative">
                      <img
                        src={getStillUrl(ep.still_path, 'small')}
                        alt={ep.name}
                        className="w-full h-full object-cover"
                      />
                      {ep.episode_number === episodeNumber && (
                        <div className="absolute inset-0 bg-brand-600/40 flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate">
                        {ep.episode_number}. {ep.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ep.runtime ? formatRuntime(ep.runtime) : 'Episode'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Stream Unavailable on Provider State
  const title = isTV ? (tvShow?.name || 'TV Series') : (movie?.title || 'Movie');
  const backdrop = isTV ? tvShow?.backdrop_path : movie?.backdrop_path;
  const poster = isTV ? tvShow?.poster_path : movie?.poster_path;

  return (
    <div className="relative w-full min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background Poster Blur */}
      {backdrop && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-2xl"
          style={{ backgroundImage: `url(${getBackdropUrl(backdrop, 'large')})` }}
        />
      )}

      <div className="relative z-10 max-w-lg w-full bg-surface-200/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
            Stream Unavailable
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            "{title}" {isTV && `(S${seasonNumber} E${episodeNumber})`} is not currently available from your active streaming provider (<strong>{streamingManager.getActiveProviderName()}</strong>).
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-100/80 border border-white/5 text-left text-xs text-slate-400 space-y-1.5">
          <div className="font-semibold text-slate-200">How to resolve:</div>
          <ul className="list-disc list-inside space-y-1 text-[11px]">
            <li>Configure a custom streaming API in <strong>Settings &rarr; Streaming Provider</strong>.</li>
            <li>Switch to the <strong>Demo Provider</strong> to test video playback with sample streams.</li>
            <li>Watch the official trailer on YouTube right now below.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {trailerKey && (
            <button
              onClick={() => setIsTrailerModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Watch Trailer</span>
            </button>
          )}

          <Link
            to="/settings"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 flex items-center justify-center gap-2 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Open Settings</span>
          </Link>

          <button
            onClick={() => navigate(isTV ? `/tv/${mediaId}` : `/movie/${mediaId}`)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 text-xs font-medium border border-white/5 flex items-center justify-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Details</span>
          </button>
        </div>
      </div>

      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
        trailerKey={trailerKey}
        title={title}
      />
    </div>
  );
};
