# RoninPLEX v2.1.0 — Playback Architecture

**Generated:** 2026-09-01
**Status:** CURRENT architecture (pre-v2.1.0)

---

## Current Architecture

### Playback Flow

```
User clicks Play (MovieDetails/TvDetails)
  └─ Navigate to /watch/movie/:id or /watch/tv/:id/:season/:episode
     └─ Watch.tsx mounts
        ├─ Fetch TMDB metadata (concurrent)
        └─ StreamingManager.getMovie() or .getTVEpisode()
           ├─ Build eligible provider list (priority + health)
           ├─ Try providers in order
           │   ├─ Provider returns StreamingResult { type, url, embedPolicy }
           │   └─ If fail → recordFailure() → try next
           └─ Return first successful stream
              └─ Render VideoPlayer.tsx
                 ├─ type === 'hls' → Hls.js
                 ├─ type === 'mp4' → native <video>
                 └─ type === 'embed' → <iframe>
```

### VideoPlayer Component (`src/components/player/VideoPlayer.tsx` — 67KB)

#### Stream Type Handling

| Stream Type | Player | Controls | State Observable | Progress Tracking |
|-------------|--------|----------|-----------------|-------------------|
| `hls` | Hls.js + `<video>` | Full local controls | Yes — `currentTime`, `duration`, buffered | Real — 5s interval from `video.currentTime` |
| `mp4` | Native `<video>` | Full local controls | Yes | Real — 5s interval |
| `embed` | `<iframe>` | Provider controls only | No — cross-origin | Fake — elapsed seconds counter via 5s interval |

#### Key Refs and Timers

| Ref/Timer | Purpose | Cleanup |
|-----------|---------|---------|
| `videoRef` | `<video>` element | Unmount |
| `hlsRef` | Hls.js instance | `hls.destroy()` on unmount/stream change |
| `containerRef` | Player container | Unmount |
| `progressIntervalRef` | 5s progress save interval | `clearInterval` on unmount |
| `hideControlsTimeoutRef` | Auto-hide controls timer | `clearTimeout` on unmount |
| `singleClickTimerRef` | Click vs double-click disambiguation | `clearTimeout` on unmount |
| `seekFeedbackTimeoutRef` | Seek feedback display | `clearTimeout` on unmount |
| `nextCountdownTimerRef` | Auto-next episode countdown | `clearTimeout` on unmount |

#### Watchdog System (5-Phase)

- Monitors `currentTime` advancement during playback
- **Timeout:** 30 seconds of stall triggers fallback
- **Disabled for embed streams** (cannot observe `currentTime`)
- Cleanup: `clearInterval(progressInterval)` on unmount

#### Resume Behavior

- On `MANIFEST_PARSED` (HLS) or `loadedmetadata` (MP4): seek to saved position
- Progress retrieved from `StorageService.getPlaybackProgress()`
- Position saved every 5 seconds via progress interval

#### Fullscreen

- Uses Tauri Window API: `getCurrentWindow().setFullscreen(true/false)`
- Also supports browser Fullscreen API as fallback

#### PiP (Picture-in-Picture)

- Standard HTML5 `requestPictureInPicture()` for `<video>`
- Also supports `documentPictureInPicture` API (Chromium/WebView2)

#### Auto-Next Episode (TV)

- Countdown starts in last segment of episode
- Uses `nextCountdownTimerRef` — properly cleared on unmount
- Navigates to next episode via React Router

#### Fallback Chain (Runtime)

```
Stream playing → watchdog detects stall (30s)
  └─ streamingManager.getNextStream(failedProviderId)
     ├─ Exclude failed provider
     ├─ Try remaining eligible providers
     └─ Load new stream into player
```

---

## Important Dependencies

| Component | Depends On |
|-----------|-----------|
| Watch.tsx | StreamingManager, TMDB service, UserContext, VideoPlayer |
| VideoPlayer | Hls.js, @tauri-apps/api (window fullscreen), UserContext (progress save) |
| StreamingManager | Provider implementations, providerConfig service |

---

## State Ownership

| State | Owner | Scope |
|-------|-------|-------|
| Current stream | Watch.tsx (local state) | Page |
| Player state (playing, seeking) | VideoPlayer refs | Component |
| HLS instance | VideoPlayer `hlsRef` | Component |
| Progress save | UserContext.savePlaybackProgress | Global |
| Provider health | StreamingManager instance | Singleton |
| Fallback history | StreamingManager.lastFallbackAttempts | Singleton |

---

## Lifecycle

```
Mount:
  1. Watch.tsx resolves stream (TMDB + StreamingManager)
  2. VideoPlayer receives stream prop
  3. Player initializes based on type (HLS/MP4/embed)
  4. Resume position applied
  5. Progress interval starts (5s)
  6. Watchdog starts (native only)
  7. Controls auto-hide timer starts

Active:
  - Progress saved every 5s
  - Watchdog monitors currentTime advancement
  - Controls show/hide on mouse movement

Stall:
  - Watchdog triggers after 30s
  - Fallback to next provider stream

Unmount:
  - HLS destroyed
  - All intervals cleared
  - All timeouts cleared
  - Progress saved one final time
```

---

## Known Risks

1. **67KB monolithic component** — VideoPlayer.tsx is large; maintenance risk
2. **Embed progress is fake** — Cannot observe actual position in cross-origin iframe
3. **Watchdog disabled for embeds** — No stall detection for iframe-based streams
4. **UserContext re-renders** — `savePlaybackProgress` called every 5s triggers context update
5. **iframe stacking risk** — Changing `iframeKey` forces remount but timing edge cases exist
6. **No explicit player disposal** on route change — relies on React unmount cleanup

---

## Target v2.1.0 Direction

*Not implemented. Observations for future phases:*

- Consider extracting player into smaller composable modules
- Consider debouncing/batching progress saves to reduce re-renders
- Consider separating playback state from UserContext
- Consider adding player error boundary
