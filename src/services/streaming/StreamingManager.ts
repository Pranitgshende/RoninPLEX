import { StreamingProvider } from './StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode, StreamingResult } from './types';
import { providerConfigService } from './providerConfig';
import { vidSrcToProvider } from './providers/VidSrcToProvider';
import { vidSrcMeProvider } from './providers/VidSrcMeProvider';
import { vidSrcDevProvider } from './providers/VidSrcDevProvider';
import { vidLinkProProvider } from './providers/VidLinkProProvider';
import { CustomConfigProvider } from './providers/CustomConfigProvider';

export interface FallbackAttempt {
  providerId: string;
  providerName: string;
  status: 'success' | 'failed' | 'skipped';
  reason?: string;
  timestamp: number;
}

export class StreamingManager {
  private providers = new Map<string, StreamingProvider>();
  private customProvider: CustomConfigProvider;
  private availabilityCache = new Map<string, { available: boolean; timestamp: number }>();
  private streamCache = new Map<string, { result: StreamingMovie | StreamingEpisode; timestamp: number }>();
  private lastFallbackAttempts: FallbackAttempt[] = [];
  private readonly CACHE_TTL_MS = 60000; // 1 minute

  constructor() {
    this.customProvider = new CustomConfigProvider(providerConfigService.getConfig());

    // Register standard authorized providers
    this.registerProvider(vidSrcToProvider);
    this.registerProvider(vidSrcMeProvider);
    this.registerProvider(vidSrcDevProvider);
    this.registerProvider(vidLinkProProvider);
    this.registerProvider(this.customProvider);

    // Listen for provider configuration changes
    if (typeof window !== 'undefined') {
      const handleProviderChange = () => {
        this.customProvider.updateConfig(providerConfigService.getConfig());
        this.availabilityCache.clear();
        this.streamCache.clear();
      };
      window.addEventListener('roninplex_provider_change', handleProviderChange);
    }
  }

  /**
   * Extension Point: Register a new streaming provider adapter.
   * Registered providers automatically participate in the fallback pipeline.
   */
  public registerProvider(provider: StreamingProvider): void {
    this.providers.set(provider.getId(), provider);
  }

  /**
   * Extension Point: Unregister a provider adapter.
   */
  public unregisterProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  /**
   * Returns all currently registered providers.
   */
  public getRegisteredProviders(): StreamingProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Returns the fallback attempt history from the most recent stream resolution.
   */
  public getLastFallbackAttempts(): FallbackAttempt[] {
    return [...this.lastFallbackAttempts];
  }

  /**
   * Clears in-memory stream & availability caches.
   */
  public clearCache(): void {
    this.availabilityCache.clear();
    this.streamCache.clear();
  }

  /**
   * Builds ordered list of eligible providers:
   * 1. The preferred/configured active provider
   * 2. Remaining registered providers in deterministic priority
   */
  public getEligibleProviders(): StreamingProvider[] {
    const config = providerConfigService.getConfig();
    if (!config.isEnabled) {
      return [];
    }

    const activeId = providerConfigService.getActiveProviderId();
    // Resolve alias (e.g. 'vidsrc' -> 'vidsrc-to')
    const normalizedActiveId = activeId === 'vidsrc' ? 'vidsrc-to' : activeId;

    const activeProvider = this.providers.get(normalizedActiveId) || this.providers.get('vidsrc-to');
    const eligible: StreamingProvider[] = [];

    if (activeProvider) {
      eligible.push(activeProvider);
    }

    // Append other registered providers in deterministic order
    const priorityOrder = ['vidsrc-to', 'vidsrc-me', 'vidsrc-dev', 'vidlink', 'custom'];
    for (const id of priorityOrder) {
      const p = this.providers.get(id);
      if (p && !eligible.some(item => item.getId() === p.getId())) {
        // Only include custom provider if base URL is configured
        if (id === 'custom' && !config.baseUrl) {
          continue;
        }
        eligible.push(p);
      }
    }

    // Include any third-party manually registered providers not in priorityOrder
    for (const [id, p] of this.providers) {
      if (!eligible.some(item => item.getId() === id)) {
        eligible.push(p);
      }
    }

    return eligible;
  }

