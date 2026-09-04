import { StreamingProvider } from './StreamingProvider';
import { StreamingMovie, StreamingTVShow, StreamingEpisode, StreamingResult, ProviderCapabilities, ProviderState } from './types';
import { providerConfigService } from './providerConfig';
import { diagnostics } from '../diagnostics';
import { vidSrcToProvider } from './providers/VidSrcToProvider';
import { vidSrcMeProvider } from './providers/VidSrcMeProvider';
import { vidSrcDevProvider } from './providers/VidSrcDevProvider';
import { vidLinkProProvider } from './providers/VidLinkProProvider';
import { superEmbedProvider } from './providers/SuperEmbedProvider';
import { CustomConfigProvider } from './providers/CustomConfigProvider';
import { TwoEmbedProvider } from './providers/TwoEmbedProvider';
import { riveStreamProvider, RIVE_SERVERS, RiveServerType } from './providers/RiveStreamProvider';
import { animeSdkProvider } from './providers/AnimeSdkProvider';
import { AnimeStreamService } from '../anime/AnimeStreamService';
import { ContentLanguage } from '../anime/AnimeTypes';

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
  private statusListeners = new Set<(status: string) => void>();
  private readonly CACHE_TTL_MS = 60000; // 1 minute
  private readonly HEALTH_EXPIRATION_MS = 300000; // 5 minutes

  constructor() {
    this.customProvider = new CustomConfigProvider(providerConfigService.getConfig());
    this.twoEmbedProvider = new TwoEmbedProvider();

    // Register standard authorized providers with VidSrcME as default
    this.registerProvider(vidSrcMeProvider);
    this.registerProvider(riveStreamProvider);
    this.registerProvider(vidLinkProProvider);
    this.registerProvider(vidSrcToProvider);
    this.registerProvider(this.twoEmbedProvider);
    this.registerProvider(this.customProvider);
    this.registerProvider(superEmbedProvider);
    this.registerProvider(vidSrcDevProvider);
    this.registerProvider(animeSdkProvider);

    // Fast-fail parked/quarantined domains by default
    this.providerHealth.set('vidsrc-dev', {
      failureCount: 5,
      lastFailureTime: Date.now(),
      isDead: true,
    });
    this.providerHealth.set('superembed', {
      failureCount: 1,
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
   * Returns declared capabilities for a given provider.
   */
  public getProviderCapabilities(providerId: string): ProviderCapabilities {
    const provider = this.providers.get(providerId);
    if (provider && provider.getCapabilities) {
      return provider.getCapabilities();
    }
    return {
      playback: { embed: true, directStream: false },
      content: { movie: true, tv: true, anime: false },
      subtitles: { supported: false },
      download: { supported: false, requiresResolver: false, directDownload: false, resumable: false },
    };
  }

  /**
   * Returns current 6-state lifecycle for a given provider.
   * Strictly separates registration, verification, and transient operational health.
   */
  public getProviderState(providerId: string): ProviderState {
    const provider = this.providers.get(providerId);
    if (!provider) return 'unavailable';

    // Parked providers (e.g. superembed, vidsrc-dev) are explicitly quarantined
    if (provider.getState && provider.getState() === 'parked') {
      return 'parked';
    }
    if (providerId === 'superembed' || providerId === 'vidsrc-dev') {
      return 'parked';
    }

    const health = this.providerHealth.get(providerId);
    if (health?.isDead) {
      return 'parked';
    }

    // Check if provider is suffering from a transient failure
    if (health && health.failureCount > 0) {
      if (Date.now() - health.lastFailureTime <= this.HEALTH_EXPIRATION_MS) {
        return 'unavailable';
      }
    }

    // If verified, it is healthy; otherwise registered
    if (this.isProviderVerified(providerId)) {
      return 'healthy';
    }

    return 'registered';
  }

  /**
   * Returns whether a provider has been verified against live production endpoints.
   */
  public isProviderVerified(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    if (provider.isVerified) {
      return provider.isVerified();
    }
    return providerId !== 'superembed' && providerId !== 'vidsrc-dev';
  }

  /**
   * Records a failed stream resolution for a provider.
   * NOTE: Transient errors (timeout, 404, 429, etc.) mark the provider as 'unavailable',
   * but NEVER erase verified status and NEVER automatically park the provider.
   */
  public recordProviderFailure(providerId: string, reason?: string): void {
    const current = this.providerHealth.get(providerId) || {
      failureCount: 0,
      lastFailureTime: 0,
      isDead: false,
    };

    const count = current.failureCount + 1;
    // Only explicit quarantine states have isDead = true
    const isDead = providerId === 'vidsrc-dev' || providerId === 'superembed';

    this.providerHealth.set(providerId, {
      failureCount: count,
      lastFailureTime: Date.now(),
      isDead,
    });

    console.warn(`[StreamingManager] Recorded failure for ${providerId} (${count} failures). Reason: ${reason || 'unspecified'}`);
  }

  /**
   * Records a successful stream resolution for a provider, restoring healthy state.
   */
  public recordProviderSuccess(providerId: string): void {
    const isDead = providerId === 'vidsrc-dev' || providerId === 'superembed';
    this.providerHealth.set(providerId, {
      failureCount: 0,
      lastFailureTime: 0,
      isDead,
    });
  }

  /**
   * Checks whether a provider is currently healthy or eligible for retry.
   */
  public isProviderHealthy(providerId: string): boolean {
    return this.getProviderState(providerId) === 'healthy';
  }

  /**
   * Returns diagnostic health summary for all providers including state and verified status.
   */
  public getProviderHealthSummary(): Record<string, { failureCount: number; isHealthy: boolean; isDead: boolean; state: ProviderState; isVerified: boolean }> {
    const summary: Record<string, { failureCount: number; isHealthy: boolean; isDead: boolean; state: ProviderState; isVerified: boolean }> = {};
    for (const [id] of this.providers) {
      const record = this.providerHealth.get(id);
      summary[id] = {
        failureCount: record?.failureCount || 0,
        isHealthy: this.isProviderHealthy(id),
        isDead: this.getProviderState(id) === 'parked',
        state: this.getProviderState(id),
        isVerified: this.isProviderVerified(id),
      };
    }
    return summary;
  }

  /**
   * Builds ordered list of eligible providers:
   * 1. Strictly filters out parked providers (e.g. superembed, vidsrc-dev)
   * 2. Capability-filters by requested content type ('movie' | 'tv' | 'anime')
   * 3. Orders candidates according to priority:
   *    vidsrc-me (default) -> rive -> vidlink -> vidsrc-to -> 2embed -> custom
   * 4. Orders healthy providers first, transiently unavailable providers as secondary failover
   */
  public getEligibleProviders(contentType: 'movie' | 'tv' | 'anime' = 'movie'): StreamingProvider[] {
    const config = providerConfigService.getConfig();
    if (!config.isEnabled) {
      return [];
    }

    const activeId = providerConfigService.getActiveProviderId();
    const normalizedActiveId = activeId === 'vidsrc' ? 'vidsrc-to' : activeId;

    const candidateMap = new Map<string, StreamingProvider>();
    for (const [id, provider] of this.providers) {
      // 1. Strict Parked-Provider Exclusion: parked providers NEVER enter active resolution
      if (this.getProviderState(id) === 'parked') {
        continue;
      }

      // 2. Custom provider validation
      if (id === 'custom' && !config.baseUrl) {
        continue;
      }

      // 3. Content Capability Matching
      const capabilities = this.getProviderCapabilities(id);
      if (contentType === 'movie' && !capabilities.content.movie) {
        continue;
      }
      if (contentType === 'tv' && !capabilities.content.tv) {
        continue;
      }
      if (contentType === 'anime' && !capabilities.content.anime) {
        continue;
      }

      candidateMap.set(id, provider);
    }

    // Priority Ordering:
    // For Anime: 1. vidlink (primary), 2. anime-sdk (fallback)
    // For Movie/TV: 1. vidsrc-me (default), 2. rive, 3. vidlink, 4. vidsrc-to, 5. 2embed, 6. custom
    const priorityOrder = ['vidsrc-me', 'rive', 'vidlink', 'vidsrc-to', '2embed', 'custom'];
    const animePriorityOrder = ['vidlink', 'anime-sdk'];
    const targetOrder = contentType === 'anime' ? animePriorityOrder : priorityOrder;
    const eligible: StreamingProvider[] = [];

    // Active provider placed first if valid and not parked
    const activeProvider = candidateMap.get(normalizedActiveId);
    if (activeProvider) {
      eligible.push(activeProvider);
    }

    // Append remaining priority providers
    for (const id of targetOrder) {
      const p = candidateMap.get(id);
      if (p && !eligible.some(item => item.getId() === p.getId())) {
        eligible.push(p);
      }
    }

    // Include any remaining third-party registered providers
    for (const [id, p] of candidateMap) {
      if (!eligible.some(item => item.getId() === id)) {
        eligible.push(p);
      }
    }

    // Sort so healthy providers come first, transiently unavailable providers come last as fallback
    return eligible.sort((a, b) => {
      const aHealthy = this.isProviderHealthy(a.getId()) ? 1 : 0;
      const bHealthy = this.isProviderHealthy(b.getId()) ? 1 : 0;

      // Keep active provider first unless it is currently unavailable
      if (a.getId() === normalizedActiveId && aHealthy) return -1;
      if (b.getId() === normalizedActiveId && bHealthy) return 1;

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
   * Subscribes to live resolution status updates for the Player HUD.
   */
  public subscribeStatus(listener: (status: string) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public emitStatus(status: string): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (e) {
        console.warn('[StreamingManager] Error in status listener:', e);
      }
    });
  }

  /**
   * Returns available delivery/engine modes for a provider if supported (e.g. Rive modes).
   */
  public getAvailableModes(providerId?: string): { id: string; name: string; description?: string }[] {
    const id = providerId || this.getActiveProviderId();
    if (id === 'rive') {
      return riveStreamProvider.getAvailableModes();
    }
    return [];
  }

  /**
   * Sets the active mode for a provider.
   */
  public setProviderMode(providerId: string, modeId: string): void {
    if (providerId === 'rive') {
      riveStreamProvider.setMode(modeId as any);
      this.clearCache();
    }
  }

  /**
   * Gets the active mode for a provider.
   */
  public getProviderMode(providerId: string): string {
    if (providerId === 'rive') {
      return riveStreamProvider.getCurrentMode();
    }
    return 'standard';
  }

  /**
   * Returns available servers for a provider if supported.
   * (Maintained as an alias for getAvailableModes)
   */
  public getAvailableServers(providerId?: string): { id: string; name: string; description?: string }[] {
    return this.getAvailableModes(providerId);
  }

  /**
   * Sets the active server for a provider.
   */
  public setProviderServer(providerId: string, serverId: string): void {
    this.setProviderMode(providerId, serverId);
  }

  /**
   * Gets the active server for a provider.
   */
  public getProviderServer(providerId: string): string {
    return this.getProviderMode(providerId);
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
  public async checkAvailability(tmdbId: number, mediaType: 'movie' | 'tv' | 'anime'): Promise<boolean> {
    // Anime availability is handled by AnimeStreamService, not TMDB providers.
    // AniList IDs passed here would produce invalid TMDB lookups.
    if (mediaType === 'anime') {
      return false;
    }

    const cacheKey = `${mediaType}-${tmdbId}`;
    const cached = this.availabilityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.available;
    }

    const providers = this.getEligibleProviders(mediaType === 'movie' ? 'movie' : 'tv');
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

    const providers = this.getEligibleProviders('movie');
    this.lastFallbackAttempts = [];

    if (providers.length === 0) {
      return null;
    }

    for (const provider of providers) {
      const pId = provider.getId();
      const pName = provider.getName();
      this.emitStatus(`Connecting to ${pName}...`);

      try {
        const movie = await provider.getMovie(tmdbId);

        if (movie && movie.available && movie.stream?.url) {
          // Success! Record attempt and return
          this.recordProviderSuccess(pId);
          this.emitStatus(`Connected to ${pName}`);
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
        this.emitStatus(`${pName} unavailable. Trying fallback provider...`);
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
        diagnostics.warn('provider', 'Provider stream resolution failed', { providerId: pId, reason });
        this.recordProviderFailure(pId, reason);
        this.emitStatus(`${pName} connection failed. Trying fallback...`);
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
    this.emitStatus('All streaming providers unavailable.');
    this.availabilityCache.set(cacheKey, { available: false, timestamp: Date.now() });
    return null;
  }

  /**
   * Retrieves streaming TV show structure from active provider.
   */
  public async getTVShow(tmdbId: number): Promise<StreamingTVShow | null> {
    const providers = this.getEligibleProviders('tv');
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

    const providers = this.getEligibleProviders('tv');
    this.lastFallbackAttempts = [];

    if (providers.length === 0) {
      return null;
    }

    for (const provider of providers) {
      const pId = provider.getId();
      const pName = provider.getName();
      this.emitStatus(`Connecting to ${pName}...`);

      try {
        const ep = await provider.getTVEpisode(tmdbId, season, episode);

        if (ep && ep.available && ep.stream?.url) {
          this.recordProviderSuccess(pId);
          this.emitStatus(`Connected to ${pName}`);
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

        this.emitStatus(`${pName} unavailable. Trying fallback provider...`);
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
        diagnostics.warn('provider', 'Provider stream resolution failed', { providerId: pId, reason });
        this.recordProviderFailure(pId, reason);
        this.emitStatus(`${pName} connection failed. Trying fallback...`);
        this.lastFallbackAttempts.push({
          providerId: pId,
          providerName: pName,
          status: 'failed',
          reason,
          timestamp: Date.now(),
        });
      }
    }

    this.emitStatus('All streaming providers unavailable.');
    this.availabilityCache.set(cacheKey, { available: false, timestamp: Date.now() });
    return null;
  }

  /**
   * Records that a stream was resolved, but playback failed at runtime
   * (e.g. black screen, iframe sandbox error, network error, or media error).
   * Penalizes provider and clears stream cache for this provider.
   */
  public reportPlaybackFailure(providerId: string, reason: string = 'Playback stalled or failed'): void {
    diagnostics.warn('playback', 'Playback failure reported', { providerId, reason });
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

  /**
   * Directly resolves stream from a specific provider (used during explicit user provider selection in Player HUD).
   */
  public async getStreamFromProvider(
    providerId: string,
    tmdbId: number,
    contentType: 'movie' | 'tv' | 'anime',
    season?: number,
    episode?: number,
    malId?: number,
    language?: 'sub' | 'dub',
    animeTitle?: string,
    animeId?: string
  ): Promise<StreamingMovie | StreamingEpisode | null> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" is not registered`);
    }

    if (this.getProviderState(providerId) === 'parked') {
      throw new Error(`Provider "${provider.getName()}" is currently parked and unavailable`);
    }

    const pName = provider.getName();
    this.emitStatus(`Connecting to ${pName}...`);

    try {
      if (contentType === 'movie') {
        const movie = await provider.getMovie(tmdbId);
        if (movie && movie.available && movie.stream?.url) {
          this.recordProviderSuccess(providerId);
          this.emitStatus(`Connected to ${pName}`);
          const enrichedMovie: StreamingMovie = {
            ...movie,
            stream: {
              ...movie.stream,
              providerName: pName,
              providerId: providerId,
              embedPolicy: movie.stream?.embedPolicy || provider.getEmbedPolicy?.(),
            },
          };
          this.streamCache.set(`movie-${tmdbId}`, { result: enrichedMovie, timestamp: Date.now() });
          return enrichedMovie;
        }
        this.recordProviderFailure(providerId, 'Stream marked unavailable by provider');
        throw new Error(`${pName} reported content unavailable`);
      } else if (contentType === 'tv') {
        const s = season ?? 1;
        const e = episode ?? 1;
        const ep = await provider.getTVEpisode(tmdbId, s, e);
        if (ep && ep.available && ep.stream?.url) {
          this.recordProviderSuccess(providerId);
          this.emitStatus(`Connected to ${pName}`);
          const enrichedEpisode: StreamingEpisode = {
            ...ep,
            stream: {
              ...ep.stream,
              providerName: pName,
              providerId: providerId,
              embedPolicy: ep.stream?.embedPolicy || provider.getEmbedPolicy?.(),
            },
          };
          this.streamCache.set(`tv-${tmdbId}-s${s}-e${e}`, { result: enrichedEpisode, timestamp: Date.now() });
          return enrichedEpisode;
        }
        this.recordProviderFailure(providerId, 'Stream marked unavailable by provider');
        throw new Error(`${pName} reported episode S${s}E${e} unavailable`);
      } else {
        // Anime resolution
        const epNum = episode ?? 1;
        const lang = language ?? 'sub';
        if (providerId === 'vidlink') {
          if (!malId || malId <= 0) {
            throw new Error(`VidLink Anime requires a valid MyAnimeList (MAL) ID. No MAL mapping found for this title.`);
          }
          const ep = await provider.getAnimeEpisode?.(malId, epNum, lang);
          if (ep && ep.available && ep.stream?.url) {
            this.recordProviderSuccess(providerId);
            this.emitStatus(`Connected to ${pName}`);
            return ep;
          }
          this.recordProviderFailure(providerId, 'VidLink stream unavailable');
          throw new Error(`${pName} reported anime episode ${epNum} unavailable`);
        } else {
          // Anime SDK sidecar fallback
          const stream = await AnimeStreamService.resolveEpisodeStream(
            animeTitle || 'Anime',
            epNum,
            lang === 'dub' ? ContentLanguage.DUB : ContentLanguage.SUB,
            animeId,
            0,
            malId,
            'anime-sdk'
          );
          if (stream && stream.sourceUrl) {
            this.recordProviderSuccess(providerId);
            this.emitStatus(`Connected to ${pName}`);
            return {
              episodeNumber: epNum,
              title: `Episode ${epNum}`,
              available: true,
              stream: {
                available: true,
                type: stream.isHLS ? 'hls' : 'mp4',
                isEmbed: stream.isEmbed,
                url: stream.sourceUrl,
                providerName: pName,
                providerId: 'anime-sdk',
                quality: stream.quality,
                subtitles: stream.subtitles,
                subtitlesAvailable: stream.subtitlesAvailable,
                videoAvailable: stream.videoAvailable,
                audioAvailable: stream.audioAvailable,
              },
            };
          }
          this.recordProviderFailure(providerId, 'Anime SDK sidecar stream unavailable');
          throw new Error(`${pName} reported stream unavailable`);
        }
      }
    } catch (err: any) {
      const reason = err?.message || 'Failed to resolve stream';
      diagnostics.warn('provider', 'Explicit provider switch resolution failed', { providerId, reason });
      this.recordProviderFailure(providerId, reason);
      this.emitStatus(`${pName} connection failed: ${reason}`);
      throw err;
    }
  }
}

export const streamingManager = new StreamingManager();
