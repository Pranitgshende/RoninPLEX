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

  const { play, setPresentationMode, presentationMode } = usePlayback();

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
    
    // When the watch route unmounts (e.g. user goes to Home), switch to PiP
    return () => {
      // NOTE: React Router reusing the component on param changes doesn't unmount it.
      // It only unmounts when navigating away from the Watch route completely!
      setPresentationMode('PIP');
    };
  }, [mediaId, mediaType, seasonNumber, episodeNumber, play, setPresentationMode]);

  // The actual player UI is rendered by PersistentPlayerHost inside App.tsx
  // We just return an empty container that acts as the background for FULL mode.
  return (
    <div className="w-full h-screen bg-black" aria-hidden="true" />
  );
};
