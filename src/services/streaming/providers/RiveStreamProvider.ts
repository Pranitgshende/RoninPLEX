import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode, StreamingResult, EmbedPolicy, DEFAULT_SECURE_SANDBOX, DEFAULT_ALLOW_POLICY, ProviderCapabilities, ProviderState } from '../types';

export type RiveModeType = 'standard' | 'aggregator' | 'torrent';
export type RiveServerType = RiveModeType;

export interface RiveModeOption {
  id: RiveModeType;
  name: string;
  description: string;
}
export type RiveServerOption = RiveModeOption;

export const RIVE_MODES: RiveModeOption[] = [
  { id: 'standard', name: 'Standard CDN', description: 'Default high-speed direct stream embed' },
  { id: 'aggregator', name: 'Aggregator', description: 'Multi-source failover aggregator stream' },
  { id: 'torrent', name: 'Torrent (Debrid)', description: 'Debrid/torrent-backed high bitrate stream' },
];
export const RIVE_SERVERS: RiveServerOption[] = RIVE_MODES;

export class RiveStreamProvider implements StreamingProvider {
  private readonly baseUrl = 'https://www.rivestream.app';
  private currentMode: RiveModeType = 'standard';
  private state: ProviderState = 'healthy';

  getName(): string {
    return 'RiveStream (rivestream.app)';
  }

  getId(): string {
    return 'rive';
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
        supported: true,
        inManifest: true,
      },
      download: {
        supported: true,
        requiresResolver: true,
        directDownload: false,
        resumable: false,
      },
      modes: ['standard', 'aggregator', 'torrent'],
      servers: RIVE_SERVERS,
    };
  }

  setMode(mode: RiveModeType): void {
    this.currentMode = mode;
  }

  getCurrentMode(): RiveModeType {
    return this.currentMode;
  }

  getAvailableModes(): RiveModeOption[] {
    return RIVE_MODES;
  }

  // Backward compatibility server aliases
  setServer(server: RiveServerType): void {
    this.setMode(server);
  }

  getCurrentServer(): RiveServerType {
    return this.getCurrentMode();
  }

  getAvailableServers(): RiveServerOption[] {
    return this.getAvailableModes();
  }

  buildMovieUrl(tmdbId: number, mode: RiveModeType = this.currentMode): string {
    switch (mode) {
      case 'aggregator':
        return `${this.baseUrl}/embed/agg?type=movie&id=${tmdbId}`;
      case 'torrent':
        return `${this.baseUrl}/embed/torrent?type=movie&id=${tmdbId}`;
      case 'standard':
      default:
        return `${this.baseUrl}/embed?type=movie&id=${tmdbId}`;
    }
  }

  buildTvUrl(tmdbId: number, season: number, episode: number, mode: RiveModeType = this.currentMode): string {
    switch (mode) {
      case 'aggregator':
        return `${this.baseUrl}/embed/agg?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`;
      case 'torrent':
        return `${this.baseUrl}/embed/torrent?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`;
      case 'standard':
      default:
        return `${this.baseUrl}/embed?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(this.baseUrl, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors',
      });
      clearTimeout(timeoutId);
      return res.type === 'opaque' || res.ok;
    } catch {
      // In web/desktop environment with opaque responses, assume available unless confirmed dead
      return true;
    }
  }

  async getMovie(tmdbId: number): Promise<StreamingMovie | null> {
    const url = this.buildMovieUrl(tmdbId, this.currentMode);
    const stream: StreamingResult = {
      available: true,
      type: 'embed',
      url,
      providerId: this.getId(),
      providerName: this.getName(),
      quality: 'HD',
      embedPolicy: this.getEmbedPolicy(),
    };

    return {
      providerId: this.getId(),
      tmdbId,
      title: `Movie ${tmdbId}`,
      type: 'movie',
      available: true,
      stream,
    };
  }

  async getTVShow(tmdbId: number): Promise<StreamingTVShow | null> {
    return {
      providerId: this.getId(),
      tmdbId,
      title: `TV Show ${tmdbId}`,
      type: 'tv',
      available: true,
      seasons: [],
    };
  }

  async getTVEpisode(tmdbId: number, season: number, episode: number): Promise<StreamingEpisode | null> {
    const url = this.buildTvUrl(tmdbId, season, episode, this.currentMode);
    const stream: StreamingResult = {
      available: true,
      type: 'embed',
      url,
      providerId: this.getId(),
      providerName: this.getName(),
      quality: 'HD',
      embedPolicy: this.getEmbedPolicy(),
    };

    return {
      episodeNumber: episode,
      seasonNumber: season,
      title: `Episode ${episode}`,
      available: true,
      stream,
    };
  }

  getEmbedPolicy(): EmbedPolicy {
    return {
      sandbox: DEFAULT_SECURE_SANDBOX,
      allow: DEFAULT_ALLOW_POLICY,
      referrerPolicy: 'origin',
    };
  }
}

export const riveStreamProvider = new RiveStreamProvider();
