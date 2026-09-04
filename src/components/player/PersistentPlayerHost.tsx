import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayback } from '../../context/PlaybackContext';
import { useGoBack } from '../../hooks/useGoBack';
import { pipService } from '../../services/pip';
import { VideoPlayer } from './VideoPlayer';
import { AnimeVideoPlayer } from './anime/AnimeVideoPlayer';
import { PlayerErrorBoundary } from './PlayerErrorBoundary';
import { X, Maximize2, Minus, Play, PictureInPicture, RefreshCw } from 'lucide-react';

import { EpisodeDrawer } from './EpisodeDrawer';

export const PersistentPlayerHost: React.FC = () => {
  const playback = usePlayback();
  const navigate = useNavigate();
  const location = useLocation();
  const goBackFallback = playback.mediaType === 'anime' ? '/anime' : '/';
  const goBack = useGoBack(goBackFallback);
  const handlePlayerBack = () => {
    playback.closePlayer();
    goBack();
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    presentationMode, mediaId, mediaType, streamResult, animeStreamSource,
    isLoading, movie, tvShow, currentEpisode, seasonNumber, episodeNumber,
    animeItem, animeEpisodes, retryCount,
    restoreSnapshot, clearRestoreSnapshot
  } = playback;

  const isAnime = mediaType === 'anime';
  const isTV = mediaType === 'tv';
  const isMovie = mediaType === 'movie';

  // Self-healing invariant: If state is PIP but no real secondary window exists, immediately revert to FULL
  useEffect(() => {
    if (presentationMode === 'PIP') {
      let isSubscribed = true;
      pipService.hasLivePiPWindow().then((hasWin) => {
        if (isSubscribed && !hasWin) {
          console.warn('[PersistentPlayerHost] Invariant violation: presentationMode is PIP without live window. Reverting to FULL.');
          playback.setPresentationMode('FULL');
        }
      });
      return () => { isSubscribed = false; };
    }
  }, [presentationMode, playback]);

  useEffect(() => {
    return () => {
      clearRestoreSnapshot();
    };
  }, [clearRestoreSnapshot]);

  if (presentationMode === 'CLOSED') return null;

  const handleRestore = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isAnime) {
      navigate(`/watch/anime/${mediaId}/${episodeNumber}`);
    } else if (isTV) {
      navigate(`/watch/tv/${mediaId}/${seasonNumber}/${episodeNumber}`);
    } else {
      navigate(`/watch/movie/${mediaId}`);
    }
  };

  const renderPlayer = () => {
    if ((isLoading || playback.isResolvingStream) && !isAnime && !streamResult) {
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-4 text-white">
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-white font-display">
              {playback.isResolvingStream ? 'Switching Provider...' : 'Connecting to Stream...'}
            </h3>
            <p className="text-xs text-slate-400">
              Provider: <span className="text-brand-400">
                {playback.isResolvingStream ? (playback.resolvingProviderId || playback.activeProviderName) : playback.activeProviderName}
              </span>
            </p>
          </div>
        </div>
      );
    }

    if (isAnime && animeItem) {
      return (
        <PlayerErrorBoundary>
          <AnimeVideoPlayer
            key={`anime-${mediaId}-${episodeNumber}-${retryCount}`}
            anime={animeItem}
            episodeNumber={episodeNumber!}
            episodes={animeEpisodes}
            stream={animeStreamSource}
            initialTime={restoreSnapshot?.currentTime}
            initialIsPlaying={restoreSnapshot?.isPlaying}
            isLoading={isLoading}
            onSelectEpisode={playback.onSelectEpisode}
            onSelectRelated={playback.onSelectRelated}
            onLanguageChange={playback.setAnimeLanguage}
            onBack={handlePlayerBack}
            onRetry={playback.triggerRetry}
          />
        </PlayerErrorBoundary>
      );
    }

    if (streamResult && streamResult.url) {
      return (
        <PlayerErrorBoundary>
          <VideoPlayer
            key={`${streamResult.url}-${retryCount}`}
            stream={streamResult}
            title={isTV ? (tvShow?.name || 'TV Series') : (movie?.title || 'Movie')}
            mediaType={isTV ? 'tv' : 'movie'}
            mediaId={mediaId!}
            seasonNumber={isTV ? seasonNumber : undefined}
            episodeNumber={isTV ? episodeNumber : undefined}
            episodeTitle={currentEpisode?.name}
            posterPath={isTV ? tvShow?.poster_path : movie?.poster_path}
            backdropPath={isTV ? tvShow?.backdrop_path : movie?.backdrop_path}
            initialTime={restoreSnapshot?.currentTime}
            initialIsPlaying={restoreSnapshot?.isPlaying}
            onBack={handlePlayerBack}
            onPrevEpisode={playback.handlePrevEpisode}
            hasPrevEpisode={playback.hasPrevEpisode}
            onNextEpisode={playback.handleNextEpisode}
            hasNextEpisode={playback.hasNextEpisode}
            onOpenEpisodeDrawer={isTV ? () => playback.setIsEpisodeDrawerOpen(true) : undefined}
          />
        </PlayerErrorBoundary>
      );
    }

    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
          <Play className="w-8 h-8 opacity-40" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">
            {playback.resolutionError || 'Stream Currently Unavailable'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            We couldn't connect to a working streaming source for this title. You can try a fallback provider or return to details.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => playback.handleTryNextProvider()}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Fallback Provider</span>
          </button>
          <button
            onClick={() => playback.triggerRetry()}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handlePlayerBack}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            Return to Details
          </button>
        </div>
      </div>
    );
  };

  const isPip = presentationMode === 'PIP';

  if (isPip) {
    const isOnWatchRoute = location.pathname.startsWith('/watch');

    if (isOnWatchRoute) {
      return (
        <div className="fixed inset-0 z-60 bg-black flex flex-col items-center justify-center text-white p-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/20 shadow-2xl">
            <PictureInPicture className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-xl font-bold font-display mb-2">Playing in Picture-in-Picture</h2>
          <p className="text-sm text-slate-400 max-w-md text-center mb-8">
            The video is currently playing in an external Picture-in-Picture window.
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={async () => {
                await pipService.closePiPWindow();
                playback.setPresentationMode('FULL');
              }}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-white shadow-lg shadow-brand-600/30 transition-all"
            >
              Return to Main Window
            </button>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-slate-200 transition-colors"
            >
              Browse Library
            </button>
          </div>
        </div>
      );
    }

    // Docked floating mini-controller when user is browsing other pages during PiP
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl animate-fade-in text-white">
        <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
          <PictureInPicture className="w-4 h-4" />
        </div>
        <div className="min-w-0 pr-2">
          <p className="text-xs font-bold text-white truncate max-w-[160px]">
            {isAnime ? animeItem?.title : isTV ? tvShow?.name : movie?.title || 'Playing'}
          </p>
          <p className="text-[10px] text-brand-300">PiP Active</p>
        </div>
        <button
          onClick={async () => {
            await pipService.closePiPWindow();
            playback.setPresentationMode('FULL');
            const targetUrl = isAnime
              ? `/watch/anime/${mediaId}/${episodeNumber || 1}`
              : isTV
                ? `/watch/tv/${mediaId}/${seasonNumber || 1}/${episodeNumber || 1}`
                : `/watch/movie/${mediaId}`;
            navigate(targetUrl);
          }}
          className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold shadow-md transition-colors"
          title="Return to Player"
        >
          Expand
        </button>
        <button
          onClick={async () => {
            await pipService.closePiPWindow();
            playback.closePlayer();
          }}
          className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Stop Playback"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // When playback is active in FULL mode, but user browsed to another route (Home, Discover, Settings)
  const isOnWatchRoute = location.pathname.startsWith('/watch');
  if (!isOnWatchRoute) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl animate-fade-in text-white">
        <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
          <Play className="w-4 h-4" />
        </div>
        <div className="min-w-0 pr-2">
          <p className="text-xs font-bold text-white truncate max-w-[160px]">
            {isAnime ? animeItem?.title : isTV ? tvShow?.name : movie?.title || 'Playing'}
          </p>
          <p className="text-[10px] text-brand-300">Active Playback</p>
        </div>
        <button
          onClick={() => {
            const targetUrl = isAnime
              ? `/watch/anime/${mediaId}/${episodeNumber || 1}`
              : isTV
                ? `/watch/tv/${mediaId}/${seasonNumber || 1}/${episodeNumber || 1}`
                : `/watch/movie/${mediaId}`;
            navigate(targetUrl);
          }}
          className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold shadow-md transition-colors"
          title="Return to Player"
        >
          Expand
        </button>
        <button
          onClick={() => {
            playback.closePlayer();
          }}
          className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Stop Playback"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed z-60 bg-black overflow-hidden shadow-2xl inset-0 w-full h-full"
    >
      {renderPlayer()}
      {isTV && (
        <EpisodeDrawer
          isOpen={playback.isEpisodeDrawerOpen}
          onClose={() => playback.setIsEpisodeDrawerOpen(false)}
          tvShow={tvShow}
          currentSeasonNumber={seasonNumber || 1}
          currentEpisodeNumber={episodeNumber || 1}
          selectedSeasonNumber={playback.drawerSeasonNumber}
          onSelectSeason={playback.setDrawerSeasonNumber}
          episodes={playback.drawerSeasonEpisodes}
          isLoading={playback.isDrawerLoading}
          onSelectEpisode={(sNum, epNum) => {
            playback.onSelectEpisode(epNum, sNum);
          }}
        />
      )}
    </div>
  );
};