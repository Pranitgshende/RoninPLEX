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

export type SeekAmount = 5 | 10 | 15 | 30;

export type HomeSectionId =
  | 'hero'
  | 'continue_watching'
  | 'watchlist'
  | 'decision_helper'
  | 'recommended'
  | 'trending'
  | 'popular_movies'
  | 'popular_tv'
  | 'anime_spotlight'
  | 'ronin_picks'
  | 'adult_content'
  | 'top_rated_movies'
  | 'action_movies'
  | 'scifi_movies'
  | 'comedy_movies';

export interface HomeSectionItem {
  id: HomeSectionId;
  label: string;
  enabled: boolean;
}

export const DEFAULT_HOME_SECTIONS: HomeSectionItem[] = [
  { id: 'hero', label: 'Hero / Featured Title', enabled: true },
  { id: 'continue_watching', label: 'Continue Watching', enabled: true },
  { id: 'watchlist', label: 'My Watchlist', enabled: true },
  { id: 'trending', label: 'Trending Today', enabled: true },
  { id: 'popular_movies', label: 'Popular Movies', enabled: true },
  { id: 'popular_tv', label: 'Binge-Worthy TV Shows', enabled: true },
  { id: 'anime_spotlight', label: 'Anime Realm Spotlight', enabled: true },
  { id: 'recommended', label: 'Recommended For You', enabled: true },
  { id: 'ronin_picks', label: 'Ronin AI Picks', enabled: true },
  { id: 'adult_content', label: '18+ Mature Recommendations', enabled: true },
  { id: 'top_rated_movies', label: 'Top Rated Masterpieces', enabled: true },
];

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
  skipIntro: boolean;
  adultContent: boolean;
  showAdultRecommendations: boolean;
  // Playback & Built-in Player Engine
  seekAmount: SeekAmount;
  autoNextEpisode: boolean;
  autoNextCountdown: number; // in seconds, default 10
  defaultPlaybackSpeed: number;
  defaultVolume: number;
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
  skipIntro: false,
  adultContent: false,
  showAdultRecommendations: false,
  seekAmount: 10,
  autoNextEpisode: true,
  autoNextCountdown: 10,
  defaultPlaybackSpeed: 1,
  defaultVolume: 1,
};
