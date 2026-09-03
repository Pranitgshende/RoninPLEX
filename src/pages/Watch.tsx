import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { usePlayback, PlaybackType } from '../context/PlaybackContext';
import { useAppReadyWhen } from '../hooks/useAppReadyWhen';

export const Watch: React.FC = () => {
  const { id, season: seasonParam, episode: episodeParam } = useParams<{
    id: string;
    season?: string;
    episode?: string;
  }>();
  const location = useLocation();

  const { play, setPresentationMode, presentationMode, closePlayer } = usePlayback();
  const presentationModeRef = React.useRef(presentationMode);
  presentationModeRef.current = presentationMode;

  const mediaId = id ? parseInt(id, 10) : 0;
  const isAnime = location.pathname.startsWith('/watch/anime');
  const isTV = Boolean(!isAnime && seasonParam !== undefined && episodeParam !== undefined);
  
  const mediaType: PlaybackType = isAnime ? 'anime' : isTV ? 'tv' : 'movie';
  const seasonNumber = seasonParam ? parseInt(seasonParam, 10) : undefined;
  const episodeNumber = episodeParam ? parseInt(episodeParam, 10) : undefined;

  // Signal route readiness (for Phase 5 integration)
  // We can say it's ready immediately since the player host is global and loading overlay will render there
  useAppReadyWhen(true);

  useEffect(() => {
    if (mediaId && mediaType) {
      play(mediaId, mediaType, seasonNumber, episodeNumber);
    }
    
    // When this component mounts, we want full screen mode
    setPresentationMode('FULL');
    
    return () => {
      // NOTE: Navigating away from the Watch route (e.g. Back button) must NOT enter PiP.
      // PiP is an explicit user action. If not in PiP, close playback session cleanly.
      if (presentationModeRef.current !== 'PIP') {
        closePlayer();
      }
    };
  }, [mediaId, mediaType, seasonNumber, episodeNumber, play, setPresentationMode, closePlayer]);

  // The actual player UI is rendered by PersistentPlayerHost inside App.tsx
  // We just return an empty container that acts as the background for FULL mode.
  return (
    <div className="w-full h-screen bg-black" aria-hidden="true" />
  );
};
