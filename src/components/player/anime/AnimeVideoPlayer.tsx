import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  FastForward,
  Layers,
  Settings,
  Subtitles,
  AlertCircle,
  RefreshCw,
  X,
  Search,
} from 'lucide-react';
import { AnimeItem, AnimeEpisode, AnimeStreamSource, ContentLanguage } from '../../../services/anime/AnimeTypes';
import { usePlaybackSession } from '../usePlaybackSession';
import { AnimeSubtitleManager } from './AnimeSubtitleManager';
import { AnimeEpisodeController } from './AnimeEpisodeController';
import { useUser } from '../../../context/UserContext';
import { storage } from '../../../services/storage';

interface AnimeVideoPlayerProps {
  anime: AnimeItem;
  episodeNumber: number;
  episodes: AnimeEpisode[];
  stream: AnimeStreamSource | null;
  isLoading: boolean;
  onSelectEpisode: (ep: number) => void;
  onSelectRelated?: (mediaId: string) => void;
  onLanguageChange?: (lang: ContentLanguage) => void;
  onBack: () => void;
  onRetry: () => void;
}

export const AnimeVideoPlayer: React.FC<AnimeVideoPlayerProps> = ({
  anime,
  episodeNumber,
  episodes,
  stream,
  isLoading,
  onSelectEpisode,
  onSelectRelated,
  onLanguageChange,
  onBack,
  onRetry,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const {
    getActiveSessionId,
    setSessionState,
    setSessionInterval,
    setSessionTimeout,
    clearSessionInterval,
    clearSessionTimeout,
    disposeCurrentSession
  } = usePlaybackSession(parseInt(anime.id as string, 10) || 0, 'anime', 1, episodeNumber, null, stream?.isHLS ? 'hls' : 'mp4', stream?.sourceUrl || '');

  const { savePlaybackProgress, preferences } = useUser();
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Subtitles & Audio
  const [subtitleManager, setSubtitleManager] = useState<AnimeSubtitleManager>(new AnimeSubtitleManager());
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>('en');
  const [activeLanguage, setActiveLanguage] = useState<ContentLanguage>(stream?.language || ContentLanguage.SUB);
  const [activeQuality, setActiveQuality] = useState<string>(stream?.quality || 'auto');
  const [activeMenu, setActiveMenu] = useState<'none' | 'quality' | 'subtitle' | 'audio'>('none');

  const handleQualityChange = (q: string) => {
    setActiveQuality(q);
    setActiveMenu('none');

    if (hlsRef.current && hlsRef.current.levels && hlsRef.current.levels.length > 0) {
      if (q === 'auto') {
        hlsRef.current.currentLevel = -1;
        return;
      }
      const heightMatch = q.match(/(\d+)p/i);
      if (heightMatch) {
        const targetHeight = parseInt(heightMatch[1], 10);
        const levelIndex = hlsRef.current.levels.findIndex(l => l.height === targetHeight);
        if (levelIndex !== -1) {
          hlsRef.current.currentLevel = levelIndex;
        }
      }
    }
  };


  // Episode chunking & search for 1100+ episodes
  const [chunkIndex, setChunkIndex] = useState(0);
  const [episodeSearch, setEpisodeSearch] = useState('');
  const CHUNK_SIZE = 100;

  const totalEpCount = anime.episodeCount || episodes.length || 12;
  const navState = AnimeEpisodeController.getNavigationState(episodeNumber, episodes, totalEpCount);

  // Auto-hide controls timer
  const controlsTimeoutRef = useRef<any>(null);
  const triggerActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearSessionTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setSessionTimeout(getActiveSessionId(), () => {
      if (isPlaying) {
        setShowControls(false);
        setActiveMenu('none');
      }
    }, 3500);
  };

  // Initialize stream / Hls.js
  useEffect(() => {
    setHasError(false);
    setIsBuffering(false);
    if (autoNextTimerRef.current) {
      clearSessionInterval(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAutoNextCountdown(null);

    const video = videoRef.current;

    if (!isLoading && !stream) {
      setHasError(true);
      return;
    }

    if (!video || !stream) return;

    if (stream.language && stream.language !== activeLanguage) {
      setActiveLanguage(stream.language);
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Initialize subtitles
    const sm = new AnimeSubtitleManager(stream.subtitles || []);
    setSubtitleManager(sm);
    const active = sm.getActiveTrack();
    if (active) {
      setActiveSubtitle(active.language);
    } else {
      setActiveSubtitle('off');
    }

    const progress = storage.getPlaybackProgress(parseInt(anime.id as string, 10) || 0, 'anime', 1, episodeNumber);
    let resumeTime = progress?.currentTime || 0;
    if (resumeTime > 15 && progress && progress.duration - resumeTime > 60) {
      // Valid resume
    } else {
      resumeTime = 0;
    }

    if (stream.isHLS && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(stream.sourceUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (resumeTime > 0) video.currentTime = resumeTime;
        video.play().catch(() => setIsPlaying(false));
      });

      const retryCountRef = { current: 0 };

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCountRef.current < 2) {
                retryCountRef.current += 1;
                hls.startLoad();
              } else {
                setHasError(true);
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              hls.destroy();
              break;
          }
        }
      });
    } else if (stream.sourceUrl) {
      video.src = stream.sourceUrl;
      if (resumeTime > 0) video.currentTime = resumeTime;
      video.play().catch(() => setIsPlaying(false));
    }

    return () => {
      const sessionId = getActiveSessionId();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.removeAttribute('src');
        video.load();
      }
      disposeCurrentSession(sessionId);
    };
  }, [stream, anime.id, episodeNumber, disposeCurrentSession, getActiveSessionId, isLoading]);

  const flushProgress = useCallback((silent = true) => {
    const current = videoRef.current?.currentTime || 0;
    const dur = videoRef.current?.duration || 0;
    if (dur > 0 && current > 15) {
      savePlaybackProgress({
        id: parseInt(anime.id as string, 10) || 0,
        mediaType: 'anime',
        title: anime.title,
        posterPath: anime.poster,
        backdropPath: anime.banner || anime.poster,
        seasonNumber: 1,
        episodeNumber: episodeNumber,
        episodeTitle: `Episode ${episodeNumber}`,
        currentTime: current,
        duration: dur,
        progressPercent: (current / dur) * 100,
        lastWatchedAt: new Date().toISOString()
      }, silent);
    }
  }, [anime.id, anime.title, anime.poster, anime.banner, episodeNumber, savePlaybackProgress]);

  // Periodic progress saving (every 5 seconds)
  useEffect(() => {
    const interval = setSessionInterval(getActiveSessionId(), () => flushProgress(true), 5000);

    return () => {
      if (interval !== null) clearSessionInterval(interval);
      flushProgress(false);
    };
  }, [flushProgress, getActiveSessionId, setSessionInterval, clearSessionInterval]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);

    // Auto next countdown in last 10 seconds
    if (dur > 60 && dur - cur <= 10 && navState.hasNext && !hasStartedAutoNextRef.current && preferences.autoNextEpisode !== false) {
      hasStartedAutoNextRef.current = true;
      startAutoNextCountdown();
    }
  };

  const autoNextTimerRef = useRef<any>(null);
  const hasStartedAutoNextRef = useRef(false);

  useEffect(() => {
    hasStartedAutoNextRef.current = false;
  }, [episodeNumber]);

  const startAutoNextCountdown = () => {
    if (autoNextTimerRef.current) clearSessionInterval(autoNextTimerRef.current);
    let count = 8;
    setAutoNextCountdown(count);
    autoNextTimerRef.current = setSessionInterval(getActiveSessionId(), () => {
      count -= 1;
      if (count <= 0) {
        if (autoNextTimerRef.current) clearSessionInterval(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
        setAutoNextCountdown(null);
        handleNextEpisode();
      } else {
        setAutoNextCountdown(count);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) {
        clearSessionInterval(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
    };
  }, [episodeNumber]);

  const handleNextEpisode = () => {
    const next = AnimeEpisodeController.getNextEpisodeNumber(episodeNumber, totalEpCount);
    if (next) onSelectEpisode(next);
  };

  const handlePrevEpisode = () => {
    const prev = AnimeEpisodeController.getPrevEpisodeNumber(episodeNumber);
    if (prev) onSelectEpisode(prev);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    let safeTime = time;
    if (isNaN(safeTime) || safeTime < 0) safeTime = 0;
    if (duration && safeTime > duration) safeTime = duration;

    videoRef.current.currentTime = safeTime;
    setCurrentTime(safeTime);

    if (duration && safeTime < duration - 10) {
      if (autoNextTimerRef.current) {
        clearSessionInterval(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      setAutoNextCountdown(null);
      hasStartedAutoNextRef.current = false;
    }
  };

  const skipIntro = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += 85;
  };

  const skipOutro = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += 90;
  };

  useEffect(() => {
    let unmounted = false;
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      getCurrentWindow().setFullscreen(true).then(() => {
        if (!unmounted) setIsFullscreen(true);
      }).catch(err => console.warn('Could not enter window fullscreen:', err));
    }).catch(() => {});

    return () => {
      unmounted = true;
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        getCurrentWindow().setFullscreen(false).catch(err => console.warn('Could not exit window fullscreen:', err));
      }).catch(() => {});
    };
  }, []);

  const toggleFullscreen = () => {
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      const win = getCurrentWindow();
      win.isFullscreen().then(isFs => {
        win.setFullscreen(!isFs);
        setIsFullscreen(!isFs);
      }).catch(err => console.warn('Could not toggle fullscreen:', err));
    }).catch(() => {});
  };

  // Subtitles selection effect
  useEffect(() => {
    if (videoRef.current && videoRef.current.textTracks) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (activeSubtitle === track.language) {
          track.mode = 'showing';
        } else {
          track.mode = 'hidden';
        }
      }
    }
  }, [activeSubtitle, subtitleManager]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

      triggerActivity();
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          e.preventDefault();
          handleSeek(currentTime + (preferences.seekAmount || 10));
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSeek(currentTime - (preferences.seekAmount || 10));
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted(!isMuted);
          break;
        case 'n':
          e.preventDefault();
          handleNextEpisode();
          break;
        case 'p':
          e.preventDefault();
          handlePrevEpisode();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Calculate episode chunks for 1100+ episodes
  const totalChunks = Math.ceil(totalEpCount / CHUNK_SIZE);
  const currentChunkEpisodes = React.useMemo(() => {
    const start = chunkIndex * CHUNK_SIZE + 1;
    const end = Math.min((chunkIndex + 1) * CHUNK_SIZE, totalEpCount);
    const list: number[] = [];
    for (let i = start; i <= end; i++) list.push(i);
    return list;
  }, [chunkIndex, totalEpCount]);

  // Set initial chunk to match current episode
  useEffect(() => {
    const initialChunk = Math.floor((episodeNumber - 1) / CHUNK_SIZE);
    setChunkIndex(initialChunk);
  }, [episodeNumber]);

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerActivity}
      className="relative w-full h-screen bg-black overflow-hidden flex flex-col justify-center items-center select-none"
    >
      {/* Video Element or Embed Fallback */}
      {stream?.isHLS || stream?.sourceUrl.endsWith('.mp4') ? (
        <video
          key={stream.sourceUrl}
          ref={videoRef}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          muted={isMuted}
          playsInline
        >
          {subtitleManager.getTracks().map(track => (
            <track
              key={track.language}
              kind="subtitles"
              src={track.url}
              srcLang={track.language}
              label={track.label}
              default={activeSubtitle === track.language}
            />
          ))}
        </video>
      ) : stream?.sourceUrl ? (
        <iframe
          src={stream.sourceUrl}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      ) : null}

      {/* Loading Overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-6 z-40"
          role="status"
          aria-live="polite"
        >
          <div className="relative flex items-center justify-center" aria-hidden="true">
            {/* Outer ring */}
            <div className="absolute w-16 h-16 border-2 border-brand-500/20 rounded-full" />
            {/* Spinning ring */}
            <div className="w-16 h-16 border-2 border-brand-500 border-t-transparent rounded-full motion-safe:animate-spin" />
          </div>
          <p className="text-sm font-semibold text-brand-300 tracking-wider motion-safe:animate-pulse-subtle">
            Wait while we load your stream...
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-4 z-40 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500" />
          <h3 className="text-xl font-bold text-white">Playback Error</h3>
          <p className="text-xs text-slate-400 max-w-md">The selected stream provider failed to deliver the video. You may retry or switch to a secondary source.</p>
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Stream</span>
            </button>
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
            >
              Return to Anime
            </button>
          </div>
        </div>
      )}

      {/* Auto Next Countdown Banner */}
      {autoNextCountdown !== null && (
        <div className="absolute bottom-24 right-8 z-30 p-4 rounded-2xl bg-surface-100/90 border border-rose-500/40 text-white backdrop-blur-md shadow-2xl flex items-center gap-4 animate-fade-in">
          <div>
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Next Episode</p>
            <p className="text-sm font-bold text-white">Starting in {autoNextCountdown}s</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNextEpisode}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Play Now
            </button>
            <button
              onClick={() => {
                if (autoNextTimerRef.current) {
                  clearSessionInterval(autoNextTimerRef.current);
                  autoNextTimerRef.current = null;
                }
                setAutoNextCountdown(null);
              }}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={onBack}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 backdrop-blur-md border border-white/10"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit Player</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
            {anime.title}
          </h2>
          <p className="text-xs text-rose-400 font-semibold mt-0.5">
            Episode {episodeNumber} of {totalEpCount}
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md border border-white/10"
          >
            <Layers className="w-4 h-4 text-rose-400" />
            <span>Episodes</span>
          </button>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Scrubber */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] text-slate-300 font-mono">
            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="flex-1 accent-rose-500 h-1.5 bg-white/20 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] text-slate-300 font-mono">
            {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
          </span>
        </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between relative">
            {/* Left Controls */}
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="p-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg mr-2">
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button onClick={() => handleSeek(currentTime - (preferences.seekAmount || 10))} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white" title={`-${preferences.seekAmount || 10}s`}>
                <RotateCcw className="w-5 h-5" />
              </button>

              <button onClick={() => handleSeek(currentTime + (preferences.seekAmount || 10))} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white mr-2" title={`+${preferences.seekAmount || 10}s`}>
                <RotateCw className="w-5 h-5" />
              </button>

              <button onClick={skipIntro} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10" title="Skip 85s Intro">
                +85s Intro
              </button>

              <button onClick={skipOutro} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 mr-2" title="Skip 90s Outro">
                +90s Outro
              </button>

              <div className="flex items-center gap-2 group relative">
                <button onClick={() => {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  if (videoRef.current) videoRef.current.muted = newMuted;
                }} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0} max={1} step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (videoRef.current) {
                      videoRef.current.volume = v;
                      if (v > 0 && isMuted) {
                        setIsMuted(false);
                        videoRef.current.muted = false;
                      } else if (v === 0 && !isMuted) {
                        setIsMuted(true);
                        videoRef.current.muted = true;
                      }
                    }
                  }}
                  className="w-20 opacity-0 group-hover:opacity-100 transition-opacity accent-rose-500 cursor-pointer h-1.5 bg-white/20 rounded-lg absolute left-12"
                />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3 relative">

              {/* Quality Menu */}
              {stream?.qualities && stream.qualities.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === 'quality' ? 'none' : 'quality')}
                    className={`px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold transition-colors ${activeMenu === 'quality' ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-200'}`}
                  >
                    {activeQuality === 'auto' ? 'Auto' : activeQuality}
                  </button>
                  {activeMenu === 'quality' && (
                    <div className="absolute bottom-full right-0 mb-2 w-32 bg-surface-200 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col py-1">
                      {stream.qualities.map(q => (
                        <button
                          key={q.quality}
                          onClick={() => handleQualityChange(q.quality)}
                          className={`px-4 py-2 text-xs font-semibold text-left transition-colors ${activeQuality === q.quality ? 'bg-rose-600/30 text-rose-300' : 'text-slate-300 hover:bg-surface-300'}`}
                        >
                          {q.quality === 'auto' ? 'Auto' : q.quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Audio Language Menu */}
              {onLanguageChange && (
                (() => {
                  const currentEp = episodes.find(e => {
                    const epNum = typeof e.number === 'string' ? parseInt(e.number, 10) : e.number;
                    return epNum === episodeNumber;
                  });
                  const supportsDub = currentEp?.availableLanguages ? currentEp.availableLanguages.includes(ContentLanguage.DUB) : true;
                  if (!supportsDub && currentEp?.availableLanguages) return null;
                  // Better: Just don't render the Dub button if not supported.
                  return (
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === 'audio' ? 'none' : 'audio')}
                        className={`px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold transition-colors ${activeMenu === 'audio' ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-200'}`}
                      >
                        {activeLanguage === ContentLanguage.SUB ? 'Sub' : 'Dub'}
                      </button>
                      {activeMenu === 'audio' && (
                        <div className="absolute bottom-full right-0 mb-2 w-32 bg-surface-200 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col py-1">
                          <button
                            onClick={() => {
                              flushProgress(true);
                              setActiveLanguage(ContentLanguage.SUB);
                              onLanguageChange(ContentLanguage.SUB);
                              setActiveMenu('none');
                            }}
                            className={`px-4 py-2 text-xs font-semibold text-left transition-colors ${activeLanguage === ContentLanguage.SUB ? 'bg-rose-600/30 text-rose-300' : 'text-slate-300 hover:bg-surface-300'}`}
                          >
                            Sub
                          </button>
                          {supportsDub !== false && (
                            <button
                              onClick={() => {
                                flushProgress(true);
                                setActiveLanguage(ContentLanguage.DUB);
                                onLanguageChange(ContentLanguage.DUB);
                                setActiveMenu('none');
                              }}
                              className={`px-4 py-2 text-xs font-semibold text-left transition-colors ${activeLanguage === ContentLanguage.DUB ? 'bg-rose-600/30 text-rose-300' : 'text-slate-300 hover:bg-surface-300'}`}
                            >
                              Dub
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              {/* Subtitles Menu */}
              {subtitleManager.getTracks().length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === 'subtitle' ? 'none' : 'subtitle')}
                    className={`p-2 rounded-xl transition-colors ${activeMenu === 'subtitle' || activeSubtitle ? 'text-white' : 'text-slate-400 hover:text-white'} ${activeMenu === 'subtitle' ? 'bg-white/20' : 'bg-white/10'}`}
                  >
                    <Subtitles className="w-5 h-5" />
                  </button>
                  {activeMenu === 'subtitle' && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface-200 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col py-1 max-h-64 overflow-y-auto">
                      <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">Captions</div>
                      <button
                        onClick={() => {
                          subtitleManager.setTrack('off');
                          setActiveSubtitle(null);
                          setActiveMenu('none');
                        }}
                        className={`px-4 py-2 text-xs font-semibold text-left transition-colors ${!activeSubtitle ? 'bg-rose-600/30 text-rose-300' : 'text-slate-300 hover:bg-surface-300'}`}
                      >
                        Off
                      </button>
                      {subtitleManager.getTracks().map(t => (
                        <button
                          key={t.language}
                          onClick={() => {
                            subtitleManager.setTrack(t.language);
                            setActiveSubtitle(t.language);
                            setActiveMenu('none');
                          }}
                          className={`px-4 py-2 text-xs font-semibold text-left transition-colors ${activeSubtitle === t.language ? 'bg-rose-600/30 text-rose-300' : 'text-slate-300 hover:bg-surface-300'}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setIsDrawerOpen(true)} className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md border border-white/10">
                <Layers className="w-4 h-4 text-rose-400" />
                <span>Episodes</span>
              </button>

              <button onClick={toggleFullscreen} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
      </div>

      {/* Episode Drawer Modal with Chunked Pagination for 1100+ Episodes */}
      {isDrawerOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-end animate-fade-in">
          <div className="w-full sm:w-96 md:w-[480px] h-full bg-surface-100/95 border-l border-white/10 p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Episodes</h3>
                <p className="text-xs text-rose-400 font-semibold">{totalEpCount} Episodes Total</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Seasons / Related Anime */}
            {anime.relations && anime.relations.filter(r => r.format === 'TV' || r.format === 'TV_SHORT' || r.format === 'MOVIE' || r.format === 'ONA' || r.format === 'OVA').length > 0 && (
              <div className="py-4 border-b border-white/5">
                <select
                  onChange={(e) => {
                    if (e.target.value !== anime.id && onSelectRelated) {
                      onSelectRelated(e.target.value);
                    }
                  }}
                  value={anime.id}
                  className="w-full bg-surface-200 border border-white/10 rounded-lg p-2.5 text-sm text-white font-semibold outline-none focus:border-rose-500"
                >
                  <option value={anime.id}>
                    {anime.title} (Current)
                  </option>
                  {anime.relations
                    .filter(r => r.format === 'TV' || r.format === 'TV_SHORT' || r.format === 'MOVIE' || r.format === 'ONA' || r.format === 'OVA')
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.relationType ? r.relationType.replace(/_/g, ' ') : r.format})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Search & Jump Input */}
            <div className="py-4">
              <input
                type="number"
                min={1}
                max={totalEpCount}
                placeholder={`Jump to episode (1 - ${totalEpCount})...`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt((e.target as HTMLInputElement).value, 10);
                    if (val >= 1 && val <= totalEpCount) {
                      onSelectEpisode(val);
                      setIsDrawerOpen(false);
                    }
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-200 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Chunk Pills (e.g. 1-100, 101-200, ..., 1101+) */}
            {totalChunks > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 border-b border-white/5">
                {Array.from({ length: totalChunks }, (_, i) => {
                  const s = i * CHUNK_SIZE + 1;
                  const e = Math.min((i + 1) * CHUNK_SIZE, totalEpCount);
                  return (
                    <button
                      key={i}
                      onClick={() => setChunkIndex(i)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        chunkIndex === i
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-surface-200 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}–{e}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Episode Grid for Selected Chunk */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2 pr-1">
              {currentChunkEpisodes.map((epNum) => {
                const isCurrent = epNum === episodeNumber;
                return (
                  <button
                    key={epNum}
                    onClick={() => {
                      onSelectEpisode(epNum);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition-all ${
                      isCurrent
                        ? 'bg-rose-600/30 border-rose-500/50 text-white shadow-md'
                        : 'bg-surface-200/60 hover:bg-surface-200 border-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>Episode {epNum}</span>
                    {isCurrent && <span className="text-[10px] text-rose-400 font-bold uppercase">Now Playing</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

