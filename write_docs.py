
import os

files = ['docs/v2.1.0/architecture/playback.md', 'docs/v2.1.0/architecture/anime-playback.md']
for file in files:
    with open(file, 'a', encoding='utf-8') as f:
        f.write("""\n\n### Phase 3 Update: usePlaybackSession Lifecycle Management\n\nIn RinPlex v2.1.0, a new `usePlaybackSession` hook was introduced to guarantee safe session teardown, preventing race conditions, memory leaks, and stale closure bugs.\n\nKey improvements:
- __Session Boundary__: Every playback instance generates a unique `sessionId` based on media identity. Stale intervals and callbacks from old sessions are automatically rejected.
- __Safe Timers__: `setInterval` has been replaced with `setSessionInterval` which binds watchdog and progress timers to the active session.
- __HLS Disposal__: Now explicitly tied to `disposeCurrentSession`, guaranteeing clean teardown when stream sources change.
- __Error Boundary__: A `ThePlayerErrorBoundary` component wraps the player to isolate catastrophic React failures from the rest of the app.""")

with open('docs/v2.1.0/PHASE-3-FINAL-REPORT.md', 'w', encoding='utf-8') as f:
    f.write("""# RONINPLEX v2.1.0 — PHASE 3 FINAL REPORT

## Overview
Phase 3 focused on improving playback reliability by establishing a regrussion-resistant session lifecycle achitecture for both ordinary media and anime.

## Accomplished Tasks

1. **Session Abstraction (usePlaybackSession)**
   - Implemented new hook to manage `sessionId`. We rejct callbacks from old sessions.
   - Created safe timer wrappers (`setSessionInterval`, `setSessionTimeout`) to ensure timers are only executed for the active session.

2. **Augmented VideoPlayer.tsx & AnimeVideoPlayer.tsx**
   - Replaced raw `window.setInterval` and `setInterval` with `setSessionInterval` in Progress and Watchdog trackers.
   - Bound `onUnmount` and HLS destruction to `disposeCurrentSession`, ensuring proper resource cleanup.
   - Resolved Streaming dependency issues.

3. **PlayerErrorBoundary.tsx**
   - Introduced a React error boundary in `WATCH.tsx` to prevent the entire application from crashing in the event of a fatal player error, providing a fallback recovery UI.

4. **Testing**
   - Created `tests/phase3-playback.test.mjs` to statically analyze and guarantee that session-cancellation, HTPS disposal, and watchdog safeguards are met.
   - All tests passed successfully, including the existing regression baseline.

## Conclusion
Phase 3 is completed. The playback architecture is now safe, guarded against race conditions, and prevents stale intervals from running behind the scenes.""")

