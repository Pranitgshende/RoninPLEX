import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Play, Settings as SettingsIcon, ChevronLeft, AlertCircle, RefreshCw, PlayCircle, X, Layers, Terminal } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { animeService, ContentLanguage } from '../services/anime/AnimeService';
import { Movie, TVShow, Season, Episode } from '../types/tmdb';
import { streamingManager } from '../services/streaming/StreamingManager';
import { StreamingResult } from '../services/streaming/types';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { AnimeVideoPlayer } from '../components/player/anime/AnimeVideoPlayer';
import { AnimeItem, AnimeEpisode, AnimeStreamSource } from '../services/anime/AnimeTypes';
import { AnimeStreamService } from '../services/anime/AnimeStreamService';
import { TrailerModal } from '../components/common/TrailerModal';
import { extractBestTrailerKey, getStillUrl, getPosterUrl, getBackdropUrl } from '../utils/helpers';
import { formatRuntime } from '../utils/formatting';
import { logPlayback } from '../utils/logger';

export const Watch: React.FC = () => {
  const { id, season: seasonParam, episode: episodeParam } = useParams<{
    id: string;
    season?: string;
    episode?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  const mediaId = id ? parseInt(id, 10) : 0;
  const isAnime = location.pathname.startsWith('/watch/anime');
  const isTV = Boolean(!isAnime && seasonParam !== undefined && episodeParam !== undefined);
  console.log('WATCH PAGE RENDER:', { pathname: location.pathname, isAnime, isTV, id, seasonParam, episodeParam });
  const seasonNumber = seasonParam ? parseInt(seasonParam, 10) : 1;
  const episodeNumber = episodeParam ? parseInt(episodeParam, 10) : 1;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [tvShow, setTvShow] = useState<TVShow | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [streamResult, setStreamResult] = useState<StreamingResult | null>(null);
  const [animeItem, setAnimeItem] = useState<AnimeItem | null>(null);
  const [animeEpisodes, setAnimeEpisodes] = useState<AnimeEpisode[]>([]);
  const [animeStreamSource, setAnimeStreamSource] = useState<AnimeStreamSource | null>(null);
  const [animeLanguage, setAnimeLanguage] = useState<ContentLanguage>(ContentLanguage.SUB);
  const [failedProviders, setFailedProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [isEpisodeDrawerOpen, setIsEpisodeDrawerOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // TV Drawer specific state
  const [drawerSeasonNumber, setDrawerSeasonNumber] = useState<number>(seasonNumber);
  const [drawerSeasonEpisodes, setDrawerSeasonEpisodes] = useState<Episode[]>([]);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    
    if (isEpisodeDrawerOpen) {
      if (drawerSeasonNumber === seasonNumber && currentSeason) {
        setDrawerSeasonEpisodes(currentSeason.episodes || []);
      } else {
        setIsDrawerLoading(true);
        tmdb.getTVSeason(mediaId!, drawerSeasonNumber).then(season => {
          if (isActive) {
            setDrawerSeasonEpisodes(season?.episodes || []);
            setIsDrawerLoading(false);
          }
        }).catch(() => {
          if (isActive) setIsDrawerLoading(false);
        });
      }
    }
    
    return () => {
      isActive = false;
    };
  }, [isEpisodeDrawerOpen, drawerSeasonNumber, seasonNumber, currentSeason, mediaId]);

  // Sync drawer to current season on load
  useEffect(() => {
    setDrawerSeasonNumber(seasonNumber);
  }, [seasonNumber]);

  // Cancellation token counter to eliminate race conditions on fast route/episode switches
  const requestIdRef = useRef<number>(0);

  // Compute next episode metadata for auto-countdown card
  const nextEpisodeInfo = React.useMemo(() => {
    if (!isTV || !currentSeason) return null;
    const nextEpNum = episodeNumber + 1;
    const nextInSeason = currentSeason.episodes?.find(e => e.episode_number === nextEpNum);
    if (nextInSeason) {
      return {
        seasonNumber,
        episodeNumber: nextEpNum,
        title: nextInSeason.name,
        stillPath: nextInSeason.still_path || null,
      };
    }
    if (tvShow?.seasons && tvShow.seasons.some(s => s.season_number === seasonNumber + 1)) {
      return {
        seasonNumber: seasonNumber + 1,
        episodeNumber: 1,
        title: `Season ${seasonNumber + 1} Episode 1`,
        stillPath: null,
      };
    }
    return null;
  }, [isTV, currentSeason, episodeNumber, seasonNumber, tvShow]);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    
    // Clear failed providers when media changes
    setFailedProviders([]);

    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);

    const loadContent = async () => {
      logPlayback(`User requested playback: id=${mediaId}, isTV=${isTV}`);
      logPlayback(`Media type: ${isAnime ? 'anime' : isTV ? 'tv' : 'movie'}`);
      logPlayback(`Provider resolution started`);
      try {
        if (isAnime) {
          // Load Anime
          logPlayback(`Loading Anime: id=${mediaId}, ep=${episodeNumber}`);
          setAnimeStreamSource(null); // Clear stale stream before resolution
          
          const animeData = await animeService.getDetails(String(mediaId));
          if (currentRequestId !== requestIdRef.current) return;
          if (!animeData) throw new Error('Anime not found');
          
          setAnimeItem(animeData);
          
          const [epsData, streamData] = await Promise.all([
            animeService.getEpisodes(String(mediaId)),
            AnimeStreamService.resolveEpisodeStream(animeData.title, episodeNumber, animeLanguage, String(mediaId))
          ]);
          
          if (currentRequestId !== requestIdRef.current) return;
          
          setAnimeEpisodes(epsData);
          setAnimeStreamSource(streamData);
          logPlayback(`Anime Stream resolved: ${streamData ? 'yes' : 'no'}`);
        } else if (!isTV) {
          // Load Movie: Concurrently request TMDB metadata + multi-provider stream
          const [movieData, streamData] = await Promise.all([
            tmdb.getMovieDetails(mediaId),
            streamingManager.getMovie(mediaId),
          ]);

          if (currentRequestId !== requestIdRef.current) return;

          setMovie(movieData);
          logPlayback(`Title: ${movieData?.title || 'Unknown'}`);
          logPlayback(`Provider resolution completed: available=${Boolean(streamData?.available)}`);
          logPlayback(`Provider selected: ${streamData?.stream?.providerName || 'none'} (${streamData?.stream?.providerId || 'none'})`);
          logPlayback(`Source returned: ${streamData?.stream ? 'yes' : 'no'}`);
          logPlayback(`Source type: ${streamData?.stream?.type || 'none'}`);
          const sanitizeUrl = (url?: string) => url ? url.split('?')[0] + '[REDACTED_QUERY]' : 'none';
          logPlayback(`Source URL: ${sanitizeUrl(streamData?.stream?.url)}`);

          if (streamData?.stream && streamData.available) {
            setStreamResult(streamData.stream);
          } else {
            setStreamResult(null);
          }
        } else {
          // Load TV Show: Concurrently request TV Details, Season data & Episode stream
          const [tvData, seasonData, epStream] = await Promise.all([
            tmdb.getTVDetails(mediaId),
            tmdb.getTVSeason(mediaId, seasonNumber),
            streamingManager.getTVEpisode(mediaId, seasonNumber, episodeNumber),
          ]);

          if (currentRequestId !== requestIdRef.current) return;

          setTvShow(tvData);
          setCurrentSeason(seasonData);

          const ep = seasonData?.episodes?.find(e => e.episode_number === episodeNumber) || null;
          setCurrentEpisode(ep);

          logPlayback(`Title: ${tvData?.name || 'Unknown'} S${seasonNumber}E${episodeNumber}: ${ep?.name || ''}`);
          logPlayback(`Provider resolution completed: available=${Boolean(epStream?.available)}`);
          logPlayback(`Provider selected: ${epStream?.stream?.providerName || 'none'} (${epStream?.stream?.providerId || 'none'})`);
          logPlayback(`Source returned: ${epStream?.stream ? 'yes' : 'no'}`);
          logPlayback(`Source type: ${epStream?.stream?.type || 'none'}`);
          const sanitizeUrl = (url?: string) => url ? url.split('?')[0] + '[REDACTED_QUERY]' : 'none';
          logPlayback(`Source URL: ${sanitizeUrl(epStream?.stream?.url)}`);

          if (epStream?.stream && epStream.available) {
            setStreamResult(epStream.stream);
          } else {
            setStreamResult(null);
          }
        }
      } catch (err: any) {
        if (currentRequestId === requestIdRef.current) {
          logPlayback(`Provider resolution error: ${err?.message || err}`);
          setStreamResult(null);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      // Invalidate on route / param change
      requestIdRef.current++;
    };
  }, [mediaId, isTV, isAnime, seasonNumber, episodeNumber, retryCount, animeLanguage]);

  const handlePrevEpisode = () => {
    if (!currentSeason) return;
    const prevEpNum = episodeNumber - 1;
    const hasPrevInSeason = currentSeason.episodes?.some(e => e.episode_number === prevEpNum) ?? false;

    if (hasPrevInSeason) {
      navigate(isAnime ? `/watch/anime/${mediaId}/${prevEpNum}` : `/watch/tv/${mediaId}/${seasonNumber}/${prevEpNum}`);
    } else if (seasonNumber > 1 && tvShow?.seasons) {
      const prevSeason = tvShow.seasons.find(s => s.season_number === seasonNumber - 1);
      if (prevSeason) {
        navigate(isAnime ? `/watch/anime/${mediaId}/${prevSeason.episode_count || 1}` : `/watch/tv/${mediaId}/${seasonNumber - 1}/${prevSeason.episode_count || 1}`);
      }
    }
  };

  const handleNextEpisode = () => {
    if (!currentSeason) return;
    const nextEpNum = episodeNumber + 1;
    const hasNextInSeason = currentSeason.episodes?.some(e => e.episode_number === nextEpNum) ?? false;

    if (hasNextInSeason) {
      navigate(isAnime ? `/watch/anime/${mediaId}/${nextEpNum}` : `/watch/tv/${mediaId}/${seasonNumber}/${nextEpNum}`);
    } else if (tvShow?.seasons && tvShow.seasons.some(s => s.season_number === seasonNumber + 1)) {
      navigate(isAnime ? `/watch/anime/${mediaId}/1` : `/watch/tv/${mediaId}/${seasonNumber + 1}/1`);
    }
  };

  const hasPrevEpisode = Boolean(
    currentSeason &&
    (currentSeason.episodes?.some(e => e.episode_number === episodeNumber - 1) ||
     (seasonNumber > 1 && tvShow?.seasons?.some(s => s.season_number === seasonNumber - 1)))
  );

  const hasNextEpisode = Boolean(
    currentSeason &&
    (currentSeason.episodes?.some(e => e.episode_number === episodeNumber + 1) ||
     (tvShow?.seasons && tvShow.seasons.some(s => s.season_number === seasonNumber + 1)))
  );


  const handleTryNextProvider = async () => {
    logPlayback(`Fallback requested. Current provider: ${streamResult?.providerId || 'none'}`);
    setIsLoading(true);
    
    // Increment and capture request ID for race condition guarding
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    
    // Add current provider to failed list if it's not already there
    const newFailed = [...failedProviders];
    if (streamResult?.providerId && !newFailed.includes(streamResult.providerId)) {
      newFailed.push(streamResult.providerId);
      setFailedProviders(newFailed);
    }
    
    try {
      const nextStream = await streamingManager.getNextStream(
        mediaId,
        isTV ? 'tv' : 'movie',
        newFailed,
        seasonNumber,
        episodeNumber
      );
      
      if (currentRequestId !== requestIdRef.current) return;
      
      logPlayback(`Next provider: ${nextStream?.stream?.providerName || 'none'} (${nextStream?.stream?.providerId || 'none'})`);
      logPlayback(`Source type: ${nextStream?.stream?.type || 'none'}`);
      const sanitizeUrl = (url?: string) => url ? url.split('?')[0] + '[REDACTED_QUERY]' : 'none';
      logPlayback(`Source URL: ${sanitizeUrl(nextStream?.stream?.url)}`);
      
      if (nextStream?.stream && nextStream.available) {
        setStreamResult(nextStream.stream);
      } else {
        setStreamResult(null);
      }
    } catch (e: any) {
      if (currentRequestId === requestIdRef.current) {
        logPlayback(`Fallback failed: ${e?.message || e}`);
        setStreamResult(null);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const trailerKey = isTV
    ? extractBestTrailerKey(tvShow?.videos?.results)
    : extractBestTrailerKey(movie?.videos?.results);

  // Dedicated Anime Player Architecture
  if (isAnime) {
    return (
      <AnimeVideoPlayer
        anime={
          animeItem || {
            id: String(mediaId),
            title: 'Anime',
            synopsis: '',
            genres: [],
            studios: [],
            status: 'RELEASING',
            episodeCount: 1200,
            poster: '',
            isAdult: false,
          }
        }
        episodeNumber={episodeNumber}
        episodes={animeEpisodes}
        stream={animeStreamSource}
        isLoading={isLoading}
        onSelectEpisode={(epNum) => navigate(`/watch/anime/${mediaId}/${epNum}`)}
        onSelectRelated={(relatedId) => {
          setIsEpisodeDrawerOpen(false);
          navigate(`/watch/anime/${relatedId}/1`);
        }}
        onLanguageChange={(lang) => setAnimeLanguage(lang)}
        onBack={() => navigate(`/anime/${mediaId}`)}
        onRetry={() => setRetryCount((c) => c + 1)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Resolving authorized stream from providers...</p>
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
          onBack={() => navigate(isAnime ? `/anime/${mediaId}` : isTV ? `/tv/${mediaId}` : `/movie/${mediaId}`)}
          onPrevEpisode={handlePrevEpisode}
          hasPrevEpisode={hasPrevEpisode}
          onNextEpisode={handleNextEpisode}
          hasNextEpisode={hasNextEpisode}
          nextEpisodeInfo={nextEpisodeInfo}
          onOpenEpisodeDrawer={() => setIsEpisodeDrawerOpen(true)}
          onTryNextProvider={handleTryNextProvider}
          onPlaybackError={() => handleTryNextProvider()}
        />

        {/* TV Episode Selector Drawer Overlay */}
        {isTV && isEpisodeDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fade-in">
            <div className="w-full max-w-md h-full bg-surface-200 border-l border-white/10 p-6 flex flex-col gap-4 overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-display truncate pr-4">{tvShow?.name}</h3>
                  <button
                    onClick={() => setIsEpisodeDrawerOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Season Selector */}
                {tvShow?.seasons && tvShow.seasons.length > 0 && (
                  <select 
                    value={drawerSeasonNumber}
                    onChange={(e) => setDrawerSeasonNumber(Number(e.target.value))}
                    className="w-full bg-surface-100 border border-white/10 rounded-lg p-2.5 text-sm text-white font-semibold outline-none focus:border-brand-500"
                  >
                    {tvShow.seasons.filter(s => s.season_number > 0).map(s => (
                      <option key={s.id} value={s.season_number}>
                        Season {s.season_number}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {isDrawerLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : drawerSeasonEpisodes.length === 0 ? (
                  <div className="text-center text-slate-400 py-8 text-sm">No episodes found.</div>
                ) : (
                  drawerSeasonEpisodes.map(ep => (
                    <button
                      key={ep.id}
                      onClick={() => {
                        setIsEpisodeDrawerOpen(false);
                        navigate(`/watch/tv/${mediaId}/${drawerSeasonNumber}/${ep.episode_number}`);
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                        ep.episode_number === episodeNumber && drawerSeasonNumber === seasonNumber
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
                ))
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Stream Unavailable on All Providers State
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
            Unable to find a working stream for "{title}" {isTV && `(S${seasonNumber} E${episodeNumber})`} across the configured streaming providers.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-100/80 border border-white/5 text-left text-xs text-slate-400 space-y-1.5">
          <div className="font-semibold text-slate-200">Recommended actions:</div>
          <ul className="list-disc list-inside space-y-1 text-[11px]">
            <li>Click <strong>Retry Stream</strong> to re-attempt the multi-provider fallback chain.</li>
            <li>Switch preferred provider or add custom endpoints in <strong>Settings &rarr; Streaming Provider</strong>.</li>
            <li>Watch the official trailer on YouTube below.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              streamingManager.clearCache();
              setRetryCount(c => c + 1);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Stream</span>
          </button>

          {trailerKey && (
            <button
              onClick={() => setIsTrailerModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Watch Trailer</span>
            </button>
          )}

          <Link
            to="/settings"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 text-xs font-semibold border border-white/5 flex items-center justify-center gap-2 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
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
