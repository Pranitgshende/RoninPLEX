import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayback } from '../../context/PlaybackContext';
import { useGoBack } from '../../hooks/useGoBack';
import { VideoPlayer } from './VideoPlayer';
import { AnimeVideoPlayer } from './anime/AnimeVideoPlayer';
import { PlayerErrorBoundary } from './PlayerErrorBoundary';
import { X, Maximize2, Minus, Play, PictureInPicture } from 'lucide-react';

export const PersistentPlayerHost: React.FC = () => {
  const playback = usePlayback();
  const navigate = useNavigate();
  const goBackFallback = playback.mediaType === 'anime' ? '/anime' : '/';
  const handlePlayerBack = useGoBack(goBackFallback);
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
    if (isLoading && !isAnime && !streamResult) {
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-4 text-white">
          <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
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
          />
        </PlayerErrorBoundary>
      );
    }

    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-slate-400">
        No stream available
      </div>
    );
  };

  const isPip = presentationMode === 'PIP';

  if (isPip) {
    return (
      <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/20">
          <PictureInPicture className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold font-display mb-2">Playing in Picture-in-Picture</h2>
        <p className="text-sm text-white/50 max-w-md text-center mb-8">
          The video is currently playing in a separate window.
        </p>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => playback.setPresentationMode('FULL')}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold shadow-lg transition-colors"
          >
            Return to Main Window
          </button>
          <button 
            onClick={() => playback.closePlayer()}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold transition-colors"
          >
            Stop Playback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed z-60 bg-black overflow-hidden shadow-2xl inset-0 w-full h-full"
    >
      {renderPlayer()}
    </div>
  );
};