import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Subtitles,
  ChevronLeft,
  SkipForward,
  Layers,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Terminal,
  X
} from 'lucide-react';
import { StreamingResult, SubtitleTrack } from '../../services/streaming/types';
import { useUser } from '../../context/UserContext';
import { formatRuntime } from '../../utils/formatting';

interface VideoPlayerProps {
  stream: StreamingResult;
  title: string;
  mediaType: 'movie' | 'tv';
  mediaId: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  onBack?: () => void;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
  onOpenEpisodeDrawer?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  title,
  mediaType,
  mediaId,
  seasonNumber,
  episodeNumber,
  episodeTitle,
  posterPath,
  backdropPath,
  onBack,
  onNextEpisode,
  hasNextEpisode = false,
  onOpenEpisodeDrawer,
}) => {
  const { savePlaybackProgress } = useUser();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('off');
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isSubtitleMenuOpen, setIsSubtitleMenuOpen] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [resumeNotification, setResumeNotification] = useState<string | null>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Embed specific state
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [showSlowBufferHelp, setShowSlowBufferHelp] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Auto-hide controls handler
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      window.clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
        setIsSpeedMenuOpen(false);
        setIsSubtitleMenuOpen(false);
      }, 3500);
    }
  }, [isPlaying]);

  // Initial resume position from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('roninplex_playback_progress') || localStorage.getItem('cinepulse_playback_progress');
      if (stored) {
        const list = JSON.parse(stored);
        const match = list.find((item: any) => {
          if (item.id !== mediaId || item.mediaType !== mediaType) return false;
          if (mediaType === 'tv') {
            return item.seasonNumber === seasonNumber && item.episodeNumber === episodeNumber;
          }
          return true;
        });

        if (match && match.currentTime > 15 && match.progressPercent < 92) {
          if (videoRef.current) {
            videoRef.current.currentTime = match.currentTime;
          }
          const mins = Math.floor(match.currentTime / 60);
          const secs = Math.floor(match.currentTime % 60);
          setResumeNotification(`Resumed from ${mins}:${secs < 10 ? '0' : ''}${secs}`);
          setTimeout(() => setResumeNotification(null), 5000);
        }
      }
    } catch (e) {
      console.warn('Could not read resume position:', e);
    }
  }, [mediaId, mediaType, seasonNumber, episodeNumber]);

  // HLS.js or native video stream setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream.url || stream.type === 'embed') return;

    setVideoError(null);

    if (stream.type === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(stream.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.error('Fatal HLS error:', data);
            setVideoError('Unable to stream HLS video source.');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        video.src = stream.url;
      } else {
        setVideoError('Your browser does not support HLS streaming.');
      }
    } else {
      // Standard MP4 video
      video.src = stream.url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [stream.url, stream.type]);

  // Reset embed loading state when stream URL changes
  useEffect(() => {
    if (stream.type === 'embed') {
      setIsIframeLoading(true);
      setShowSlowBufferHelp(false);
      const timer = window.setTimeout(() => {
        setShowSlowBufferHelp(true);
      }, 7000);
      return () => window.clearTimeout(timer);
    }
  }, [stream.url, stream.type, iframeKey]);

  // Periodic Continue Watching tracking for embed streams
  useEffect(() => {
    if (stream.type !== 'embed') return;

    let watchedSeconds = 0;
    const interval = window.setInterval(() => {
      watchedSeconds += 5;
      const estDuration = mediaType === 'tv' ? 2700 : 7200;
      const percent = Math.min(Math.round((watchedSeconds / estDuration) * 100), 90);
      savePlaybackProgress({
        id: mediaId,
        mediaType,
        title,
        seasonNumber,
        episodeNumber,
        episodeTitle,
        currentTime: watchedSeconds,
        duration: estDuration,
        progressPercent: percent,
        posterPath: posterPath || null,
        backdropPath: backdropPath || null,
        lastWatchedAt: new Date().toISOString(),
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [stream.type, mediaId, mediaType, title, seasonNumber, episodeNumber, episodeTitle, posterPath, backdropPath, savePlaybackProgress]);

  // Periodic progress saving for native video (every 5 seconds)
  useEffect(() => {
    if (stream.type === 'embed') return;

    const interval = setInterval(() => {
      if (isPlaying && duration > 0 && currentTime > 15) {
        const percent = Math.round((currentTime / duration) * 100);
        savePlaybackProgress({
          id: mediaId,
          mediaType,
          title,
          seasonNumber,
          episodeNumber,
          episodeTitle,
          currentTime,
          duration,
          progressPercent: percent,
          posterPath: posterPath || null,
          backdropPath: backdropPath || null,
          lastWatchedAt: new Date().toISOString(),
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, mediaId, mediaType, title, seasonNumber, episodeNumber, episodeTitle, posterPath, backdropPath, savePlaybackProgress, stream.type]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(e => console.warn('Play interrupted:', e));
      setHasStartedPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const seekRelative = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const targetTime = Math.max(0, Math.min(duration, pos * duration));
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleScrubHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setHoverPosition(Math.max(0, Math.min(duration, pos * duration)));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.warn('Could not enter fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Could not exit fullscreen:', err);
      });
      setIsFullscreen(false);
    }
  };

  const handleRateChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setIsSpeedMenuOpen(false);
  };

  const handleSubtitleChange = (lang: string) => {
    setSelectedSubtitle(lang);
    setIsSubtitleMenuOpen(false);

    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        if (lang === 'off') {
          tracks[i].mode = 'disabled';
        } else {
          tracks[i].mode = tracks[i].language === lang ? 'showing' : 'disabled';
        }
      }
    }
  };

  const handleReloadIframe = () => {
    setIsIframeLoading(true);
    setShowSlowBufferHelp(false);
    setIframeKey(k => k + 1);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle diagnostics with 'D' key
      if (e.key === 'd' || e.key === 'D') {
        setShowDiagnostics(prev => !prev);
        return;
      }

      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
      resetControlsTimer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, isMuted, isPlaying, resetControlsTimer]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Diagnostics Modal Component
  const renderDiagnostics = () => {
    if (!showDiagnostics) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-lg bg-surface-200 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-400" />
              <h3 className="font-bold text-white text-sm">Streaming Diagnostics (GSD)</h3>
            </div>
            <button
              onClick={() => setShowDiagnostics(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex justify-between p-2 rounded bg-surface-100 border border-white/5">
              <span className="text-slate-400">Provider:</span>
              <span className="text-white font-semibold">{stream.providerName || 'VidSrc (vidsrc.to)'}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-100 border border-white/5">
              <span className="text-slate-400">Stream Type:</span>
              <span className="text-brand-400 uppercase font-semibold">{stream.type || 'embed'}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-100 border border-white/5">
              <span className="text-slate-400">Quality:</span>
              <span className="text-white">{stream.quality || 'Auto HD'}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-100 border border-white/5">
              <span className="text-slate-400">Player State:</span>
              <span className={isIframeLoading && stream.type === 'embed' ? 'text-amber-400' : 'text-emerald-400'}>
                {stream.type === 'embed'
                  ? (isIframeLoading ? 'Connecting / Loading IFrame...' : 'IFrame Loaded & Active')
                  : (isPlaying ? 'Playing' : 'Paused / Ready')}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-100 border border-white/5">
              <span className="text-slate-400">Permissions:</span>
              <span className="text-slate-300">accelerometer; autoplay; fullscreen</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-100 border border-white/5">
              <span className="text-slate-400">Referrer Policy:</span>
              <span className="text-slate-300">origin</span>
            </div>
            <div className="p-2 rounded bg-surface-100 border border-white/5 break-all">
              <div className="text-slate-400 mb-1">Stream Endpoint URL:</div>
              <div className="text-cyan-400 font-semibold">{stream.url}</div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            {stream.type === 'embed' && (
              <button
                onClick={handleReloadIframe}
                className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-white/10 text-white font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Stream</span>
              </button>
            )}
            {stream.url && (
              <button
                onClick={() => window.open(stream.url, '_blank')}
                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Browser</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // EMBED PLAYER IMPLEMENTATION
  if (stream.type === 'embed' && stream.url) {
    return (
      <div className="relative w-full h-screen bg-black flex flex-col overflow-hidden select-none">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between gap-3 pointer-events-auto">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/10 shadow-lg transition-colors"
                title="Return to Details"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-base font-bold text-white drop-shadow-md">{title}</h1>
              {episodeTitle && (
                <p className="text-xs text-slate-300">S{seasonNumber} E{episodeNumber}: {episodeTitle}</p>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* TV Episode Selector */}
            {mediaType === 'tv' && onOpenEpisodeDrawer && (
              <button
                onClick={onOpenEpisodeDrawer}
                className="p-2.5 rounded-full bg-black/70 hover:bg-black text-slate-300 hover:text-white border border-white/10 shadow-lg transition-colors"
                title="Select Episode"
              >
                <Layers className="w-4 h-4" />
              </button>
            )}

            {/* Next Episode */}
            {mediaType === 'tv' && hasNextEpisode && onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="p-2.5 rounded-full bg-black/70 hover:bg-black text-brand-400 hover:text-brand-300 border border-white/10 shadow-lg transition-colors"
                title="Play Next Episode"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}

            {/* Diagnostics HUD */}
            <button
              onClick={() => setShowDiagnostics(true)}
              className="p-2.5 rounded-full bg-black/70 hover:bg-black text-slate-300 hover:text-white border border-white/10 shadow-lg transition-colors"
              title="Stream Diagnostics (Press D)"
            >
              <Terminal className="w-4 h-4" />
            </button>

            {/* Reload Stream */}
            <button
              onClick={handleReloadIframe}
              className="p-2.5 rounded-full bg-black/70 hover:bg-black text-slate-300 hover:text-white border border-white/10 shadow-lg transition-colors"
              title="Reload Stream Player"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Open in Window */}
            <button
              onClick={() => window.open(stream.url, '_blank')}
              className="p-2.5 rounded-full bg-black/70 hover:bg-black text-slate-300 hover:text-white border border-white/10 shadow-lg transition-colors"
              title="Open stream in external window"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {isIframeLoading && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20 pointer-events-none animate-fade-in">
            <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white font-display">Connecting to Stream...</h3>
              <p className="text-xs text-slate-400">
                Provider: <span className="text-brand-400">{stream.providerName || 'VidSrc'}</span>
              </p>
            </div>
          </div>
        )}

        {/* Slow Buffer Assistance Banner */}
        {showSlowBufferHelp && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 rounded-2xl bg-surface-100/95 backdrop-blur-md border border-white/10 shadow-2xl flex items-center gap-3 text-xs text-slate-300 animate-slide-up">
            <span>Slow buffer?</span>
            <button
              onClick={handleReloadIframe}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload</span>
            </button>
            <button
              onClick={() => window.open(stream.url, '_blank')}
              className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Window</span>
            </button>
            <button
              onClick={() => setShowSlowBufferHelp(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* The Embed Player Iframe */}
        <iframe
          key={iframeKey}
          src={stream.url}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="origin"
          onLoad={() => {
            setIsIframeLoading(false);
          }}
        />

        {/* Diagnostics Modal */}
        {renderDiagnostics()}
      </div>
    );
  }

  // HTML5 / HLS NATIVE VIDEO PLAYER
  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
      className="relative w-full h-screen bg-black select-none overflow-hidden flex items-center justify-center group font-sans"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            if (videoRef.current.buffered.length > 0) {
              setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
            }
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (onNextEpisode && hasNextEpisode) {
            onNextEpisode();
          }
        }}
        playsInline
        crossOrigin="anonymous"
        onError={() => {
          setVideoError('Unable to load video stream from URL. The stream link may be expired, blocked by CORS, or unreachable.');
        }}
      >
        {stream.subtitles?.map((sub: SubtitleTrack) => (
          <track
            key={sub.language}
            kind="subtitles"
            label={sub.label}
            src={sub.url}
            srcLang={sub.language}
            default={sub.isDefault}
          />
        ))}
      </video>

      {/* Error Overlay */}
      {videoError && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-4 z-40 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500" />
          <h2 className="text-xl font-bold text-white">Playback Error</h2>
          <p className="text-sm text-slate-400 max-w-md">{videoError}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
            >
              Return to Details
            </button>
          )}
        </div>
      )}

      {/* Resume Notification */}
      {resumeNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-surface-100/90 backdrop-blur-md border border-white/10 text-xs font-semibold text-white shadow-2xl flex items-center gap-2 animate-slide-up">
          <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
          <span>{resumeNotification}</span>
        </div>
      )}

      {/* Center Big Play Button when paused */}
      {!isPlaying && hasStartedPlaying && !videoError && (
        <button
          onClick={togglePlay}
          className="absolute z-20 w-20 h-20 rounded-full bg-brand-600/90 hover:bg-brand-500 text-white flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all cursor-pointer"
        >
          <Play className="w-8 h-8 fill-current ml-1" />
        </button>
      )}

      {/* Initial Play Button */}
      {!hasStartedPlaying && !videoError && (
        <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <button
            onClick={togglePlay}
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-brand-600/50 transform hover:scale-105 transition-all cursor-pointer"
          >
            <Play className="w-10 h-10 fill-current ml-1.5" />
          </button>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-white font-display">{title}</h2>
            {episodeTitle && (
              <p className="text-xs text-slate-300 font-medium">S{seasonNumber} E{episodeNumber}: {episodeTitle}</p>
            )}
          </div>
        </div>
      )}

      {/* Top Bar Header */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full bg-surface-100/70 hover:bg-surface-50 text-white transition-colors"
                title="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-base font-bold text-white leading-tight">{title}</h1>
              {episodeTitle && (
                <p className="text-xs text-slate-400">
                  Season {seasonNumber} · Episode {episodeNumber} · {episodeTitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDiagnostics(true)}
              className="p-2 rounded-full bg-surface-100/70 hover:bg-surface-50 text-slate-300 hover:text-white transition-colors"
              title="Stream Diagnostics (Press D)"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30 transition-opacity duration-300 space-y-3 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrub Bar */}
        <div
          onClick={handleScrub}
          onMouseMove={handleScrubHover}
          onMouseLeave={() => setHoverPosition(null)}
          className="relative w-full h-1.5 hover:h-3 bg-white/20 rounded-full cursor-pointer transition-all group/scrub"
        >
          {/* Buffered Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
            style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
          />

          {/* Current Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-brand-500 rounded-full"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover/scrub:scale-100 transition-transform" />
          </div>

          {/* Hover Time Tooltip */}
          {hoverPosition !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-surface-200 text-[10px] font-mono text-white border border-white/10 shadow-lg pointer-events-none"
              style={{ left: `${(hoverPosition / duration) * 100}%` }}
            >
              {formatTime(hoverPosition)}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-brand-400 transition-colors p-1"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={() => seekRelative(-10)}
              className="text-slate-300 hover:text-white transition-colors p-1"
              title="Rewind 10s (Left Arrow)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Forward 10s */}
            <button
              onClick={() => seekRelative(10)}
              className="text-slate-300 hover:text-white transition-colors p-1"
              title="Forward 10s (Right Arrow)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="text-slate-300 hover:text-white transition-colors p-1"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 sm:w-20 accent-brand-500 h-1 bg-white/20 rounded-lg cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Elapsed / Duration */}
            <div className="text-xs font-mono text-slate-300 pl-1">
              <span>{formatTime(currentTime)}</span>
              <span className="text-slate-500 mx-1.5">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 relative">
            {/* TV Show: Next Episode */}
            {mediaType === 'tv' && hasNextEpisode && onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                title="Play Next Episode"
              >
                <SkipForward className="w-4 h-4" />
                <span className="hidden sm:inline">Next Episode</span>
              </button>
            )}

            {/* TV Show: Episode Drawer */}
            {mediaType === 'tv' && onOpenEpisodeDrawer && (
              <button
                onClick={onOpenEpisodeDrawer}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="Select Episode"
              >
                <Layers className="w-5 h-5" />
              </button>
            )}

            {/* Subtitles Menu */}
            {stream.subtitles && stream.subtitles.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setIsSubtitleMenuOpen(!isSubtitleMenuOpen)}
                  className={`p-2 transition-colors ${
                    selectedSubtitle !== 'off' ? 'text-brand-400 font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Subtitles"
                >
                  <Subtitles className="w-5 h-5" />
                </button>

                {isSubtitleMenuOpen && (
                  <div className="absolute bottom-10 right-0 w-36 py-2 bg-surface-200/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl z-50 text-xs space-y-1">
                    <button
                      onClick={() => handleSubtitleChange('off')}
                      className={`w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors ${
                        selectedSubtitle === 'off' ? 'text-brand-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      Off
                    </button>
                    {stream.subtitles.map((sub: SubtitleTrack) => (
                      <button
                        key={sub.language}
                        onClick={() => handleSubtitleChange(sub.language)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors ${
                          selectedSubtitle === sub.language ? 'text-brand-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Playback Speed Menu */}
            <div className="relative">
              <button
                onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                className="px-2 py-1 rounded text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {isSpeedMenuOpen && (
                <div className="absolute bottom-10 right-0 w-28 py-2 bg-surface-200/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl z-50 text-xs space-y-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors ${
                        playbackRate === rate ? 'text-brand-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      {rate}x {rate === 1 && '(Normal)'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="text-slate-300 hover:text-white transition-colors p-1"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostics Modal */}
      {renderDiagnostics()}
    </div>
  );
};
