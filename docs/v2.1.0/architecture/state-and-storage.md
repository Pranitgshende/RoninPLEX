# RoninPLEX v2.1.0 — State & Storage Architecture

**Generated:** 2026-09-01
**Status:** CURRENT architecture (pre-v2.1.0)

---

## Current Architecture

### Storage Layer

**Implementation:** `src/services/storage.ts` — `StorageService` class (singleton)
**Backend:** `window.localStorage` (browser/WebView2)
**Serialization:** JSON (`JSON.parse` / `JSON.stringify`)

### Storage Keys

| Key | Type | Default | Used By |
|-----|------|---------|---------|
| `roninplex_watchlist` | `WatchlistItem[]` | `[]` | UserContext |
| `roninplex_watched` | `WatchedItem[]` | `[]` | UserContext |
| `roninplex_playback_progress` | `PlaybackProgress[]` | `[]` | UserContext |
| `roninplex_preferences` | `UserPreferences` (partial merge) | `DEFAULT_USER_PREFERENCES` | UserContext |
| `roninplex_home_layout` | `HomeSectionItem[]` | `DEFAULT_HOME_SECTIONS` | UserContext |
| `roninplex_tmdb_api_key` | `string` | `''` | ApiKeyContext, tmdb service |
| `roninplex_streaming_provider_config` | `ProviderConfig` | `DEFAULT_PROVIDER_CONFIG` | providerConfigService |
| `roninplex_active_streaming_provider_id` | `string` | `'vidsrc-me'` | providerConfigService |

### Legacy Migration

`StorageService.migrateLegacyStorage()` — runs once on construction:

| Legacy Key | New Key |
|-----------|---------|
| `cinepulse_watchlist` | `roninplex_watchlist` |
| `cinepulse_watched` | `roninplex_watched` |
| `cinepulse_preferences` | `roninplex_preferences` |
| `cinepulse_tmdb_api_key` | `roninplex_tmdb_api_key` |
| `cinepulse_playback_progress` | `roninplex_playback_progress` |
| `cinepulse_streaming_provider_config` | `roninplex_streaming_provider_config` |
| `cinepulse_active_streaming_provider_id` | `roninplex_active_streaming_provider_id` |

**Behavior:** Copy legacy value if new key doesn't exist, then delete legacy key.

### Cross-Tab/Component Synchronization

StorageService emits custom window events on every write:

| Event | Triggered By | Listeners |
|-------|-------------|-----------|
| `roninplex_storage_change` | Every `StorageService.set()` call | UserContext |
| `roninplex_home_layout_change` | `saveHomeLayout()` | UserContext |
| `roninplex_api_key_change` | `saveCustomApiKey()` | ApiKeyContext, TMDBService |
| `roninplex_provider_change` | providerConfigService | StreamingManager |

---

## State Context Layer

### UserContext (`src/context/UserContext.tsx`)

**Role:** Primary state owner for all user data.

| State Field | Type | Initialized From | Persistence |
|-------------|------|-------------------|-------------|
| `watchlist` | `WatchlistItem[]` | `storage.getWatchlist()` | Auto-saved |
| `watched` | `WatchedItem[]` | `storage.getWatched()` | Auto-saved |
| `continueWatching` | `PlaybackProgress[]` | `storage.getContinueWatchingList()` | Auto-saved |
| `preferences` | `UserPreferences` | `storage.getPreferences()` | Auto-saved |
| `homeLayout` | `HomeSectionItem[]` | `storage.getHomeLayout()` | Auto-saved |
| `isOnboardingOpen` | `boolean` | `!prefs.onboardingCompleted` | Memory |
| `isPreferencesOpen` | `boolean` | `false` | Memory |
| `toasts` | `ToastMessage[]` | `[]` | Memory |

**Pattern:** State is initialized from localStorage synchronously, then kept in React state. On mutation, storage is updated first, then React state is refreshed from storage.

### ApiKeyContext (`src/context/ApiKeyContext.tsx`)

**Role:** TMDB API key management.

| State Field | Type | Persistence |
|-------------|------|-------------|
| `apiKey` | `string` | localStorage via tmdb.getApiKey() |
| `isValid` | `boolean \| null` | Memory (validated on mount) |
| `isValidating` | `boolean` | Memory |
| `isModalOpen` | `boolean` | Memory |

---

## Data Structures

### WatchlistItem
```typescript
{
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  releaseYear: string;
  genres: string[];
  addedAt: string; // ISO
  notes?: string;
}
```

### WatchedItem
```typescript
{
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number; // TMDB rating
  userRating?: number; // 1-10
  userLiked?: boolean;
  userDisliked?: boolean;
  releaseYear: string;
  genres: string[];
  watchedAt: string; // ISO
  review?: string;
}
```

### PlaybackProgress
```typescript
{
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  currentTime: number; // seconds
  duration: number; // seconds
  progressPercent: number; // 0-100
  lastWatchedAt: string; // ISO
}
```

### Smart Progress Rules

| Condition | Action |
|-----------|--------|
| `progressPercent >= 95` | Remove from Continue Watching → auto-add to Watched |
| `currentTime < 15` | Don't save progress (too short) |
| TV show | Deduplicate to single most recent episode per show |

### UserPreferences
```typescript
{
  favoriteGenreIds: number[];
  favoriteActors: string[];
  favoriteDirectors: string[];
  preferredLanguages: string[];
  minRatingThreshold: number;
  onboardingCompleted: boolean;
  autoplayTrailer: boolean;
  enableHoverTrailers: boolean;
  reduceMotion: boolean;
  adultContent: boolean;
  showAdultRecommendations: boolean;
  seekAmount: 5 | 10 | 15 | 30;
  autoNextEpisode: boolean;
  autoNextCountdown: number; // seconds, default 10
  defaultPlaybackSpeed: number;
  defaultVolume: number;
}
```

---

## Known Risks

1. **Monolithic UserContext** — All user state in one context; any update (e.g., progress save every 5s) re-renders all subscribers
2. **localStorage size limits** — No size tracking; large watchlists/history could exceed limits
3. **No data versioning** — No schema version in stored data; forward compatibility handled via spread merge only
4. **Sync serialization** — `JSON.parse` on large data blocks main thread during init
5. **Migration is destructive** — Legacy keys are deleted after copy; no rollback
6. **clearAllData removes everything** — Including API key; could surprise users

---

## Target v2.1.0 Direction

*Not implemented. Observations for future phases:*

- Consider splitting UserContext (playback state separate from catalog state)
- Consider adding schema versioning to stored data
- Consider throttling progress save to reduce re-renders
- Preserve `roninplex_*` key prefix compatibility
