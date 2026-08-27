import { vidSrcToProvider } from '../src/services/streaming/providers/VidSrcToProvider.ts';
import { vidSrcMeProvider } from '../src/services/streaming/providers/VidSrcMeProvider.ts';
import { vidSrcDevProvider } from '../src/services/streaming/providers/VidSrcDevProvider.ts';
import { vidLinkProProvider } from '../src/services/streaming/providers/VidLinkProProvider.ts';
import { streamingManager } from '../src/services/streaming/StreamingManager.ts';

async function runTests() {
  console.log('====================================================');
  console.log('RONINPLEX v1.1.0 MULTI-PROVIDER & FALLBACK TEST SUITE');
  console.log('====================================================\n');

  // TEST 1: VidSrc To (vidsrc.to)
  console.log('--- TEST 1: VidSrc To (vidsrc.to) ---');
  const movieTo = await vidSrcToProvider.getMovie(693134); // Dune: Part Two
  console.log('Movie Available:', movieTo?.available);
  console.log('Movie URL:', movieTo?.stream?.url);
  if (!movieTo?.stream?.url?.includes('vidsrc.to')) {
    throw new Error('VidSrc To returned invalid URL: ' + movieTo?.stream?.url);
  }
  const epTo = await vidSrcToProvider.getTVEpisode(1399, 1, 1);
  console.log('TV S1E1 URL:', epTo?.stream?.url);
  if (!epTo?.stream?.url?.includes('vidsrc.to/embed/tv/1399/1/1')) {
    throw new Error('VidSrc To TV returned invalid URL');
  }

  // TEST 2: VidSrc Me (vidsrcme.ru)
  console.log('\n--- TEST 2: VidSrc Me (vidsrcme.ru) ---');
  const movieMe = await vidSrcMeProvider.getMovie(693134);
  console.log('Movie Available:', movieMe?.available);
  console.log('Movie URL:', movieMe?.stream?.url);
  if (!movieMe?.stream?.url?.includes('vidsrcme.ru')) {
    throw new Error('VidSrc Me returned invalid URL: ' + movieMe?.stream?.url);
  }
  const epMe = await vidSrcMeProvider.getTVEpisode(1399, 1, 1);
  console.log('TV S1E1 URL:', epMe?.stream?.url);
  if (!epMe?.stream?.url?.includes('vidsrcme.ru/embed/tv/1399/1/1')) {
    throw new Error('VidSrc Me TV returned invalid URL');
  }

  // TEST 3: VidSrc Dev (vidsrc.dev)
  console.log('\n--- TEST 3: VidSrc Dev (vidsrc.dev) ---');
  const movieDev = await vidSrcDevProvider.getMovie(693134);
  console.log('Movie Available:', movieDev?.available);
  console.log('Movie URL:', movieDev?.stream?.url);
  if (!movieDev?.stream?.url?.includes('vidsrc.dev')) {
    throw new Error('VidSrc Dev returned invalid URL: ' + movieDev?.stream?.url);
  }
  const epDev = await vidSrcDevProvider.getTVEpisode(1399, 1, 1);
  console.log('TV S1E1 URL:', epDev?.stream?.url);
  if (!epDev?.stream?.url?.includes('vidsrc.dev/embed/tv/1399/1/1')) {
    throw new Error('VidSrc Dev TV returned invalid URL');
  }

  // TEST 4: VidLink Pro (vidlink.pro)
  console.log('\n--- TEST 4: VidLink Pro (vidlink.pro) ---');
  const movieLink = await vidLinkProProvider.getMovie(693134);
  console.log('Movie Available:', movieLink?.available);
  console.log('Movie URL:', movieLink?.stream?.url);
  if (!movieLink?.stream?.url?.includes('vidlink.pro/movie/693134')) {
    throw new Error('VidLink Pro returned invalid URL: ' + movieLink?.stream?.url);
  }
  const epLink = await vidLinkProProvider.getTVEpisode(1399, 1, 1);
  console.log('TV S1E1 URL:', epLink?.stream?.url);
  if (!epLink?.stream?.url?.includes('vidlink.pro/tv/1399/1/1')) {
    throw new Error('VidLink Pro TV returned invalid URL');
  }

  // TEST 5: StreamingManager Multi-Provider Fallback
  console.log('\n--- TEST 5: StreamingManager Provider Fallback Simulation ---');
  console.log('Initial Active Provider:', streamingManager.getActiveProviderName());
  console.log('Eligible Providers Count:', streamingManager.getEligibleProviders().length);

  // Register a deliberately failing mock provider A
  const failingProvider = {
    getId: () => 'mock-failing',
    getName: () => 'Mock Failing Provider',
    testConnection: async () => false,
    getMovie: async () => { throw new Error('Simulated upstream HTTP 503 outage'); },
    getTVShow: async () => null,
    getTVEpisode: async () => { throw new Error('Simulated upstream HTTP 503 outage'); },
  };

  streamingManager.registerProvider(failingProvider);
  streamingManager.setActiveProviderId('mock-failing');
  streamingManager.clearCache();

  console.log('Active Provider set to:', streamingManager.getActiveProviderName());

  // Request movie — Provider A will throw, fallback will seamlessly pick Provider B (vidsrc-to)
  const resolvedMovie = await streamingManager.getMovie(693134);
  console.log('Resolved Stream URL:', resolvedMovie?.stream?.url);
  console.log('Resolved Provider:', resolvedMovie?.stream?.providerName);

  if (!resolvedMovie?.stream?.url) {
    throw new Error('Fallback failed to resolve a stream when preferred provider errored!');
  }

  const attempts = streamingManager.getLastFallbackAttempts();
  console.log('Fallback Attempts Log:', attempts.map(a => `${a.providerName}: ${a.status}${a.reason ? ` (${a.reason})` : ''}`).join(' -> '));

  const firstAttempt = attempts[0];
  if (firstAttempt?.status !== 'failed' || !firstAttempt?.reason?.includes('503')) {
    throw new Error('Fallback attempt log did not properly record the failed provider attempt!');
  }

  const successfulAttempt = attempts.find(a => a.status === 'success');
  if (!successfulAttempt) {
    throw new Error('Fallback attempt log did not record successful provider attempt!');
  }

  // Clean up mock provider and restore default
  streamingManager.unregisterProvider('mock-failing');
  streamingManager.setActiveProviderId('vidsrc-to');
  streamingManager.clearCache();

  console.log('\n--- TEST 6: All-Provider Failure Handled Gracefully ---');
  // Passing an invalid 0 ID should cleanly return null without unhandled rejections
  const invalidMovie = await streamingManager.getMovie(0);
  console.log('Invalid Media Result (expected null):', invalidMovie);
  if (invalidMovie !== null) {
    throw new Error('Expected null for invalid ID 0');
  }

  console.log('\n====================================================');
  console.log('ALL RONINPLEX STREAMING & FALLBACK UNIT TESTS PASSED!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Unit tests failed:', err);
  process.exit(1);
});
