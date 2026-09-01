
import os

with open('docs/v2.1.0/CHANGE-MANIFEST.md', 'a', encoding='utf-8') as f:
    f.write("""\n### Phase 3 - Playback Reliability\n- `VideoPlayer.tsx` - Integrated session lifecycle hook and error boundary.\n- `AnimeVideoPlayer.tsx` - Integrated session lifecycle hook and error boundary.\n- `usePlaybackSession.ts` - Added new hook to isolate and manage playback sessions,\n- `PlayerErrorBoundary.tsx` - Added new REact error boundary to prevent app crashes during fatal player errors.\n- `phase3-playback.test.mjs` - Added static analysis tests for session safeguards.\n- \Watch.tsx` - Wrapped players in error boundaries and provided retryCount in key to guarantee fresh mounts on retry.\n""")

