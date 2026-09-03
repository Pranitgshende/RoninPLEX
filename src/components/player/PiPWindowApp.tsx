import React, { useEffect, useState, useRef, useCallback } from 'react';
import { pipService, PlaybackSnapshot } from '../../services/pip';
import { VideoPlayer } from './VideoPlayer';
import { PlaybackContext, PresentationMode } from '../../context/PlaybackContext';
import { AnimeVideoPlayer } from './anime/AnimeVideoPlayer';
import { Maximize2, Square, Power, PictureInPicture } from 'lucide-react';

export const PiPWindowApp: React.FC = () => {
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot | null>(null);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2500);
  }, []);

  const handleMouseMove = useCallback(() => {
    resetHideTimer();
  }, [resetHideTimer]);

  const handleClosePiP = useCallback(async () => {
    const finalSnap = pipService.pullSnapshot() || snapshot;
    pipService.broadcast({
      sessionId: finalSnap?.sessionId,
      sourceGeneration: finalSnap?.sourceGeneration,
      type: 'COMMAND_CLOSE_PIP',
      payload: finalSnap,
    });
    await pipService.closePiPWindow();
  }, [snapshot]);

  const handleStopPlayback = useCallback(async () => {
    pipService.broadcast({
      type: 'COMMAND_STOP',
    });
    await pipService.closePiPWindow();
  }, []);

  const handleExitApp = useCallback(async () => {
    pipService.broadcast({
      type: 'COMMAND_EXIT_APP',
    });
    await pipService.exitApplication();
  }, []);

  useEffect(() => {
    resetHideTimer();

    // Subscribe to IPC messages
    const unsubscribe = pipService.subscribe((msg) => {
      if (msg.type === 'PLAYBACK_SNAPSHOT') {
        setSnapshot(msg.payload);
      }
    });

    // Announce ready
    pipService.broadcast({ type: 'PIP_READY' });

    // Handle window close
    const handleBeforeUnload = () => {
      const finalSnapshot = pipService.pullSnapshot() || snapshot;
      pipService.broadcast({
        sessionId: finalSnapshot?.sessionId,
        sourceGeneration: finalSnapshot?.sourceGeneration,
        type: 'PIP_DESTROYED',
        payload: finalSnapshot || undefined,
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer, snapshot]);

  if (!snapshot) {
    return (
      <div 
        data-tauri-drag-region
        className="w-full h-screen bg-black/95 flex flex-col items-center justify-center text-white/50 text-xs select-none cursor-move"
      >
        <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-3" />
        <span>Initializing PiP Window...</span>
      </div>
    );
  }

  const isAnime = snapshot.mediaType === 'anime';

  return (
    <div 
      className="w-full h-screen bg-black overflow-hidden relative select-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={resetHideTimer}
    >
      {/* Floating Auto-Hiding Top Bar / Custom Chrome */}
      <div 
        data-tauri-drag-region
        className={`absolute top-0 left-0 right-0 z-50 px-3 py-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 cursor-move ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Title & Brand indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80 pointer-events-none">
          <PictureInPicture className="w-3.5 h-3.5 text-brand-400" />
          <span className="truncate max-w-[200px]">RoninPLEX PiP</span>
        </div>

        {/* Window Action Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={handleClosePiP}
            className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Return to Main Window"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleStopPlayback}
            className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-amber-400 hover:text-amber-300 transition-colors"
            title="Stop Playback"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            type="button"
            onClick={handleExitApp}
            className="p-1 rounded-md bg-rose-600/80 hover:bg-rose-500 text-white transition-colors"
            title="Exit RoninPLEX"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <PlaybackContext.Provider value={{
        mediaId: snapshot.mediaId,
        mediaType: snapshot.mediaType as any,
        seasonNumber: snapshot.seasonNumber || 1,
        episodeNumber: snapshot.episodeNumber || 1,
        streamResult: snapshot.streamResult,
        animeStreamSource: snapshot.animeStreamSource,
        animeLanguage: snapshot.language as any,
        presentationMode: 'PIP',
        play: () => {},
        closePlayer: handleStopPlayback,
        handlePrevEpisode: () => {},
        handleNextEpisode: () => {},
        handleTryNextProvider: () => pipService.broadcast({ type: 'COMMAND_RETRY' }),
        setPresentationMode: (m: PresentationMode) => { if (m === 'FULL') handleClosePiP(); },
        setAnimeLanguage: () => {},
        triggerRetry: () => pipService.broadcast({ type: 'COMMAND_RETRY' }),
        onSelectEpisode: () => {},
        onSelectRelated: () => {},
        hasPrevEpisode: false,
        hasNextEpisode: false,
        isLoading: false,
        retryCount: 0,
      } as any}>
        {isAnime ? (
          <AnimeVideoPlayer
            anime={{ id: snapshot.mediaId.toString() } as any}
            episodeNumber={snapshot.episodeNumber || 1}
            episodes={[]}
            stream={snapshot.animeStreamSource}
            isLoading={false}
            onSelectEpisode={() => {}}
            onBack={handleClosePiP}
            onRetry={() => pipService.broadcast({ type: 'COMMAND_RETRY' })}
            initialTime={snapshot.currentTime}
            initialIsPlaying={snapshot.isPlaying}
            isPipHost={true}
          />
        ) : (
          <VideoPlayer 
            stream={snapshot.streamResult!}
            title="RoninPLEX PiP"
            mediaType={snapshot.mediaType as any}
            mediaId={snapshot.mediaId}
            onBack={handleClosePiP}
            initialTime={snapshot.currentTime}
            initialIsPlaying={snapshot.isPlaying}
            isPipHost={true}
          />
        )}
      </PlaybackContext.Provider>
    </div>
  );
};
