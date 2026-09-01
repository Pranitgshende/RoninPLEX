import os
import re

pages_dir = 'src/pages'
pages = os.listdir(pages_dir)

for page in pages:
    if not page.endswith('.tsx'): continue
    path = os.path.join(pages_dir, page)
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    if 'useAppReadyWhen' not in content:
        content = "import { useAppReadyWhen } from '../hooks/useAppReadyWhen';\n" + content

    match = re.search(r'\n\s*useEffect\(', content)
    
    if match:
        idx = match.start()
        if 'isLoading' in content:
            hook_call = '\n  useAppReadyWhen(!isLoading);\n'
        else:
            hook_call = '\n  useAppReadyWhen(true);\n'
        
        if 'useAppReadyWhen(' not in content[idx-100:idx]:
            content = content[:idx] + hook_call + content[idx:]
    else:
        # no useEffect? just insert before return
        match = re.search(r'\n\s*return\s*\(', content)
        if match:
            idx = match.start()
            hook_call = '\n  useAppReadyWhen(true);\n'
            if 'useAppReadyWhen(' not in content[idx-100:idx]:
                content = content[:idx] + hook_call + content[idx:]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
