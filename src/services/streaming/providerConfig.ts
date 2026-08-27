import { ProviderConfig, DEFAULT_PROVIDER_CONFIG } from './types';

const STORAGE_KEY = 'roninplex_streaming_provider_config';
const LEGACY_STORAGE_KEY = 'cinepulse_streaming_provider_config';
const ACTIVE_PROVIDER_KEY = 'roninplex_active_streaming_provider_id';
const LEGACY_ACTIVE_PROVIDER_KEY = 'cinepulse_active_streaming_provider_id';

export class ProviderConfigService {
  getConfig(): ProviderConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!stored) return DEFAULT_PROVIDER_CONFIG;
      return {
        ...DEFAULT_PROVIDER_CONFIG,
        ...JSON.parse(stored),
      };
    } catch {
      return DEFAULT_PROVIDER_CONFIG;
    }
  }

  saveConfig(config: Partial<ProviderConfig>): ProviderConfig {
    try {
      const current = this.getConfig();
      const updated: ProviderConfig = {
        ...current,
        ...config,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('roninplex_provider_change'));
      window.dispatchEvent(new Event('cinepulse_provider_change'));
      return updated;
    } catch (e) {
      console.error('Failed to save provider config:', e);
      return DEFAULT_PROVIDER_CONFIG;
    }
  }

  getActiveProviderId(): string {
    try {
      return localStorage.getItem(ACTIVE_PROVIDER_KEY) || localStorage.getItem(LEGACY_ACTIVE_PROVIDER_KEY) || 'vidsrc';
    } catch {
      return 'vidsrc';
    }
  }

  setActiveProviderId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_PROVIDER_KEY, id);
      window.dispatchEvent(new Event('roninplex_provider_change'));
      window.dispatchEvent(new Event('cinepulse_provider_change'));
    } catch (e) {
      console.error('Failed to set active provider ID:', e);
    }
  }

  resetConfig(): ProviderConfig {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.setItem(ACTIVE_PROVIDER_KEY, 'vidsrc');
    window.dispatchEvent(new Event('roninplex_provider_change'));
    window.dispatchEvent(new Event('cinepulse_provider_change'));
    return DEFAULT_PROVIDER_CONFIG;
  }
}

export const providerConfigService = new ProviderConfigService();