  /**
   * Returns display name of active provider or indicates unconfigured state
   */
  public getActiveProviderName(): string {
    const config = providerConfigService.getConfig();
    if (!config.isEnabled) return 'Disabled (Discovery Only)';

    const activeId = providerConfigService.getActiveProviderId();
    const normalized = activeId === 'vidsrc' ? 'vidsrc-to' : activeId;
    const provider = this.providers.get(normalized);
    if (!provider) return 'VidSrc (vidsrc.to)';
    return provider.getName();
  }

  public getActiveProviderId(): string {
    const id = providerConfigService.getActiveProviderId();
    return id === 'vidsrc' ? 'vidsrc-to' : id;
  }

  public setActiveProviderId(id: string): void {
    providerConfigService.setActiveProviderId(id);
    this.clearCache();
  }

  /**
   * Tests connection to the currently active provider or a specific provider.
   */
  public async testConnection(providerId?: string): Promise<boolean> {
    const id = providerId || this.getActiveProviderId();
    const provider = this.providers.get(id);
    if (!provider) return false;
    try {
      return await provider.testConnection();
    } catch {
      return false;
    }
  }

  /**
   * Quick check for whether a title is available for streaming across eligible providers.
   */
  public async checkAvailability(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<boolean> {
    const cacheKey = `${mediaType}-${tmdbId}`;
    const cached = this.availabilityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.available;
    }

    const providers = this.getEligibleProviders();
    if (providers.length === 0) return false;

    // Fast check: check active provider or first available
    for (const provider of providers) {
      try {
        if (mediaType === 'movie') {
          const movie = await provider.getMovie(tmdbId);
          if (movie && movie.available && movie.stream?.url) {
            this.availabilityCache.set(cacheKey, { available: true, timestamp: Date.now() });
            return true;
          }
        } else {
          const tv = await provider.getTVShow(tmdbId);
          if (tv && tv.available) {
            this.availabilityCache.set(cacheKey, { available: true, timestamp: Date.now() });
            return true;
          }
        }
      } catch {
        continue;
      }
    }

    this.availabilityCache.set(cacheKey, { available: false, timestamp: Date.now() });
    return false;
  }

  /**
   * Retrieves streaming movie metadata with multi-provider fallback.
   * Attempts each eligible provider in sequence until a working stream is resolved.
   */
  public async getMovie(tmdbId: number): Promise<StreamingMovie | null> {
    const cacheKey = `movie-${tmdbId}`;
    const cached = this.streamCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.result as StreamingMovie;
    }

    const providers = this.getEligibleProviders();
    this.lastFallbackAttempts = [];

    if (providers.length === 0) {
      return null;
    }

    for (const provider of providers) {
      const pId = provider.getId();
      const pName = provider.getName();

      try {
        const movie = await provider.getMovie(tmdbId);

        if (movie && movie.available && movie.stream?.url) {
          // Success! Record attempt and return
          this.lastFallbackAttempts.push({
            providerId: pId,
            providerName: pName,
            status: 'success',
            timestamp: Date.now(),
          });

          // Ensure stream result carries active provider metadata & embed policy
          const enrichedMovie: StreamingMovie = {
            ...movie,
            stream: {
              ...movie.stream,
              providerName: pName,
              providerId: pId,
              embedPolicy: movie.stream?.embedPolicy || provider.getEmbedPolicy?.(),
            },
          };

          this.streamCache.set(cacheKey, { result: enrichedMovie, timestamp: Date.now() });
          this.availabilityCache.set(cacheKey, { available: true, timestamp: Date.now() });
          return enrichedMovie;
        }

        // Provider responded but content was unavailable
        this.lastFallbackAttempts.push({
          providerId: pId,
          providerName: pName,
          status: 'failed',
          reason: 'Stream marked unavailable by provider',
          timestamp: Date.now(),
        });
      } catch (err: any) {
        // Isolated provider error (timeout, network, 404, 401, 429)
        this.lastFallbackAttempts.push({
          providerId: pId,
          providerName: pName,
          status: 'failed',
          reason: err?.message || 'Network or parse error',
          timestamp: Date.now(),
        });
      }
    }

