# Phase 20: Anime Player Stability (Sub/Dub Switching)

## Overview
Phase 20 focused on resolving critical stability issues in the Anime video player when switching languages (Sub <-> Dub). The primary symptoms reported were crashes, playback stranding, video element corruption, and loss of playback position.

## Root Cause Analysis
1. **React Component Unmounting on Load:**
   When a user switched languages via onLanguageChange, the PlaybackContext correctly initiated a new stream resolution and set isLoading = true. However, PersistentPlayerHost indiscriminately rendered a global spinner when isLoading was true, fully unmounting the AnimeVideoPlayer component.
   - This destroyed all local component state.
   - It orphaned the ongoing playback session.
   - It forced a complete tear-down and rebuild of the video and Hls instances, which triggered the perceived crash and visual stranding.
2. **Missing Position Flush:**
   The AnimeVideoPlayer saved progress on a 5-second interval. Because language switching unmounted the player immediately, any progress made since the last interval tick (up to 5 seconds) was lost.
3. **HLS Video Source Ghosting:**
   When hls.destroy() was called during cleanup, it did not manually clear the ideo src attribute for MP4 fallbacks, leading to stale frames or corrupted video element states when the component was reused.

## Resolution
1. **Persistent Player Mounting:**
   - Modified PersistentPlayerHost to only show the global loading spinner if isLoading && !isAnime && !streamResult.
   - This ensures AnimeVideoPlayer remains mounted during language and episode switches.
   - The player now relies on its own internal isLoading overlay to gracefully block interaction while the new stream resolves.
2. **Synchronous Progress Flushing:**
   - Extracted lushProgress into a useCallback hook in AnimeVideoPlayer.
   - Bound lushProgress(true) to the Sub and Dub button onClick handlers, guaranteeing the exact current playback frame is saved to the database immediately before the language switch occurs.
3. **Safe Video Element Cleanup:**
   - Augmented the AnimeVideoPlayer unmount/cleanup useEffect to safely execute ideo.removeAttribute('src'); video.load(); alongside hls.destroy().
4. **Stale Item Cleanup:**
   - Added setAnimeItem(null) to PlaybackContext.closePlayer() to prevent the player from briefly flashing old anime metadata if the user closes and immediately opens a different anime.

## Verification
- Verified safe component rendering and memory cleanup during rapid language switching.
- Verified TypeScript and Vite build passes perfectly.
- Verified OS-level user keyring (from Phase 18) remains completely untouched and isolated from these player state modifications.

## Next Phase
Ready to proceed to Phase 21 or final integration testing.
