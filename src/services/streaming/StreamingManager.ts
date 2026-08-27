import { StreamingProvider } from './StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode } from './types';
import { demoProvider } from './providers/DemoProvider';
import { vidSrcProvider } from './providers/VidSrcProvider';
import { CustomConfigProvider } from './providers/CustomConfigProvider';
import { providerConfigService } from './providerConfig';

class StreamingManager {
  private customProvider: CustomConfigProvider;
  private availabilityCache = new Map<string, { available: boolean; timestamp: number }>();
  private readonly CACHE_TTL_MS = 60000; // 1 minute

  constructor() {
    this.customProvider = new CustomConfigProvider(providerConfigService.getConfig());

    // Listen for provider configuration changes
    if (typeof window !== 'undefined') {
      const handleProviderChange = () => {
        this.customProvider.updateConfig(providerConfigService.getConfig());
        this.availabilityCache.clear();
      };
      window.addEventListener('roninplex_provider_change', handleProviderChange);
      window.addEventListener('cinepulse_provider_change', handleProviderChange);
    }
  }

  /**
   * Resolves the currently active streaming provider instance
   */
  private getActiveProvider(): StreamingProvider | null {
    const config = providerConfigService.getConfig();
    if (!config.isEnabled) {
      return null;
    }

    const activeId = providerConfigService.getActiveProviderId();
    if (activeId === 'vidsrc') {
      return vidSrcProvider;
    }
    if (activeId === 'custom') {
      return this.customProvider;
    }
    if (activeId === 'demo') {
      return demoProvider;
    }
    return vidSrcProvider;
  }

  /**
   * Returns display name of active provider or indicates unconfigured state
   */
  getActiveProviderName(): string {
    const provider = this.getActiveProvider();
    if (!provider) return 'Disabled (Discovery Only)';
    return provider.getName();
  }

  getActiveProviderId(): string {
    return providerConfigService.getActiveProviderId();
  }

  setActiveProviderId(id: string): void {
    providerConfigService.setActiveProviderId(id);
    this.availabilityCache.clear();
  }

  /**
   * Tests connection to currently active provider
   */
  async testConnection(): Promise<boolean> {
    const provider = this.getActiveProvider();
    if (!provider) return false;
    return await provider.testConnection();
  }

  /**
   * Quick check for whether a title is available for streaming on active provider
   */
  async checkAvailability(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<boolean> {
    const provider = this.getActiveProvider();
    if (!provider) return false;

    const cacheKey = `${mediaType}-${tmdbId}`;
    const cached = this.availabilityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.available;
    }

    try {
      let isAvail = false;
      if (mediaType === 'movie') {
        const movie = await provider.getMovie(tmdbId);
        isAvail = !!(movie && movie.available && movie.stream?.url);
      } else {
        const tv = await provider.getTVShow(tmdbId);
        isAvail = !!(tv && tv.available);
      }

      this.availabilityCache.set(cacheKey, { available: isAvail, timestamp: Date.now() });
      return isAvail;
    } catch {
      return false;
    }
  }

  /**
   * Retrieves streaming movie metadata and stream URL from active provider
   */
  async getMovie(tmdbId: number): Promise<StreamingMovie | null> {
    const provider = this.getActiveProvider();
    if (!provider) return null;
    return await provider.getMovie(tmdbId);
  }

  /**
   * Retrieves streaming TV show structure from active provider
   */
  async getTVShow(tmdbId: number): Promise<StreamingTVShow | null> {
    const provider = this.getActiveProvider();
    if (!provider) return null;
    return await provider.getTVShow(tmdbId);
  }

  /**
   * Retrieves streaming episode data and stream URL from active provider
   */
  async getTVEpisode(tmdbId: number, season: number, episode: number): Promise<StreamingEpisode | null> {
    const provider = this.getActiveProvider();
    if (!provider) return null;
    return await provider.getTVEpisode(tmdbId, season, episode);
  }

  /**
   * Optional search query pass-through
   */
  async searchMovies(query: string): Promise<StreamingMovie[]> {
    const provider = this.getActiveProvider();
    if (!provider || !provider.searchMovies) return [];
    return await provider.searchMovies(query);
  }

  async searchTVShows(query: string): Promise<StreamingTVShow[]> {
    const provider = this.getActiveProvider();
    if (!provider || !provider.searchTVShows) return [];
    return await provider.searchTVShows(query);
  }
}

export const streamingManager = new StreamingManager();
