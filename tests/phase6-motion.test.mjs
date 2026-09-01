import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, '../src');

test('Phase 6 Unified Motion System Suite', async (t) => {
  await t.test('ScrambleText exists and has required API', () => {
    const p = path.join(srcPath, 'animation/components/ScrambleText.tsx');
    assert.ok(fs.existsSync(p), 'ScrambleText missing');
    const c = fs.readFileSync(p, 'utf-8');
    assert.match(c, /forwardRef/);
    assert.match(c, /useImperativeHandle/);
    assert.match(c, /start: \(\) => void/);
    assert.match(c, /reset: \(\) => void/);
    assert.match(c, /useReducedMotion/);
    assert.match(c, /tweenRef\.current\.kill/); // Ensure cleanup
  });

  await t.test('RoninIntro uses the new branding asset', () => {
    const p = path.join(srcPath, 'components/startup/RoninIntro.tsx');
    const c = fs.readFileSync(p, 'utf-8');
    assert.match(c, /logo\.png/);
    assert.match(c, /<img/);
    assert.doesNotMatch(c, /font-black text-white">R<\/span>/); // Old CSS logo removed
  });

  await t.test('Motion tokens available', () => {
    const p = path.join(srcPath, 'design/tokens/motion.ts');
    assert.ok(fs.existsSync(p), 'Motion tokens missing');
  });
});
