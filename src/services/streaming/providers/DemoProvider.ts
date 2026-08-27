import { StreamingProvider } from '../StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode } from '../types';

export class DemoProvider implements StreamingProvider {
  private id = 'demo';
  private name = 'RoninPLEX Demo Provider (Public Domain)';

  getName(): string {
    return this.name;
  }

  getId(): string {
    return this.id;
  }

  async testConnection(): Promise<boolean> {
    // Demo provider is always connected and ready
    return true;
  }

  async getMovie(tmdbId: number): Promise<StreamingMovie | null> {
    // Open-source Creative Commons / Public Domain test movies
    const sampleStreams = [
      {
        type: 'mp4' as const,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        quality: '1080p HD',
        subtitles: [
          {
            language: 'en',
            label: 'English',
            url: 'https://raw.githubusercontent.com/brenopolanski/html5-video-webvtt-example/master/subtitles.vtt',
            isDefault: true,
          }
        ]
      },
      {
        type: 'mp4' as const,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        quality: '1080p HD',
      },
      {
        type: 'mp4' as const,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        quality: '1080p HD',
      },
      {
        type: 'mp4' as const,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        quality: '720p HD',
      },
      {
        // Public HLS stream test (Akamai / Apple sample test stream)
        type: 'hls' as const,
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        quality: 'Adaptive HLS',
      }
    ];

    // Pick stream deterministically based on tmdbId
    const stream = sampleStreams[Math.abs(tmdbId) % sampleStreams.length];

    return {
      providerId: this.id,
      tmdbId,
      title: 'Demo Movie',
      type: 'movie',
      available: true,
      stream: {
        available: true,
        type: stream.type,
        url: stream.url,
        quality: stream.quality,
        subtitles: stream.subtitles,
        providerName: this.name,
      }
    };
  }

  async getTVShow(tmdbId: number): Promise<StreamingTVShow | null> {
    const episodes: StreamingEpisode[] = [
      {
        episodeNumber: 1,
        seasonNumber: 1,
        title: 'Episode 1: The Genesis',
        overview: 'In the opening chapter, ancient mysteries collide with future ambitions.',
        available: true,
        runtime: 48,
        stream: {
          available: true,
          type: 'mp4',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          quality: '1080p HD',
          providerName: this.name,
        }
      },
      {
        episodeNumber: 2,
        seasonNumber: 1,
        title: 'Episode 2: Divergence',
        overview: 'Tensions escalate as unforeseen adversaries threaten the fragile coalition.',
        available: true,
        runtime: 52,
        stream: {
          available: true,
          type: 'mp4',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          quality: '1080p HD',
          providerName: this.name,
        }
      },
      {
        episodeNumber: 3,
        seasonNumber: 1,
        title: 'Episode 3: The Ascent',
        overview: 'A daring gambit yields unexpected revelations and forces a sacrifice.',
        available: true,
        runtime: 45,
        stream: {
          available: true,
          type: 'mp4',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
          quality: '1080p HD',
          providerName: this.name,
        }
      }
    ];

    return {
      providerId: this.id,
      tmdbId,
      title: 'Demo TV Show',
      type: 'tv',
      available: true,
      seasons: [
        {
          seasonNumber: 1,
          name: 'Season 1',
          episodes,
        }
      ]
    };
  }

  async getTVEpisode(tmdbId: number, season: number, episode: number): Promise<StreamingEpisode | null> {
    const show = await this.getTVShow(tmdbId);
    const seasonData = show?.seasons?.find(s => s.seasonNumber === season);
    const ep = seasonData?.episodes.find(e => e.episodeNumber === episode);

    if (ep) return ep;

    // Fallback for higher episode numbers
    return {
      episodeNumber: episode,
      seasonNumber: season,
      title: `Episode ${episode}`,
      overview: `Streaming stream for Season ${season}, Episode ${episode}.`,
      available: true,
      stream: {
        available: true,
        type: 'mp4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        quality: '1080p HD',
        providerName: this.name,
      }
    };
  }
}

export const demoProvider = new DemoProvider();
