import { useState, useEffect } from 'react';
import { tmdb } from '../services/tmdb';
import { extractBestTrailerKey } from '../utils/helpers';
import { MediaType, VideoResult } from '../types/tmdb';

interface UseTrailerResult {
  trailerKey: string | null;
  isLoading: boolean;
  hasError: boolean;
  allVideos: VideoResult[];
}

export function useTrailer(id?: number | null, mediaType: MediaType = 'movie', initialVideos?: VideoResult[]): UseTrailerResult {
  const [trailerKey, setTrailerKey] = useState<string | null>(() => extractBestTrailerKey(initialVideos));
  const [allVideos, setAllVideos] = useState<VideoResult[]>(initialVideos || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!id) {
      setTrailerKey(null);
      setAllVideos([]);
      setIsLoading(false);
      return;
    }

    // If initialVideos already provided with valid trailer, use it
    if (initialVideos && initialVideos.length > 0) {
      const key = extractBestTrailerKey(initialVideos);
      setTrailerKey(key);
      setAllVideos(initialVideos);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    const fetchTrailer = async () => {
      try {
        if (mediaType === 'anime') {
          // Anime trailers are usually handled directly by AnimeService/AnimeMapper via URL strings.
          // Don't query TMDB for AniList IDs.
          setIsLoading(false);
          return;
        } else if (mediaType === 'movie') {
          const movie = await tmdb.getMovieDetails(id);
          if (!isMounted) return;
          const videos = movie?.videos?.results || [];
          setAllVideos(videos);
          setTrailerKey(extractBestTrailerKey(videos));
        } else {
          const tv = await tmdb.getTVDetails(id);
          if (!isMounted) return;
          const videos = tv?.videos?.results || [];
          setAllVideos(videos);
          setTrailerKey(extractBestTrailerKey(videos));
        }
      } catch (err) {
        if (isMounted) {
          console.warn(`Failed to fetch trailer for ${mediaType} ${id}:`, err);
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTrailer();

    return () => {
      isMounted = false;
    };
  }, [id, mediaType, initialVideos]);

  return { trailerKey, isLoading, hasError, allVideos };
}
