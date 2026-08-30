import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Movie, TVShow, MediaItem, VideoResult } from '../types/tmdb';
import { ScoredMediaItem } from '../types/recommendation';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const IMAGE_SIZES = {
  poster: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    original: 'original',
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original',
  },
  profile: {
    small: 'w45',
    medium: 'w185',
    large: 'h632',
    original: 'original',
  },
  still: {
    small: 'w185',
    medium: 'w300',
    original: 'original',
  },
};

export const PLACEHOLDER_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450' fill='%23131520'%3E%3Crect width='300' height='450' fill='%23131520'/%3E%3Cpath d='M150 190c-16.5 0-30-13.5-30-30s13.5-30 30-30 30 13.5 30 30-13.5 30-30 30zm0 20c26.7 0 80 13.4 80 40v20H70v-20c0-26.6 53.3-40 80-40z' fill='%23282c40'/%3E%3Ctext x='50%25' y='70%25' dominant-baseline='middle' text-anchor='middle' fill='%2358607a' font-family='sans-serif' font-size='15'%3ENo Poster Available%3C/text%3E%3C/svg%3E";

export const PLACEHOLDER_BACKDROP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720' fill='%23090a0f'%3E%3Crect width='1280' height='720' fill='%230e1019'/%3E%3Cpath d='M640 300c-33 0-60-27-60-60s27-60 60-60 60 27 60 60-27 60-60 60zm0 40c53.4 0 160 26.8 160 80v40H480v-40c0-53.2 106.6-80 160-80z' fill='%231e2130'/%3E%3Ctext x='50%25' y='65%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='sans-serif' font-size='24'%3ENo Backdrop Available%3C/text%3E%3C/svg%3E";

export function getPosterUrl(path: string | null | undefined, size: keyof typeof IMAGE_SIZES.poster = 'large'): string {
  if (!path) return PLACEHOLDER_POSTER;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${TMDB_IMAGE_BASE}/${IMAGE_SIZES.poster[size]}${path}`;
}

export function getBackdropUrl(path: string | null | undefined, size: keyof typeof IMAGE_SIZES.backdrop = 'original'): string {
  if (!path) return PLACEHOLDER_BACKDROP;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${TMDB_IMAGE_BASE}/${IMAGE_SIZES.backdrop[size]}${path}`;
}

export function getProfileUrl(path: string | null | undefined, size: keyof typeof IMAGE_SIZES.profile = 'medium'): string {
  if (!path) return PLACEHOLDER_POSTER;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${TMDB_IMAGE_BASE}/${IMAGE_SIZES.profile[size]}${path}`;
}

export function getStillUrl(path: string | null | undefined, size: keyof typeof IMAGE_SIZES.still = 'medium'): string {
  if (!path) return PLACEHOLDER_BACKDROP;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${TMDB_IMAGE_BASE}/${IMAGE_SIZES.still[size]}${path}`;
}

export function extractBestTrailerKey(videos?: VideoResult[]): string | null {
  if (!videos || videos.length === 0) return null;
  
  const youtubeVideos = videos.filter(v => v.site === 'YouTube');
  if (youtubeVideos.length === 0) return null;

  const officialTrailer = youtubeVideos.find(v => v.type === 'Trailer' && v.official);
  if (officialTrailer) return officialTrailer.key;

  const anyTrailer = youtubeVideos.find(v => v.type === 'Trailer');
  if (anyTrailer) return anyTrailer.key;

  const officialTeaser = youtubeVideos.find(v => v.type === 'Teaser' && v.official);
  if (officialTeaser) return officialTeaser.key;

  const teaserOrClip = youtubeVideos.find(v => v.type === 'Teaser' || v.type === 'Clip');
  if (teaserOrClip) return teaserOrClip.key;

  return youtubeVideos[0].key;
}

export function normalizeMedia(item: Movie | TVShow | ScoredMediaItem | MediaItem | any, explicitType?: 'movie' | 'tv' | 'anime'): MediaItem {
  // Handle Anime format
  if (explicitType === 'anime' || ('romajiTitle' in item && 'synopsis' in item)) {
    const anime = item;
    return {
      id: anime.id,
      title: anime.title,
      original_title: anime.romajiTitle || anime.nativeTitle || anime.title,
      overview: anime.synopsis,
      poster_path: anime.poster,
      backdrop_path: anime.banner || anime.poster,
      release_date: anime.year ? `${anime.year}-01-01` : '',
      vote_average: anime.score || 0,
      vote_count: 500,
      popularity: anime.popularity || 100,
      genre_ids: [],
      original_language: 'ja',
      media_type: 'anime' as any,
      adult: anime.isAdult,
      displayTitle: anime.title,
      displayDate: anime.year ? String(anime.year) : '',
      displayYear: anime.year ? String(anime.year) : '',
    } as any;
  }

  // Handle ScoredMediaItem format
  if ('posterPath' in item) {
    const scored = item as ScoredMediaItem;
    return {
      id: scored.id,
      title: scored.title,
      original_title: scored.title,
      overview: scored.overview,
      poster_path: scored.posterPath,
      backdrop_path: scored.backdropPath,
      release_date: scored.releaseDate,
      vote_average: scored.rating,
      vote_count: scored.voteCount,
      popularity: scored.rating * 10,
      genre_ids: scored.genreIds,
      original_language: 'en',
      media_type: scored.mediaType as 'movie',
      displayTitle: scored.title,
      displayDate: scored.releaseDate,
      displayYear: scored.releaseYear,
    } as MediaItem;
  }

  const isMovie = explicitType === 'movie' || ('title' in item && Boolean((item as Movie).title));
  if (isMovie) {
    const movie = item as Movie;
    const displayTitle = movie.title || movie.original_title || 'Untitled Movie';
    const displayDate = movie.release_date || '';
    const displayYear = displayDate ? displayDate.substring(0, 4) : '';
    return {
      ...movie,
      media_type: 'movie',
      displayTitle,
      displayDate,
      displayYear,
    };
  } else {
    const tv = item as TVShow;
    const displayTitle = tv.name || tv.original_name || 'Untitled Show';
    const displayDate = tv.first_air_date || '';
    const displayYear = displayDate ? displayDate.substring(0, 4) : '';
    return {
      ...tv,
      media_type: 'tv',
      displayTitle,
      displayDate,
      displayYear,
    };
  }
}
