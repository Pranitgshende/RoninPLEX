/**
 * ============================================================================
 * RONINPLEX STREAMING PROVIDER TEMPLATE
 * ============================================================================
 *
 * This file is a clean, fully documented template for implementing custom
 * streaming provider adapters.
 *
 * TO CREATE A NEW PROVIDER ADAPTER:
 * 1. Duplicate this file, e.g. `src/services/streaming/providers/ProviderA.ts`
 * 2. Implement the methods below according to your provider's JSON/REST format.
 * 3. Register your provider in `src/services/streaming/StreamingManager.ts`.
 *
 * IMPORTANT ARCHITECTURAL RULES:
 * - Never import React or UI components into this adapter.
 * - Return normalized models: StreamingMovie, StreamingTVShow, StreamingEpisode.
 * - Use StreamingHttpClient for automatic timeout, error handling, and security.
 * - Always handle missing streams gracefully by returning { available: false }.
 */

import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode } from '../types';
import { streamingHttpClient } from '../StreamingHttpClient';

export class ProviderTemplate implements StreamingProvider {
  // 1. PROVIDER IDENTIFICATION
  private readonly id = 'provider-template';
  private readonly name = 'Provider Template API';

  // 2. CONFIGURATION & CREDENTIALS
  // Replace these with your target API specifications or load from environment/storage
  private readonly baseUrl = 'https://api.your-authorized-provider.com/v1';
  private readonly apiKey = process.env.VITE_STREAMING_API_KEY || '';

  getName(): string {
    return this.name;
  }

  getId(): string {
    return this.id;
  }

  /**
   * 3. HEALTH & CONNECTIVITY CHECK
   * Called from /settings when the user tests the connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await streamingHttpClient.testEndpoint(`${this.baseUrl}/health`, {
        apiKey: this.apiKey,
        timeoutMs: 5000,
      });
      return response;
    } catch (err) {
      console.error(`[${this.name}] Connection test failed:`, err);
      return false;
    }
  }

  /**
   * 4. MOVIE LOOKUP
   * Looks up a movie by TMDB ID and returns the streaming source
   */
  async getMovie(tmdbId: number): Promise<StreamingMovie | null> {
    try {
      // Example endpoint: GET https://api.your-provider.com/v1/movies?tmdb_id=123
      const data = await streamingHttpClient.get<any>(`${this.baseUrl}/movies`, {
        params: { tmdb_id: tmdbId },
        apiKey: this.apiKey,
      });

      // Check if title is available in provider's catalog
      if (!data || !data.stream_url) {
        return {
          providerId: this.id,
          tmdbId,
          title: data?.title || 'Unknown Title',
          type: 'movie',
          available: false,
        };
      }

      // Map response to standard StreamingMovie
      return {
        providerId: this.id,
        tmdbId,
        title: data.title,
        type: 'movie',
        available: true,
        stream: {
          available: true,
          type: data.format === 'hls' ? 'hls' : 'mp4', // 'hls' | 'mp4' | 'embed'
          url: data.stream_url,
          quality: data.quality || '1080p',
          subtitles: data.subtitles?.map((sub: any) => ({
            language: sub.lang,
            label: sub.label,
            url: sub.vtt_url,
            isDefault: sub.is_default || false,
          })),
          providerName: this.name,
        },
      };
    } catch (err) {
      console.warn(`[${this.name}] Error fetching movie ${tmdbId}:`, err);
      return null;
    }
  }

  /**
   * 5. TV SHOW METADATA & SEASON HIERARCHY
   */
  async getTVShow(tmdbId: number): Promise<StreamingTVShow | null> {
    try {
      // Example endpoint: GET https://api.your-provider.com/v1/shows?tmdb_id=123
      const data = await streamingHttpClient.get<any>(`${this.baseUrl}/shows`, {
        params: { tmdb_id: tmdbId },
        apiKey: this.apiKey,
      });

      if (!data) return null;

      return {
        providerId: this.id,
        tmdbId,
        title: data.title || data.name,
        type: 'tv',
        available: data.available !== false,
        seasons: data.seasons || [],
      };
    } catch (err) {
      console.warn(`[${this.name}] Error fetching TV show ${tmdbId}:`, err);
      return null;
    }
  }

  /**
   * 6. INDIVIDUAL TV EPISODE LOOKUP
   */
  async getTVEpisode(tmdbId: number, season: number, episode: number): Promise<StreamingEpisode | null> {
    try {
      // Example endpoint: GET https://api.your-provider.com/v1/episodes?tmdb_id=123&season=1&episode=2
      const data = await streamingHttpClient.get<any>(`${this.baseUrl}/episodes`, {
        params: {
          tmdb_id: tmdbId,
          season,
          episode,
        },
        apiKey: this.apiKey,
      });

      if (!data || !data.stream_url) {
        return {
          episodeNumber: episode,
          seasonNumber: season,
          title: data?.title || `Episode ${episode}`,
          available: false,
        };
      }

      return {
        episodeNumber: episode,
        seasonNumber: season,
        title: data.title || `Episode ${episode}`,
        overview: data.overview,
        available: true,
        stream: {
          available: true,
          type: data.format === 'hls' ? 'hls' : 'mp4',
          url: data.stream_url,
          quality: data.quality || '1080p',
          subtitles: data.subtitles,
          providerName: this.name,
        },
      };
    } catch (err) {
      console.warn(`[${this.name}] Error fetching episode S${season}E${episode}:`, err);
      return null;
    }
  }

  /**
   * 7. OPTIONAL SEARCH
   */
  async searchMovies?(query: string): Promise<StreamingMovie[]> {
    try {
      const data = await streamingHttpClient.get<any>(`${this.baseUrl}/search/movies`, {
        params: { q: query },
        apiKey: this.apiKey,
      });
      return data.results || [];
    } catch {
      return [];
    }
  }
}
