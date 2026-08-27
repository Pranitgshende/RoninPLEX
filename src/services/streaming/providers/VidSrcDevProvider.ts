import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode, EmbedPolicy } from '../types';

export class VidSrcDevProvider implements StreamingProvider {
  private readonly id = 'vidsrc-dev';
  private readonly name = 'VidSrc Dev (vidsrc.dev)';
  private readonly baseUrl = 'https://vidsrc.dev';

  getName(): string {
    return this.name;
  }

  getId(): string {
    return this.id;
  }

  getEmbedPolicy(): EmbedPolicy {
    return {
      sandbox: 'allow-scripts allow-same-origin allow-forms allow-presentation',
      allow: 'autoplay; fullscreen; encrypted-media; picture-in-picture',
      referrerPolicy: 'origin',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return false;
      }
      const res = await fetch(this.baseUrl, { method: 'GET' });
      if (!res.ok) return false;
      const text = await res.text();
      if (text.includes('for sale') || text.includes('abovedomains')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async getMovie(tmdbId: number): Promise<StreamingMovie | null> {
    if (!tmdbId || isNaN(tmdbId)) return null;

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
      title: 'TV Series',
      type: 'tv',
      available: true,
      seasons: [],
    };
  }

  async getTVEpisode(tmdbId: number, season: number, episode: number): Promise<StreamingEpisode | null> {
    if (!tmdbId || isNaN(tmdbId)) return null;

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
        providerId: this.id,
        quality: 'Auto HD',
        embedPolicy: this.getEmbedPolicy(),
      },
    };
  }
}

export const vidSrcDevProvider = new VidSrcDevProvider();
