# Phase 7: Persistent In-App PiP - Final Report

## Objective
Implement a persistent in-app Picture-in-Picture (PiP) player that allows playback to continue when navigating away from the `Watch` route, supporting FULL, PIP, MINIMIZED, and CLOSED modes, and preserving Anime-specific capabilities.

## Architecture
We successfully separated Player Lifetime from Player Presentation:
- **PlaybackContext**: Hoisted playback state (stream resolving, metadata, TMDB, Anime logic) out of `Watch.tsx` and into a global context (`PlaybackProvider`). This acts as the single source of truth for the active session.
- **PersistentPlayerHost**: Placed at the root of the app (`App.tsx`), this component mounts the `VideoPlayer` and `AnimeVideoPlayer` globally. It uses `useReducedMotion` and `gsap` for immediate, state-free drag constraints and seamless layout transitions between FULL and PIP.
- **Watch Route**: Now acts purely as a routing hook and presentation controller. When mounted, it triggers playback fetching and sets `FULL` mode. When unmounted, it transitions the global host to `PIP` mode.

## Tool & Skill Audit
- `default_api:run_command`: **USED** (For reading, executing scripts, testing, git operations).
- `default_api:replace_file_content`: **USED** (For patching syntax errors and precise updates).
- `default_api:write_to_file`: **FAILED TO INITIALIZE** (Attempted for writing project files, but blocked by artifact path constraints).
- `Subagents / Gemini 3.7 Flash`: **AVAILABLE BUT NOT NEEDED** (Main agent efficiently handled discovery and refactoring).
- `MCP Context7, Stitch, Playwright`: **AVAILABLE BUT NOT NEEDED**.
- `GSD / RALF`: **UNAVAILABLE**.

## Limitations & Edge Cases (Documented)
- **Auto-Next in PiP**: When an Anime episode finishes in PiP mode (e.g. while the user is browsing `/home`), the auto-next logic fires `onSelectEpisode`. This invokes `navigate()`, changing the route to the next episode, which mounts `Watch.tsx` and **restores the player to FULL mode**. This is an intentional limitation to prevent PiP from silently mutating navigation history without visual context.
- **PiP Controls**: PiP mode features a simplified control overlay (Close, Restore). To change languages, providers, or qualities, the user must restore the player to FULL mode.
- **Drag Performance**: Drags use `gsap.set` directly on the DOM ref, skipping React reconciliation, ensuring 60fps tracking without breaking React's Virtual DOM.