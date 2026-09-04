import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode, EmbedPolicy, ProviderCapabilities, ProviderState } from '../types';

export class VidSrcMeProvider implements StreamingProvider {
  private readonly id = 'vidsrc-me';
  private readonly name = 'VidSrc Me (vidsrcme.ru)';
  private readonly baseUrl = 'https://vidsrcme.ru';
  private state: ProviderState = 'healthy';

  getName(): string {
    return this.name;
  }

  getId(): string {
    return this.id;
  }

  getState(): ProviderState {
    return this.state;
  }

  isVerified(): boolean {
    return true;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      playback: {
        embed: true,
        directStream: false,
      },
      content: {
        movie: true,
        tv: true,
        anime: false,
      },
      subtitles: {
        supported: false,
      },
      download: {
        supported: false,
        requiresResolver: false,
        directDownload: false,
        resumable: false,
      },
    };
  }

  getEmbedPolicy(): EmbedPolicy {
    return {
      // vidsrcme.ru runs sbx.js (anti-sandbox blocker) which explicitly checks document.domain
      // and blocks any sandboxed frames.
      // Omitting the sandbox attribute allows legitimate player initialization
      // while top-level navigation is prevented by Tauri's native navigation guard.
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

export const vidSrcMeProvider = new VidSrcMeProvider();
