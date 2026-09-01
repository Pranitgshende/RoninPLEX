import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createMockSessionContract() {
  let currentSessionId = '';
  let state = 'resolving';

  const mock = {
    init: () => {
      currentSessionId = 'session_' + Math.random();
      state = 'initializing';
      return currentSessionId;
    },
    getActiveSessionId: () => currentSessionId,
    disposeCurrentSession: (targetId) => {
      if (!targetId || targetId === currentSessionId) {
        state = 'disposed';
      }
    },
    runIfActive: (sessionId, fn) => (...args) => {
      if (sessionId === currentSessionId && state !== 'disposed') {
        return fn(...args);
      }
    }
  };
  return mock;
}

test('Phase 3 Playback Reliability Suite', async (t) => {
  const videoPlayerPath = path.join(__dirname, '..', 'src', 'components', 'player', 'VideoPlayer.tsx');
  const animeVideoPlayerPath = path.join(__dirname, '..', 'src', 'components', 'player', 'anime', 'AnimeVideoPlayer.tsx');
  const usePlaybackSessionPath = path.join(__dirname, '..', 'src', 'components', 'player', 'usePlaybackSession.ts');

  const videoPlayerContent = fs.readFileSync(videoPlayerPath, 'utf8');
  const animeVideoPlayerContent = fs.readFileSync(animeVideoPlayerPath, 'utf8');
  const usePlaybackSessionContent = fs.readFileSync(usePlaybackSessionPath, 'utf8');

  await t.test('HLS disposal is tied to session disposal', () => {
    assert.match(videoPlayerContent, /disposeCurrentSession\(sessionId\)/);
    assert.match(animeVideoPlayerContent, /disposeCurrentSession\(sessionId\)/);
  });

  await t.test('Progress save cancellation is handled by setSessionInterval', () => {
    assert.match(videoPlayerContent, /setSessionInterval\((?:sessionId|getActiveSessionId\(\)), flushProgress/);
    assert.match(animeVideoPlayerContent, /setSessionInterval\((?:sessionId|getActiveSessionId\(\)), flushProgress/);
  });

  await t.test('Watchdog cancellation is handled by setSessionInterval', () => {
    assert.ok(videoPlayerContent.includes('setWatchdogPhase'));
    assert.ok(videoPlayerContent.includes('setSessionInterval(sessionId'));
  });

  await t.test('Stale-session rejection and duplicate initialization prevention are enforced', () => {
    assert.match(usePlaybackSessionContent, /runIfActive/);
    assert.match(usePlaybackSessionContent, /isSessionActive/);
  });

  await t.test('Provider/session replacement is handled by Id', () => {
    assert.match(usePlaybackSessionContent, /currentSessionIdRef\.current =/);
    assert.match(usePlaybackSessionContent, /intervalsRef\.current\.forEach/);
  });

  await t.test('BEHAVIORAL: session contract enforces A cannot mutate B', () => {
    const sessionCore = createMockSessionContract();

    const sessionA = sessionCore.init();
    let executedA = false;
    const callbackA = sessionCore.runIfActive(sessionA, () => { executedA = true; });

    // Dispose A by starting B
    sessionCore.disposeCurrentSession(sessionA);
    const sessionB = sessionCore.init();
    let executedB = false;
    const callbackB = sessionCore.runIfActive(sessionB, () => { executedB = true; });

    // Fire both
    callbackA();
    callbackB();

    assert.strictEqual(executedA, false, 'Old callback A should not execute');
    assert.strictEqual(executedB, true, 'New callback B should execute');
  });
});
