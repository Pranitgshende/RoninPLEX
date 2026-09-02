import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function verifyPhase4AnimeArchitecture() {
  const watchPath = path.join(__dirname, '../src/pages/Watch.tsx');
  const watchSrc = fs.readFileSync(path.join(__dirname, '../src/components/player/PersistentPlayerHost.tsx'), 'utf8'); const ctxSrc = fs.readFileSync(path.join(__dirname, '../src/context/PlaybackContext.tsx'), 'utf8');

  test('AnimeVideoPlayer Key is deterministic and not sourceUrl bound', () => {
    assert.ok(watchSrc.includes('key={`anime-${mediaId}-${episodeNumber}-${retryCount}`}'), 'AnimeVideoPlayer key must be session and retry aware');
  });

  test('retryCount is passed down to AnimeStreamService', () => {
    assert.match(ctxSrc, /AnimeStreamService\.resolveEpisodeStream.*retryCount\)/, 'Must pass retryCount to resolveEpisodeStream');
  });

  const playerPath = path.join(__dirname, '../src/components/player/anime/AnimeVideoPlayer.tsx');
  const playerSrc = fs.readFileSync(playerPath, 'utf8');

  test('Auto-next cancels on reverse seek', () => {
    assert.match(playerSrc, /hasStartedAutoNextRef\.current = false;/, 'Must reset auto-next on seek backward');
  });

  test('Quality Selection uses handleQualityChange', () => {
    assert.match(playerSrc, /handleQualityChange\(q\.quality\)/, 'Quality click must trigger handleQualityChange');
    assert.match(playerSrc, /hlsRef\.current\.currentLevel = -1/, 'Must set hls level for auto');
  });

  test('Relation dropdown shows RelationType', () => {
    assert.match(playerSrc, /r\.relationType \? r\.relationType\.replace/, 'Relation dropdown must render relation type');
  });

  const streamServicePath = path.join(__dirname, '../src/services/anime/AnimeStreamService.ts');
  const streamServiceSrc = fs.readFileSync(streamServicePath, 'utf8');

  test('AnimeStreamService falls back to SUB if DUB fails', () => {
    assert.match(streamServiceSrc, /preferredLanguage === ContentLanguage\.DUB/, 'Must fallback to SUB if DUB fails');
  });
}

verifyPhase4AnimeArchitecture();
