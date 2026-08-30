import { StreamingProvider } from './StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode, StreamingResult } from './types';
import { providerConfigService } from './providerConfig';
import { vidSrcToProvider } from './providers/VidSrcToProvider';
import { vidSrcMeProvider } from './providers/VidSrcMeProvider';
import { vidSrcDevProvider } from './providers/VidSrcDevProvider';
import { vidLinkProProvider } from './providers/VidLinkProProvider';
import { CustomConfigProvider } from './providers/CustomConfigProvider';
import { TwoEmbedProvider } from './providers/TwoEmbedProvider';

export interface FallbackAttempt {
  providerId: string;
  providerName: string;
  status: 'success' | 'failed' | 'skipped';
  reason?: string;
  timestamp: number;
}

export interface ProviderHealthRecord {
  failureCount: number;
  lastFailureTime: number;
  isDead: boolean;
}

export class StreamingManager {
  private providers = new Map<string, StreamingProvider>();
  private customProvider: CustomConfigProvider;
  private twoEmbedProvider: TwoEmbedProvider;
  private availabilityCache = new Map<string, { available: boolean; timestamp: number }>();
  private streamCache = new Map<string, { result: StreamingMovie | StreamingEpisode; timestamp: number }>();
  private providerHealth = new Map<string, ProviderHealthRecord>();
  private lastFallbackAttempts: FallbackAttempt[] = [];
  private readonly CACHE_TTL_MS = 60000; // 1 minute
  private readonly HEALTH_EXPIRATION_MS = 300000; // 5 minutes

