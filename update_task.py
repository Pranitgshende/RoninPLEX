
import os

filepath = 'C:\\Users\\prani\\.gemini\\antigravity\\brain\\5e53fba6-cac4-48d8-be01-bc274fba3e09\\task.md'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('[ ] Add tests for stale-session rejection', '[x] Add tests for stale-session rejection')
    content = content.replace('[ ] Run focused playback tests plus the existing regression baseline.', '[x] Run focused playback tests plus the existing regression baseline.')
    content = content.replace('[ ] Produce final report and update architecture documents.', '[x] Produce final report and update architecture documents.')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

