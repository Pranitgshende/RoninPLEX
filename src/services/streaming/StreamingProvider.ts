import { StreamingMovie, StreamingTVShow, StreamingEpisode } from './types';

export interface StreamingProvider {
  /**
   * Returns the display name of this provider
   */
  getName(): string;

  /**
   * Unique identifier for this provider
   */
  getId(): string;

  /**
   * Tests connectivity and authentication to the provider
   */
  testConnection(): Promise<boolean>;

  /**
   * Fetches movie stream availability and stream details by TMDB ID
   */
  getMovie(tmdbId: number): Promise<StreamingMovie | null>;

  /**
   * Fetches TV show stream availability and season structure by TMDB ID
   */
  getTVShow(tmdbId: number): Promise<StreamingTVShow | null>;

  /**
   * Fetches an individual TV episode stream details by TMDB ID, season, and episode number
   */
  getTVEpisode(tmdbId: number, season: number, episode: number): Promise<StreamingEpisode | null>;

  /**
   * Optional resolution for anime episodes by MAL ID, episode number, and sub/dub preference
   */
  getAnimeEpisode?(malId: number, episodeNumber: number, language?: 'sub' | 'dub'): Promise<StreamingEpisode | null>;

  /**
   * Optional search for movies available on this provider
   */
  searchMovies?(query: string): Promise<StreamingMovie[]>;

  /**
   * Optional search for TV shows available on this provider
   */
  searchTVShows?(query: string): Promise<StreamingTVShow[]>;

  /**
   * Optional provider-aware iframe embed policy.
   * Defines sandbox tokens, feature policy permissions, and referrer policy.
   */
  getEmbedPolicy?(): import('./types').EmbedPolicy;

  /**
   * Optional capability descriptor detailing supported media types, playback modes,
   * subtitle support, download mechanisms, and available servers.
   */
  getCapabilities?(): import('./types').ProviderCapabilities;

  /**
   * Optional provider lifecycle state.
   */
  getState?(): import('./types').ProviderState;

  /**
   * Whether the provider has been verified against live production endpoints.
   */
  isVerified?(): boolean;
}
