import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import React, { useState, useEffect, useRef, useCallback, createContext, useContext, ReactNode } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Settings as SettingsIcon, ChevronLeft, AlertCircle, RefreshCw, PlayCircle, X, Layers, Terminal } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { pipService } from '../services/pip';
import { animeService, ContentLanguage } from '../services/anime/AnimeService';
import { Movie, TVShow, Season, Episode } from '../types/tmdb';
import { streamingManager } from '../services/streaming/StreamingManager';
import { StreamingResult } from '../services/streaming/types';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { AnimeVideoPlayer } from '../components/player/anime/AnimeVideoPlayer';
import { AnimeItem, AnimeEpisode, AnimeStreamSource } from '../services/anime/AnimeTypes';
import { AnimeStreamService } from '../services/anime/AnimeStreamService';
import { PlayerErrorBoundary } from '../components/player/PlayerErrorBoundary';
import { TrailerModal } from '../components/common/TrailerModal';
import { extractBestTrailerKey, getStillUrl, getPosterUrl, getBackdropUrl } from '../utils/helpers';
import { formatRuntime } from '../utils/formatting';
import { logPlayback } from '../utils/logger';




export type PresentationMode = 'FULL' | 'PIP' | 'MINIMIZED' | 'CLOSED';
export type PlaybackType = 'movie' | 'tv' | 'anime' | null;

interface PlaybackContextType {
  // State
  mediaId: number;
  mediaType: PlaybackType;
  seasonNumber?: number;
  episodeNumber?: number;
  
  streamResult: StreamingResult | null;
  animeStreamSource: AnimeStreamSource | null;
  movie: Movie | null;
  tvShow: TVShow | null;
  currentSeason: Season | null;
  currentEpisode: Episode | null;
  animeItem: AnimeItem | null;
  animeEpisodes: AnimeEpisode[];
  
  animeLanguage: ContentLanguage;
  setAnimeLanguage: (lang: ContentLanguage) => void;
  retryCount: number;
  isLoading: boolean;
  
  presentationMode: PresentationMode;
  setPresentationMode: (mode: PresentationMode) => void;
  enterPiP: () => Promise<boolean>;
  restoreSnapshot?: { currentTime: number; isPlaying: boolean } | null;
  clearRestoreSnapshot: () => void;

  // TV Drawer specific state
  isEpisodeDrawerOpen: boolean;
  setIsEpisodeDrawerOpen: (open: boolean) => void;
  drawerSeasonNumber: number;
  setDrawerSeasonNumber: (num: number) => void;
  drawerSeasonEpisodes: Episode[];
  isDrawerLoading: boolean;
  
  // Actions
  play: (id: number, type: PlaybackType, season?: number, episode?: number) => void;
  closePlayer: () => void;
  
  // Provider & Mode Switching State
  activeProviderId: string;
  activeProviderName: string;
  activeModeId: string;
  isResolvingStream: boolean;
  resolvingProviderId: string | null;
  resolutionError: string | null;
  switchProvider: (providerId: string) => Promise<boolean>;
  switchMode: (modeId: string) => Promise<boolean>;

  // Handlers for players
  handlePrevEpisode: () => void;
  hasPrevEpisode: boolean;
  handleNextEpisode: () => void;
  hasNextEpisode: boolean;
  handleTryNextProvider: () => void;
  onSelectEpisode: (epNum: number, seasonNum?: number) => void;
  onSelectRelated: (relatedId: string) => void;
  triggerRetry: () => void;
}

export const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const usePlayback = () => {
  const context = useContext(PlaybackContext);
  if (!context) throw new Error('usePlayback must be used within PlaybackProvider');
  return context;
};

