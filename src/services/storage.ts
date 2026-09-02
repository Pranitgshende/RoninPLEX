import { diagnostics } from './diagnostics';
import { MediaType } from '../types/tmdb';
import {
  WatchlistItem,
  WatchedItem,
  UserPreferences,
  PlaybackProgress,
  DEFAULT_USER_PREFERENCES,
  HomeSectionItem,
  DEFAULT_HOME_SECTIONS,
} from '../types/user';

const STORAGE_KEYS = {
  WATCHLIST: 'roninplex_watchlist',
  WATCHED: 'roninplex_watched',
  PREFERENCES: 'roninplex_preferences',
  API_KEY: 'roninplex_tmdb_api_key',
  PLAYBACK_PROGRESS: 'roninplex_playback_progress',
  PROVIDER_CONFIG: 'roninplex_streaming_provider_config',
  HOME_LAYOUT: 'roninplex_home_layout',
} as const;

class StorageService {
  constructor() {
    this.migrateLegacyStorage();
  }

  /**
   * Safe one-time legacy storage migration:
   * Copies any CinePulse-era keys over to RoninPLEX keys if they don't already exist.
   */
  public migrateLegacyStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    try {
      const mappings: Array<[string, string]> = [
        ['cinepulse_watchlist', STORAGE_KEYS.WATCHLIST],
        ['cinepulse_watched', STORAGE_KEYS.WATCHED],
        ['cinepulse_preferences', STORAGE_KEYS.PREFERENCES],
        ['cinepulse_tmdb_api_key', STORAGE_KEYS.API_KEY],
        ['cinepulse_playback_progress', STORAGE_KEYS.PLAYBACK_PROGRESS],
        ['cinepulse_streaming_provider_config', STORAGE_KEYS.PROVIDER_CONFIG],
        ['cinepulse_active_streaming_provider_id', 'roninplex_active_streaming_provider_id'],
      ];

      for (const [legacyKey, newKey] of mappings) {
        const legacyVal = localStorage.getItem(legacyKey);
        const currentVal = localStorage.getItem(newKey);
        
        if (legacyVal) {
          if (!currentVal && legacyVal !== 'cleared') {
            localStorage.setItem(newKey, legacyVal);
          }
          // Remove the legacy key immediately to prevent resurrection, unless we just marked it cleared.
          // Wait, if another tab uses it? The easiest way is just to remove the legacy key so it never resurrects.
          localStorage.removeItem(legacyKey);
        }
      }
    } catch (e) {
      console.warn('Storage migration check encountered an error:', e);
    }
  }

  private get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === 'cleared') return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      diagnostics.error('persistence', 'Failed to read from localStorage', { key, error });
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new Event('roninplex_storage_change'));
      return true;
    } catch (error) {
      diagnostics.error('persistence', 'Failed to write to localStorage', { key, error });
      return false;
    }
  }

  // --- Watchlist ---
  getWatchlist(): WatchlistItem[] {
    return this.get<WatchlistItem[]>(STORAGE_KEYS.WATCHLIST, []);
  }

  addToWatchlist(item: WatchlistItem): boolean {
    const list = this.getWatchlist();
    if (list.some(i => i.id === item.id && i.mediaType === item.mediaType)) {
      return false; // Already present
    }
    const updated = [item, ...list];
    return this.set(STORAGE_KEYS.WATCHLIST, updated);
  }

  removeFromWatchlist(id: number, mediaType: MediaType): boolean {
    const list = this.getWatchlist();
    const updated = list.filter(i => !(i.id === id && i.mediaType === mediaType));
    return this.set(STORAGE_KEYS.WATCHLIST, updated);
  }

  isInWatchlist(id: number, mediaType: MediaType): boolean {
    const list = this.getWatchlist();
    return list.some(i => i.id === id && i.mediaType === mediaType);
  }

  clearWatchlist(): boolean {
    return this.set(STORAGE_KEYS.WATCHLIST, []);
  }

  // --- Watched History ---
  getWatched(): WatchedItem[] {
    return this.get<WatchedItem[]>(STORAGE_KEYS.WATCHED, []);
  }

  addToWatched(item: WatchedItem): boolean {
    const list = this.getWatched();
    const filtered = list.filter(i => !(i.id === item.id && i.mediaType === item.mediaType));
    const updated = [item, ...filtered];
    return this.set(STORAGE_KEYS.WATCHED, updated);
  }

  removeFromWatched(id: number, mediaType: MediaType): boolean {
    const list = this.getWatched();
    const updated = list.filter(i => !(i.id === id && i.mediaType === mediaType));
    return this.set(STORAGE_KEYS.WATCHED, updated);
  }

  isWatched(id: number, mediaType: MediaType): boolean {
    const list = this.getWatched();
    return list.some(i => i.id === id && i.mediaType === mediaType);
  }

  updateWatchedRating(id: number, mediaType: MediaType, userRating?: number, liked?: boolean, disliked?: boolean): boolean {
    const list = this.getWatched();
    const itemIndex = list.findIndex(i => i.id === id && i.mediaType === mediaType);
    if (itemIndex === -1) return false;

    list[itemIndex] = {
      ...list[itemIndex],
      ...(userRating !== undefined ? { userRating } : {}),
      ...(liked !== undefined ? { userLiked: liked } : {}),
      ...(disliked !== undefined ? { userDisliked: disliked } : {}),
    };
    return this.set(STORAGE_KEYS.WATCHED, list);
  }

  clearWatched(): boolean {
    return this.set(STORAGE_KEYS.WATCHED, []);
  }

  // --- Playback Progress & Continue Watching ---
  /**
   * Returns all stored playback progress records, sorted descending by lastWatchedAt
   */
  getAllPlaybackProgress(): PlaybackProgress[] {
    const all = this.get<PlaybackProgress[]>(STORAGE_KEYS.PLAYBACK_PROGRESS, []);
    return all.sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime());
  }

  /**
   * Returns deduplicated items for the Continue Watching shelf.
   * For TV shows, only the single most recently watched episode is shown to prevent duplicate cards.
   */
  getContinueWatchingList(): PlaybackProgress[] {
    const all = this.getAllPlaybackProgress();
    const seen = new Set<string>();
    const deduplicated: PlaybackProgress[] = [];

    for (const item of all) {
      const key = `${item.mediaType}-${item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    }
    return deduplicated;
  }

  /**
   * Looks up playback progress for a specific movie or TV episode
   */
  getPlaybackProgress(id: number, mediaType: MediaType, season?: number, episode?: number): PlaybackProgress | null {
    const all = this.getAllPlaybackProgress();
    const match = all.find(item => {
      if (item.id !== id || item.mediaType !== mediaType) return false;
      if (mediaType === 'tv' || mediaType === 'anime') {
        return item.seasonNumber === season && item.episodeNumber === episode;
      }
      return true;
    });
    return match || null;
  }

  savePlaybackProgress(progress: PlaybackProgress): boolean {
    const all = this.getAllPlaybackProgress();
    const filtered = all.filter(item => {
      if (item.id !== progress.id || item.mediaType !== progress.mediaType) return true;
      if (progress.mediaType === 'tv' || progress.mediaType === 'anime') {
        return !(item.seasonNumber === progress.seasonNumber && item.episodeNumber === progress.episodeNumber);
      }
      return false;
    });

    // Don't keep completed titles (if > 95% finished) or if position is under 15 seconds
    if (progress.progressPercent >= 95 || progress.currentTime < 15) {
      if (progress.progressPercent >= 95) {
        // Automatically add to Watched History if not already watched
        this.addToWatched({
          id: progress.id,
          mediaType: progress.mediaType,
          title: progress.title,
          posterPath: progress.posterPath,
          backdropPath: progress.backdropPath,
          rating: 0,
          releaseYear: '',
          genres: [],
          watchedAt: new Date().toISOString(),
        });
      }
      return this.set(STORAGE_KEYS.PLAYBACK_PROGRESS, filtered);
    }

    const updated = [progress, ...filtered];
    return this.set(STORAGE_KEYS.PLAYBACK_PROGRESS, updated);
  }

  removePlaybackProgress(id: number, mediaType: MediaType, season?: number, episode?: number): boolean {
    const all = this.getAllPlaybackProgress();
    const updated = all.filter(item => {
      if (item.id !== id || item.mediaType !== mediaType) return true;
      if ((mediaType === 'tv' || mediaType === 'anime') && season !== undefined && episode !== undefined) {
        return !(item.seasonNumber === season && item.episodeNumber === episode);
      }
      // If season/episode not specified, remove all progress for this show/movie
      return false;
    });
    return this.set(STORAGE_KEYS.PLAYBACK_PROGRESS, updated);
  }

  clearPlaybackProgress(): boolean {
    return this.set(STORAGE_KEYS.PLAYBACK_PROGRESS, []);
  }

  // --- User Preferences ---
  getPreferences(): UserPreferences {
    const stored = this.get<Partial<UserPreferences>>(STORAGE_KEYS.PREFERENCES, {});
    return {
      ...DEFAULT_USER_PREFERENCES,
      ...stored,
    };
  }

  savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const updated: UserPreferences = {
      ...current,
      ...prefs,
    };
    this.set(STORAGE_KEYS.PREFERENCES, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('roninplex_preferences_change'));
    }
    return updated;
  }

  resetPreferences(): UserPreferences {
    this.set(STORAGE_KEYS.PREFERENCES, DEFAULT_USER_PREFERENCES);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('roninplex_preferences_change'));
    }
    return DEFAULT_USER_PREFERENCES;
  }

  // --- Home Page Layout ---
  getHomeLayout(): HomeSectionItem[] {
    const stored = this.get<HomeSectionItem[] | null>(STORAGE_KEYS.HOME_LAYOUT, null);
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      return [...DEFAULT_HOME_SECTIONS];
    }
    // Merge any missing default sections (forward compatibility)
    const existingIds = new Set(stored.map(s => s.id));
    const merged = [...stored];
    for (const defSection of DEFAULT_HOME_SECTIONS) {
      if (!existingIds.has(defSection.id)) {
        merged.push(defSection);
      }
    }
    return merged;
  }

  saveHomeLayout(layout: HomeSectionItem[]): boolean {
    const success = this.set(STORAGE_KEYS.HOME_LAYOUT, layout);
    if (success && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('roninplex_home_layout_change'));
    }
    return success;
  }

  resetHomeLayout(): HomeSectionItem[] {
    this.saveHomeLayout(DEFAULT_HOME_SECTIONS);
    return [...DEFAULT_HOME_SECTIONS];
  }

  // --- TMDB API Key Override ---
  getCustomApiKey(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
    } catch {
      return '';
    }
  }

  saveCustomApiKey(key: string): void {
    try {
      if (!key) {
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
        localStorage.removeItem('cinepulse_tmdb_api_key');
      } else {
        localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
      }
      window.dispatchEvent(new Event('roninplex_api_key_change'));
    } catch (e) {
      diagnostics.error('persistence', 'Failed to save TMDB API key to localStorage', { error: e });
    }
  }

  // --- Reset All Local Data ---
  clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.WATCHLIST);
      localStorage.removeItem(STORAGE_KEYS.WATCHED);
      localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      localStorage.removeItem(STORAGE_KEYS.PLAYBACK_PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.PROVIDER_CONFIG);
      localStorage.removeItem(STORAGE_KEYS.HOME_LAYOUT);
      localStorage.removeItem('roninplex_active_streaming_provider_id');
      // Also clear legacy keys
      localStorage.removeItem('cinepulse_watchlist');
      localStorage.removeItem('cinepulse_watched');
      localStorage.removeItem('cinepulse_preferences');
      localStorage.removeItem('cinepulse_tmdb_api_key');
      localStorage.removeItem('cinepulse_playback_progress');
      localStorage.removeItem('cinepulse_streaming_provider_config');
      localStorage.removeItem('cinepulse_active_streaming_provider_id');
      window.dispatchEvent(new Event('roninplex_storage_change'));
      window.dispatchEvent(new Event('roninplex_api_key_change'));
    } catch (e) {
      diagnostics.error('persistence', 'Failed to clear all data', { error: e });
    }
  }
}

export const storage = new StorageService();
