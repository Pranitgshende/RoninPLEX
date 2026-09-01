# RoninPLEX v2.1.0 — Streaming Providers Architecture

**Generated:** 2026-09-01
**Status:** CURRENT architecture (pre-v2.1.0)

---

## Current Architecture

### Provider Interface

Defined in `src/services/streaming/StreamingProvider.ts`:

```typescript
interface StreamingProvider {
  getName(): string;
  getId(): string;
  testConnection(): Promise<boolean>;
  getMovie(tmdbId: number): Promise<StreamingMovie | null>;
  getTVShow(tmdbId: number): Promise<StreamingTVShow | null>;
  getTVEpisode(tmdbId: number, season: number, episode: number): Promise<StreamingEpisode | null>;
  searchMovies?(query: string): Promise<StreamingMovie[]>;
  searchTVShows?(query: string): Promise<StreamingTVShow[]>;
  getEmbedPolicy?(): EmbedPolicy;
}
```

### Registered Providers

| ID | Name | File | Stream Type | Status |
|----|------|------|-------------|--------|
| `vidsrc-me` | VidSrc Me | `VidSrcMeProvider.ts` | embed | Active — default |
| `vidsrc-to` | VidSrc To | `VidSrcToProvider.ts` | embed | Active |
| `2embed` | 2Embed | `TwoEmbedProvider.ts` | embed | Active |
| `vidlink` | VidLink Pro | `VidLinkProProvider.ts` | embed | Active |
| `vidsrc-dev` | VidSrc Dev | `VidSrcDevProvider.ts` | embed | **Dead** — hardcoded as failed |
| `custom` | Custom Config | `CustomConfigProvider.ts` | configurable | Conditional — requires baseUrl |

### Provider Priority Order

```
1. User-configured active provider (if healthy)
2. vidsrc-me (default)
3. vidsrc-to
4. 2embed
5. custom (if baseUrl configured)
6. vidlink
7. vidsrc-dev (dead — fast-fail)
```

Health-based sorting applies: healthy providers first, unhealthy last.

### StreamingManager (`src/services/streaming/StreamingManager.ts` — 21KB)

#### Key Features

- **Provider registry** — `Map<string, StreamingProvider>`
- **Availability cache** — `Map<string, { available, timestamp }>` (1-min TTL)
- **Stream cache** — `Map<string, { result, timestamp }>` (1-min TTL)
- **Provider health** — `Map<string, ProviderHealthRecord>`
- **Fallback tracking** — `lastFallbackAttempts: FallbackAttempt[]`

#### Health Tracking

```typescript
interface ProviderHealthRecord {
  failureCount: number;
  lastFailureTime: number;
  isDead: boolean;
}
```

- **Failure threshold:** 2 failures → penalized (skipped)
- **Dead threshold:** `isDead: true` → fast-fail
- **Expiration:** 5 minutes — penalties expire, provider retried
- **Dead retry:** 10 minutes (2× expiration) — dead providers get another chance

#### Resolution Flow

```
getMovie(tmdbId) / getTVEpisode(tmdbId, season, episode)
  ├─ Check stream cache → return if hit
  ├─ getEligibleProviders() → ordered provider list
  ├─ For each provider:
  │   ├─ isProviderHealthy(id)?
  │   │   ├─ Yes → try provider.getMovie/getTVEpisode
  │   │   └─ No → skip (unless expired)
  │   ├─ Success → cache result, return
  │   └─ Failure → recordFailure(), continue
  └─ All failed → return null
```

#### Runtime Fallback

```
getNextStream(failedProviderId, tmdbId, mediaType, season?, episode?)
  ├─ Exclude failed provider
  ├─ Get remaining eligible providers
  ├─ Try each in order
  └─ Return first successful stream or null
```

### Embed Policies

```typescript
interface EmbedPolicy {
  sandbox?: string | null;   // iframe sandbox tokens
  allow?: string;            // feature policy
  referrerPolicy?: ReferrerPolicy;
}
```

Defaults:
- `sandbox`: `'allow-scripts allow-same-origin allow-forms allow-presentation'`
- `allow`: `'autoplay; fullscreen; encrypted-media; picture-in-picture'`
- **Top-navigation prohibited** — `allow-top-navigation` explicitly excluded

### Provider Config Persistence

```
roninplex_streaming_provider_config → ProviderConfig JSON
roninplex_active_streaming_provider_id → active provider ID string
```

Changed via Settings → Streaming section.
Triggers `roninplex_provider_change` event → clears caches.

---

## Important Dependencies

| Component | Depends On |
|-----------|-----------|
| StreamingManager | All provider implementations, providerConfig service |
| providerConfig | StorageService (localStorage) |
| Providers | External streaming services (network) |
| CustomConfigProvider | User-provided baseUrl and endpoint templates |

---

## State Ownership

| State | Owner | Scope |
|-------|-------|-------|
| Provider registry | StreamingManager singleton | App lifetime |
| Provider health | StreamingManager.providerHealth | App lifetime (memory) |
| Availability cache | StreamingManager.availabilityCache | 1-min TTL |
| Stream cache | StreamingManager.streamCache | 1-min TTL |
| Fallback log | StreamingManager.lastFallbackAttempts | App lifetime |
| Active provider ID | providerConfigService (localStorage) | Persistent |
| Provider config | providerConfigService (localStorage) | Persistent |

---

## Known Risks

1. **All current providers are embed-type** — No HLS/MP4 providers registered by default; native playback only available via CustomConfigProvider
2. **Provider availability is external** — Providers can go offline/blocked without notice
3. **vidsrc-dev hardcoded dead** — May confuse users if shown in settings
4. **1-minute cache TTL** — Short; may result in repeated failed attempts
5. **No provider authentication** — All providers are anonymous embed endpoints
6. **`vidsrc` alias handling** — `vidsrc` normalizes to `vidsrc-to`; potential confusion
7. **Event listener leak** — `roninplex_provider_change` listener registered in constructor without cleanup (singleton, so acceptable)

---

## Native vs Iframe Playback Map

| Stream Type | Player | Local Controls | State Observable | Progress | Watchdog |
|-------------|--------|----------------|-----------------|----------|----------|
| `hls` | Hls.js + `<video>` | Full | Yes | Real (currentTime) | Active |
| `mp4` | Native `<video>` | Full | Yes | Real (currentTime) | Active |
| `embed` | `<iframe>` | None (provider UI) | No (cross-origin) | Fake (elapsed seconds) | Disabled |

---

## Target v2.1.0 Direction

*Not implemented. Observations for future phases:*

- Consider adding HLS-capable providers as default
- Consider provider health dashboard in Settings
- Consider longer cache TTL for stable providers
- Consider provider-level timeout configuration
