# RoninPLEX v2.1.0 — Test & Verification Plan

## Persistent Desktop PiP Tests

### P0
1. Start movie/TV/anime playback.
2. Enter PiP.
3. Verify a separate top-level desktop window exists.
4. Verify PiP stays above other applications.
5. Move PiP.
6. Resize PiP.
7. Minimize the main RoninPLEX window.
8. Verify playback continues.
9. Close/hide the main RoninPLEX UI window while PiP is active, using the supported app lifecycle.
10. Verify PiP continues.
11. Reopen RoninPLEX.
12. Return PiP to the main player.
13. Verify playback position/state is preserved.
14. Close PiP independently.
15. Verify the main UI behaves correctly afterward.
16. Verify true process termination stops playback rather than leaving an impossible orphaned player.

## Other Release Matrix
### Startup
- launch/fullscreen
- resize
- fullscreen exit/re-entry
- relaunch

### Movie
- detail -> playback
- provider failure/retry
- fullscreen
- seek
- PiP

### TV
- season
- episode
- playback
- provider failure
- resume

### Anime
- season/episode
- provider
- sub/dub
- subtitles
- quality
- seek
- fullscreen
- persistent PiP
- fallback

### UI
- glass cards
- Anime cards
- trailer hero/fallback
- navigation
- settings
- keyboard/focus/accessibility

### Build
- production frontend build
- Tauri build/package
- installer/package launch
- installed-app smoke test
- version metadata
