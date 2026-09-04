import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode, EmbedPolicy, ProviderCapabilities, ProviderState } from '../types';

/**
 * SuperEmbed / MultiEmbed Provider.
 * 
 * AUDIT & VERIFICATION STATUS: PARKED
 * Runtime probe on 2026-09-04 against https://multiembed.mov/directstream.php?video_id=550
 * returned HTTP 403 Forbidden (Cloudflare anti-bot challenge).
 * 
 * Per Phase 1 architectural requirements, this provider is explicitly quarantined with state: 'parked'
 * and isVerified: false, strictly excluding it from the active playback fallback pipeline.
 */
export class SuperEmbedProvider implements StreamingProvider {
  private readonly id = 'superembed';
  private readonly name = 'SuperEmbed (multiembed.mov)';
  private readonly baseUrl = 'https://multiembed.mov';
  private state: ProviderState = 'parked';

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
    return false;
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
      sandbox: 'allow-scripts allow-same-origin allow-forms allow-presentation',
      allow: 'autoplay; fullscreen; encrypted-media; picture-in-picture',
      referrerPolicy: 'origin',
    };
  }

  async testConnection(): Promise<boolean> {
    // Fails connection check because multiembed.mov blocks direct/automated access with Cloudflare 403
    return false;
  }

  async getMovie(tmdbId: number): Promise<StreamingMovie | null> {
    if (!tmdbId || isNaN(tmdbId)) return null;

    // Endpoint modeled for future un-parking if legitimate access is restored
    const streamUrl = `${this.baseUrl}/directstream.php?video_id=${tmdbId}&tmdb=1`;

    return {
      providerId: this.id,
      tmdbId,
      title: 'Movie',
      type: 'movie',
      available: false, // Explicitly false while parked
      stream: {
        available: false,
        type: 'embed',
        url: streamUrl,
        providerName: this.name,
        providerId: this.id,
        quality: 'Auto HD',
        embedPolicy: this.getEmbedPolicy(),
        message: 'SuperEmbed is currently parked (Cloudflare 403 challenge).',
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
      available: false,
      seasons: [],
    };
  }

  async getTVEpisode(tmdbId: number, season: number, episode: number): Promise<StreamingEpisode | null> {
    if (!tmdbId || isNaN(tmdbId)) return null;

    const streamUrl = `${this.baseUrl}/directstream.php?video_id=${tmdbId}&s=${season}&e=${episode}&tmdb=1`;

    return {
      episodeNumber: episode,
      seasonNumber: season,
      title: `Episode ${episode}`,
      available: false,
      stream: {
        available: false,
        type: 'embed',
        url: streamUrl,
        providerName: this.name,
        providerId: this.id,
        quality: 'Auto HD',
        embedPolicy: this.getEmbedPolicy(),
        message: 'SuperEmbed is currently parked (Cloudflare 403 challenge).',
      },
    };
  }
}

export const superEmbedProvider = new SuperEmbedProvider();
