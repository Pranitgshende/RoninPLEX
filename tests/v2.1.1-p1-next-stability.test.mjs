import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('RoninPLEX v2.1.1 Next Stability, Provider, UI Customization & PiP Suite', () => {
  // ============================================================================
  // 1. RIVESTREAM FIRST-CLASS PROVIDER INTEGRATION
  // ============================================================================
  test('RiveStream: source code builds standard, aggregator, and torrent endpoints conforming to docs', () => {
    const code = fs.readFileSync('src/services/streaming/providers/RiveStreamProvider.ts', 'utf8');
    assert.match(code, /https:\/\/www\.rivestream\.app/, 'Base URL must be rivestream.app');
    assert.match(code, /\/embed\?type=movie&id=\$\{tmdbId\}/, 'Standard movie endpoint must match docs');
    assert.match(code, /\/embed\?type=tv&id=\$\{tmdbId\}&season=\$\{season\}&episode=\$\{episode\}/, 'Standard TV endpoint must match docs');
    assert.match(code, /\/embed\/agg\?type=movie&id=\$\{tmdbId\}/, 'Aggregator movie endpoint must match docs');
    assert.match(code, /\/embed\/agg\?type=tv&id=\$\{tmdbId\}&season=\$\{season\}&episode=\$\{episode\}/, 'Aggregator TV endpoint must match docs');
    assert.match(code, /\/embed\/torrent\?type=movie&id=\$\{tmdbId\}/, 'Torrent movie endpoint must match docs');
    assert.match(code, /\/embed\/torrent\?type=tv&id=\$\{tmdbId\}&season=\$\{season\}&episode=\$\{episode\}/, 'Torrent TV endpoint must match docs');
  });

  test('RiveStream: embed policy enforces anti-hijacking and secure sandbox flags', () => {
    const code = fs.readFileSync('src/services/streaming/providers/RiveStreamProvider.ts', 'utf8');
    assert.match(code, /sandbox:\s*DEFAULT_SECURE_SANDBOX/, 'Must use DEFAULT_SECURE_SANDBOX');
    assert.match(code, /allow:\s*DEFAULT_ALLOW_POLICY/, 'Must use DEFAULT_ALLOW_POLICY');
    assert.match(code, /referrerPolicy:\s*'origin'/, 'Must set origin referrer policy');
  });

  // ============================================================================
  // 2. PROVIDER PRIORITY & FALLBACK ARCHITECTURE
  // ============================================================================
  test('StreamingManager: registers providers with VidSrcME as default and deterministic priority order', () => {
    const code = fs.readFileSync('src/services/streaming/StreamingManager.ts', 'utf8');
    assert.match(code, /this\.registerProvider\(vidSrcMeProvider\)/, 'StreamingManager must register vidSrcMeProvider');
    assert.match(code, /this\.registerProvider\(riveStreamProvider\)/, 'StreamingManager must register riveStreamProvider');
    assert.match(code, /priorityOrder\s*=\s*\['vidsrc-me',\s*'rive',\s*'vidlink',\s*'vidsrc-to'/, 'Priority order must start with vidsrc-me followed by rive and vidlink');
    assert.match(code, /subscribeStatus\s*\(/, 'StreamingManager must provide subscribeStatus listener');
    assert.match(code, /getAvailableServers\s*\(/, 'StreamingManager must support server enumeration');
    assert.match(code, /emitStatus\s*\(/, 'StreamingManager must emit live status events');
  });

  test('ProviderConfig: defaults to vidsrc-me as the active provider ID', () => {
    const code = fs.readFileSync('src/services/streaming/providerConfig.ts', 'utf8');
    assert.match(code, /inMemoryActiveId:\s*string\s*=\s*'vidsrc-me'/, 'Default active provider must be vidsrc-me');
  });

  // ============================================================================
  // 3. ADVANCED CUSTOM DECLARATIVE PROVIDERS VALIDATOR
  // ============================================================================
  test('CustomConfigProvider: validates HTTPS, placeholders, and rejects unsafe schemes', () => {
    const code = fs.readFileSync('src/services/streaming/providers/CustomConfigProvider.ts', 'utf8');
    assert.match(code, /validateCustomProviderUrl/, 'Must export validateCustomProviderUrl');
    assert.match(code, /startsWith\('https:\/\/'\)/, 'Must enforce https:// scheme');
    assert.match(code, /includes\('\{tmdbId\}'\)/, 'Must require {tmdbId} placeholder');
    assert.match(code, /javascript:|data:|file:/i, 'Must reject unsafe schemes');
  });

  // ============================================================================
  // 4. GLASS-CARD STYLING TOKENS & USER PREFERENCES
  // ============================================================================
  test('UserPreferences: includes full appearance, cards, animations, and provider configuration schemas', () => {
    const userTypesCode = fs.readFileSync('src/types/user.ts', 'utf8');
    assert.match(userTypesCode, /enableGlassCards:\s*boolean/, 'Must define enableGlassCards');
    assert.match(userTypesCode, /cardGlassOpacity:\s*number/, 'Must define cardGlassOpacity');
    assert.match(userTypesCode, /cardBlurStrength:\s*'none'\s*\|\s*'sm'\s*\|\s*'md'\s*\|\s*'lg'/, 'Must define cardBlurStrength');
    assert.match(userTypesCode, /cardGlow:\s*boolean/, 'Must define cardGlow');
    assert.match(userTypesCode, /cardCornerRadius:\s*'rounded-lg'\s*\|\s*'rounded-xl'\s*\|\s*'rounded-2xl'/, 'Must define cardCornerRadius');
    assert.match(userTypesCode, /cardElevation:\s*'none'\s*\|\s*'sm'\s*\|\s*'md'\s*\|\s*'lg'\s*\|\s*'2xl'/, 'Must define cardElevation');
    assert.match(userTypesCode, /customProviders:\s*DeclarativeCustomProvider\[\]/, 'Must define customProviders');
  });

  test('MovieCard: dynamically consumes configurable glass card tokens from UserPreferences', () => {
    const cardCode = fs.readFileSync('src/components/common/MovieCard.tsx', 'utf8');
    assert.match(cardCode, /enableGlassCards/, 'MovieCard must read enableGlassCards');
    assert.match(cardCode, /cardGlassOpacity/, 'MovieCard must read cardGlassOpacity');
    assert.match(cardCode, /cardBlurStrength/, 'MovieCard must read cardBlurStrength');
    assert.match(cardCode, /--card-glass-opacity/, 'MovieCard must bind CSS variable --card-glass-opacity');
    assert.match(cardCode, /--card-blur-strength/, 'MovieCard must bind CSS variable --card-blur-strength');
  });

  // ============================================================================
  // 5. PLAYER HUD PROVIDER/SERVER DROPDOWN
  // ============================================================================
  test('VideoPlayer: mounts Provider & Server dropdown in top HUD bar', () => {
    const playerCode = fs.readFileSync('src/components/player/VideoPlayer.tsx', 'utf8');
    assert.match(playerCode, /isProviderMenuOpen/, 'VideoPlayer must track isProviderMenuOpen');
    assert.match(playerCode, /streamingManager\.getRegisteredProviders\(\)/, 'Must render registered providers');
    assert.match(playerCode, /streamingManager\.getAvailableServers\(/, 'Must render provider servers');
    assert.match(playerCode, /streamingManager\.setActiveProviderId/, 'Must allow switching active provider');
  });

  // ============================================================================
  // 6. PICTURE-IN-PICTURE ROUTE PERSISTENCE & MINI-CONTROLLER
  // ============================================================================
  test('PersistentPlayerHost: renders docked mini-controller when navigating away from watch route', () => {
    const hostCode = fs.readFileSync('src/components/player/PersistentPlayerHost.tsx', 'utf8');
    assert.match(hostCode, /const\s+isOnWatchRoute\s*=\s*location\.pathname\.startsWith\('\/watch'\)/, 'Must detect watch route');
    assert.match(hostCode, /Active Playback/, 'Must render docked mini-controller for background playback');
    assert.match(hostCode, /Expand/, 'Must provide Expand action');
    assert.match(hostCode, /Stop Playback/, 'Must provide Stop Playback action');
  });
});
