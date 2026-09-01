
import os
files = [
    'src/components/player/VideoPlayer.tsx',
    'src/components/player/anime/AnimeVideoPlayer.tsx'
]
for filepath in files:
  if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
      content = f.read()
    content = content.replace('as number', '')
    content = content.replace('if (interval) clearInterval(interval)', 'if (interval !== null) window.clearInterval(interval)')
    content = content.replace('if (interval) window.clearInterval(interval)', 'if (interval !== null) window.clearInterval(interval)')
    content = content.replace('if (progressInterval) window.clearInterval(progressInterval)', 'if (progressInterval !== null) window.clearInterval(progressInterval)')
    with open(filepath, 'w', encoding='utf-8') as f:
      f.write(content)

