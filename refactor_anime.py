
import re
with open('src/components/player/anime/AnimeVideoPlayer.tsx', 'r', encoding='utf-8') as f:
  c = f.read()

# Add clearSessionInterval, clearSessionTimeout to hook destructuring
h_old = """  const { \n    getActiveSessionId, \n    setSessionState, \n    setSessionInterval, \n    setSessionTimeout,\n    disposeCurrentSession\n  } = """
h_new = """  const { \n    getActiveSessionId, \n    setSessionState, \n    setSessionInterval, \n    setSessionTimeout,\n    clearSessionInterval,\n    clearSessionTimeout,\n    disposeCurrentSession\n  } = """
c = c.replace(h_old, h_new)

# Replace clearInterval with clearSessionInterval
c = c.replace('clearInterval(autoNextTimerRef.current)', 'clearSessionInterval(autoNextTimerRef.current)')
c = c.replace('clearInterval(interval)', 'clearSessionInterval(interval)')

# Replace setTimeout and clearTimeout for controlsTimeoutRef
c = c.replace('clearTimeout(controlsTimeoutRef.current)', 'clearSessionTimeout(controlsTimeoutRef.current)')
c = c.replace('setTimeout(() => {', 'setSessionTimeout(getActiveSessionId(), () => {')

# Remove the redundant useEffect for controlsTimeoutRef unmount
a = re.sub(r'\s+useEffect\(\\(\\) => \\{\n\s+return \\(\\) => \\{\n\ls+if \\(controlsTimeoutRef\\.current\\) clearSessionTimeout\\(controlsTimeoutRef\\.current\\);\n\s+{\\};\n\s+}\\), \\{\]|\\);', '', c)

if a != c:
  c = a
with open('src/components/player/anime/AnimeVideoPlayer.tsx', 'w', encoding='utf-8') as f:
  f.write(c)


