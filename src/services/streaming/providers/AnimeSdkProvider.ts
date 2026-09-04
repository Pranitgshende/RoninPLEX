import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode, ProviderCapabilities, ProviderState } from '../types';

export class AnimeSdkProvider implements StreamingProvider {
  private readonly id = 'anime-sdk';
  private readonly name = 'Anime SDK (Local Sidecar)';
  private readonly baseUrl = 'http://127.0.0.1:4173';
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
        embed: false,
        directStream: true,
      },
      content: {
        movie: false,
        tv: false,
        anime: true,
      },
      subtitles: {
        supported: true,
        inManifest: true,
        externalTracks: true,
      },
      download: {
        supported: false,
        requiresResolver: false,
        directDownload: false,
        resumable: false,
      },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getMovie(_tmdbId: number): Promise<StreamingMovie | null> {
    return null;
  }

  async getTVShow(_tmdbId: number): Promise<StreamingTVShow | null> {
    return null;
  }

  async getTVEpisode(_tmdbId: number, _season: number, _episode: number): Promise<StreamingEpisode | null> {
    return null;
  }
}

export const animeSdkProvider = new AnimeSdkProvider();
