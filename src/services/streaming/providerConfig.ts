import { ProviderConfig, DEFAULT_PROVIDER_CONFIG } from './types';

const STORAGE_KEY = 'roninplex_streaming_provider_config';
const LEGACY_STORAGE_KEY = 'cinepulse_streaming_provider_config';
const ACTIVE_PROVIDER_KEY = 'roninplex_active_streaming_provider_id';
const LEGACY_ACTIVE_PROVIDER_KEY = 'cinepulse_active_streaming_provider_id';

export class ProviderConfigService {
  private inMemoryConfig: ProviderConfig = { ...DEFAULT_PROVIDER_CONFIG };
  private inMemoryActiveId: string = 'vidsrc-me';

  getConfig(): ProviderConfig {
    if (typeof localStorage === 'undefined') {
      return this.inMemoryConfig;
    }

    try {
      let stored = localStorage.getItem(STORAGE_KEY);
      if (!stored && localStorage.getItem(LEGACY_STORAGE_KEY)) {
        stored = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (stored) {
          localStorage.setItem(STORAGE_KEY, stored);
        }
      }
      if (!stored) return this.inMemoryConfig;
      return {
        ...DEFAULT_PROVIDER_CONFIG,
        ...JSON.parse(stored),
      };
    } catch {
      return this.inMemoryConfig;
    }
  }

  saveConfig(config: Partial<ProviderConfig>): ProviderConfig {
    const current = this.getConfig();
    const updated: ProviderConfig = {
      ...current,
      ...config,
    };
    this.inMemoryConfig = updated;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save provider config to localStorage:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('roninplex_provider_change'));
    }
    return updated;
  }

  getActiveProviderId(): string {
    if (typeof localStorage === 'undefined') {
      return this.inMemoryActiveId;
    }

    try {
      const val = localStorage.getItem(ACTIVE_PROVIDER_KEY);
      if (val) {
        if (val === 'vidsrc') {
          localStorage.setItem(ACTIVE_PROVIDER_KEY, 'vidsrc-to');
          return 'vidsrc-to';
        }
        return val;
      }

      const legacyVal = localStorage.getItem(LEGACY_ACTIVE_PROVIDER_KEY);
      if (legacyVal) {
        const migratedVal = legacyVal === 'vidsrc' ? 'vidsrc-to' : legacyVal;
        localStorage.setItem(ACTIVE_PROVIDER_KEY, migratedVal);
        return migratedVal;
      }

      return 'vidsrc-me';
    } catch {
      return this.inMemoryActiveId;
    }
  }

  setActiveProviderId(id: string): void {
    this.inMemoryActiveId = id;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(ACTIVE_PROVIDER_KEY, id);
      } catch (e) {
        console.error('Failed to set active provider ID:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('roninplex_provider_change'));
    }
  }

  resetConfig(): ProviderConfig {
    this.inMemoryConfig = { ...DEFAULT_PROVIDER_CONFIG };
    this.inMemoryActiveId = 'vidsrc-me';

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        localStorage.setItem(ACTIVE_PROVIDER_KEY, 'vidsrc-me');
      } catch (e) {
        console.error('Failed to reset provider config:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('roninplex_provider_change'));
    }
    return DEFAULT_PROVIDER_CONFIG;
  }
}

export const providerConfigService = new ProviderConfigService();
