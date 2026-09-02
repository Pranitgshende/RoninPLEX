import React, { useEffect, useState, useRef } from 'react';
import { pipService, PlaybackSnapshot } from '../../services/pip';
import { VideoPlayer } from './VideoPlayer';
import { PlaybackContext, PresentationMode } from '../../context/PlaybackContext';

import { AnimeVideoPlayer } from './anime/AnimeVideoPlayer';

export const PiPWindowApp: React.FC = () => {
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot | null>(null);

  useEffect(() => {
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
      pipService.broadcast({ 
        type: 'PIP_DESTROYED',
        payload: (pipService as any).snapshotProvider?.()
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (!snapshot) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white/50 text-sm">
        Initializing PiP...
      </div>
    );
  }

  const isAnime = snapshot.mediaType === 'anime';

  // We provide a mock PlaybackContext that uses the snapshot
  return (
    <div className="w-full h-screen bg-black overflow-hidden relative group">
      <div className="absolute inset-0 z-50 pointer-events-none" style={{ WebkitAppRegion: 'drag' } as any} />
      <PlaybackContext.Provider value={{
        mediaId: snapshot.mediaId,
        mediaType: snapshot.mediaType as any,
        seasonNumber: snapshot.seasonNumber || 1,
        episodeNumber: snapshot.episodeNumber || 1,
        streamResult: snapshot.streamResult,
        animeStreamSource: snapshot.animeStreamSource,
        animeLanguage: snapshot.language as any,
        presentationMode: 'PIP',
        // Mock functions that broadcast commands back to main
        play: () => {},
        closePlayer: () => pipService.broadcast({ type: 'COMMAND_STOP' }),
        handlePrevEpisode: () => {},
        handleNextEpisode: () => {},
        handleTryNextProvider: () => pipService.broadcast({ type: 'COMMAND_RETRY' }),
        setPresentationMode: (m: PresentationMode) => { if (m === 'FULL') pipService.broadcast({ type: 'COMMAND_CLOSE_PIP' }) },
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
            onBack={() => pipService.broadcast({ type: 'COMMAND_CLOSE_PIP' })}
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
            initialTime={snapshot.currentTime}
            initialIsPlaying={snapshot.isPlaying}
            isPipHost={true}
          />
        )}
      </PlaybackContext.Provider>
    </div>
  );
};
