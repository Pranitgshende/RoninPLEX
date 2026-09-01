
import os
files = [
    'src/components/player/VideoPlayer.tsx',
    'src/components/player/anime/AnimeVideoPlayer.tsx'
]
for filepath in files:
  if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
      content = f.read()
    content = content.replace('as unknown as number', 'as number')
    with open(filepath, 'w', encoding='utf-8') as f:
      f.write(content)

