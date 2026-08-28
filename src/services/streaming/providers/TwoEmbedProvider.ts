import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode, EmbedPolicy } from '../types';

export class TwoEmbedProvider implements StreamingProvider {
  private readonly id = '2embed';
  private readonly name = '2Embed (2embed.cc)';
  private readonly baseUrl = 'https://www.2embed.cc';

  getName(): string {
    return this.name;
  }

  getId(): string {
    return this.id;
  }

  getEmbedPolicy(): EmbedPolicy {
    return {
      sandbox: null,
      allow: 'autoplay; fullscreen; encrypted-media; picture-in-picture',
      referrerPolicy: 'origin',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async getMovie(tmdbId: number): Promise<StreamingMovie | null> {
    if (!tmdbId || isNaN(tmdbId)) return null;

    const streamUrl = `${this.baseUrl}/embed/${tmdbId}`;

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
        providerId: this.id,
        quality: 'Auto HD',
        embedPolicy: this.getEmbedPolicy(),
      },
    };
  }

  async getTVShow(tmdbId: number): Promise<StreamingTVShow | null> {
    if (!tmdbId || isNaN(tmdbId)) return null;

    return {
      providerId: this.id,
      tmdbId,
      title: 'TV Show',
      type: 'tv',
      available: true,
      seasons: [],
    };
  }

  async getTVEpisode(
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<StreamingEpisode | null> {
    if (!tmdbId || isNaN(tmdbId)) return null;

    const streamUrl = `${this.baseUrl}/embedtv/${tmdbId}&s=${seasonNumber}&e=${episodeNumber}`;

    return {
      episodeNumber,
      seasonNumber,
      title: `Episode ${episodeNumber}`,
      available: true,
      stream: {
        available: true,
        type: 'embed',
        url: streamUrl,
        providerName: this.name,
        providerId: this.id,
        quality: 'Auto HD',
        embedPolicy: this.getEmbedPolicy(),
      },
    };
  }
}

