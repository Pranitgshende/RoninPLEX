import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { getCurrentWindow } from '@tauri-apps/api/window';
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
  SkipBack,
  Layers,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Terminal,
  X,
  PictureInPicture,
} from 'lucide-react';
import { StreamingResult, SubtitleTrack } from '../../services/streaming/types';
import { useUser } from '../../context/UserContext';
import { storage } from '../../services/storage';
import { streamingManager, FallbackAttempt } from '../../services/streaming/StreamingManager';
import { getStillUrl } from '../../utils/helpers';
import { logPlayback } from '../../utils/logger';

export interface NextEpisodeInfo {
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  stillPath?: string | null;
}

export interface VideoPlayerProps {
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
  onPrevEpisode?: () => void;
  hasPrevEpisode?: boolean;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
  nextEpisodeInfo?: NextEpisodeInfo | null;
  onOpenEpisodeDrawer?: () => void;
  onTryNextProvider?: () => void;
  onPlaybackError?: (error: string) => void;
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
  onPrevEpisode,
  hasPrevEpisode = false,
  onNextEpisode,
  hasNextEpisode = false,
  nextEpisodeInfo,
  onOpenEpisodeDrawer,
  onTryNextProvider,
  onPlaybackError,
}) => {
  const { preferences, savePlaybackProgress } = useUser();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubBarRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const isDraggingScrubRef = useRef<boolean>(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('off');
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isSubtitleMenuOpen, setIsSubtitleMenuOpen] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [resumeNotification, setResumeNotification] = useState<string | null>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // v1.2.0 Seeking & Gesture state
  const seekStep = preferences.seekAmount || 10;
  const [seekFeedback, setSeekFeedback] = useState<{
    direction: 'forward' | 'backward';
    amount: number;
    id: number;
  } | null>(null);
  const seekFeedbackTimeoutRef = useRef<number | null>(null);
  const singleClickTimerRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickRegionRef = useRef<'left' | 'center' | 'right' | null>(null);

  // v1.2.0 TV Auto-Next state
  const [showNextEpisodeCard, setShowNextEpisodeCard] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(preferences.autoNextCountdown || 10);
  const nextCountdownTimerRef = useRef<number | null>(null);


  // Embed specific state
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [showSlowBufferHelp, setShowSlowBufferHelp] = useState(false);
  const [embedStallDetected, setEmbedStallDetected] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [fallbackHistory, setFallbackHistory] = useState<FallbackAttempt[]>([]);

  // v2.0.0 Watchdog State Machine (5 mandatory phases from PRD/RALPH-LOOP)
  const [watchdogPhase, setWatchdogPhase] = useState<'source_resolved' | 'player_initialized' | 'media_loaded' | 'playback_started' | 'currentTime_advances'>('source_resolved');

  const [diagnosticStream, setDiagnosticStream] = useState<StreamingResult | null>(null);
  const effectiveStream = diagnosticStream || stream;

  // Provider-aware iframe embed policy resolution
  const resolvedEmbedPolicy = React.useMemo(() => {
    if (effectiveStream.embedPolicy) {
      return effectiveStream.embedPolicy;
    }
    // Infer policy based on provider / URL if not explicitly attached
    const url = effectiveStream.url?.toLowerCase() || '';
    const isAntiSandbox = url.includes('vidsrc') || url.includes('vsembed') || url.includes('2embed') || url.includes('cloudorchestra');
    if (isAntiSandbox) {
      return {
        sandbox: null,
        allow: 'autoplay; fullscreen; encrypted-media; picture-in-picture',
        referrerPolicy: 'origin' as const,
      };
    }
    return {
      sandbox: 'allow-scripts allow-same-origin allow-presentation',
      allow: 'autoplay; fullscreen; encrypted-media; picture-in-picture',
      referrerPolicy: 'origin' as const,
    };
  }, [effectiveStream.embedPolicy, effectiveStream.url]);



  // Auto-hide controls timer
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

  // Load fallback history for diagnostics
  useEffect(() => {
    setFallbackHistory(streamingManager.getLastFallbackAttempts());
  }, [stream.url]);

  const hasAppliedResumeRef = useRef(false);

  // Reset resume application tracker when media changes
  useEffect(() => {
    hasAppliedResumeRef.current = false;
  }, [mediaId, mediaType, seasonNumber, episodeNumber]);

  // Picture-in-Picture event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPip = () => setIsPip(true);
    const handleLeavePip = () => setIsPip(false);

    video.addEventListener('enterpictureinpicture', handleEnterPip);
    video.addEventListener('leavepictureinpicture', handleLeavePip);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPip);
      video.removeEventListener('leavepictureinpicture', handleLeavePip);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    let unmounted = false;
    
    // Auto-enter fullscreen on mount
    getCurrentWindow().setFullscreen(true).then(() => {
      if (!unmounted) setIsFullscreen(true);
    }).catch(err => console.warn('Could not enter window fullscreen:', err));

    return () => {
      unmounted = true;
      getCurrentWindow().setFullscreen(false).catch(err => console.warn('Could not exit window fullscreen:', err));
    };
  }, []);

  const toggleFullscreen = () => {
    const win = getCurrentWindow();
    win.isFullscreen().then(isFs => {
      win.setFullscreen(!isFs);
      setIsFullscreen(!isFs);
    }).catch(err => console.warn('Could not toggle fullscreen:', err));
  };

  // Master unmount timer cleanup
  useEffect(() => {
    return () => {
      if (singleClickTimerRef.current) window.clearTimeout(singleClickTimerRef.current);
      if (seekFeedbackTimeoutRef.current) window.clearTimeout(seekFeedbackTimeoutRef.current);
      if (nextCountdownTimerRef.current) clearInterval(nextCountdownTimerRef.current);
      if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
    };
  }, []);

  // HLS.js or native video stream setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveStream.url || effectiveStream.type === 'embed') return;

    logPlayback(`Player initialization started: type=${effectiveStream.type}, url=${effectiveStream.url}`);
    logPlayback('Player initialized');
    setVideoError(null);

    if (effectiveStream.type === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(effectiveStream.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!hasAppliedResumeRef.current) {
            hasAppliedResumeRef.current = true;
            try {
              const match = storage.getPlaybackProgress(mediaId, mediaType, seasonNumber, episodeNumber);
              if (match && match.currentTime > 15 && match.progressPercent < 92) {
                video.currentTime = match.currentTime;
                const mins = Math.floor(match.currentTime / 60);
                const secs = Math.floor(match.currentTime % 60);
                setResumeNotification(`Resumed from ${mins}:${secs < 10 ? '0' : ''}${secs}`);
                setTimeout(() => setResumeNotification(null), 5000);
              }
            } catch (e) {
              console.warn('Could not read resume position:', e);
            }
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            logPlayback(`playback error: fatal HLS error ${data.type} ${data.details}`);
            setVideoError('Unable to stream HLS video source.');
            onPlaybackError?.(`HLS fatal error: ${data.details}`);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS
        video.src = effectiveStream.url;
      } else {
        logPlayback('playback error: HLS not supported');
        setVideoError('Your browser does not support HLS streaming.');
        onPlaybackError?.('HLS not supported');
      }
    } else {
      // Standard MP4 video
      video.src = effectiveStream.url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [effectiveStream.url, effectiveStream.type]);

  // Reset embed loading state when stream URL changes
  useEffect(() => {
    if (effectiveStream.type === 'embed') {
      logPlayback(`Player initialization started: type=embed, url=${effectiveStream.url}`);
      logPlayback('Player initialized');
      setIsIframeLoading(true);
      setShowSlowBufferHelp(false);
      const timer = window.setTimeout(() => {
        setShowSlowBufferHelp(true);
      }, 7000);
      return () => window.clearTimeout(timer);
    }
  }, [effectiveStream.url, effectiveStream.type, iframeKey]);

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

    const flushProgress = () => {
      const current = videoRef.current?.currentTime || 0;
      const dur = videoRef.current?.duration || 0;
      
      if (dur > 0 && current > 15) {
        const percent = Math.round((current / dur) * 100);
        savePlaybackProgress({
          id: mediaId,
          mediaType,
          title,
          seasonNumber,
          episodeNumber,
          episodeTitle,
          currentTime: current,
          duration: dur,
          progressPercent: percent,
          posterPath: posterPath || null,
          backdropPath: backdropPath || null,
          lastWatchedAt: new Date().toISOString(),
        });
      }
    };

    const interval = setInterval(flushProgress, 5000);

    return () => {
      clearInterval(interval);
      flushProgress();
    };
  }, [mediaId, mediaType, title, seasonNumber, episodeNumber, episodeTitle, posterPath, backdropPath, savePlaybackProgress, stream.type]);

  // Single Click Play/Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(e => console.warn('Play interrupted:', e));
      setIsPlaying(true);
      setHasStartedPlaying(true);
    }
  }, [isPlaying]);

  // Trigger temporary animated seek badge
  const triggerSeekFeedback = useCallback((direction: 'forward' | 'backward', amount: number) => {
    if (seekFeedbackTimeoutRef.current) {
      window.clearTimeout(seekFeedbackTimeoutRef.current);
    }
    setSeekFeedback({ direction, amount, id: Date.now() });
    seekFeedbackTimeoutRef.current = window.setTimeout(() => {
      setSeekFeedback(null);
    }, 750);
  }, []);

  // Central seek implementation with boundary clamping & feedback
  const seekRelative = useCallback((seconds: number) => {
    if (!videoRef.current || isNaN(duration) || duration <= 0) return;
    const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    triggerSeekFeedback(seconds > 0 ? 'forward' : 'backward', Math.abs(seconds));
  }, [duration, triggerSeekFeedback]);

  // Container click handler: double-click seeking on left/right thirds, single-click togglePlay
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, a, [role="button"], .player-control-surface')) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const region: 'left' | 'center' | 'right' =
      clickX < width * 0.33 ? 'left' : clickX > width * 0.67 ? 'right' : 'center';

    const now = Date.now();
    const isDouble = (now - lastClickTimeRef.current < 280) && (lastClickRegionRef.current === region);
    lastClickTimeRef.current = now;
    lastClickRegionRef.current = region;

    if (isDouble) {
      // Cancel any pending single-click play/pause
      if (singleClickTimerRef.current) {
        window.clearTimeout(singleClickTimerRef.current);
        singleClickTimerRef.current = null;
      }
      if (region === 'left') {
        seekRelative(-seekStep);
      } else if (region === 'right') {
        seekRelative(seekStep);
      }
      // Center double-click: do NOT seek
      resetControlsTimer();
    } else {
      // Single click: schedule responsive play/pause toggle
      if (singleClickTimerRef.current) {
        window.clearTimeout(singleClickTimerRef.current);
      }
      singleClickTimerRef.current = window.setTimeout(() => {
        togglePlay();
        resetControlsTimer();
        singleClickTimerRef.current = null;
      }, 250);
    }
  };

  // v2.0.0 Playback Watchdog: currentTime advance verification & black-screen stall protection
  useEffect(() => {
    let progressInterval: number | null = null;

    if (effectiveStream.type === 'embed' || videoError) {
      if (effectiveStream.type === 'embed') {
        setEmbedStallDetected(false); // Embeds cannot be reliably tracked for stalls
      }
      return;
    }

    if (isPlaying) {
      let lastTime = videoRef.current?.currentTime || 0;
      let checkCount = 0;

      progressInterval = window.setInterval(() => {
        const current = videoRef.current?.currentTime || 0;
        
        if (current > lastTime) {
          lastTime = current;
          checkCount = 0; // Reset checks on progress
          if (watchdogPhase !== 'currentTime_advances') {
            setWatchdogPhase('currentTime_advances');
          }
        } else {
          checkCount++;
          if (checkCount >= 6) { // 30 seconds of no progress while playing
            logPlayback(`Watchdog alert: currentTime did not advance within 30s for provider ${effectiveStream.providerId || 'unknown'}`);
            setEmbedStallDetected(true);
            if (effectiveStream.providerId) {
              streamingManager.reportPlaybackFailure(effectiveStream.providerId, 'Watchdog detected playback stall (currentTime did not advance)');
            }
            if (progressInterval) window.clearInterval(progressInterval);
          }
        }
      }, 5000);
    }

    return () => {
      if (progressInterval) window.clearInterval(progressInterval);
    };
  }, [effectiveStream.url, effectiveStream.type, iframeKey, videoError, isPlaying, watchdogPhase]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, newVolume));
    videoRef.current.volume = clamped;
    setVolume(clamped);
    setIsMuted(clamped === 0);
  };

  // Drag / Scrub Seeking Handlers
  const handleScrubPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!videoRef.current || isNaN(duration) || duration <= 0) return;
    isDraggingScrubRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    const rect = scrubBarRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetTime = Math.max(0, Math.min(duration, pos * duration));
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleScrubPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubBarRef.current || isNaN(duration) || duration <= 0) return;
    const rect = scrubBarRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;

    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = Math.max(0, Math.min(duration, pos * duration));
    setHoverPosition(targetTime);

    if (isDraggingScrubRef.current && videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleScrubPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingScrubRef.current) {
      isDraggingScrubRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  // Picture-in-Picture toggle (supports Document PiP & standard HTML5 video PiP)
  const togglePictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
        return;
      }

      // 1. Standard HTML5 Video PiP
      if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPip(true);
        return;
      }

      // 2. Document Picture-in-Picture (Chromium / WebView2)
      if ('documentPictureInPicture' in window) {
        const pipWin = await (window as any).documentPictureInPicture.requestWindow({
          width: 640,
          height: 360,
        });
        setIsPip(true);
        pipWin.addEventListener('pagehide', () => setIsPip(false));
      }
    } catch (err) {
      console.warn('Could not toggle Picture-in-Picture:', err);
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
          seekRelative(-seekStep);
          break;
        case 'arrowright':
          e.preventDefault();
          seekRelative(seekStep);
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
        case 'p':
          e.preventDefault();
          togglePictureInPicture();
          break;
      }
      resetControlsTimer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, isMuted, isPlaying, resetControlsTimer, togglePlay, seekRelative, seekStep]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
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
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in player-control-surface">
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
              <span className="text-slate-400">Active Provider:</span>
              <span className="text-white font-semibold">{stream.providerName || streamingManager.getActiveProviderName()}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-100 border border-white/5">
              <span className="text-slate-400">Stream Type:</span>
              <span className="text-brand-400 uppercase font-semibold">{effectiveStream.type || 'embed'}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-100 border border-white/5">
              <span className="text-slate-400">Quality:</span>
              <span className="text-white">{effectiveStream.quality || 'Auto HD'}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-100 border border-white/5">
              <span className="text-slate-400">Player State:</span>
              <span className={isIframeLoading && effectiveStream.type === 'embed' ? 'text-amber-400' : 'text-emerald-400'}>
                {effectiveStream.type === 'embed'
                  ? (isIframeLoading ? 'Connecting / Loading IFrame...' : 'IFrame Loaded & Active')
                  : (isPlaying ? 'Playing' : 'Paused / Ready')}
              </span>
            </div>

            {/* v2.0.0 Watchdog State Machine Visual Status */}
            <div className="p-2.5 rounded-xl bg-surface-100 border border-brand-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white">Watchdog State Machine:</span>
                <span className="text-[10px] font-mono font-bold text-brand-400 uppercase">
                  {watchdogPhase.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1 pt-1 text-[9px] text-center font-mono">
                <div className={`p-1 rounded ${watchdogPhase ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'bg-surface-200 text-slate-500'}`}>
                  1. Resolved
                </div>
                <div className={`p-1 rounded ${watchdogPhase !== 'source_resolved' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'bg-surface-200 text-slate-500'}`}>
                  2. Init
                </div>
                <div className={`p-1 rounded ${['media_loaded', 'playback_started', 'currentTime_advances'].includes(watchdogPhase) ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'bg-surface-200 text-slate-500'}`}>
                  3. Loaded
                </div>
                <div className={`p-1 rounded ${['playback_started', 'currentTime_advances'].includes(watchdogPhase) ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'bg-surface-200 text-slate-500'}`}>
                  4. Started
                </div>
                <div className={`p-1 rounded ${watchdogPhase === 'currentTime_advances' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'bg-surface-200 text-slate-500'}`}>
                  5. Advancing
                </div>
              </div>
            </div>
            {fallbackHistory.length > 0 && (
              <div className="p-2 rounded bg-surface-100 border border-white/5 space-y-1">
                <span className="text-slate-400 block">Fallback Attempts:</span>
                {fallbackHistory.map((att, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-300">{att.providerName}</span>
                    <span className={att.status === 'success' ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {att.status}{att.reason ? ` (${att.reason})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between p-2 rounded bg-surface-100 border border-white/5">
              <span className="text-slate-400">IFrame Sandboxing:</span>
              <span className={resolvedEmbedPolicy.sandbox ? 'text-emerald-400 font-mono text-[10px]' : 'text-amber-400'}>
                {resolvedEmbedPolicy.sandbox || 'Standard (Anti-Sandbox Protected)'}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-100 border border-white/5">
              <span className="text-slate-400">Top Window Navigation:</span>
              <span className="text-emerald-400 font-semibold">Blocked (Native OS Guard Active)</span>
            </div>
            <div className="p-2 rounded bg-surface-100 border border-white/5 break-all">
              <div className="text-slate-400 mb-1">Stream Endpoint URL:</div>
              <div className="text-cyan-400 font-semibold">{effectiveStream.url}</div>
            </div>

            {/* Phase 6 Diagnostic Isolation Tests */}
            <div className="p-3 rounded-xl bg-surface-100 border border-brand-500/20 space-y-2">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Diagnostic Test Media (Phase 6 Isolation)</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">Verified Test Source</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Test known legitimate direct streams to verify the internal HTML5 player engine independently of web embed providers.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    logPlayback('Testing diagnostic direct HLS stream (Big Buck Bunny)');
                    setDiagnosticStream({
                      available: true,
                      type: 'hls',
                      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                      providerName: 'Mux Big Buck Bunny (Direct HLS)',
                      providerId: 'diagnostic-hls',
                      quality: '1080p HLS',
                    });
                    setShowDiagnostics(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Play Direct HLS in App</span>
                </button>
                {diagnosticStream && (
                  <button
                    type="button"
                    onClick={() => {
                      setDiagnosticStream(null);
                      setShowDiagnostics(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-semibold text-xs transition-colors"
                  >
                    Reset to Original Stream
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            {onTryNextProvider && (
              <button
                onClick={() => {
                  setShowDiagnostics(false);
                  onTryNextProvider();
                }}
                className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-white/10 text-white font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Next Provider</span>
              </button>
            )}
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

  // ============================================================================
  // EMBED PLAYER IMPLEMENTATION (VidSrc, VidLink, etc.)
  // ============================================================================
  if (effectiveStream.type === 'embed' && effectiveStream.url) {
    return (
      <div className="relative w-full h-screen bg-black flex flex-col overflow-hidden select-none">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between gap-3 pointer-events-auto player-control-surface">
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
            {/* TV Prev Episode */}
            {mediaType === 'tv' && hasPrevEpisode && onPrevEpisode && (
              <button
                onClick={onPrevEpisode}
                className="p-2.5 rounded-full bg-black/70 hover:bg-black text-slate-300 hover:text-white border border-white/10 shadow-lg transition-colors"
                title="Play Previous Episode"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            {/* TV Next Episode */}
            {mediaType === 'tv' && hasNextEpisode && onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="p-2.5 rounded-full bg-black/70 hover:bg-black text-brand-400 hover:text-brand-300 border border-white/10 shadow-lg transition-colors"
                title="Play Next Episode"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}

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

            {/* Next Provider Button */}
            {onTryNextProvider && (
              <button
                onClick={onTryNextProvider}
                className="p-2.5 rounded-full bg-black/70 hover:bg-black text-brand-400 hover:text-brand-300 border border-white/10 shadow-lg transition-colors"
                title="Switch to Next Streaming Provider"
              >
                <RefreshCw className="w-4 h-4" />
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
              onClick={() => window.open(effectiveStream.url, '_blank')}
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
                Provider: <span className="text-brand-400">{effectiveStream.providerName || streamingManager.getActiveProviderName()}</span>
              </p>
            </div>
          </div>
        )}

        {/* Playback Assistance Banner */}
        {(embedStallDetected || showSlowBufferHelp) && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-5 py-3 rounded-2xl bg-surface-100/95 backdrop-blur-md border border-amber-500/30 shadow-2xl flex items-center gap-3 text-xs text-slate-200 animate-slide-up player-control-surface">
            <span className="font-medium text-amber-300">Stalled or black screen?</span>
            {onTryNextProvider && (
              <button
                onClick={onTryNextProvider}
                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Next Provider</span>
              </button>
            )}
            <button
              onClick={handleReloadIframe}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload</span>
            </button>
            <button
              onClick={() => {
                setEmbedStallDetected(false);
                setShowSlowBufferHelp(false);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white ml-1"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* The Embed Player Iframe with Provider-Aware Policy */}
        <iframe
          key={iframeKey}
          src={effectiveStream.url}
          title={title}
          className="w-full h-full border-0"
          {...(resolvedEmbedPolicy.sandbox ? { sandbox: resolvedEmbedPolicy.sandbox } : {})}
          allow={resolvedEmbedPolicy.allow || 'autoplay; fullscreen; encrypted-media; picture-in-picture'}
          allowFullScreen
          referrerPolicy={resolvedEmbedPolicy.referrerPolicy || 'origin'}
          onLoad={() => {
            logPlayback('iframe/video load event');
            setIsIframeLoading(false);
          }}
        />

        {/* Diagnostics Modal */}
        {renderDiagnostics()}
      </div>
    );
  }

  // ============================================================================
  // HTML5 / HLS NATIVE VIDEO PLAYER
  // ============================================================================
  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onClick={handleContainerClick}
      className="relative w-full h-screen bg-black select-none overflow-hidden flex items-center justify-center group font-sans cursor-default"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onPlay={() => {
          setIsPlaying(true);
          setWatchdogPhase('playback_started');
          logPlayback('Watchdog [Phase 4/5]: playback started');
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (videoRef.current && !isDraggingScrubRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);
            if (time > 0.5) {
              setWatchdogPhase('currentTime_advances');
            }
            if (videoRef.current.buffered.length > 0) {
              setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
            }
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setWatchdogPhase('media_loaded');
            logPlayback('Watchdog [Phase 3/5]: media loaded');
            
            // Safely apply resume position after metadata is loaded
            if (!hasAppliedResumeRef.current) {
              hasAppliedResumeRef.current = true;
              try {
                const match = storage.getPlaybackProgress(mediaId, mediaType, seasonNumber, episodeNumber);
                if (match && match.currentTime > 15 && match.progressPercent < 92) {
                  videoRef.current.currentTime = match.currentTime;
                  const mins = Math.floor(match.currentTime / 60);
                  const secs = Math.floor(match.currentTime % 60);
                  setResumeNotification(`Resumed from ${mins}:${secs < 10 ? '0' : ''}${secs}`);
                  setTimeout(() => setResumeNotification(null), 5000);
                }
              } catch (e) {
                console.warn('Could not read resume position:', e);
              }
            }
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (mediaType === 'tv' && hasNextEpisode && onNextEpisode) {
            setShowNextEpisodeCard(true);
            if (preferences.autoNextEpisode !== false) {
              const countdownStart = preferences.autoNextCountdown || 10;
              setNextCountdown(countdownStart);
              if (nextCountdownTimerRef.current) clearInterval(nextCountdownTimerRef.current);
              nextCountdownTimerRef.current = window.setInterval(() => {
                setNextCountdown(prev => {
                  if (prev <= 1) {
                    if (nextCountdownTimerRef.current) clearInterval(nextCountdownTimerRef.current);
                    setShowNextEpisodeCard(false);
                    onNextEpisode();
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            }
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
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center gap-4 z-40 p-6 text-center player-control-surface animate-fade-in">
          <AlertCircle className="w-12 h-12 text-rose-500" />
          <h2 className="text-xl font-bold text-white font-display">Playback Error Detected</h2>
          <p className="text-xs text-slate-400 max-w-md">{videoError}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onTryNextProvider && (
              <button
                onClick={onTryNextProvider}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch to Next Provider</span>
              </button>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-surface-100 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
              >
                Return to Details
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resume Notification */}
      {resumeNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-surface-100/90 backdrop-blur-md border border-white/10 text-xs font-semibold text-white shadow-2xl flex items-center gap-2 animate-slide-up pointer-events-none">
          <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
          <span>{resumeNotification}</span>
        </div>
      )}

      {/* Center Big Play Button when paused */}
      {!isPlaying && hasStartedPlaying && !videoError && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer pointer-events-auto"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-20 h-20 rounded-full bg-brand-600/90 hover:bg-brand-500 text-white flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all cursor-pointer player-control-surface"
            title="Play"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        </div>
      )}

      {/* Initial Play Screen: Click anywhere to start */}
      {!hasStartedPlaying && !videoError && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 cursor-pointer"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-brand-600/50 transform hover:scale-105 transition-all cursor-pointer player-control-surface"
            title="Start Playback"
          >
            <Play className="w-10 h-10 fill-current ml-1.5" />
          </button>
          <div className="text-center space-y-1 select-none">
            <h2 className="text-xl font-bold text-white font-display">{title}</h2>
            {episodeTitle && (
              <p className="text-xs text-slate-300 font-medium">S{seasonNumber} E{episodeNumber}: {episodeTitle}</p>
            )}
            <p className="text-[11px] text-slate-400 pt-1">Click anywhere to play</p>
          </div>
        </div>
      )}

      {/* Top Controls Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-30 transition-opacity duration-300 player-control-surface ${
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
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30 transition-opacity duration-300 space-y-3 player-control-surface ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Interactive Scrub Bar with Drag Support */}
        <div
          ref={scrubBarRef}
          onPointerDown={handleScrubPointerDown}
          onPointerMove={handleScrubPointerMove}
          onPointerUp={handleScrubPointerUp}
          onMouseLeave={() => setHoverPosition(null)}
          className="relative w-full h-2 hover:h-3.5 bg-white/20 rounded-full cursor-pointer transition-all group/scrub touch-none"
        >
          {/* Buffered Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-white/30 rounded-full pointer-events-none"
            style={{ width: `${duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0}%` }}
          />

          {/* Current Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-brand-500 rounded-full pointer-events-none"
            style={{ width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md scale-0 group-hover/scrub:scale-100 transition-transform" />
          </div>

          {/* Hover Time Tooltip */}
          {hoverPosition !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 px-2 py-0.5 rounded bg-surface-200 text-[10px] font-mono text-white border border-white/10 shadow-lg pointer-events-none"
              style={{ left: `${duration > 0 ? (hoverPosition / duration) * 100 : 0}%` }}
            >
              {formatTime(hoverPosition)}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-brand-400 transition-colors p-1"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            {/* Rewind seekStep */}
            <button
              onClick={() => seekRelative(-seekStep)}
              className="text-slate-300 hover:text-white transition-colors p-1 flex items-center gap-0.5"
              title={`Rewind ${seekStep}s (Left Arrow / Double-click Left)`}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[10px] font-bold font-mono">{seekStep}</span>
            </button>

            {/* Forward seekStep */}
            <button
              onClick={() => seekRelative(seekStep)}
              className="text-slate-300 hover:text-white transition-colors p-1 flex items-center gap-0.5"
              title={`Forward ${seekStep}s (Right Arrow / Double-click Right)`}
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[10px] font-bold font-mono">{seekStep}</span>
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
            {/* TV Show: Prev Episode */}
            {mediaType === 'tv' && hasPrevEpisode && onPrevEpisode && (
              <button
                onClick={onPrevEpisode}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                title="Play Previous Episode"
              >
                <SkipBack className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>
            )}

            {/* TV Show: Next Episode */}
            {mediaType === 'tv' && hasNextEpisode && onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600/30 border border-brand-500/40 hover:bg-brand-600 text-xs font-semibold text-white transition-colors"
                title="Play Next Episode"
              >
                <SkipForward className="w-4 h-4" />
                <span className="hidden sm:inline">Next</span>
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

            {/* Picture-in-Picture */}
            <button
              onClick={togglePictureInPicture}
              className={`p-1.5 rounded transition-colors ${
                isPip ? 'text-brand-400 bg-brand-500/20' : 'text-slate-300 hover:text-white'
              }`}
              title="Picture-in-Picture (P)"
            >
              <PictureInPicture className="w-5 h-5" />
            </button>

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

      {/* Animated Seek Feedback Badge Overlay */}
      {seekFeedback && (
        <div
          key={seekFeedback.id}
          className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center animate-fade-in ${
            seekFeedback.direction === 'backward' ? 'left-16 sm:left-24' : 'right-16 sm:right-24'
          }`}
        >
          <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-2xl transform scale-105 transition-all">
            {seekFeedback.direction === 'backward' ? (
              <RotateCcw className="w-8 h-8 text-brand-400 animate-pulse" />
            ) : (
              <RotateCw className="w-8 h-8 text-brand-400 animate-pulse" />
            )}
            <span className="text-sm font-bold font-mono mt-1">
              {seekFeedback.direction === 'backward' ? `−${seekFeedback.amount}s` : `+${seekFeedback.amount}s`}
            </span>
          </div>
        </div>
      )}

      {/* TV Auto-Next Episode Overlay Card */}
      {showNextEpisodeCard && (
        <div className="absolute bottom-24 right-8 z-40 max-w-sm w-full bg-surface-200/95 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl space-y-3.5 animate-slide-up player-control-surface">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-brand-600/30 text-brand-400 font-bold text-[10px] uppercase tracking-wider">
                  Up Next
                </span>
                {preferences.autoNextEpisode !== false && (
                  <span className="text-xs text-slate-400 font-mono">in {nextCountdown}s</span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {nextEpisodeInfo
                  ? `S${nextEpisodeInfo.seasonNumber} E${nextEpisodeInfo.episodeNumber}: ${nextEpisodeInfo.title}`
                  : 'Next Episode'}
              </h3>
            </div>
            <button
              onClick={() => {
                if (nextCountdownTimerRef.current) clearInterval(nextCountdownTimerRef.current);
                setShowNextEpisodeCard(false);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Cancel Autoplay"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {nextEpisodeInfo?.stillPath && (
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-surface-300 relative">
              <img
                src={getStillUrl(nextEpisodeInfo.stillPath, 'medium')}
                alt={nextEpisodeInfo.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {preferences.autoNextEpisode !== false && (
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-1000 ease-linear"
                style={{
                  width: `${(nextCountdown / (preferences.autoNextCountdown || 10)) * 100}%`,
                }}
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                if (nextCountdownTimerRef.current) clearInterval(nextCountdownTimerRef.current);
                setShowNextEpisodeCard(false);
                onNextEpisode?.();
              }}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Now</span>
            </button>
            <button
              onClick={() => {
                if (nextCountdownTimerRef.current) clearInterval(nextCountdownTimerRef.current);
                setShowNextEpisodeCard(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-surface-100 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Diagnostics Modal */}
      {renderDiagnostics()}
    </div>
  );
};
