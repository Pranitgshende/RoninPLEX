import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode, EmbedPolicy, ProviderCapabilities, ProviderState } from '../types';

export class VidLinkProProvider implements StreamingProvider {
  private readonly id = 'vidlink';
  private readonly name = 'VidLink Pro (vidlink.pro)';
  private readonly baseUrl = 'https://vidlink.pro';
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
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  getEmbedPolicy(): EmbedPolicy {
    return {
      sandbox: 'allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock',
      allow: 'autoplay; fullscreen; encrypted-media; picture-in-picture',
      referrerPolicy: 'origin',
    };
  }

  async getMovie(tmdbId: number): Promise<StreamingMovie | null> {
    if (!tmdbId || isNaN(tmdbId)) return null;

    const streamUrl = `${this.baseUrl}/movie/${tmdbId}`;

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

    const streamUrl = `${this.baseUrl}/tv/${tmdbId}/${season}/${episode}`;

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

  async getAnimeEpisode(malId: number, episodeNumber: number, language: 'sub' | 'dub' = 'sub'): Promise<StreamingEpisode | null> {
    if (!malId || isNaN(malId) || malId <= 0) return null;
    if (!episodeNumber || isNaN(episodeNumber) || episodeNumber <= 0) return null;

    const normalizedLang = language === 'dub' ? 'dub' : 'sub';
    const streamUrl = `${this.baseUrl}/anime/${malId}/${episodeNumber}/${normalizedLang}?fallback=true`;
    const isSub = normalizedLang === 'sub';

    return {
      episodeNumber,
      title: `Episode ${episodeNumber}`,
      available: true,
      stream: {
        available: true,
        type: 'embed',
        isEmbed: true,
        url: streamUrl,
        providerName: this.name,
        providerId: this.id,
        quality: 'Auto HD',
        embedPolicy: this.getEmbedPolicy(),
        // VidLink embeds manage subtitles internally within their cross-origin player (rendered for sub streams).
        // The RoninPLEX host window cannot inspect, extract, or control individual WebVTT tracks due to Same-Origin Policy (SOP).
        subtitlesAvailable: isSub,
        subtitleInspectionStatus: 'managed_by_embed',
        subtitleNote: isSub
          ? 'Subtitles are rendered and managed internally by the VidLink embed player. Direct track inspection and DOM manipulation are restricted by browser Same-Origin Policy (SOP).'
          : 'Dub audio stream selected; embed subtitles disabled.',
        subtitles: [],
        videoAvailable: true,
        audioAvailable: true,
      },
    };
  }
}

export const vidLinkProProvider = new VidLinkProProvider();
