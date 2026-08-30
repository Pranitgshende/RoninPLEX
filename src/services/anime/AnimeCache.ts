/**
 * RoninPLEX v2.0.0 � Anime Cache
 * In-memory and localStorage cache with TTL to eliminate redundant API requests.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class AnimeCache {
  private static memoryStore = new Map<string, CacheEntry<unknown>>();
  private static prefix = 'ronin_anime_cache_';

  /**
   * Get cached entry if valid and not expired.
   */
  public static get<T>(key: string): T | null {
    const now = Date.now();

    // 1. Check in-memory store
    const memEntry = this.memoryStore.get(key) as CacheEntry<T> | undefined;
    if (memEntry) {
      if (memEntry.expiresAt > now) {
        return memEntry.data;
      }
      this.memoryStore.delete(key);
    }

    // 2. Check localStorage fallback
    try {
      const storageKey = this.prefix + key;
      const serialized = localStorage.getItem(storageKey);
      if (!serialized) return null;

      const entry = JSON.parse(serialized) as CacheEntry<T>;
      if (entry && entry.expiresAt > now) {
        // Re-populate in-memory cache
        this.memoryStore.set(key, entry as CacheEntry<unknown>);
        return entry.data;
      }
      localStorage.removeItem(storageKey);
    } catch {
      // Storage unavailable or quota exceeded
    }

    return null;
  }

  /**
   * Put value in cache with TTL in milliseconds.
   */
  public static set<T>(key: string, data: T, ttlMs: number = 15 * 60 * 1000): void {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs,
    };

    this.memoryStore.set(key, entry as CacheEntry<unknown>);

    try {
      const storageKey = this.prefix + key;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch {
      // Best-effort storage
    }
  }

  /**
   * Invalidate specific key or prefix.
   */
  public static invalidate(keyPrefix: string): void {
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.memoryStore.delete(key);
      }
    }
    try {
      const fullPrefix = this.prefix + keyPrefix;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(fullPrefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }
}
