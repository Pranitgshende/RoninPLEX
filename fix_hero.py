p = 'src/components/hero/HeroBanner.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

if 'ScrambleText' not in c[:500]:
    c = "import { ScrambleText } from '../../animation/components/ScrambleText';\n" + c

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)
