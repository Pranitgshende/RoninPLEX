import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode } from '../types';

export class VidSrcMeProvider implements StreamingProvider {
  private readonly id = 'vidsrc-me';
  private readonly name = 'VidSrc Me (vidsrcme.ru)';
  private readonly baseUrl = 'https://vidsrcme.ru';

  getName(): string {
    return this.name;
  }

  getId(): string {
    return this.id;
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
        quality: 'Auto HD',
      },
    };
  }
}

export const vidSrcMeProvider = new VidSrcMeProvider();
