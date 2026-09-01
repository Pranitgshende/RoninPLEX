import re

with open('src/components/player/VideoPlayer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

hook_call = """
  const { 
    getActiveSessionId, 
    setSessionState, 
    setSessionInterval, 
    setSessionTimeout,
    disposeCurrentSession
  } = usePlaybackSession(mediaId, mediaType, seasonNumber, episodeNumber, effectiveStream.providerId || null, effectiveStream.type || '', effectiveStream.url || '');
"""

# Remove old effectiveStream and hook call
content = content.replace("  const effectiveStream = diagnosticStream || stream;\n", "")
content = content.replace(hook_call, "")

# Insert both exactly after diagnosticStream state
target = "  const [diagnosticStream, setDiagnosticStream] = useState<StreamingResult | null>(null);"
replacement = target + "\n  const effectiveStream = diagnosticStream || stream;\n" + hook_call

content = content.replace(target, replacement, 1)

with open('src/components/player/VideoPlayer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
