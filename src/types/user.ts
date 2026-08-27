import { MediaType } from './tmdb';

export interface WatchlistItem {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  releaseYear: string;
  genres: string[];
  addedAt: string; // ISO date string
  notes?: string;
}

export interface WatchedItem {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number; // TMDB rating
  userRating?: number; // 1-10 personal rating
  userLiked?: boolean; // thumbs up
  userDisliked?: boolean; // thumbs down
  releaseYear: string;
  genres: string[];
  watchedAt: string; // ISO date string
  review?: string;
}

export interface PlaybackProgress {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  currentTime: number; // in seconds
  duration: number; // in seconds
  progressPercent: number; // 0 - 100
  lastWatchedAt: string; // ISO date string
}

export interface UserPreferences {
  favoriteGenreIds: number[];
  favoriteActors: string[];
  favoriteDirectors: string[];
  preferredLanguages: string[];
  minRatingThreshold: number;
  onboardingCompleted: boolean;
  autoplayTrailer: boolean;
  enableHoverTrailers: boolean;
  reduceMotion: boolean;
  adultContent: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  favoriteGenreIds: [28, 878, 53], // Action, Sci-Fi, Thriller by default
  favoriteActors: [],
  favoriteDirectors: [],
  preferredLanguages: ['en'],
  minRatingThreshold: 6.5,
  onboardingCompleted: false,
  autoplayTrailer: true,
  enableHoverTrailers: true,
  reduceMotion: false,
  adultContent: false,
};