export const PlaybackProvider: React.FC<{children: ReactNode}> = ({ children }) => {

  const navigate = useNavigate();
  const location = useLocation();

  const [mediaId, setMediaId] = useState<number>(0);
  const [mediaType, setMediaType] = useState<PlaybackType>(null);
  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  
  const [presentationMode, setPresentationMode] = useState<PresentationMode>('CLOSED');
  const [restoreSnapshot, setRestoreSnapshot] = useState<{ currentTime: number; isPlaying: boolean } | null>(null);
  const clearRestoreSnapshot = useCallback(() => setRestoreSnapshot(null), []);
  
  const isAnime = mediaType === 'anime';
  const isTV = mediaType === 'tv';


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
  const [isLoading, setIsLoading] = useState(false);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [isEpisodeDrawerOpen, setIsEpisodeDrawerOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // TV Drawer specific state
  const [drawerSeasonNumber, setDrawerSeasonNumber] = useState<number>(seasonNumber);
  const [drawerSeasonEpisodes, setDrawerSeasonEpisodes] = useState<Episode[]>([]);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);

  // Provider & Mode switching state
  const [activeProviderIdState, setActiveProviderIdState] = useState<string>(() => streamingManager.getActiveProviderId());
  const [activeProviderNameState, setActiveProviderNameState] = useState<string>(() => streamingManager.getActiveProviderName());
  const [activeModeIdState, setActiveModeIdState] = useState<string>(() => streamingManager.getProviderMode('rive'));
  const [isResolvingStream, setIsResolvingStream] = useState<boolean>(false);
  const [resolvingProviderId, setResolvingProviderId] = useState<string | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  useAppReadyWhen(!isLoading);


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
    if (!mediaId || !mediaType) return;
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
            AnimeStreamService.resolveEpisodeStream(
              animeData.title,
              episodeNumber,
              animeLanguage,
              String(mediaId),
              retryCount,
              animeData.malId
            )
          ]);
          
          if (currentRequestId !== requestIdRef.current) return;
          
          setAnimeEpisodes(epsData);
          setAnimeStreamSource(streamData);
          if (streamData) {
            setActiveProviderIdState(streamData.providerId || 'vidlink');
            setActiveProviderNameState(streamData.providerId === 'vidlink' ? 'VidLink Pro' : 'Anime SDK (Local Sidecar)');
            setResolutionError(null);
          } else {
            setResolutionError('Anime stream unavailable across all eligible providers');
          }
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
            setActiveProviderIdState(streamData.stream.providerId || 'vidsrc-me');
            setActiveProviderNameState(streamData.stream.providerName || 'VidSrc Me');
            setResolutionError(null);
          } else {
            setStreamResult(null);
            setResolutionError('Content unavailable across all eligible streaming providers');
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
            setActiveProviderIdState(epStream.stream.providerId || 'vidsrc-me');
            setActiveProviderNameState(epStream.stream.providerName || 'VidSrc Me');
            setResolutionError(null);
          } else {
            setStreamResult(null);
            setResolutionError('Episode unavailable across all eligible streaming providers');
          }
        }
      } catch (err: any) {
        if (currentRequestId === requestIdRef.current) {
          logPlayback(`Provider resolution error: ${err?.message || err}`);
          setStreamResult(null);
          setResolutionError(err?.message || 'Stream resolution error');
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


  const play = useCallback((id: number, type: PlaybackType, season?: number, episode?: number) => {
    setMediaId(id);
    setMediaType(type);
    setStreamResult(null);
    setAnimeStreamSource(null);
    setResolutionError(null);
    setFailedProviders([]);
    setIsResolvingStream(false);
    setResolvingProviderId(null);
    setSeasonNumber(season ?? 1);
    setEpisodeNumber(episode ?? 1);
    setPresentationMode('FULL');
  }, []);

  const closePlayer = useCallback(async () => {
    setPresentationMode('CLOSED');
    setMediaId(0);
    setMediaType(null);
    setStreamResult(null);
    setAnimeStreamSource(null);
    setAnimeItem(null);
    setResolutionError(null);
    setIsResolvingStream(false);
    setResolvingProviderId(null);
    await pipService.closePiPWindow();
    try {
      const win = getCurrentWindow();
      await win.show();
      await win.setFocus();
    } catch {}
  }, []);

  const switchProvider = useCallback(async (providerId: string): Promise<boolean> => {
    if (!mediaId) return false;

    logPlayback(`Explicit provider switch requested: ${providerId} (isAnime: ${isAnime})`);
    setIsResolvingStream(true);
    setResolvingProviderId(providerId);
    setResolutionError(null);

    // CRITICAL: Immediately clear streamResult and animeStreamSource to instantly unmount player and prevent audio leakage!
    setStreamResult(null);
    setAnimeStreamSource(null);

    // Increment request ID to cancel any in-flight resolutions
    const currentRequestId = ++requestIdRef.current;

    try {
      streamingManager.setActiveProviderId(providerId);
      setActiveProviderIdState(providerId);
      setActiveProviderNameState(streamingManager.getActiveProviderName());

      if (isAnime) {
        const result = await streamingManager.getStreamFromProvider(
          providerId,
          mediaId,
          'anime',
          1,
          episodeNumber,
          animeItem?.malId,
          animeLanguage === ContentLanguage.DUB ? 'dub' : 'sub',
          animeItem?.title,
          String(mediaId)
        );

        if (currentRequestId !== requestIdRef.current) return false;

        if (result && result.available && result.stream) {
          const s = result.stream;
          const streamUrl = s.url;
          if (!streamUrl) return false;
          setAnimeStreamSource({
            sourceUrl: streamUrl,
            isHLS: s.type === 'hls',
            isEmbed: s.isEmbed ?? s.type === 'embed',
            quality: s.quality || 'Auto HD',
            providerId: s.providerId || providerId,
            language: animeLanguage,
            subtitles: s.subtitles as any,
            subtitlesAvailable: s.subtitlesAvailable ?? false,
            videoAvailable: s.videoAvailable ?? true,
            audioAvailable: s.audioAvailable ?? true,
            qualities: [{ url: streamUrl, quality: s.quality || 'Auto HD', isHLS: s.type === 'hls' }],
          });
          setActiveProviderIdState(s.providerId || providerId);
          setActiveProviderNameState(s.providerName || streamingManager.getActiveProviderName());
          setResolutionError(null);
          return true;
        } else {
          setAnimeStreamSource(null);
          setResolutionError(`Failed to load anime stream from ${streamingManager.getActiveProviderName()}`);
          return false;
        }
      }

      const result = await streamingManager.getStreamFromProvider(
        providerId,
        mediaId,
        isTV ? 'tv' : 'movie',
        seasonNumber,
        episodeNumber
      );

      if (currentRequestId !== requestIdRef.current) return false;

      if (result && result.available && result.stream?.url) {
        setStreamResult(result.stream);
        setActiveProviderIdState(result.stream.providerId || providerId);
        setActiveProviderNameState(result.stream.providerName || streamingManager.getActiveProviderName());
        setResolutionError(null);
        return true;
      } else {
        setStreamResult(null);
        setResolutionError(`Failed to load stream from ${streamingManager.getActiveProviderName()}`);
        return false;
      }
    } catch (err: any) {
      if (currentRequestId === requestIdRef.current) {
        const msg = err?.message || 'Stream resolution failed';
        logPlayback(`Provider switch failed: ${msg}`);
        setResolutionError(msg);
        setStreamResult(null);
        setAnimeStreamSource(null);
      }
      return false;
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsResolvingStream(false);
        setResolvingProviderId(null);
      }
    }
  }, [isAnime, mediaId, isTV, seasonNumber, episodeNumber, animeItem, animeLanguage]);

  const switchMode = useCallback(async (modeId: string): Promise<boolean> => {
    if (isAnime || !mediaId) return false;

    const targetProviderId = activeProviderIdState || 'rive';
    logPlayback(`Explicit mode switch requested: ${modeId} for ${targetProviderId}`);
    setIsResolvingStream(true);
    setResolvingProviderId(targetProviderId);
    setResolutionError(null);

    // CRITICAL: Immediately clear streamResult to instantly unmount iframe and prevent audio leakage!
    setStreamResult(null);

    const currentRequestId = ++requestIdRef.current;

    try {
      streamingManager.setProviderMode(targetProviderId, modeId);
      setActiveModeIdState(modeId);

      const result = await streamingManager.getStreamFromProvider(
        targetProviderId,
        mediaId,
        isTV ? 'tv' : 'movie',
        seasonNumber,
        episodeNumber
      );

      if (currentRequestId !== requestIdRef.current) return false;

      if (result && result.available && result.stream?.url) {
        setStreamResult(result.stream);
        setResolutionError(null);
        return true;
      } else {
        setStreamResult(null);
        setResolutionError(`Failed to load stream with mode "${modeId}"`);
        return false;
      }
    } catch (err: any) {
      if (currentRequestId === requestIdRef.current) {
        const msg = err?.message || 'Mode switch failed';
        logPlayback(`Mode switch failed: ${msg}`);
        setResolutionError(msg);
        setStreamResult(null);
      }
      return false;
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsResolvingStream(false);
        setResolvingProviderId(null);
      }
    }
  }, [isAnime, mediaId, isTV, seasonNumber, episodeNumber, activeProviderIdState]);

  useEffect(() => {
    const unsubscribe = pipService.subscribe(async (msg) => {
      if (msg.type === 'PIP_READY') {
        pipService.provideSnapshot();
      } else if (msg.type === 'COMMAND_CLOSE_PIP') {
        if (msg.payload) {
          setRestoreSnapshot({ currentTime: msg.payload.currentTime, isPlaying: msg.payload.isPlaying });
        }
        setPresentationMode('FULL');
        await pipService.closePiPWindow();
        try {
          const win = getCurrentWindow();
          await win.show();
          await win.setFocus();
        } catch (e) {
          console.warn('[Playback] Error restoring main window on CLOSE_PIP:', e);
        }
      } else if (msg.type === 'COMMAND_STOP') {
        closePlayer();
        await pipService.closePiPWindow();
        try {
          const win = getCurrentWindow();
          await win.show();
          await win.setFocus();
        } catch (e) {
          console.warn('[Playback] Error showing main window on STOP:', e);
        }
      } else if (msg.type === 'COMMAND_EXIT_APP') {
        await pipService.exitApplication();
      } else if (msg.type === 'PIP_DESTROYED') {
        if (msg.payload) {
          setRestoreSnapshot({ currentTime: msg.payload.currentTime, isPlaying: msg.payload.isPlaying });
        }
        setPresentationMode('FULL');
        try {
          const win = getCurrentWindow();
          await win.show();
          await win.setFocus();
        } catch (e) {
          console.warn('[Playback] Error showing main window on PIP_DESTROYED:', e);
        }
      }
    });
    return () => { unsubscribe(); };
  }, [closePlayer]);

  useEffect(() => {
    const win = getCurrentWindow();
    let unlisten: (() => void) | undefined;
    
    win.onCloseRequested(async (event) => {
      let pipWin = null;
      try {
        pipWin = await WebviewWindow.getByLabel('pip-window');
      } catch {}

      if (presentationMode === 'PIP' && pipWin) {
        event.preventDefault();
        await win.hide();
      } else {
        event.preventDefault();
        await pipService.exitApplication();
      }
    }).then(u => { unlisten = u; });
    
    return () => {
      if (unlisten) unlisten();
    };
  }, [presentationMode]);

  const enterPiP = useCallback(async (): Promise<boolean> => {
    // Invariant: Must have active media and stream
    if (!mediaId || (!streamResult && !animeStreamSource)) {
      console.warn('[Playback] Cannot enter PiP: No active media source');
      return false;
    }

    let snapshot = pipService.pullSnapshot();
    if (!snapshot) {
      console.warn('[Playback] Snapshot provider returned null, constructing from PlaybackContext state');
      snapshot = {
        sessionId: `session_${mediaId}_${Date.now()}`,
        sourceGeneration: 1,
        mediaId: mediaId!,
        mediaType: mediaType!,
        seasonNumber,
        episodeNumber,
        currentTime: 0,
        duration: 0,
        isPlaying: true,
        volume: 1,
        muted: false,
        language: 'default',
        streamResult: streamResult || undefined,
        animeStreamSource: animeStreamSource || undefined,
      };
    }

    const success = await pipService.requestEnterPiP(snapshot);
    if (success) {
      setPresentationMode('PIP');
      return true;
    } else {
      console.warn('[Playback] PiP creation failed or timed out, retaining FULL mode');
      setPresentationMode('FULL');
      return false;
    }
  }, [mediaId, streamResult, animeStreamSource]);

  const onSelectEpisode = useCallback((epNum: number, sNum?: number) => {
    if (isAnime) {
      navigate(`/watch/anime/${mediaId}/${epNum}`);
    } else {
      const targetSeason = sNum || seasonNumber;
      navigate(`/watch/tv/${mediaId}/${targetSeason}/${epNum}`);
    }
  }, [isAnime, mediaId, seasonNumber, navigate]);

  const onSelectRelated = (relatedId: string) => {
    navigate(`/watch/anime/${relatedId}/1`);
  };

  const triggerRetry = () => {
    setRetryCount(c => c + 1);
  };

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
        setActiveProviderIdState(nextStream.stream.providerId || 'vidsrc-me');
        setActiveProviderNameState(nextStream.stream.providerName || 'VidSrc Me');
        setResolutionError(null);
      } else {
        setStreamResult(null);
        setResolutionError('All fallback providers failed to deliver a stream');
      }
    } catch (e: any) {
      if (currentRequestId === requestIdRef.current) {
        logPlayback(`Fallback failed: ${e?.message || e}`);
        setStreamResult(null);
        setResolutionError(e?.message || 'Fallback failed');
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

    return (
    <PlaybackContext.Provider value={{
      mediaId, mediaType, seasonNumber, episodeNumber,
      streamResult, animeStreamSource, movie, tvShow, currentSeason, currentEpisode, animeItem, animeEpisodes,
      animeLanguage, setAnimeLanguage, retryCount, isLoading,
      presentationMode, setPresentationMode, enterPiP,
      restoreSnapshot, clearRestoreSnapshot,
      isEpisodeDrawerOpen, setIsEpisodeDrawerOpen,
      drawerSeasonNumber, setDrawerSeasonNumber,
      drawerSeasonEpisodes, isDrawerLoading,
      play, closePlayer,
      activeProviderId: activeProviderIdState,
      activeProviderName: activeProviderNameState,
      activeModeId: activeModeIdState,
      isResolvingStream,
      resolvingProviderId,
      resolutionError,
      switchProvider,
      switchMode,
      handlePrevEpisode, hasPrevEpisode, handleNextEpisode, hasNextEpisode, handleTryNextProvider,
      onSelectEpisode, onSelectRelated, triggerRetry
    }}>
      {children}
    </PlaybackContext.Provider>
  );
}
