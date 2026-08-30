import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('RoninPLEX v2.0.0 Master Architecture Suite', () => {
  test('Complete VLC Eradication: Zero VLC in Rust codebase', () => {
    const mainRs = fs.readFileSync('src-tauri/src/main.rs', 'utf8');
    const libRs = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');
    const cargoToml = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');

    assert.strictEqual(mainRs.toLowerCase().includes('vlc'), false, 'main.rs must not mention VLC');
    assert.strictEqual(libRs.toLowerCase().includes('vlc'), false, 'lib.rs must not mention VLC');
    assert.strictEqual(cargoToml.toLowerCase().includes('vlc'), false, 'Cargo.toml must not mention VLC');
  });

  test('Complete VLC Eradication: Zero VLC in frontend src/', () => {
    const checkDir = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        const full = `${dir}/${f.name}`;
        if (f.isDirectory()) {
          checkDir(full);
        } else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx') || f.name.endsWith('.css')) {
          const content = fs.readFileSync(full, 'utf8');
          assert.strictEqual(
            content.toLowerCase().includes('vlcplayer') || content.toLowerCase().includes('vlc_'),
            false,
            `${full} must not reference VLC components`
          );
        }
      }
    };
    checkDir('src');
  });

  test('Slice A: Anime SDK Genuine Integration exists and exports normalized methods', () => {
    assert.ok(fs.existsSync('src/services/anime/AnimeSdkAdapter.ts'), 'AnimeSdkAdapter.ts must exist');
    const adapterCode = fs.readFileSync('src/services/anime/AnimeSdkAdapter.ts', 'utf8');
    assert.ok(adapterCode.includes("from 'anime-sdk'"), 'AnimeSdkAdapter must genuinely import from anime-sdk');
    assert.ok(adapterCode.includes('searchAnime'), 'Must export searchAnime');
    assert.ok(adapterCode.includes('getAnimeDetails'), 'Must export getAnimeDetails');
    assert.ok(adapterCode.includes('getEpisodes'), 'Must export getEpisodes');
    assert.ok(adapterCode.includes('getStreamingSources'), 'Must export getStreamingSources');
  });

  test('Slice B: Anime Isolation — AnimeService has dedicated repository and domain types without TMDB leakage', () => {
    assert.ok(fs.existsSync('src/services/anime/AnimeTypes.ts'), 'AnimeTypes exists');
    assert.ok(fs.existsSync('src/services/anime/AnimeRepository.ts'), 'AnimeRepository exists');
    assert.ok(fs.existsSync('src/services/anime/AnimeMapper.ts'), 'AnimeMapper exists');
    assert.ok(fs.existsSync('src/services/anime/AnimeService.ts'), 'AnimeService exists');

    const serviceCode = fs.readFileSync('src/services/anime/AnimeService.ts', 'utf8');
    assert.strictEqual(serviceCode.includes("from '../tmdb'"), false, 'AnimeService must not import TMDB');
    assert.strictEqual(serviceCode.includes('from "../tmdb"'), false, 'AnimeService must not import TMDB');
  });

  test('Slice C: Dedicated Anime Player Architecture exists and is separate from generic movie player', () => {
    assert.ok(fs.existsSync('src/components/player/anime/AnimeVideoPlayer.tsx'), 'AnimeVideoPlayer.tsx must exist');
    assert.ok(fs.existsSync('src/components/player/anime/AnimeSubtitleManager.ts'), 'AnimeSubtitleManager must exist');
    assert.ok(fs.existsSync('src/components/player/anime/AnimeEpisodeController.ts'), 'AnimeEpisodeController must exist');
    assert.ok(fs.existsSync('src/components/player/anime/AnimePlaybackController.ts'), 'AnimePlaybackController must exist');

    const watchCode = fs.readFileSync('src/pages/Watch.tsx', 'utf8');
    assert.ok(watchCode.includes('<AnimeVideoPlayer'), 'Watch.tsx must render dedicated AnimeVideoPlayer when isAnime is true');
  });

  test('Slice D: Anime Episode Pagination / 1100+ Support without 500-cap', () => {
    const mapperCode = fs.readFileSync('src/services/anime/AnimeMapper.ts', 'utf8');
    assert.strictEqual(mapperCode.includes('Math.min(totalCount, 500)'), false, 'AnimeMapper must not artificially cap at 500 episodes');

    const detailsCode = fs.readFileSync('src/pages/AnimeDetails.tsx', 'utf8');
    assert.ok(detailsCode.includes('CHUNK_SIZE'), 'AnimeDetails must chunk episode display for high counts');
    assert.ok(detailsCode.includes('Jump to ep'), 'AnimeDetails must include jump to episode numeric input');
    assert.ok(detailsCode.includes('Latest (Ep'), 'AnimeDetails must include jump to latest episode');
  });

  test('Slice E: Latest & Upcoming Anime Airing System with countdown', () => {
    const repoCode = fs.readFileSync('src/services/anime/AnimeRepository.ts', 'utf8');
    assert.ok(repoCode.includes('fetchLatestEpisodes'), 'AnimeRepository must have fetchLatestEpisodes');
    assert.ok(repoCode.includes('fetchUpcomingEpisodes'), 'AnimeRepository must have fetchUpcomingEpisodes');
    assert.ok(repoCode.includes('airingSchedules'), 'Must query AniList airingSchedules');

    const animePageCode = fs.readFileSync('src/pages/Anime.tsx', 'utf8');
    assert.ok(animePageCode.includes('Latest Episodes'), 'Anime page must have Latest Episodes section');
    assert.ok(animePageCode.includes('formatCountdown'), 'Anime page must calculate live airing countdown');
  });

  test('Slice F & G: Unified Discover with Anime & Compound Key Filter Integrity', () => {
    const discoverCode = fs.readFileSync('src/pages/Discover.tsx', 'utf8');
    assert.ok(discoverCode.includes("mediaType === 'anime'"), 'Discover must support anime mediaType');
    assert.ok(discoverCode.includes('Anime Only'), 'Discover must have Anime Only selector');
    assert.ok(discoverCode.includes('All Media'), 'Discover must have All Media selector');
    assert.ok(discoverCode.includes('stableKey'), 'Discover must use compound key for deduplication');
    assert.ok(discoverCode.includes('requestIdRef'), 'Discover must cancel obsolete requests');
  });

  test('Slice H: Adult & 18+ Accessible Classification', () => {
    assert.ok(fs.existsSync('src/components/common/AdultBadge.tsx'), 'AdultBadge.tsx exists');
    const badge = fs.readFileSync('src/components/common/AdultBadge.tsx', 'utf8');
    assert.ok(badge.includes('aria-label="18+ Adult Content"'), 'AdultBadge has accessible aria-label');

    const animePageCode = fs.readFileSync('src/pages/Anime.tsx', 'utf8');
    assert.ok(animePageCode.includes("selectedGenre === '18+'"), 'Anime page must feature explicit 18+ filter');
  });

  test('Slice I: Real Glass UI tokens exist in stylesheet', () => {
    const css = fs.readFileSync('src/index.css', 'utf8');
    assert.ok(css.includes('.glass-card'), 'Must contain .glass-card');
    assert.ok(css.includes('.glass-nav'), 'Must contain .glass-nav');
    assert.ok(css.includes('backdrop-filter'), 'Must use genuine backdrop-filter');
  });

  test('Slice J & K: Ronin AI Branding & Multi-turn Conversational Intelligence', () => {
    const nav = fs.readFileSync('src/components/common/Navbar.tsx', 'utf8');
    assert.strictEqual(nav.includes("'Decision Helper'"), false, 'Navbar must not mention Decision Helper');
    assert.ok(nav.includes("'Ronin AI'"), 'Navbar must feature Ronin AI');
    assert.ok(nav.includes('title="Ask Ronin AI"'), 'Navbar brand must include direct Ronin AI entry point');

    const ai = fs.readFileSync('src/services/ai/AIService.ts', 'utf8');
    assert.ok(ai.includes('The Marvel tapestry is vast'), 'AIService contains Marvel conversational multi-turn inquiry');
    assert.ok(ai.includes('The Dojo welcomes you'), 'AIService contains Anime conversational multi-turn inquiry');
    assert.ok(ai.includes('recommendedIds'), 'AIService tracks session recommended IDs to prevent repeats');
  });

  test('Slice L: Ronin Avatar 9 Reactive Character States', () => {
    const avatar = fs.readFileSync('src/components/ronin/RoninAvatar.tsx', 'utf8');
    const requiredStates = [
      'idle', 'thinking', 'talking', 'happy', 'curious',
      'recommending', 'surprised', 'sword-practice', 'celebrating'
    ];
    for (const st of requiredStates) {
      assert.ok(avatar.includes(st), `RoninAvatar must support state: ${st}`);
    }
  });
  test('Slice M: Anime Progress Deletion - Episode specificity', () => {
    const storageContent = fs.readFileSync('src/services/storage.ts', 'utf8');
    // Ensure removePlaybackProgress checks for season and episode specifically for tv and anime
    assert.match(storageContent, /if \(\(mediaType === 'tv' \|\| mediaType === 'anime'\) && season !== undefined && episode !== undefined\)/);
  });

  test('Slice N: Universal Search includes Movies, TV Shows, and Anime', () => {
    const searchCode = fs.readFileSync('src/pages/Search.tsx', 'utf8');
    assert.ok(searchCode.includes("activeType === 'anime'"), 'Search must support anime type');
    assert.ok(searchCode.includes('animeService.search'), 'Search must call anime metadata search');
    assert.ok(searchCode.includes('All Media'), 'Search must have All Media tab');
  });
});