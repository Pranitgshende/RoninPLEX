import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode } from '../types';

export class VidSrcProvider implements StreamingProvider {
  private id = 'vidsrc';
  private name = 'VidSrc (vidsrc.to)';
  private baseUrl = 'https://vidsrc.to';

  getName(): string {
    return this.name;
  }

  getId(): string {
    return this.id;
  }

  async testConnection(): Promise<boolean> {
    try {
      // In browser contexts, direct fetch to embed endpoints can be subject to CORS,
      // but an image or ping check or checking online status verifies client connectivity.
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async getMovie(tmdbId: number): Promise<StreamingMovie | null> {
    if (!tmdbId) return null;

    const streamUrl = `${this.baseUrl}/embed/movie/${tmdbId}`;

    return {
      providerId: this.id,
      tmdbId,
      title: 'Movie',
      type: 'movie',
      available: true,
      stream: {
        available: true,
        type: 'embed',
        url: streamUrl,
        providerName: this.name,
        quality: 'Auto HD',
      },
    };
  }

  async getTVShow(tmdbId: number): Promise<StreamingTVShow | null> {
    if (!tmdbId) return null;

    return {
      providerId: this.id,
      tmdbId,
      title: 'TV Series',
      type: 'tv',
      available: true,
      seasons: [],
    };
  }

  async getTVEpisode(tmdbId: number, season: number, episode: number): Promise<StreamingEpisode | null> {
    if (!tmdbId) return null;

    const streamUrl = `${this.baseUrl}/embed/tv/${tmdbId}/${season}/${episode}`;

    return {
      episodeNumber: episode,
      seasonNumber: season,
      title: `Episode ${episode}`,
      available: true,
      stream: {
        available: true,
        type: 'embed',
        url: streamUrl,
        providerName: this.name,
        quality: 'Auto HD',
      },
    };
  }
}

export const vidSrcProvider = new VidSrcProvider();
