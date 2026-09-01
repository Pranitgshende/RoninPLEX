# RoninPLEX v2.1.0 — Anime Playback Architecture

**Generated:** 2026-09-01
**Status:** CURRENT architecture (pre-v2.1.0)
**Classification:** P0 Protected Subsystem

---

## Current Architecture

### Full Anime Flow

```
Anime.tsx (browse/search via AniList)
  └─ AnimeDetails.tsx (detail page, episodes list)
     └─ Navigate to /watch/anime/:id/:episode
        └─ Watch.tsx detects anime mediaType
           └─ AnimeVideoPlayer.tsx mounts
              ├─ AnimeStreamService.fetchStreamingSources(id, episode)
              │   ├─ Query sidecar: http://127.0.0.1:4173/...
              │   ├─ Fallback across providers: animeparadise → gogoanime → allmanga
              │   └─ Validate streams via HEAD/GET
              ├─ Initialize HLS.js with resolved m3u8 URL
              ├─ Load subtitles via AnimeSubtitleManager
              ├─ Apply language/quality preferences
              └─ Start playback with resume position
```

### Component Breakdown

| Component | File | Size | Responsibility |
|-----------|------|------|---------------|
| AnimeVideoPlayer | `src/components/player/anime/AnimeVideoPlayer.tsx` | 36KB | Main anime player: HLS, controls, subs, quality, auto-next |
| AnimeEpisodeController | `src/components/player/anime/AnimeEpisodeController.ts` | 1KB | Episode navigation (prev/next) logic |
| AnimePlaybackController | `src/components/player/anime/AnimePlaybackController.ts` | 2KB | Playback control helpers |
| AnimeSubtitleManager | `src/components/player/anime/AnimeSubtitleManager.ts` | 1KB | Subtitle track management |

### Service Layer

| Service | File | Size | Responsibility |
|---------|------|------|---------------|
| AnimeStreamService | `src/services/anime/AnimeStreamService.ts` | 8KB | Stream resolution via sidecar API |
| AnimeRepository | `src/services/anime/AnimeRepository.ts` | 27KB | AniList GraphQL data access, caching |
| AnimeService | `src/services/anime/AnimeService.ts` | 5KB | Business logic layer |
| AnimeSdkAdapter | `src/services/anime/AnimeSdkAdapter.ts` | 3KB | Adapter for sidecar SDK API |
| AnimeMapper | `src/services/anime/AnimeMapper.ts` | 7KB | AniList ↔ internal type mapping |
| AnimeCache | `src/services/anime/AnimeCache.ts` | 2KB | In-memory caching |
| AnimeTypes | `src/services/anime/AnimeTypes.ts` | 3KB | Type definitions |

### Sidecar (anime-server)

```
backend/server.js
  ├─ anime-sdk providers: GogoanimeProvider, AllmangaProvider, AnimeParadiseProvider
  ├─ anime-sdk meta: AnilistMeta
  ├─ Proxy: Content-Type rewriting (.ts segments: image/jpeg → video/MP2T)
  └─ Listening on port 4173
```

**Build pipeline:**
```
scripts/build-sidecar.cjs
  ├─ @vercel/ncc bundles backend/server.js → backend/dist/index.js
  ├─ Patches ESM→CJS (createRequire, import.meta.url)
  └─ pkg packages → src-tauri/bin/anime-server-x86_64-pc-windows-msvc
```

---

## State Ownership

| State | Owner | Persistence |
|-------|-------|-------------|
| Episode list / anime info | AnimeDetails page (local) | Memory |
| Current stream URL | AnimeVideoPlayer (local ref) | Memory |
| HLS instance | AnimeVideoPlayer `hlsRef` | Memory |
| Subtitle tracks | AnimeSubtitleManager | Memory |
| Language preference | AnimeVideoPlayer (local state) | Memory |
| Quality selection | AnimeVideoPlayer (local state) | Memory |
| Playback progress | UserContext → StorageService | localStorage |
| Episode navigation | AnimeEpisodeController | Props |
| Anime cache | AnimeCache singleton | Memory (5-min TTL) |

---

## Lifecycle

### Source Resolution
```
AnimeStreamService.fetchStreamingSources(animeId, episodeNumber)
  ├─ Build sidecar URL: http://127.0.0.1:4173/watch/{id}?ep={episode}
  ├─ Fetch with timeout (15s for meta fetching)
  ├─ Parse response: { sources: [{ url, quality }], subtitles: [...] }
  ├─ Validate each source URL via HEAD/GET request
  ├─ Fallback order: animeparadise → gogoanime → allmanga
  └─ Return: { url (m3u8), subtitles, quality }
```

### Player Initialization
```
1. Receive resolved stream from AnimeStreamService
2. Create Hls.js instance
3. Load m3u8 manifest
4. On MANIFEST_PARSED:
   a. Apply saved playback position (resume)
   b. Apply quality preference
   c. Start playback
5. Load subtitle tracks via AnimeSubtitleManager
6. Start progress save interval
```

### Episode Switching
```
User selects new episode (drawer or prev/next buttons)
  ├─ AnimeEpisodeController provides navigation
  ├─ Destroy current HLS instance
  ├─ Clear timers
  ├─ Save final progress for current episode
  ├─ Resolve new episode stream
  └─ Re-initialize player with new source
```

### Auto-Next
```
Episode reaches last 10 seconds
  ├─ Start countdown timer (configurable, default 10s)
  ├─ Display countdown UI
  ├─ On complete: navigate to next episode
  └─ Timer cleaned up via autoNextTimerRef on:
     - User cancels
     - Component unmount
     - Episode switch
```

### Cleanup (Unmount)
```
1. HLS.destroy()
2. Clear autoNextTimerRef
3. Clear progress interval
4. Clear all other timers
5. Remove event listeners
6. Save final playback progress
```

---

## Known Risks

1. **Sidecar startup race** — AnimeStreamService queries `127.0.0.1:4173` but no explicit readiness check; if sidecar hasn't started, first requests fail
2. **Content-Type monkey-patching** — `backend/server.js` patches `http.ServerResponse.prototype.writeHead` globally; fragile approach
3. **Single sidecar port** — Hard-coded port 4173; conflicts possible if port is in use
4. **Large component** — AnimeVideoPlayer.tsx at 36KB is substantial; maintenance risk
5. **Provider dependency** — External anime providers (gogoanime, allmanga, animeparadise) are third-party and can break/disappear
6. **pkg/node18 packaging** — Uses `pkg` which is deprecated; bundling node18 runtime

---

## Target v2.1.0 Direction

*Not implemented. Observations for future phases:*

- Consider sidecar health check before routing to anime playback
- Consider extracting shared player logic between VideoPlayer and AnimeVideoPlayer
- Consider modernizing sidecar build (replace pkg with SEA or similar)
- Maintain P0 protection: no breaking changes to anime flow without explicit approval


### Phase 3 Update: usePlaybackSession Lifecycle Management

In RoninPLEX v2.1.0, a new `usePlaybackSession` hook was introduced to guarantee safe session teardown, preventing race conditions, memory leaks, and stale closure bugs.

Key improvements:
- __Session Boundary__: Every playback instance generates a unique `sessionId` based on media identity. Stale intervals and callbacks from old sessions are automatically rejected.
- __Safe Timers__: `setInterval` has been replaced with `setSessionInterval` which binds watchdog and progress timers to the active session.
- __HLS Disposal__: Now explicitly tied to `disposeCurrentSession`, guaranteeing clean teardown when stream sources change.
- __Error Boundary__: A `PlayerErrorBoundary` component wraps the player to isolate catastrophic React failures from the rest of the app.