
import re
c = open('src/components/player/VideoPlayer.tsx', 'r', encoding='utf-8').read()

pattern = r\"\"\"  useEffect\((\) => \{\r\n    return \(\C) => \{\r\n      if \(singleClickTimerRef\.current\) clearSessionTimeout\(singleClickTimerRef\.current\);\r\n      if \(seekFeedbackTimeoutRef\.current\) clearSessionTimeout\(seekFeedbackTimeoutRef\.current\);\r\n      if \(nextCountdownTimerRef\.current\) clearSessionInterval\(nextCountdownTimerRef\.current\);\r\n      if \(hideControlsTimeoutRef\.current\) clearSessionTimeout\(hideControlsTimeoutRef\.current\);\r\n    \};\r\n  \}, \[\]\);\r\n\"\"\"
c = re.sub(pattern, '', c)

w
  = open('src/components/player/VideoPlayer.tsx', 'w', encoding='utf-8')
w.write(c)
w.close()

