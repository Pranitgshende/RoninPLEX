import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode, ProviderConfig } from '../types';
import { streamingHttpClient } from '../StreamingHttpClient';

export class CustomConfigProvider implements StreamingProvider {
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  getName(): string {
    return this.config.name || 'Custom Configured Provider';
  }

  getId(): string {
    return 'custom';
  }

  updateConfig(newConfig: ProviderConfig): void {
    this.config = newConfig;
  }

  private resolveUrl(template: string, replacements: Record<string, string | number>): string {
    let url = template;
    Object.entries(replacements).forEach(([key, val]) => {
      url = url.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    });

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const base = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }

  async testConnection(): Promise<boolean> {
    if (!this.config.baseUrl) return false;

    // Direct embed providers don't serve CORS JSON for testEndpoint; check online status
    if (this.config.baseUrl.includes('embed') || this.config.baseUrl.includes('vidsrc')) {
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    return await streamingHttpClient.testEndpoint(this.config.baseUrl, {
      apiKey: this.config.apiKey,
      apiToken: this.config.apiToken,
    });
  }

  async getMovie(tmdbId: number): Promise<StreamingMovie | null> {
    if (!this.config.baseUrl || !this.config.movieEndpoint) return null;

    try {
      const url = this.resolveUrl(this.config.movieEndpoint, { tmdbId });

      // If the template is an embed URL pattern (e.g. /embed/movie/{tmdbId}), return directly
      if (url.includes('/embed/') || this.config.baseUrl.includes('embed') || this.config.baseUrl.includes('vidsrc')) {
        return {
          providerId: this.getId(),
          tmdbId,
          title: 'Movie',
          type: 'movie',
          available: true,
          stream: {
            available: true,
            type: 'embed',
            url,
            quality: 'Auto HD',
            providerName: this.getName(),
          },
        };
      }

      const data = await streamingHttpClient.get<any>(url, {
        apiKey: this.config.apiKey,
        apiToken: this.config.apiToken,
      });

      if (!data) return null;

      // Extract stream info from normalized or custom response
      const streamUrl = data.streamUrl || data.url || data.stream?.url;
      if (!streamUrl) {
        return {
          providerId: this.getId(),
          tmdbId,
          title: data.title || 'Movie',
          type: 'movie',
          available: false,
        };
      }

      return {
        providerId: this.getId(),
        tmdbId,
        title: data.title || 'Movie',
        type: 'movie',
        available: true,
        stream: {
          available: true,
          type: (data.type || data.stream?.type || (streamUrl.includes('.m3u8') ? 'hls' : streamUrl.includes('/embed') ? 'embed' : 'mp4')),
          url: streamUrl,
          quality: data.quality || 'HD',
          subtitles: data.subtitles || data.stream?.subtitles,
          providerName: this.getName(),
        },
      };
    } catch (err) {
      console.warn(`[CustomConfigProvider] Failed to fetch movie ${tmdbId}:`, err);
      return null;
    }
  }

  async getTVShow(tmdbId: number): Promise<StreamingTVShow | null> {
    if (!this.config.baseUrl || !this.config.tvEndpoint) return null;

    try {
      const url = this.resolveUrl(this.config.tvEndpoint, { tmdbId });

      if (url.includes('/embed/') || this.config.baseUrl.includes('embed') || this.config.baseUrl.includes('vidsrc')) {
        return {
          providerId: this.getId(),
          tmdbId,
          title: 'TV Series',
          type: 'tv',
          available: true,
          seasons: [],
        };
      }

      const data = await streamingHttpClient.get<any>(url, {
        apiKey: this.config.apiKey,
        apiToken: this.config.apiToken,
      });

      if (!data) return null;

      return {
        providerId: this.getId(),
        tmdbId,
        title: data.title || data.name || 'TV Show',
        type: 'tv',
        available: data.available !== false,
        seasons: data.seasons || [],
      };
    } catch (err) {
      console.warn(`[CustomConfigProvider] Failed to fetch TV show ${tmdbId}:`, err);
      return null;
    }
  }

  async getTVEpisode(tmdbId: number, season: number, episode: number): Promise<StreamingEpisode | null> {
    if (!this.config.baseUrl || !this.config.episodeEndpoint) return null;

    try {
      const url = this.resolveUrl(this.config.episodeEndpoint, { tmdbId, season, episode });

      if (url.includes('/embed/') || this.config.baseUrl.includes('embed') || this.config.baseUrl.includes('vidsrc')) {
        return {
          episodeNumber: episode,
          seasonNumber: season,
          title: `Episode ${episode}`,
          available: true,
          stream: {
            available: true,
            type: 'embed',
            url,
            quality: 'Auto HD',
            providerName: this.getName(),
          },
        };
      }

      const data = await streamingHttpClient.get<any>(url, {
        apiKey: this.config.apiKey,
        apiToken: this.config.apiToken,
      });

      if (!data) return null;

      const streamUrl = data.streamUrl || data.url || data.stream?.url;
      if (!streamUrl) {
        return {
          episodeNumber: episode,
          seasonNumber: season,
          title: data.title || `Episode ${episode}`,
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
          type: (data.type || data.stream?.type || (streamUrl.includes('.m3u8') ? 'hls' : streamUrl.includes('/embed') ? 'embed' : 'mp4')),
          url: streamUrl,
          quality: data.quality || 'HD',
          subtitles: data.subtitles || data.stream?.subtitles,
          providerName: this.getName(),
        },
      };
    } catch (err) {
      console.warn(`[CustomConfigProvider] Failed to fetch episode ${tmdbId} S${season}E${episode}:`, err);
      return null;
    }
  }
}
