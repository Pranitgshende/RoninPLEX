export type StreamType = 'hls' | 'mp4' | 'embed';

export interface SubtitleTrack {
  language: string;
  label: string;
  url: string;
  isDefault?: boolean;
}

export interface EmbedPolicy {
  /**
   * The iframe sandbox attribute tokens, or null if the provider cannot function inside a sandboxed frame.
   * Permitted tokens: allow-scripts, allow-same-origin, allow-forms, allow-presentation.
   * Top-level navigation permissions (allow-top-navigation) are strictly prohibited.
   */
  sandbox?: string | null;
  /**
   * Feature policy permissions for the iframe (autoplay, fullscreen, etc.).
   */
  allow?: string;
  /**
   * Referrer policy for the embed iframe.
   */
  referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
}

export const DEFAULT_SECURE_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-presentation';
export const DEFAULT_ALLOW_POLICY = 'autoplay; fullscreen; encrypted-media; picture-in-picture';

export interface StreamingResult {
  available: boolean;
  type?: StreamType;
  url?: string;
  subtitles?: SubtitleTrack[];
  providerName?: string;
  providerId?: string;
  quality?: string;
  message?: string;
  embedPolicy?: EmbedPolicy;
}

export interface StreamingMovie {
  providerId: string;
  tmdbId?: number;
  title: string;
  type: 'movie';
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseDate?: string;
  year?: number;
  rating?: number;
  genres?: string[];
  duration?: number;
  available: boolean;
  stream?: StreamingResult;
}

export interface StreamingEpisode {
  episodeNumber: number;
  seasonNumber?: number;
  title: string;
  overview?: string;
  stillUrl?: string;
  airDate?: string;
  runtime?: number;
  available: boolean;
  stream?: StreamingResult;
}

export interface StreamingSeason {
  seasonNumber: number;
  name?: string;
  episodes: StreamingEpisode[];
}

export interface StreamingTVShow {
  providerId: string;
  tmdbId?: number;
  title: string;
  type: 'tv';
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  firstAirDate?: string;
  year?: number;
  rating?: number;
  genres?: string[];
  available: boolean;
  seasons?: StreamingSeason[];
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  apiToken: string;
  movieEndpoint: string;
  tvEndpoint: string;
  episodeEndpoint: string;
  searchEndpoint: string;
  isEnabled: boolean;
}

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  id: 'vidsrc',
  name: 'VidSrc (vidsrc.to)',
  baseUrl: 'https://vidsrc.to',
  apiKey: '',
  apiToken: '',
  movieEndpoint: '/embed/movie/{tmdbId}',
  tvEndpoint: '/embed/tv/{tmdbId}',
  episodeEndpoint: '/embed/tv/{tmdbId}/{season}/{episode}',
  searchEndpoint: '/search?q={query}',
  isEnabled: true,
};
