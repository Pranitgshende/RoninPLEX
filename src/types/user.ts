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

export interface DeclarativeCustomProvider {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  movieUrlTemplate: string;
  tvUrlTemplate: string;
  supportedTypes: ('movie' | 'tv')[];
  mode: 'embed';
}

export interface UserPreferences {
  preferencesSchemaVersion?: number;
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

  // General UI Customization
  accentColor: 'purple' | 'cyan' | 'rose' | 'amber' | 'emerald';
  uiDensity: 'compact' | 'comfortable' | 'spacious';
  cornerRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  enableGlassUI: boolean;
  glassOpacity: number;
  blurAmount: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderIntensity: 'subtle' | 'medium' | 'prominent' | 'none';
  glowIntensity: 'subtle' | 'medium' | 'vibrant' | 'none';

  // Card Styling Tokens
  enableGlassCards: boolean;
  cardGlassOpacity: number;
  cardBlurStrength: 'none' | 'sm' | 'md' | 'lg';
  cardBorderVisibility: boolean;
  cardBorderOpacity: number;
  cardGlow: boolean;
  cardCornerRadius: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl';
  cardElevation: 'none' | 'sm' | 'md' | 'lg' | '2xl';
  cardHoverIntensity: 'subtle' | 'normal' | 'lifted';
  cardBadgeStyle: 'glass' | 'solid' | 'minimal';
  cardBadgeVisibility: boolean;
  cardAnimationIntensity: 'subtle' | 'normal' | 'cinematic';
  cardMetadataDensity: 'compact' | 'normal' | 'detailed';

  // Animation Tokens
  globalAnimationIntensity: 'off' | 'reduced' | 'normal' | 'cinematic';
  scrambleAnimationIntensity: 'off' | 'fast' | 'cinematic';
  pageTransitionIntensity: 'instant' | 'subtle' | 'normal';
  hoverAnimations: boolean;
  glowAnimations: boolean;
  respectPrefersReducedMotion: boolean;

  // Player & Provider Configuration
  defaultProvider: string;
  defaultServer: string;
  autoProviderFallback: boolean;
  autoServerFallback: boolean;
  rememberLastProvider: boolean;
  rememberLastServer: boolean;
  playerHudStyle: 'glass-pill' | 'solid' | 'minimal';
  playerTitleVisibility: boolean;
  playerControlAutoHideTiming: number;

  // Layout Tokens
  contentDensity: 'compact' | 'comfortable' | 'spacious';
  shelfCardSize: 'compact' | 'normal' | 'large';

  // Custom User Providers
  customProviders: DeclarativeCustomProvider[];
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  preferencesSchemaVersion: 2,
  favoriteGenreIds: [28, 878, 53], // Action, Sci-Fi, Thriller by default
  favoriteActors: [],
  favoriteDirectors: [],
  preferredLanguages: ['en'],
  minRatingThreshold: 6.5,
  onboardingCompleted: false,
  autoplayTrailer: true,
  enableHoverTrailers: false,
  reduceMotion: false,
  skipIntro: false,
  adultContent: false,
  showAdultRecommendations: false,
  seekAmount: 10,
  autoNextEpisode: true,
  autoNextCountdown: 10,
  defaultPlaybackSpeed: 1,
  defaultVolume: 1,

  // General UI Defaults
  accentColor: 'purple',
  uiDensity: 'comfortable',
  cornerRadius: 'xl',
  enableGlassUI: true,
  glassOpacity: 45,
  blurAmount: 'md',
  borderIntensity: 'subtle',
  glowIntensity: 'subtle',

  // Card Styling Defaults
  enableGlassCards: true,
  cardGlassOpacity: 35,
  cardBlurStrength: 'md',
  cardBorderVisibility: true,
  cardBorderOpacity: 12,
  cardGlow: true,
  cardCornerRadius: 'rounded-xl',
  cardElevation: 'lg',
  cardHoverIntensity: 'normal',
  cardBadgeStyle: 'glass',
  cardBadgeVisibility: true,
  cardAnimationIntensity: 'normal',
  cardMetadataDensity: 'normal',

  // Animation Defaults
  globalAnimationIntensity: 'normal',
  scrambleAnimationIntensity: 'cinematic',
  pageTransitionIntensity: 'normal',
  hoverAnimations: true,
  glowAnimations: true,
  respectPrefersReducedMotion: true,

  // Player & Provider Defaults
  defaultProvider: 'vidsrc-me',
  defaultServer: 'standard',
  autoProviderFallback: true,
  autoServerFallback: true,
  rememberLastProvider: true,
  rememberLastServer: true,
  playerHudStyle: 'glass-pill',
  playerTitleVisibility: true,
  playerControlAutoHideTiming: 3.0,

  // Layout Defaults
  contentDensity: 'comfortable',
  shelfCardSize: 'normal',

  // Custom Providers
  customProviders: [],
};

