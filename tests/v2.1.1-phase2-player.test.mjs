import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

describe('RoninPLEX v2.1.1 — Phase 2 Player HUD, Provider Switching & Rive Modes', () => {

  // ============================================================================
  // 1. RIVE MODES & URL RESOLUTION
  // ============================================================================
  test('RiveStreamProvider: implements standard, aggregator, and torrent modes', () => {
    const code = fs.readFileSync('src/services/streaming/providers/RiveStreamProvider.ts', 'utf8');

    // Type & constants
    assert.match(code, /export type RiveModeType = 'standard' \| 'aggregator' \| 'torrent'/, 'Must define RiveModeType');
    assert.match(code, /export const RIVE_MODES: RiveModeOption\[\] = \[/, 'Must define RIVE_MODES array');
    assert.match(code, /id:\s*'standard',\s*name:\s*'Standard CDN'/, 'Must define Standard CDN mode');
    assert.match(code, /id:\s*'aggregator',\s*name:\s*'Aggregator'/, 'Must define Aggregator mode');
    assert.match(code, /id:\s*'torrent',\s*name:\s*'Torrent \(Debrid\)'/, 'Must define Torrent mode');

    // Mode getter / setter methods
    assert.match(code, /setMode\(mode:\s*RiveModeType\):\s*void/, 'Must implement setMode');
    assert.match(code, /getCurrentMode\(\):\s*RiveModeType/, 'Must implement getCurrentMode');
    assert.match(code, /getAvailableModes\(\):\s*RiveModeOption\[\]/, 'Must implement getAvailableModes');

    // URL builders
    assert.match(code, /case 'aggregator':[\s\S]*?\/embed\/agg\?type=movie/, 'Must construct aggregator movie URL');
    assert.match(code, /case 'torrent':[\s\S]*?\/embed\/torrent\?type=movie/, 'Must construct torrent movie URL');
    assert.match(code, /case 'standard':[\s\S]*?\/embed\?type=movie/, 'Must construct standard movie URL');
    assert.match(code, /case 'aggregator':[\s\S]*?\/embed\/agg\?type=tv/, 'Must construct aggregator TV URL');
    assert.match(code, /case 'torrent':[\s\S]*?\/embed\/torrent\?type=tv/, 'Must construct torrent TV URL');
    assert.match(code, /case 'standard':[\s\S]*?\/embed\?type=tv/, 'Must construct standard TV URL');
  });

  // ============================================================================
  // 2. STREAMING MANAGER SPECIFIC PROVIDER RESOLUTION
  // ============================================================================
  test('StreamingManager: provides getStreamFromProvider with capability and state validation', () => {
    const code = fs.readFileSync('src/services/streaming/StreamingManager.ts', 'utf8');

    // Method signature
    assert.match(
      code,
      /public async getStreamFromProvider\(\s*providerId:\s*string,\s*tmdbId:\s*number,\s*contentType:\s*'movie' \| 'tv'( \| 'anime')?,\s*season\?:\s*number,\s*episode\?:\s*number/,
      'Must declare getStreamFromProvider signature'
    );

    // Rejection of unregistered providers
    assert.match(code, /throw new Error\(`Provider "\$\{providerId\}" is not registered`\)/, 'Must reject unregistered providers');

    // Strict quarantine check against parked providers
    assert.match(
      code,
      /if \(this\.getProviderState\(providerId\) === 'parked'\)\s*\{\s*throw new Error\(`Provider "\$\{provider\.getName\(\)\}" is currently parked and unavailable`\);\s*\}/,
      'Must reject parked providers'
    );

    // Dedicated movie and TV resolution
    assert.match(code, /const movie = await provider\.getMovie\(tmdbId\)/, 'Must call provider getMovie for movie');
    assert.match(code, /const ep = await provider\.getTVEpisode\(tmdbId, s, e\)/, 'Must call provider getTVEpisode for TV');

    // Mode management APIs
    assert.match(code, /public getAvailableModes\(providerId\?: string\)/, 'Must expose getAvailableModes');
    assert.match(code, /public setProviderMode\(providerId: string, modeId: string\)/, 'Must expose setProviderMode');
    assert.match(code, /public getProviderMode\(providerId: string\)/, 'Must expose getProviderMode');
  });

  // ============================================================================
  // 3. PROVIDER MENU COMPONENT
  // ============================================================================
  test('ProviderMenu: enforces glass styling, non-parked filtering, and Rive modes', () => {
    const menuCode = fs.readFileSync('src/components/player/ProviderMenu.tsx', 'utf8');

    // Component definition
    assert.match(menuCode, /export const ProviderMenu: React\.FC<ProviderMenuProps>/, 'Must export ProviderMenu component');
    assert.match(menuCode, /getEligibleProviders\(mediaType\)/, 'Must filter providers by mediaType capability');
    assert.match(menuCode, /getProviderHealthSummary\(\)/, 'Must query provider health summary');

    // Rive Modes rendering
    assert.match(menuCode, /isRiveActive\s*&&\s*riveModes\.length\s*>\s*0/, 'Must render Rive modes when Rive is active');
    assert.match(menuCode, /onSelectMode/, 'Must provide mode selection callback');

    // Dismissal
    assert.match(menuCode, /window\.addEventListener\('keydown', handleKeyDown\)/, 'Must listen for Escape key');
    assert.match(menuCode, /document\.addEventListener\('mousedown', handleClickOutside\)/, 'Must listen for click-outside');
  });

  // ============================================================================
  // 4. PLAYBACK CONTEXT PROVIDER SWITCHING & RACE PROTECTION
  // ============================================================================
  test('PlaybackContext: implements switchProvider, switchMode, and race/audio protections', () => {
    const contextCode = fs.readFileSync('src/context/PlaybackContext.tsx', 'utf8');

    // Context Type definitions
    assert.match(contextCode, /activeProviderId:\s*string;/, 'Must export activeProviderId in PlaybackContextType');
    assert.match(contextCode, /activeProviderName:\s*string;/, 'Must export activeProviderName in PlaybackContextType');
    assert.match(contextCode, /activeModeId:\s*string;/, 'Must export activeModeId in PlaybackContextType');
    assert.match(contextCode, /isResolvingStream:\s*boolean;/, 'Must export isResolvingStream in PlaybackContextType');
    assert.match(contextCode, /resolvingProviderId:\s*string \| null;/, 'Must export resolvingProviderId in PlaybackContextType');
    assert.match(contextCode, /resolutionError:\s*string \| null;/, 'Must export resolutionError in PlaybackContextType');
    assert.match(contextCode, /switchProvider:\s*\(providerId:\s*string\)\s*=>\s*Promise<boolean>;/, 'Must declare switchProvider signature');
    assert.match(contextCode, /switchMode:\s*\(modeId:\s*string\)\s*=>\s*Promise<boolean>;/, 'Must declare switchMode signature');

    // Immediate stream clearing to prevent background audio leaks
    assert.match(
      contextCode,
      /setStreamResult\(null\);[\s\S]*?streamingManager\.setActiveProviderId\(providerId\)/,
      'switchProvider must immediately clear streamResult before fetching to prevent audio leak'
    );
    assert.match(
      contextCode,
      /setStreamResult\(null\);[\s\S]*?streamingManager\.setProviderMode/,
      'switchMode must immediately clear streamResult before fetching to prevent audio leak'
    );

    // Race condition protection
    assert.match(
      contextCode,
      /\+\+requestIdRef\.current;[\s\S]*?if \(currentRequestId !== requestIdRef\.current\) return false;/,
      'Must guard against out-of-order resolution race conditions'
    );
  });

  // ============================================================================
  // 5. VIDEO PLAYER HUD INTEGRATION
  // ============================================================================
  test('VideoPlayer: mounts ProviderMenu in both Embed and Native Video player HUDs', () => {
    const playerCode = fs.readFileSync('src/components/player/VideoPlayer.tsx', 'utf8');

    assert.match(playerCode, /import\s*\{\s*ProviderMenu\s*\}\s*from '\.\/ProviderMenu';/, 'Must import ProviderMenu');

    // Embed HUD mounts ProviderMenu
    assert.match(
      playerCode,
      /<ProviderMenu[\s\S]*?activeProviderId=\{playbackContext\.activeProviderId[\s\S]*?onSelectProvider=\{handleSelectProvider\}[\s\S]*?onSelectMode=\{handleSelectMode\}/,
      'Must mount ProviderMenu in Embed HUD'
    );

    // Native Video HUD mounts ProviderMenu
    assert.match(
      playerCode,
      /Provider & Mode Dropdown for Native Video/,
      'Must mount ProviderMenu in Native Video HUD'
    );

    // Embed loading overlay reflects provider switching
    assert.match(
      playerCode,
      /playbackContext\.isResolvingStream\s*\?\s*'Switching Provider\.\.\.'\s*:\s*'Connecting to Stream\.\.\.'/,
      'Loading overlay must reflect switching provider status'
    );

    // Resolution error banner
    assert.match(
      playerCode,
      /playbackContext\.resolutionError\s*&&/,
      'Must display resolution error banner if stream resolution fails'
    );
  });

  // ============================================================================
  // 6. PERSISTENT PLAYER HOST LOADING & FALLBACK UX
  // ============================================================================
  test('PersistentPlayerHost: handles provider switching and fallback UX', () => {
    const hostCode = fs.readFileSync('src/components/player/PersistentPlayerHost.tsx', 'utf8');

    assert.match(
      hostCode,
      /playback\.isResolvingStream \? 'Switching Provider\.\.\.' : 'Connecting to Stream\.\.\.'/,
      'Must display Switching Provider when resolving in host'
    );

    assert.match(
      hostCode,
      /playback\.resolutionError \|\| 'Stream Currently Unavailable'/,
      'Must display resolution error in host fallback screen'
    );

    assert.match(
      hostCode,
      /playback\.handleTryNextProvider\(\)/,
      'Must offer Try Fallback Provider button'
    );
  });
});
