import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, '../src');

test('Phase 5 Unified Startup Architecture Suite', async (t) => {
  await t.test('AppLifecycleContext exists', () => {
    const p = path.join(srcPath, 'context/AppLifecycleContext.tsx');
    assert.ok(fs.existsSync(p), 'Context file missing');
    const c = fs.readFileSync(p, 'utf-8');
    assert.match(c, /appState: AppState/);
    assert.match(c, /isIntroComplete: boolean/);
    assert.match(c, /completeIntro: \(\) => void/);
    assert.match(c, /markAppReady: \(\) => void/);
  });

  await t.test('useAppReadyWhen hook exists', () => {
    const p = path.join(srcPath, 'hooks/useAppReadyWhen.ts');
    assert.ok(fs.existsSync(p), 'Hook file missing');
    const c = fs.readFileSync(p, 'utf-8');
    assert.match(c, /markAppReady\(\)/);
  });

  await t.test('Pages are wired to useAppReadyWhen', () => {
    const pagesDir = path.join(srcPath, 'pages');
    const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
    let count = 0;
    for (const f of files) {
      const c = fs.readFileSync(path.join(pagesDir, f), 'utf-8');
      if (c.includes('useAppReadyWhen')) count++;
    }
    assert.ok(count > 10, 'Not all pages wired to useAppReadyWhen');
  });

  await t.test('RoninIntro uses appState for readiness', () => {
    const p = path.join(srcPath, 'App.tsx');
    const c = fs.readFileSync(p, 'utf-8');
    assert.match(c, /isAppReady=\{appState === 'ready'\}/);
    assert.match(c, /completeIntro/);
  });
});