    // All eligible providers failed
    this.availabilityCache.set(cacheKey, { available: false, timestamp: Date.now() });
    return null;
  }

  /**
   * Retrieves streaming TV show structure from active provider.
   */
  public async getTVShow(tmdbId: number): Promise<StreamingTVShow | null> {
    const providers = this.getEligibleProviders();
    if (providers.length === 0) return null;

    for (const provider of providers) {
      try {
        const tv = await provider.getTVShow(tmdbId);
        if (tv && tv.available) {
          return tv;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * Retrieves streaming episode data and stream URL with multi-provider fallback.
   */
  public async getTVEpisode(tmdbId: number, season: number, episode: number): Promise<StreamingEpisode | null> {
    const cacheKey = `tv-${tmdbId}-s${season}-e${episode}`;
    const cached = this.streamCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.result as StreamingEpisode;
    }

    const providers = this.getEligibleProviders();
    this.lastFallbackAttempts = [];

    if (providers.length === 0) {
      return null;
    }

    for (const provider of providers) {
      const pId = provider.getId();
      const pName = provider.getName();

      try {
        const ep = await provider.getTVEpisode(tmdbId, season, episode);

        if (ep && ep.available && ep.stream?.url) {
          this.lastFallbackAttempts.push({
            providerId: pId,
            providerName: pName,
            status: 'success',
            timestamp: Date.now(),
          });

          const enrichedEp: StreamingEpisode = {
            ...ep,
            stream: {
              ...ep.stream,
              providerName: pName,
              providerId: pId,
              embedPolicy: ep.stream?.embedPolicy || provider.getEmbedPolicy?.(),
            },
          };

          this.streamCache.set(cacheKey, { result: enrichedEp, timestamp: Date.now() });
          this.availabilityCache.set(cacheKey, { available: true, timestamp: Date.now() });
          return enrichedEp;
        }

        this.lastFallbackAttempts.push({
          providerId: pId,
          providerName: pName,
          status: 'failed',
          reason: 'Episode marked unavailable by provider',
          timestamp: Date.now(),
        });
      } catch (err: any) {
        this.lastFallbackAttempts.push({
          providerId: pId,
          providerName: pName,
          status: 'failed',
          reason: err?.message || 'Network or parse error',
          timestamp: Date.now(),
        });
      }
    }

    this.availabilityCache.set(cacheKey, { available: false, timestamp: Date.now() });
    return null;
  }

  /**
   * Directly resolves the next alternative stream in the fallback chain
   * when a player encounters a runtime embed or buffer failure.
   */
  public async getNextStream(
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    failedProviderId?: string,
    season?: number,
    episode?: number
  ): Promise<StreamingMovie | StreamingEpisode | null> {
    const providers = this.getEligibleProviders();
    const candidates = failedProviderId
      ? providers.filter(p => p.getId() !== failedProviderId)
      : providers;

    for (const provider of candidates) {
      try {
        if (mediaType === 'movie') {
          const movie = await provider.getMovie(tmdbId);
          if (movie && movie.available && movie.stream?.url) {
            return {
              ...movie,
              stream: {
                ...movie.stream,
                providerName: provider.getName(),
                providerId: provider.getId(),
                embedPolicy: movie.stream?.embedPolicy || provider.getEmbedPolicy?.(),
              },
            };
          }
        } else if (season !== undefined && episode !== undefined) {
          const ep = await provider.getTVEpisode(tmdbId, season, episode);
          if (ep && ep.available && ep.stream?.url) {
            return {
              ...ep,
              stream: {
                ...ep.stream,
                providerName: provider.getName(),
                providerId: provider.getId(),
                embedPolicy: ep.stream?.embedPolicy || provider.getEmbedPolicy?.(),
              },
            };
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * Optional search query pass-through
   */
  public async searchMovies(query: string): Promise<StreamingMovie[]> {
    const providers = this.getEligibleProviders();
    for (const provider of providers) {
      if (provider.searchMovies) {
        try {
          const results = await provider.searchMovies(query);
          if (results && results.length > 0) return results;
        } catch {
          continue;
        }
      }
    }
    return [];
  }

  public async searchTVShows(query: string): Promise<StreamingTVShow[]> {
    const providers = this.getEligibleProviders();
    for (const provider of providers) {
      if (provider.searchTVShows) {
        try {
          const results = await provider.searchTVShows(query);
          if (results && results.length > 0) return results;
        } catch {
          continue;
        }
      }
    }
    return [];
  }
}

export const streamingManager = new StreamingManager();
