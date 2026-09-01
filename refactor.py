import re

with open('src/components/player/VideoPlayer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import { usePlaybackSession } from './usePlaybackSession';\n"
if 'usePlaybackSession' not in content:
    content = content.replace("import { getCurrentWindow }", import_stmt + "import { getCurrentWindow }")

hook_call = """
  const { 
    getActiveSessionId, 
    setSessionState, 
    setSessionInterval, 
    setSessionTimeout,
    disposeCurrentSession
  } = usePlaybackSession(mediaId, mediaType, seasonNumber, episodeNumber, effectiveStream.providerId || null, effectiveStream.type || '', effectiveStream.url || '');
"""
if 'usePlaybackSession(mediaId' not in content:
    content = content.replace("  const { preferences, savePlaybackProgress } = useUser();", "  const { preferences, savePlaybackProgress } = useUser();\n" + hook_call)

# Fix Watchdog
old_watchdog = """    if (isPlaying) {
      let lastTime = videoRef.current?.currentTime || 0;
      let checkCount = 0;

      progressInterval = window.setInterval(() => {
        const current = videoRef.current?.currentTime || 0;
        
        if (current > lastTime) {
          lastTime = current;
          checkCount = 0; // Reset checks on progress
          if (watchdogPhase !== 'currentTime_advances') {
            setWatchdogPhase('currentTime_advances');
          }
        } else {
          checkCount++;
          if (checkCount >= 6) { // 30 seconds of no progress while playing
            logPlayback(`Watchdog alert: currentTime did not advance within 30s for provider ${effectiveStream.providerId || 'unknown'}`);
            setEmbedStallDetected(true);
            if (effectiveStream.providerId) {
              streamingManager.reportPlaybackFailure(effectiveStream.providerId, 'Watchdog detected playback stall (currentTime did not advance)');
            }
            if (progressInterval) window.clearInterval(progressInterval);
          }
        }
      }, 5000);
    }"""
new_watchdog = """    if (isPlaying) {
      let lastTime = videoRef.current?.currentTime || 0;
      let checkCount = 0;

      const sessionId = getActiveSessionId();
      progressInterval = setSessionInterval(sessionId, () => {
        const current = videoRef.current?.currentTime || 0;
        
        if (current > lastTime) {
          lastTime = current;
          checkCount = 0; // Reset checks on progress
          setWatchdogPhase(prev => prev !== 'currentTime_advances' ? 'currentTime_advances' : prev);
        } else {
          checkCount++;
          if (checkCount >= 6) { // 30 seconds of no progress while playing
            logPlayback(`Watchdog alert: currentTime did not advance within 30s for provider ${effectiveStream.providerId || 'unknown'}`);
            setEmbedStallDetected(true);
            if (effectiveStream.providerId) {
              streamingManager.reportPlaybackFailure(effectiveStream.providerId, 'Watchdog detected playback stall (currentTime did not advance)');
            }
            if (progressInterval) window.clearInterval(progressInterval as number);
          }
        }
      }, 5000) as unknown as number;
    }"""
content = content.replace(old_watchdog, new_watchdog)
content = content.replace('isPlaying, watchdogPhase]', 'isPlaying, getActiveSessionId, setSessionInterval]') # Fix deps

# Fix Native Progress
old_native_prog = """    const interval = setInterval(flushProgress, 5000);

    return () => {
      clearInterval(interval);
      flushProgress();
    };"""
new_native_prog = """    const sessionId = getActiveSessionId();
    const interval = setSessionInterval(sessionId, flushProgress, 5000);

    return () => {
      if (interval) clearInterval(interval as unknown as number);
      flushProgress();
    };"""
content = content.replace(old_native_prog, new_native_prog)

c1 = "mediaId, mediaType, title, seasonNumber, episodeNumber, episodeTitle, posterPath, backdropPath, savePlaybackProgress, stream.type]"
c2 = "mediaId, mediaType, title, seasonNumber, episodeNumber, episodeTitle, posterPath, backdropPath, savePlaybackProgress, stream.type, getActiveSessionId, setSessionInterval]"
content = content.replace(c1, c2)

# Fix Embed Progress
old_embed_prog = """    let watchedSeconds = 0;
    const interval = window.setInterval(() => {
      watchedSeconds +=5;"""
new_embed_prog = """    let watchedSeconds = 0;
    const sessionId = getActiveSessionId();
    const interval = setSessionInterval(sessionId, () => {
      watchedSeconds +=5;"""
content = content.replace(old_embed_prog, new_embed_prog)

# Fix HLS destroy
old_hls_destroy = """    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [effectiveStream.url, effectiveStream.type]);"""
new_hls_destroy = """    const sessionId = getActiveSessionId();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      disposeCurrentSession(sessionId);
    };
  }, [effectiveStream.url, effectiveStream.type, disposeCurrentSession, getActiveSessionId]);"""
content = content.replace(old_hls_destroy, new_hls_destroy)

with open('src/components/player/VideoPlayer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
