
import re
c = open('src/components/player/anime/AnimeVideoPlayer.tsx', 'r', encoding='utf-8').read()
c = c.replace('clearInterval(autoNextTimerRef.current)', 'clearSessionInterval(autoNextTimerRef.current)')
c = c.replace('clearInterval(interval )', 'clearSessionInterval(interval )')
c = c.replace('clearTimeout(controlsTimeoutRef.current)', 'clearSessionTimeout(controlsTimeoutRef.current)')
c = c.replace('setTimeout(() => {', 'setSessionTimeout(getActiveSessionId(), () => {')
remove = __import__('textwrap').dedent("""  useEffect(() => {\n    return () => {\n      if (controlsTimeoutRef.current) clearSessionTimeout(controlsTimeoutRef.current);\n    };\n  }, []);\n""")
c = c.replace(remove, '')
with open('src/components/player/anime/AnimeVideoPlayer.tsx', 'w', encoding='utf-8') as f: f.write(c)

