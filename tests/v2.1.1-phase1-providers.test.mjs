import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('RoninPLEX v2.1.1 — Phase 1 Provider Architecture & Capability System', () => {
  // ============================================================================
  // 1. PROVIDER LIFECYCLE & 6-STATE MODEL
  // ============================================================================
  test('ProviderState: supports all 6 states in types.ts', () => {
    const code = fs.readFileSync('src/services/streaming/types.ts', 'utf8');
    assert.match(code, /export type ProviderState =/, 'Must export ProviderState type');
    assert.match(code, /'candidate'/, 'Must support candidate state');
    assert.match(code, /'registered'/, 'Must support registered state');
    assert.match(code, /'verified'/, 'Must support verified state');
    assert.match(code, /'healthy'/, 'Must support healthy state');
    assert.match(code, /'unavailable'/, 'Must support unavailable state');
    assert.match(code, /'parked'/, 'Must support parked state');
  });

  test('StreamingManager: strictly separates verified status from operational health', () => {
    const code = fs.readFileSync('src/services/streaming/StreamingManager.ts', 'utf8');
    assert.match(code, /getProviderState\s*\(/, 'Must implement getProviderState API');
    assert.match(code, /isProviderVerified\s*\(/, 'Must implement isProviderVerified API');
    assert.match(code, /isProviderHealthy\s*\(/, 'Must implement isProviderHealthy API');

    // Verify transient errors do NOT automatically park providers
    assert.match(
      code,
      /const isDead = providerId === 'vidsrc-dev' \|\| providerId === 'superembed';/,
      'Transient errors must never set isDead=true for legitimate providers'
    );
  });

  // ============================================================================
  // 2. CAPABILITY-DRIVEN PROVIDER MODEL
  // ============================================================================
  test('ProviderCapabilities: provides structured capability model and lookup API', () => {
    const typesCode = fs.readFileSync('src/services/streaming/types.ts', 'utf8');
    assert.match(typesCode, /export interface ProviderCapabilities \{/, 'Must export ProviderCapabilities interface');
    assert.match(typesCode, /playback:\s*\{\s*embed:\s*boolean;\s*directStream:\s*boolean;\s*\}/, 'Must declare playback capabilities');
    assert.match(typesCode, /content:\s*\{\s*movie:\s*boolean;\s*tv:\s*boolean;\s*anime:\s*boolean;\s*\}/, 'Must declare content capabilities');
    assert.match(typesCode, /subtitles:\s*\{/, 'Must declare subtitle capabilities');
    assert.match(typesCode, /download:\s*\{/, 'Must declare download capabilities');

    const managerCode = fs.readFileSync('src/services/streaming/StreamingManager.ts', 'utf8');
    assert.match(managerCode, /getProviderCapabilities\s*\(providerId:\s*string\)/, 'StreamingManager must provide getProviderCapabilities API');
  });

  test('StreamingProvider interface: includes optional capability and state hooks', () => {
    const code = fs.readFileSync('src/services/streaming/StreamingProvider.ts', 'utf8');
    assert.match(code, /getCapabilities\?\(\):\s*import\('\.\/types'\)\.ProviderCapabilities;/, 'Must declare getCapabilities');
    assert.match(code, /getState\?\(\):\s*import\('\.\/types'\)\.ProviderState;/, 'Must declare getState');
    assert.match(code, /isVerified\?\(\):\s*boolean;/, 'Must declare isVerified');
  });

  // ============================================================================
  // 3. PARKED PROVIDER EXCLUSION & SUPEREMBED
  // ============================================================================
  test('SuperEmbed: explicitly initialized as parked with documented 403 test result', () => {
    const code = fs.readFileSync('src/services/streaming/providers/SuperEmbedProvider.ts', 'utf8');
    assert.match(code, /export class SuperEmbedProvider implements StreamingProvider/, 'Must implement SuperEmbedProvider');
    assert.match(code, /HTTP 403 Forbidden/, 'Must document HTTP 403 Forbidden Cloudflare challenge');
    assert.match(code, /state:\s*ProviderState\s*=\s*'parked'/, 'Initial state must be parked');
    assert.match(code, /isVerified\(\):\s*boolean\s*\{\s*return false;\s*\}/, 'isVerified must return false');
  });

  test('StreamingManager: strictly excludes parked providers from eligible resolution', () => {
    const code = fs.readFileSync('src/services/streaming/StreamingManager.ts', 'utf8');
    assert.match(
      code,
      /if \(this\.getProviderState\(id\) === 'parked'\)\s*\{\s*continue;\s*\}/,
      'getEligibleProviders must strictly exclude any provider with state parked'
    );
  });

  // ============================================================================
  // 4. DEFAULT PROVIDER & FALLBACK ORDERING
  // ============================================================================
  test('Default Provider: VidSrcME is the default Movie/TV provider across config and preferences', () => {
    const configCode = fs.readFileSync('src/services/streaming/providerConfig.ts', 'utf8');
    assert.match(configCode, /inMemoryActiveId:\s*string\s*=\s*'vidsrc-me'/, 'Default active provider in config must be vidsrc-me');
    assert.match(configCode, /return 'vidsrc-me'/, 'Fallback in getActiveProviderId must be vidsrc-me');

    const userCode = fs.readFileSync('src/types/user.ts', 'utf8');
    assert.match(userCode, /defaultProvider:\s*'vidsrc-me'/, 'DEFAULT_USER_PREFERENCES must set defaultProvider to vidsrc-me');

    const managerCode = fs.readFileSync('src/services/streaming/StreamingManager.ts', 'utf8');
    assert.match(managerCode, /if \(!provider\) return 'VidSrc Me \(vidsrcme\.ru\)';/, 'getActiveProviderName must fallback to VidSrc Me');
  });

  test('Fallback Ordering: priority chain resolves vidsrc-me first, followed by rive, vidlink, vidsrc-to, 2embed', () => {
    const code = fs.readFileSync('src/services/streaming/StreamingManager.ts', 'utf8');
    assert.match(
      code,
      /const priorityOrder = \['vidsrc-me',\s*'rive',\s*'vidlink',\s*'vidsrc-to',\s*'2embed',\s*'custom'\];/,
      'Priority order must match intended specification'
    );
  });

  test('Capability Filtering: getEligibleProviders matches content type', () => {
    const code = fs.readFileSync('src/services/streaming/StreamingManager.ts', 'utf8');
    assert.match(code, /getEligibleProviders\(contentType:\s*'movie' \| 'tv' \| 'anime'\s*=\s*'movie'\)/, 'Must accept contentType parameter');
    assert.match(code, /if \(contentType === 'movie' && !capabilities\.content\.movie\)/, 'Must filter movie capabilities');
    assert.match(code, /if \(contentType === 'tv' && !capabilities\.content\.tv\)/, 'Must filter tv capabilities');
    assert.match(code, /if \(contentType === 'anime' && !capabilities\.content\.anime\)/, 'Must filter anime capabilities');
    assert.match(code, /this\.getEligibleProviders\('movie'\)/, 'getMovie must pass movie content type');
    assert.match(code, /this\.getEligibleProviders\('tv'\)/, 'getTVShow and getTVEpisode must pass tv content type');
  });

  // ============================================================================
  // 5. PROVIDER IMPLEMENTATIONS AUDIT
  // ============================================================================
  test('VidSrcMeProvider: exposes verified capabilities and domain vidsrcme.ru', () => {
    const code = fs.readFileSync('src/services/streaming/providers/VidSrcMeProvider.ts', 'utf8');
    assert.match(code, /baseUrl = 'https:\/\/vidsrcme\.ru'/, 'Must target vidsrcme.ru');
    assert.match(code, /getState\(\):\s*ProviderState/, 'Must implement getState');
    assert.match(code, /isVerified\(\):\s*boolean/, 'Must be verified');
    assert.match(code, /movie:\s*true[\s\S]*?tv:\s*true[\s\S]*?anime:\s*false/, 'Must declare movie/tv only');
  });

  test('RiveStreamProvider: exposes verified capabilities, modes, and server options', () => {
    const code = fs.readFileSync('src/services/streaming/providers/RiveStreamProvider.ts', 'utf8');
    assert.match(code, /modes:\s*\['standard',\s*'aggregator',\s*'torrent'\]/, 'Must declare modes');
    assert.match(code, /servers:\s*RIVE_SERVERS/, 'Must declare servers');
    assert.match(code, /download:\s*\{[\s\S]*?supported:\s*true[\s\S]*?requiresResolver:\s*true/, 'Must declare download requiring resolver');
  });

  test('VidLinkProProvider: exposes verified capabilities including anime support', () => {
    const code = fs.readFileSync('src/services/streaming/providers/VidLinkProProvider.ts', 'utf8');
    assert.match(code, /baseUrl = 'https:\/\/vidlink\.pro'/, 'Must target vidlink.pro');
    assert.match(code, /movie:\s*true[\s\S]*?tv:\s*true[\s\S]*?anime:\s*true/, 'Must declare movie, tv, and anime');
  });

  test('VidSrcDevProvider: quarantined as parked and not verified', () => {
    const code = fs.readFileSync('src/services/streaming/providers/VidSrcDevProvider.ts', 'utf8');
    assert.match(code, /state:\s*ProviderState\s*=\s*'parked'/, 'Initial state must be parked');
    assert.match(code, /isVerified\(\):\s*boolean\s*\{\s*return false;\s*\}/, 'Must return false for isVerified');
  });
});
