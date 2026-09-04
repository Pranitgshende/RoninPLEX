import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

describe('RoninPLEX v2.1.1 — Phase 5 Test Gap Closure Suite', () => {

  // ============================================================================
  // SUITE A: SlidingMediaWall.tsx Component & Motion Architecture
  // ============================================================================
  describe('Suite A: SlidingMediaWall Component Architecture', () => {
    const wallFilePath = path.join(rootDir, 'src/components/startup/SlidingMediaWall.tsx');
    const introFilePath = path.join(rootDir, 'src/components/startup/RoninIntro.tsx');

    test('SlidingMediaWall source file exists and exports component', () => {
      assert.ok(fs.existsSync(wallFilePath), 'SlidingMediaWall.tsx must exist');
      const code = fs.readFileSync(wallFilePath, 'utf8');
      assert.match(code, /export const SlidingMediaWall:\s*React\.FC/, 'Must export SlidingMediaWall functional component');
    });

    test('SlidingMediaWall defines curated media cards and multi-row layout', () => {
      const code = fs.readFileSync(wallFilePath, 'utf8');
      assert.match(code, /const WALL_ITEMS:\s*MediaCardData\[\]\s*=/, 'Must define curated WALL_ITEMS array');
      assert.match(code, /const ROW_CONFIGS\s*=/, 'Must define ROW_CONFIGS array');
      
      // Verify row configurations exist with alternating directions
      assert.match(code, /direction:\s*'left'/);
      assert.match(code, /direction:\s*'right'/);
      assert.match(code, /items:\s*\[\.\.\.items,\s*\.\.\.items\]/, 'Must double items array for seamless continuous looping');
    });

    test('SlidingMediaWall preserves alternating animation classes and GPU duration styles', () => {
      const code = fs.readFileSync(wallFilePath, 'utf8');
      assert.match(code, /animate-media-wall-left/, 'Must include leftward infinite marquee animation class');
      assert.match(code, /animate-media-wall-right/, 'Must include rightward infinite marquee animation class');
      assert.match(code, /--media-wall-duration/, 'Must assign CSS custom property for individual row duration');
    });

    test('SlidingMediaWall respects reduced motion by disabling marquee animation', () => {
      const code = fs.readFileSync(wallFilePath, 'utf8');
      assert.match(code, /useReducedMotion\(\)/, 'Must consume useReducedMotion hook');
      assert.match(
        code,
        /reducedMotion\s*\?\s*''\s*:\s*row\.direction === 'left'/,
        'Must remove marquee animation class when reducedMotion is active'
      );
    });

    test('RoninIntro isolates centered logo in foreground with radial scrim contrast', () => {
      const wallCode = fs.readFileSync(wallFilePath, 'utf8');
      assert.match(wallCode, /radial-gradient/, 'Must render cinematic radial scrim overlay');
      assert.match(wallCode, /z-10 pointer-events-none/, 'Scrim must layer above background cards');

      const introCode = fs.readFileSync(introFilePath, 'utf8');
      assert.match(introCode, /<SlidingMediaWall\s*\/>/, 'RoninIntro must mount SlidingMediaWall');
      assert.match(
        introCode,
        /flex items-center justify-center/,
        'Intro container must center content'
      );
      assert.match(
        introCode,
        /ref=\{logoRef\}\s*className="relative z-10 flex flex-col items-center select-none"/,
        'Ronin logo must be centered in fixed foreground (relative z-10)'
      );
    });
  });

  // ============================================================================
  // SUITE B: useReducedMotion.ts Lifecycle & Accessibility
  // ============================================================================
  describe('Suite B: useReducedMotion Hook Lifecycle', () => {
    const hookFilePath = path.join(rootDir, 'src/animation/hooks/useReducedMotion.ts');

    test('useReducedMotion hook exists and exports function', () => {
      assert.ok(fs.existsSync(hookFilePath), 'useReducedMotion.ts must exist');
      const code = fs.readFileSync(hookFilePath, 'utf8');
      assert.match(code, /export function useReducedMotion\(\):\s*boolean/, 'Must export useReducedMotion hook returning boolean');
    });

    test('useReducedMotion evaluates media query and user storage preferences', () => {
      const code = fs.readFileSync(hookFilePath, 'utf8');
      assert.match(code, /const REDUCED_MOTION_QUERY\s*=\s*'\(prefers-reduced-motion:\s*reduce\)'/, 'Must define standard CSS media query');
      assert.match(code, /storage\.getPreferences\(\)\.reduceMotion/, 'Must evaluate explicit user reduceMotion setting');
      assert.match(code, /window\.matchMedia\(REDUCED_MOTION_QUERY\)/, 'Must check window.matchMedia');
    });

    test('useReducedMotion registers listeners and cleans them up on unmount', () => {
      const code = fs.readFileSync(hookFilePath, 'utf8');
      assert.match(code, /mediaQueryList\.addEventListener\('change',\s*mqListener\)/, 'Must add media query change listener');
      assert.match(code, /window\.addEventListener\('roninplex_preferences_change',\s*storageListener\)/, 'Must add storage change listener');
      assert.match(code, /mediaQueryList\.removeEventListener\('change',\s*mqListener\)/, 'Must remove media query listener on unmount');
      assert.match(code, /window\.removeEventListener\('roninplex_preferences_change',\s*storageListener\)/, 'Must remove storage listener on unmount');
    });
  });

  // ============================================================================
  // SUITE C: Preferences & Glass-Card Customization
  // ============================================================================
  describe('Suite C: Preferences & Glass-Card Customization', () => {
    const userTypesPath = path.join(rootDir, 'src/types/user.ts');
    const settingsPath = path.join(rootDir, 'src/pages/Settings.tsx');
    const storagePath = path.join(rootDir, 'src/services/storage.ts');
    const movieCardPath = path.join(rootDir, 'src/components/common/MovieCard.tsx');

    test('User preferences schema supports glass cards and styling tokens', () => {
      const code = fs.readFileSync(userTypesPath, 'utf8');
      assert.match(code, /enableGlassCards:\s*boolean;/, 'Must define enableGlassCards preference');
      assert.match(code, /cardGlassOpacity:\s*number;/, 'Must define cardGlassOpacity preference');
      assert.match(code, /cardBlurStrength:\s*'none'\s*\|\s*'sm'\s*\|\s*'md'\s*\|\s*'lg';/, 'Must define cardBlurStrength preference');
      assert.match(code, /cardBadgeStyle:\s*'glass'\s*\|\s*'solid'\s*\|\s*'minimal';/, 'Must define cardBadgeStyle preference');
      assert.match(code, /enableGlassCards:\s*true,/, 'Default preferences must enable glass cards');
    });

    test('Settings UI exposes reactive controls for glass-card preferences', () => {
      const code = fs.readFileSync(settingsPath, 'utf8');
      assert.match(code, /handlePreferenceChange\('enableGlassCards'/, 'Must have toggle handler for enableGlassCards');
      assert.match(code, /handlePreferenceChange\('cardGlassOpacity'/, 'Must have slider handler for cardGlassOpacity');
      assert.match(code, /handlePreferenceChange\('cardBlurStrength'/, 'Must have selector handler for cardBlurStrength');
    });

    test('StorageService persists and hydrates glass-card preferences', () => {
      const code = fs.readFileSync(storagePath, 'utf8');
      assert.match(code, /getPreferences\(\)/, 'StorageService must provide getPreferences');
      assert.match(code, /savePreferences\(/, 'StorageService must provide savePreferences');
      assert.match(code, /roninplex_preferences_change/, 'StorageService must dispatch sync events');
    });

    test('MovieCard dynamically switches CSS classes based on enableGlassCards token', () => {
      const code = fs.readFileSync(movieCardPath, 'utf8');
      assert.match(
        code,
        /enableGlassCards\s*\?\s*'glass-card'\s*:\s*'glass-card-solid'/,
        'MovieCard must toggle between frosted glass and solid card appearance'
      );
      assert.match(code, /enableGlassCards\s*\?/, 'MovieCard must dynamically adapt style tokens');
    });
  });

  // ============================================================================
  // SUITE D: DownloadCenterModal.tsx UI States & Lifecycle
  // ============================================================================
  describe('Suite D: DownloadCenterModal UI States & Event Lifecycle', () => {
    const modalFilePath = path.join(rootDir, 'src/components/downloads/DownloadCenterModal.tsx');
    const serviceFilePath = path.join(rootDir, 'src/services/download/downloadService.ts');

    test('DownloadCenterModal source file exists and exports component', () => {
      assert.ok(fs.existsSync(modalFilePath), 'DownloadCenterModal.tsx must exist');
      const code = fs.readFileSync(modalFilePath, 'utf8');
      assert.match(code, /export const DownloadCenterModal:\s*React\.FC<DownloadCenterModalProps>/, 'Must export DownloadCenterModal');
    });

    test('DownloadCenterModal implements empty queue state', () => {
      const code = fs.readFileSync(modalFilePath, 'utf8');
      assert.match(code, /downloads\.length === 0/, 'Must check for empty download list');
      assert.match(code, /No downloads queued yet/, 'Must render informative empty state heading');
    });

    test('DownloadCenterModal implements active downloading and progress state', () => {
      const code = fs.readFileSync(modalFilePath, 'utf8');
      assert.match(code, /status === 'downloading'/, 'Must detect active downloading status');
      assert.match(code, /<span>\{percent\}%<\/span>/, 'Must render percentage progress in downloading badge');
      assert.match(code, /style=\{\{\s*width:\s*`\$\{item\.status === 'completed' \? 100 : percent\}%`\s*\}\}/, 'Must bind progress bar width to calculated percent');
      assert.match(code, /handlePause\(item\.id\)/, 'Must render pause action button for active download');
    });

    test('DownloadCenterModal implements paused and retryable failure states', () => {
      const code = fs.readFileSync(modalFilePath, 'utf8');
      assert.match(code, /handleResume\(item\.id\)/, 'Must render resume action for paused downloads');
      assert.match(code, /status === 'paused'/, 'Must render paused badge/indicator');
      assert.match(code, /status === 'failed'/, 'Must render error state with alert styling');
      assert.match(code, /status === 'completed'/, 'Must render completed state with success indicator');
    });

    test('DownloadCenterModal manages live subscription lifecycle to prevent memory leaks', () => {
      const code = fs.readFileSync(modalFilePath, 'utf8');
      assert.match(code, /downloadService\.onProgress\(/, 'Must subscribe to progress events on mount');
      assert.match(code, /downloadService\.onStatusChanged\(/, 'Must subscribe to status change events on mount');
      assert.match(code, /unsubProgress\(\)/, 'Must unsubscribe from progress events in cleanup');
      assert.match(code, /unsubStatus\(\)/, 'Must unsubscribe from status events in cleanup');
    });

    test('DownloadService exposes verified IPC commands for lifecycle control', () => {
      const code = fs.readFileSync(serviceFilePath, 'utf8');
      assert.match(code, /pauseDownload/, 'downloadService must expose pauseDownload');
      assert.match(code, /resumeDownload/, 'downloadService must expose resumeDownload');
      assert.match(code, /cancelDownload/, 'downloadService must expose cancelDownload');
      assert.match(code, /deleteDownload/, 'downloadService must expose deleteDownload');
    });
  });

});