  constructor() {
    this.customProvider = new CustomConfigProvider(providerConfigService.getConfig());
    this.twoEmbedProvider = new TwoEmbedProvider();

    // Register standard authorized providers
    this.registerProvider(vidSrcMeProvider);
    this.registerProvider(vidSrcToProvider);
    this.registerProvider(this.twoEmbedProvider);
    this.registerProvider(vidLinkProProvider);
    this.registerProvider(vidSrcDevProvider);
    this.registerProvider(this.customProvider);

    // Fast-fail parked/dead domains by default
    this.providerHealth.set('vidsrc-dev', {
      failureCount: 5,
      lastFailureTime: Date.now(),
      isDead: true,
    });

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
   * Records a failed stream resolution for a provider.
   */
  public recordProviderFailure(providerId: string, reason?: string): void {
    const current = this.providerHealth.get(providerId) || {
      failureCount: 0,
      lastFailureTime: 0,
      isDead: false,
    };

    const count = current.failureCount + 1;
    const isDead = providerId === 'vidsrc-dev' || count >= 4;

    this.providerHealth.set(providerId, {
      failureCount: count,
      lastFailureTime: Date.now(),
      isDead,
    });

    console.warn(`[StreamingManager] Recorded failure for ${providerId} (${count} failures). Reason: ${reason || 'unspecified'}`);
  }

  /**
   * Records a successful stream resolution for a provider, resetting failure counts.
   */
  public recordProviderSuccess(providerId: string): void {
    this.providerHealth.set(providerId, {
      failureCount: 0,
      lastFailureTime: 0,
      isDead: false,
    });
  }

  /**
   * Checks whether a provider is currently healthy or if failure penalty has expired.
   */
  public isProviderHealthy(providerId: string): boolean {
    const health = this.providerHealth.get(providerId);
    if (!health) return true;

    // Fast-fail parked or dead providers
    if (providerId === 'vidsrc-dev' || health.isDead) {
      // Allow re-testing dead providers after expiration
      if (Date.now() - health.lastFailureTime > this.HEALTH_EXPIRATION_MS * 2) {
        return true;
      }
      return false;
    }

    // Check if failure penalty has expired
    if (Date.now() - health.lastFailureTime > this.HEALTH_EXPIRATION_MS) {
      return true; // Expiration elapsed; eligible for retry
    }

    return health.failureCount < 2;
  }

  /**
   * Returns diagnostic health summary for all providers.
   */
  public getProviderHealthSummary(): Record<string, { failureCount: number; isHealthy: boolean; isDead: boolean }> {
    const summary: Record<string, { failureCount: number; isHealthy: boolean; isDead: boolean }> = {};
    for (const [id] of this.providers) {
      const record = this.providerHealth.get(id);
      summary[id] = {
        failureCount: record?.failureCount || 0,
        isHealthy: this.isProviderHealthy(id),
        isDead: Boolean(record?.isDead),
      };
    }
    return summary;
  }

  /**
   * Builds ordered list of eligible providers:
   * 1. The preferred/configured active provider (if healthy)
   * 2. Remaining registered healthy providers in deterministic priority
   * 3. Unhealthy/failing providers as secondary fallbacks
   */
  public getEligibleProviders(): StreamingProvider[] {
    const config = providerConfigService.getConfig();
    if (!config.isEnabled) {
      return [];
    }

    const activeId = providerConfigService.getActiveProviderId();
    const normalizedActiveId = activeId === 'vidsrc' ? 'vidsrc-to' : activeId;

    const activeProvider = this.providers.get(normalizedActiveId) || this.providers.get('vidsrc-me') || this.providers.get('vidsrc-to');
    const eligible: StreamingProvider[] = [];

    if (activeProvider) {
      eligible.push(activeProvider);
    }

    // Prioritized order: High-reliability unblocked providers first, secondary fallbacks next, parked/dead last
    const priorityOrder = ['vidsrc-me', 'vidsrc-to', '2embed', 'custom', 'vidlink', 'vidsrc-dev'];
    for (const id of priorityOrder) {
      const p = this.providers.get(id);
      if (p && !eligible.some(item => item.getId() === p.getId())) {
        if (id === 'custom' && !config.baseUrl) {
          continue;
        }
        eligible.push(p);
      }
    }

    // Include any third-party manually registered providers
    for (const [id, p] of this.providers) {
      if (!eligible.some(item => item.getId() === id)) {
        eligible.push(p);
      }
    }

    // Sort so healthy providers come first, unhealthy providers come last
    return eligible.sort((a, b) => {
      // Keep active provider first unless it's known dead
      if (a.getId() === normalizedActiveId && !this.providerHealth.get(a.getId())?.isDead) return -1;
      if (b.getId() === normalizedActiveId && !this.providerHealth.get(b.getId())?.isDead) return 1;

      const aHealthy = this.isProviderHealthy(a.getId()) ? 1 : 0;
      const bHealthy = this.isProviderHealthy(b.getId()) ? 1 : 0;
      return bHealthy - aHealthy;
    });
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
    if (!provider) return 'VidSrc Me (vidsrcme.ru)';
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
          this.recordProviderSuccess(pId);
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
        this.recordProviderFailure(pId, 'Stream marked unavailable by provider');
        this.lastFallbackAttempts.push({
          providerId: pId,
          providerName: pName,
          status: 'failed',
          reason: 'Stream marked unavailable by provider',
          timestamp: Date.now(),
        });
      } catch (err: any) {
        // Isolated provider error (timeout, network, 404, 401, 429)
        const reason = err?.message || 'Network or parse error';
        this.recordProviderFailure(pId, reason);
        this.lastFallbackAttempts.push({
          providerId: pId,
          providerName: pName,
          status: 'failed',
          reason,
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
          this.recordProviderSuccess(pId);
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

        this.recordProviderFailure(pId, 'Episode marked unavailable by provider');
        this.lastFallbackAttempts.push({
          providerId: pId,
          providerName: pName,
          status: 'failed',
          reason: 'Episode marked unavailable by provider',
          timestamp: Date.now(),
        });
      } catch (err: any) {
        const reason = err?.message || 'Network or parse error';
        this.recordProviderFailure(pId, reason);
        this.lastFallbackAttempts.push({
          providerId: pId,
          providerName: pName,
          status: 'failed',
          reason,
          timestamp: Date.now(),
        });
      }
    }

    this.availabilityCache.set(cacheKey, { available: false, timestamp: Date.now() });
    return null;
  }

  /**
   * Records that a stream was resolved, but playback failed at runtime
   * (e.g. black screen, iframe sandbox error, network error, or media error).
   * Penalizes provider and clears stream cache for this provider.
   */
  public reportPlaybackFailure(providerId: string, reason: string = 'Playback stalled or failed'): void {
    this.recordProviderFailure(providerId, `Playback Failure: ${reason}`);
    this.streamCache.clear();
  }

  public async getNextStream(
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    failedProviderIds: string[] = [],
    season?: number,
    episode?: number
  ): Promise<StreamingMovie | StreamingEpisode | null> {
    if (failedProviderIds.length > 0) {
      const lastFailed = failedProviderIds[failedProviderIds.length - 1];
      this.reportPlaybackFailure(lastFailed, 'Runtime failover requested');
      this.lastFallbackAttempts.push({
        providerId: lastFailed,
        providerName: this.providers.get(lastFailed)?.getName() || lastFailed,
        status: 'failed',
        reason: 'Runtime player failover',
        timestamp: Date.now(),
      });
    }

    const providers = this.getEligibleProviders();
    const candidates = failedProviderIds.length > 0
      ? providers.filter(p => !failedProviderIds.includes(p.getId()))
      : providers;

    for (const provider of candidates) {
      try {
        if (mediaType === 'movie') {
          const movie = await provider.getMovie(tmdbId);
          if (movie && movie.available && movie.stream?.url) {
            this.recordProviderSuccess(provider.getId());
            this.lastFallbackAttempts.push({
              providerId: provider.getId(),
              providerName: provider.getName(),
              status: 'success',
              timestamp: Date.now(),
            });
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
            this.recordProviderSuccess(provider.getId());
            this.lastFallbackAttempts.push({
              providerId: provider.getId(),
              providerName: provider.getName(),
              status: 'success',
              timestamp: Date.now(),
            });
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
      } catch (err: any) {
        this.recordProviderFailure(provider.getId(), err?.message || 'Error during failover');
        this.lastFallbackAttempts.push({
          providerId: provider.getId(),
          providerName: provider.getName(),
          status: 'failed',
          reason: err?.message || 'Error during failover',
          timestamp: Date.now(),
        });
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
