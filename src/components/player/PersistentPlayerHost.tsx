import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayback } from '../../context/PlaybackContext';
import { useGoBack } from '../../hooks/useGoBack';
import { VideoPlayer } from './VideoPlayer';
import { AnimeVideoPlayer } from './anime/AnimeVideoPlayer';
import { PlayerErrorBoundary } from './PlayerErrorBoundary';
import { X, Maximize2, Minus, Play } from 'lucide-react';
import gsap from 'gsap';
import { useReducedMotion } from '../../animation/hooks/useReducedMotion';

export const PersistentPlayerHost: React.FC = () => {
  const playback = usePlayback();
  const navigate = useNavigate();
  const goBackFallback = playback.mediaType === 'anime' ? '/anime' : '/';
  const handlePlayerBack = useGoBack(goBackFallback);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number; currentX: number; currentY: number }>({
    isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0
  });
  const reducedMotion = useReducedMotion();

  const {
    presentationMode, mediaId, mediaType, streamResult, animeStreamSource,
    isLoading, movie, tvShow, currentEpisode, seasonNumber, episodeNumber,
    animeItem, animeEpisodes, animeLanguage, retryCount
  } = playback;

  const isAnime = mediaType === 'anime';
  const isTV = mediaType === 'tv';
  const isMovie = mediaType === 'movie';

  useEffect(() => {
    if (!containerRef.current) return;
    
    const el = containerRef.current;
    
    if (presentationMode === 'FULL') {
      gsap.to(el, {
        x: 0, y: 0, 
        width: '100%', height: '100%', 
        bottom: 0, right: 0,
        borderRadius: 0,
        duration: reducedMotion ? 0 : 0.4,
        ease: 'power3.out'
      });
    } else if (presentationMode === 'PIP') {
      gsap.to(el, {
        width: '400px', height: '225px',
        bottom: '24px', right: '24px',
        borderRadius: '12px',
        duration: reducedMotion ? 0 : 0.4,
        ease: 'power3.out'
      });
    }
  }, [presentationMode, reducedMotion]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || presentationMode !== 'PIP') return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.pip-drag-handle')) return;

      dragRef.current.isDragging = true;
      dragRef.current.startX = e.clientX - dragRef.current.currentX;
      dragRef.current.startY = e.clientY - dragRef.current.currentY;
      el.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragRef.current.isDragging) return;
      
      let newX = e.clientX - dragRef.current.startX;
      let newY = e.clientY - dragRef.current.startY;
      
      dragRef.current.currentX = newX;
      dragRef.current.currentY = newY;
      gsap.set(el, { x: newX, y: newY });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        el.releasePointerCapture(e.pointerId);
      }
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerUp);

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [presentationMode]);

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
    if (isLoading) {
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

  return (
    <div 
      ref={containerRef}
      className={`fixed z-60 bg-black overflow-hidden shadow-2xl ${
        isPip ? 'bottom-6 right-6 w-400px h-225px rounded-xl ring-1 ring-white/10' : 'inset-0 w-full h-full'
      }`}
    >
      {isPip && (
        <div className="absolute inset-0 z-70 opacity-0 hover:opacity-100 transition-opacity bg-black/40 pip-drag-handle flex flex-col cursor-move">
          <div className="flex justify-between p-2 pip-controls">
            <button 
              onClick={handleRestore}
              className="p-1.5 bg-black/60 rounded hover:bg-black/80 text-white cursor-pointer"
              title="Back to full screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); playback.closePlayer(); }}
              className="p-1.5 bg-black/60 rounded hover:bg-red-500/80 text-white cursor-pointer"
              title="Close player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-grow" />
        </div>
      )}

      <div className="w-full h-full pointer-events-auto">
        {renderPlayer()}
      </div>
    </div>
  );
};