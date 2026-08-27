import { WatchlistItem, WatchedItem, UserPreferences, PlaybackProgress, DEFAULT_USER_PREFERENCES } from '../types/user';

const STORAGE_KEYS = {
  WATCHLIST: 'roninplex_watchlist',
  WATCHED: 'roninplex_watched',
  PREFERENCES: 'roninplex_preferences',
  API_KEY: 'roninplex_tmdb_api_key',
  PLAYBACK_PROGRESS: 'roninplex_playback_progress',
  PROVIDER_CONFIG: 'roninplex_streaming_provider_config',
} as const;

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      let item = localStorage.getItem(key);
      if (!item && key.startsWith('roninplex_')) {
        // Backward-compatible fallback for previous CinePulse data
        const legacyKey = key.replace('roninplex_', 'cinepulse_');
        item = localStorage.getItem(legacyKey);
      }
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`Failed to read ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new Event('roninplex_storage_change'));
      window.dispatchEvent(new Event('cinepulse_storage_change'));
      return true;
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage:`, e);
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

  removeFromWatchlist(id: number, mediaType: 'movie' | 'tv'): boolean {
    const list = this.getWatchlist();
    const updated = list.filter(i => !(i.id === id && i.mediaType === mediaType));
    return this.set(STORAGE_KEYS.WATCHLIST, updated);
  }

  isInWatchlist(id: number, mediaType: 'movie' | 'tv'): boolean {
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

  removeFromWatched(id: number, mediaType: 'movie' | 'tv'): boolean {
    const list = this.getWatched();
    const updated = list.filter(i => !(i.id === id && i.mediaType === mediaType));
    return this.set(STORAGE_KEYS.WATCHED, updated);
  }

  isWatched(id: number, mediaType: 'movie' | 'tv'): boolean {
    const list = this.getWatched();
    return list.some(i => i.id === id && i.mediaType === mediaType);
  }

  updateWatchedRating(id: number, mediaType: 'movie' | 'tv', userRating?: number, liked?: boolean, disliked?: boolean): boolean {
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
  getContinueWatchingList(): PlaybackProgress[] {
    const all = this.get<PlaybackProgress[]>(STORAGE_KEYS.PLAYBACK_PROGRESS, []);
    // Sort descending by lastWatchedAt
    return all.sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime());
  }

  getPlaybackProgress(id: number, mediaType: 'movie' | 'tv', season?: number, episode?: number): PlaybackProgress | null {
    const list = this.getContinueWatchingList();
    const match = list.find(item => {
      if (item.id !== id || item.mediaType !== mediaType) return false;
      if (mediaType === 'tv') {
        return item.seasonNumber === season && item.episodeNumber === episode;
      }
      return true;
    });
    return match || null;
  }

  savePlaybackProgress(progress: PlaybackProgress): boolean {
    const list = this.getContinueWatchingList();
    const filtered = list.filter(item => {
      if (item.id !== progress.id || item.mediaType !== progress.mediaType) return true;
      if (progress.mediaType === 'tv') {
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

  removePlaybackProgress(id: number, mediaType: 'movie' | 'tv', season?: number, episode?: number): boolean {
    const list = this.getContinueWatchingList();
    const updated = list.filter(item => {
      if (item.id !== id || item.mediaType !== mediaType) return true;
      if (mediaType === 'tv') {
        return !(item.seasonNumber === season && item.episodeNumber === episode);
      }
      return false;
    });
    return this.set(STORAGE_KEYS.PLAYBACK_PROGRESS, updated);
  }

  clearPlaybackProgress(): boolean {
    return this.set(STORAGE_KEYS.PLAYBACK_PROGRESS, []);
  }

  // --- User Preferences ---
  getPreferences(): UserPreferences {
    return this.get<UserPreferences>(STORAGE_KEYS.PREFERENCES, DEFAULT_USER_PREFERENCES);
  }

  savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const updated: UserPreferences = {
      ...current,
      ...prefs,
    };
    this.set(STORAGE_KEYS.PREFERENCES, updated);
    return updated;
  }

  resetPreferences(): UserPreferences {
    this.set(STORAGE_KEYS.PREFERENCES, DEFAULT_USER_PREFERENCES);
    return DEFAULT_USER_PREFERENCES;
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
      } else {
        localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
      }
      window.dispatchEvent(new Event('roninplex_api_key_change'));
      window.dispatchEvent(new Event('cinepulse_api_key_change'));
    } catch (e) {
      console.error('Failed to save TMDB API key to localStorage:', e);
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
      // Also clear legacy keys
      localStorage.removeItem('cinepulse_watchlist');
      localStorage.removeItem('cinepulse_watched');
      localStorage.removeItem('cinepulse_preferences');
      localStorage.removeItem('cinepulse_tmdb_api_key');
      localStorage.removeItem('cinepulse_playback_progress');
      localStorage.removeItem('cinepulse_streaming_provider_config');
      window.dispatchEvent(new Event('roninplex_storage_change'));
      window.dispatchEvent(new Event('cinepulse_storage_change'));
      window.dispatchEvent(new Event('roninplex_api_key_change'));
      window.dispatchEvent(new Event('cinepulse_api_key_change'));
    } catch (e) {
      console.error('Failed to clear all data:', e);
    }
  }
}

export const storage = new StorageService();
