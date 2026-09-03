import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('RoninPLEX v2.1.1 P0 Desktop & PiP Stabilization Suite', () => {
  // ============================================================================
  // 1. PIP STATE VALIDITY INVARIANT
  // ============================================================================
  test('P0 Invariant: pipService exposes hasLivePiPWindow and requestEnterPiP with deterministic handshake', () => {
    const pipCode = fs.readFileSync('src/services/pip.ts', 'utf8');
    assert.match(pipCode, /hasLivePiPWindow\s*\(\)/, 'pipService must implement hasLivePiPWindow');
    assert.match(pipCode, /requestEnterPiP\s*\(/, 'pipService must implement requestEnterPiP');
    assert.match(pipCode, /msg\.type\s*===\s*'PIP_READY'/, 'requestEnterPiP must await PIP_READY handshake');
  });

  test('P0 Invariant: PlaybackContext enterPiP only sets presentationMode to PIP on verified window creation', () => {
    const contextCode = fs.readFileSync('src/context/PlaybackContext.tsx', 'utf8');
    assert.match(contextCode, /enterPiP\s*=\s*useCallback/, 'PlaybackContext must provide enterPiP');
    assert.match(contextCode, /const\s+success\s*=\s*await\s+pipService\.requestEnterPiP/, 'enterPiP must await requestEnterPiP');
    assert.match(contextCode, /if\s*\(success\)\s*\{\s*setPresentationMode\('PIP'\)/, 'enterPiP must only set PIP presentation mode on success');
  });

  test('P0 Invariant: PersistentPlayerHost contains self-healing guard if PIP state exists without window', () => {
    const hostCode = fs.readFileSync('src/components/player/PersistentPlayerHost.tsx', 'utf8');
    assert.match(hostCode, /pipService\.hasLivePiPWindow/, 'PersistentPlayerHost must check for live PiP window');
    assert.match(hostCode, /playback\.setPresentationMode\('FULL'\)/, 'PersistentPlayerHost must self-heal to FULL if window missing');
  });

  // ============================================================================
  // 2. PLAYER BACK ISOLATION
  // ============================================================================
  test('P0 Player Back: Player Back navigation does NOT trigger PiP in Watch.tsx', () => {
    const watchCode = fs.readFileSync('src/pages/Watch.tsx', 'utf8');
    assert.ok(!watchCode.includes("setPresentationMode('PIP')"), 'Watch.tsx must NOT unconditionally set presentation mode to PIP on unmount');
    assert.match(watchCode, /presentationModeRef\.current\s*!==\s*'PIP'\s*\)\s*\{\s*closePlayer\(\);/, 'Watch.tsx must close playback session cleanly if not in PiP');
  });

  test('P0 Player Back: PersistentPlayerHost handlePlayerBack explicitly terminates playback before navigating', () => {
    const hostCode = fs.readFileSync('src/components/player/PersistentPlayerHost.tsx', 'utf8');
    assert.match(hostCode, /handlePlayerBack\s*=\s*\(\)\s*=>\s*\{\s*playback\.closePlayer\(\);\s*goBack\(\);/, 'handlePlayerBack must close player before calling goBack');
  });

  // ============================================================================
  // 3. RECOVERY UI PIP ACTION
  // ============================================================================
  test('P0 Recovery UI: PiP button available on Stalled/Black Screen banner and top bar without touching iframe', () => {
    const playerCode = fs.readFileSync('src/components/player/VideoPlayer.tsx', 'utf8');
    assert.match(playerCode, /Stalled or black screen\?/, 'Recovery banner must be present');
    assert.match(playerCode, /playbackContext\.enterPiP\(\)/, 'Recovery banner PiP button must invoke enterPiP');
    assert.match(playerCode, /title="Picture-in-Picture \(P\)"/, 'Top floating bar must have PiP button');
  });

  // ============================================================================
  // 4. PLAYER HUD AUTO-HIDE & HIT TESTING
  // ============================================================================
  test('P1 HUD Auto-Hide: VideoPlayer uses exactly 3.0s auto-hide timer and pauses for open menus', () => {
    const playerCode = fs.readFileSync('src/components/player/VideoPlayer.tsx', 'utf8');
    assert.match(playerCode, /3000\);/, 'resetControlsTimer must hide controls after exactly 3000ms');
    assert.match(playerCode, /!isSpeedMenuOpen\s*&&\s*!isSubtitleMenuOpen/, 'Timer must pause when speed or subtitle menus are open');
  });

  test('P1 HUD Hit Testing: Top bar container has pointer-events-none and button groups have pointer-events-auto', () => {
    const playerCode = fs.readFileSync('src/components/player/VideoPlayer.tsx', 'utf8');
    assert.match(playerCode, /pointer-events-none\s+transition-opacity\s+duration-300/, 'Top bar container must allow pass-through clicks');
    assert.match(playerCode, /pointer-events-auto\s+player-control-surface/, 'Button groups must capture pointer events');
  });

  // ============================================================================
  // 5. EPISODE DRAWER INTEGRATION
  // ============================================================================
  test('P1 Episode Drawer: EpisodeDrawer component exists with season selector, thumbnails, and TMDB integration', () => {
    const drawerExists = fs.existsSync('src/components/player/EpisodeDrawer.tsx');
    assert.ok(drawerExists, 'EpisodeDrawer.tsx must exist');
    const drawerCode = fs.readFileSync('src/components/player/EpisodeDrawer.tsx', 'utf8');
    assert.match(drawerCode, /selectedSeasonNumber/, 'EpisodeDrawer must have season selector');
    assert.match(drawerCode, /getStillUrl/, 'EpisodeDrawer must display episode thumbnails');
    assert.match(drawerCode, /onSelectEpisode/, 'EpisodeDrawer must notify when episode is clicked');
  });

  test('P1 Episode Drawer: PersistentPlayerHost mounts EpisodeDrawer and passes onOpenEpisodeDrawer to VideoPlayer', () => {
    const hostCode = fs.readFileSync('src/components/player/PersistentPlayerHost.tsx', 'utf8');
    assert.match(hostCode, /<EpisodeDrawer/, 'PersistentPlayerHost must mount EpisodeDrawer');
    assert.match(hostCode, /onOpenEpisodeDrawer=\{isTV/, 'PersistentPlayerHost must wire onOpenEpisodeDrawer to VideoPlayer');
  });

  // ============================================================================
  // 6. MOTION / INTRO TIMING
  // ============================================================================
  test('P1 Intro Motion: logo zoom locked to 2.0s max and scramble continues for 4.5s with hold', () => {
    const timelineCode = fs.readFileSync('src/animation/timelines/roninIntroTimeline.ts', 'utf8');
    assert.match(timelineCode, /duration:\s*2\.0,\s*ease:\s*motionTokens\.ease\.cinematic/, 'Logo zoom must complete and lock at 2.0s');
    assert.match(timelineCode, /duration:\s*5\.0/, 'Timeline must run for 5.0s to hold readable text after 4.5s scramble');

    const introCode = fs.readFileSync('src/components/startup/RoninIntro.tsx', 'utf8');
    assert.match(introCode, /<ScrambleText\s+text="(?:RoninPLEX|RONINPLEX)"\s+duration=\{4\.5\}/, 'RoninIntro must render ScrambleText with duration 4.5');
  });

  // ============================================================================
  // 7. SCRAMBLETEXT ACTIVATION MODEL
  // ============================================================================
  test('P1 ScrambleText: linear progression, deliberate frame cadence, and autoStart defaults to false', () => {
    const scrambleCode = fs.readFileSync('src/animation/components/ScrambleText.tsx', 'utf8');
    assert.match(scrambleCode, /autoStart\s*=\s*false/, 'ScrambleText must default autoStart to false');
    assert.match(scrambleCode, /ease:\s*"none"/, 'ScrambleText must resolve linearly');
    assert.match(scrambleCode, /frameCount\s*%\s*3\s*===\s*0/, 'ScrambleText must throttle character mutation cadence');
    assert.match(scrambleCode, /whitespace-nowrap/, 'ScrambleText must preserve single-line geometry');
  });

  test('P1 Scramble Activation: Secondary shelf headings use autoStart=false', () => {
    const mediaRowCode = fs.readFileSync('src/components/common/MediaRow.tsx', 'utf8');
    assert.match(mediaRowCode, /<ScrambleText\s+text=\{title\}\s+autoStart=\{false\}\s*\/>/, 'MediaRow shelves must default to hover-only scramble');

    const homeCode = fs.readFileSync('src/pages/Home.tsx', 'utf8');
    assert.match(homeCode, /<ScrambleText\s+text="Continue Watching"\s+autoStart=\{false\}\s*\/>/, 'Home Continue Watching must be hover-only');
    assert.match(homeCode, /<ScrambleText\s+text="My Watchlist"\s+autoStart=\{false\}\s*\/>/, 'Home Watchlist must be hover-only');

    const animeCode = fs.readFileSync('src/pages/Anime.tsx', 'utf8');
    assert.match(animeCode, /<ScrambleText\s+text=\{title\}\s+autoStart=\{false\}\s*\/>/, 'Anime shelves must be hover-only');
    assert.match(animeCode, /<ScrambleText\s+text="Upcoming Episodes"\s+autoStart=\{false\}\s*\/>/, 'Anime Upcoming Episodes must be hover-only');
    assert.match(animeCode, /<ScrambleText\s+text="Latest Episodes"\s+autoStart=\{false\}\s*\/>/, 'Anime Latest Episodes must be hover-only');
  });

  // ============================================================================
  // 8. GLASSMORPHIC SKELETON LOADING
  // ============================================================================
  test('P1 Skeletons: GlassSkeleton, SkeletonCard, SkeletonShelf, SkeletonHero exist with pure CSS shimmer', () => {
    assert.ok(fs.existsSync('src/components/common/skeleton/GlassSkeleton.tsx'), 'GlassSkeleton must exist');
    assert.ok(fs.existsSync('src/components/common/skeleton/SkeletonCard.tsx'), 'SkeletonCard must exist');
    assert.ok(fs.existsSync('src/components/common/skeleton/SkeletonShelf.tsx'), 'SkeletonShelf must exist');
    assert.ok(fs.existsSync('src/components/common/skeleton/SkeletonHero.tsx'), 'SkeletonHero must exist');

    const cssCode = fs.readFileSync('src/index.css', 'utf8');
    assert.match(cssCode, /@keyframes\s+shimmer/, 'index.css must define @keyframes shimmer');
    assert.match(cssCode, /\.animate-shimmer/, 'index.css must define .animate-shimmer');
  });

  // ============================================================================
  // 9. WINDOWS TASKBAR & APP BRANDING
  // ============================================================================
  test('P1 Branding: Circular emblem master icon and Tauri icon assets exist', () => {
    assert.ok(fs.existsSync('src-tauri/icons/icon.png'), 'Master icon.png must exist');
    assert.ok(fs.existsSync('src-tauri/icons/icon.ico'), 'icon.ico must exist');
    assert.ok(fs.existsSync('src-tauri/icons/32x32.png'), '32x32.png must exist');
    assert.ok(fs.existsSync('src-tauri/icons/128x128.png'), '128x128.png must exist');
    assert.ok(fs.existsSync('src/assets/brand-mark.png'), 'brand-mark.png must exist');

    const logoCode = fs.readFileSync('src/components/common/RoninLogo.tsx', 'utf8');
    assert.match(logoCode, /brand-mark\.png/, 'RoninLogo must use brand-mark.png');

    const introCode = fs.readFileSync('src/components/startup/RoninIntro.tsx', 'utf8');
    assert.match(introCode, /brand-mark\.png/, 'RoninIntro must use brand-mark.png');
  });

  // ============================================================================
  // 10. TAURI LIFECYCLE & PROCESS SECURITY
  // ============================================================================
  test('P0 Lifecycle: Tauri Rust lib.rs handles WindowEvent::Destroyed for main and pip-window', () => {
    const libCode = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');
    assert.match(libCode, /WindowEvent::Destroyed/, 'app.run must intercept WindowEvent::Destroyed');
    assert.match(libCode, /kill_sidecar\(app_handle\);\s*app_handle\.exit\(0\);/, 'Destroying main window without pip must kill sidecar and exit cleanly');
    assert.match(libCode, /pip-window/, 'app.run must handle pip-window destruction to recover main window');
  });

  // ============================================================================
  // 11. TMDB MODAL & ONBOARDING SCRAMBLE LIFECYCLE
  // ============================================================================
  test('P1 TMDB Onboarding: Coordinates with AppLifecycle to hold page scramble while blocking', () => {
    const lifecycleCode = fs.readFileSync('src/context/AppLifecycleContext.tsx', 'utf8');
    assert.match(lifecycleCode, /isOnboardingBlocking/, 'AppLifecycleContext must manage isOnboardingBlocking');
    assert.match(lifecycleCode, /canAnimatePage\s*=\s*isIntroComplete\s*&&\s*!isOnboardingBlocking/, 'canAnimatePage must gate on intro completion and onboarding dismissal');

    const modalCode = fs.readFileSync('src/components/modals/TMDBOnboardingModal.tsx', 'utf8');
    assert.match(modalCode, /setIsOnboardingBlocking\(true\)/, 'TMDBOnboardingModal must block page animations while open');
    assert.match(modalCode, /setIsOnboardingBlocking\(false\)/, 'TMDBOnboardingModal must unblock page animations when closed');
    assert.match(modalCode, /document\.body\.style\.overflow\s*=\s*['"]hidden['"]/, 'TMDBOnboardingModal must lock background body scrolling');
    assert.match(modalCode, /<PremiumGlowBorder/, 'TMDBOnboardingModal must use PremiumGlowBorder');

    const heroCode = fs.readFileSync('src/components/hero/HeroBanner.tsx', 'utf8');
    assert.match(heroCode, /autoStart=\{canAnimatePage\}/, 'HeroBanner ScrambleText must autoStart using canAnimatePage');
  });

  // ============================================================================
  // 12. PREMIUM ROTATING GLOW BORDER
  // ============================================================================
  test('P1 Motion: PremiumGlowBorder component and CSS keyframes exist with reduced motion respect', () => {
    assert.ok(fs.existsSync('src/components/common/PremiumGlowBorder.tsx'), 'PremiumGlowBorder.tsx must exist');

    const cssCode = fs.readFileSync('src/index.css', 'utf8');
    assert.match(cssCode, /@keyframes\s+rotateGlow/, 'index.css must define @keyframes rotateGlow');
    assert.match(cssCode, /\.animate-rotate-glow/, 'index.css must define .animate-rotate-glow');

    const glowCode = fs.readFileSync('src/components/common/PremiumGlowBorder.tsx', 'utf8');
    assert.match(glowCode, /animate-rotate-glow/, 'PremiumGlowBorder must use animate-rotate-glow');
    assert.match(glowCode, /conic-gradient/, 'PremiumGlowBorder must use purple/indigo conic gradient');
  });

  // ============================================================================
  // 13. SKELETON CARD LOADING & BADGE SYNCHRONIZATION
  // ============================================================================
  test('P1 Skeleton: MovieCard uses GlassSkeleton and synchronizes badges with image load', () => {
    const movieCardCode = fs.readFileSync('src/components/common/MovieCard.tsx', 'utf8');
    assert.match(movieCardCode, /<GlassSkeleton/, 'MovieCard must render GlassSkeleton during image fetch');
    assert.match(movieCardCode, /imageError/, 'MovieCard must track image loading error');
    assert.match(movieCardCode, /imageLoaded\s*\?\s*['"]opacity-100['"]\s*:\s*['"]opacity-0/, 'MovieCard must synchronize overlay badges with imageLoaded state');

    const skeletonCardCode = fs.readFileSync('src/components/common/skeleton/SkeletonCard.tsx', 'utf8');
    assert.match(skeletonCardCode, /hasCustomWidth/, 'SkeletonCard must support flexible grid column sizing');
  });

  // ============================================================================
  // 14. PICTURE-IN-PICTURE RUNTIME INTEGRITY
  // ============================================================================
  test('P0 PiP: Snapshot provider registered unconditionally and PiPWindowApp has UserProvider & HashRouter', () => {
    const videoPlayerCode = fs.readFileSync('src/components/player/VideoPlayer.tsx', 'utf8');
    assert.doesNotMatch(videoPlayerCode, /if\s*\(isPipHost\)\s*\{\s*return\s*pipService\.registerSnapshotProvider/, 'VideoPlayer snapshot provider must not be restricted to isPipHost');

    const animePlayerCode = fs.readFileSync('src/components/player/anime/AnimeVideoPlayer.tsx', 'utf8');
    assert.doesNotMatch(animePlayerCode, /if\s*\(isPipHost\)\s*\{\s*return\s*pipService\.registerSnapshotProvider/, 'AnimeVideoPlayer snapshot provider must not be restricted to isPipHost');

    const mainCode = fs.readFileSync('src/main.tsx', 'utf8');
    assert.match(mainCode, /<HashRouter>\s*<UserProvider>\s*<PiPWindowApp\s*\/>\s*<\/UserProvider>\s*<\/HashRouter>/, 'PiPWindowApp must be wrapped in HashRouter and UserProvider');

    const playbackCode = fs.readFileSync('src/context/PlaybackContext.tsx', 'utf8');
    assert.match(playbackCode, /constructing from PlaybackContext state/, 'PlaybackContext must have resilient snapshot fallback');
  });

  // ============================================================================
  // 15. PROVIDER PLAYER HUD & NATIVE BROWSER COMMAND
  // ============================================================================
  test('P0 Player: Top interaction sensor in embed player and open_in_browser in lib.rs', () => {
    const videoPlayerCode = fs.readFileSync('src/components/player/VideoPlayer.tsx', 'utf8');
    assert.match(videoPlayerCode, /Dedicated Top Interaction\/Hover Strip for Embed Provider HUD/, 'VideoPlayer must provide top interaction sensor');
    assert.doesNotMatch(videoPlayerCode, /Play Direct HLS in App/, 'Misleading Direct HLS test button must be removed');
    assert.match(videoPlayerCode, /open_in_browser/, 'VideoPlayer must invoke native open_in_browser command');

    const libCode = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');
    assert.match(libCode, /fn\s+open_in_browser/, 'src-tauri/src/lib.rs must implement open_in_browser command');
    assert.match(libCode, /trimmed\.starts_with\("http:\/\/"\)\s*&&\s*!trimmed\.starts_with\("https:\/\/"\)/, 'open_in_browser must strictly validate HTTP/HTTPS');
    assert.match(libCode, /open_in_browser/, 'open_in_browser must be registered in invoke_handler');
  });

  // ============================================================================
  // 16. PAGE NAVIGATION SCROLL RESET
  // ============================================================================
  test('P1 Navigation: ScrollToTop component resets window scroll position on route change', () => {
    assert.ok(fs.existsSync('src/components/common/ScrollToTop.tsx'), 'ScrollToTop.tsx must exist');

    const scrollCode = fs.readFileSync('src/components/common/ScrollToTop.tsx', 'utf8');
    assert.match(scrollCode, /window\.scrollTo\(\{\s*top:\s*0,\s*left:\s*0,\s*behavior:\s*['"]instant['"]\s*\}\)/, 'ScrollToTop must execute window.scrollTo top:0, left:0');

    const appCode = fs.readFileSync('src/App.tsx', 'utf8');
    assert.match(appCode, /<ScrollToTop\s*\/>/, 'App.tsx must render <ScrollToTop />');
  });

  // ============================================================================
  // 17. DECIDE FOR ME FUNCTIONALITY & ROTATING GLOW
  // ============================================================================
  test('P1 Decide for Me: Actionable recommendations with View Details & Play and PremiumGlowBorder', () => {
    const tonightPickerCode = fs.readFileSync('src/components/decision/TonightPicker.tsx', 'utf8');
    assert.match(tonightPickerCode, /View Details & Play/, 'TonightPicker must render primary View Details & Play action');
    assert.match(tonightPickerCode, /getDetailsUrl/, 'TonightPicker must calculate correct details route');
    assert.match(tonightPickerCode, /handleViewDetails/, 'TonightPicker backdrop/title and button must trigger navigation');
    assert.match(tonightPickerCode, /<PremiumGlowBorder/, 'TonightPicker must use PremiumGlowBorder');

    const homeCode = fs.readFileSync('src/pages/Home.tsx', 'utf8');
    assert.match(homeCode, /<PremiumGlowBorder[^>]*>\s*<div[^>]*>\s*<div[^>]*>\s*<div[^>]*>\s*<Sparkles[^>]*\/>\s*<span>Ronin AI<\/span>/, 'Home decision_helper banner must be wrapped in PremiumGlowBorder');
  });

  // ============================================================================
  // 18. WINDOWS MULTI-RESOLUTION ICO INTEGRITY
  // ============================================================================
  test('P1 Windows Icon: icon.ico exists with non-zero size', () => {
    const stat = fs.statSync('src-tauri/icons/icon.ico');
    assert.ok(stat.size > 50000, `icon.ico must be a comprehensive multi-resolution ICO (size was ${stat.size} bytes)`);
  });

  // ============================================================================
  // 19. MATURE / 18+ RECOMMENDATIONS COMPLETION & CDN INTEGRITY
  // ============================================================================
  test('P1 Mature: getAdultRecommendations returns complete verified items with valid poster paths', async () => {
    const tmdbCode = fs.readFileSync('src/services/tmdb.ts', 'utf8');
    assert.match(tmdbCode, /getAdultRecommendations\(\):\s*Promise/, 'getAdultRecommendations must exist in tmdb.ts');
    assert.match(tmdbCode, /\/3E53WEZJqP6aM84D8CckXx4pIHw\.jpg/, 'Deadpool must use verified 200 OK poster path');
    assert.match(tmdbCode, /\/lqcDVZ8pyk08AVftMBildDR3QUK\.jpg/, 'Cyberpunk must use verified 200 OK poster path');
    assert.match(tmdbCode, /\/jSziioSwPVrOy9Yow3XhWIBDjq1\.jpg/, 'Fight Club must use verified 200 OK poster path');
    assert.match(tmdbCode, /\/vQWk5YBFWF4bZaofAbv0tShwBvQ\.jpg/, 'Pulp Fiction must use verified 200 OK poster path');

    const homeCode = fs.readFileSync('src/pages/Home.tsx', 'utf8');
    assert.match(homeCode, /tmdb\.getAdultRecommendations\(\)/, 'Home.tsx must dynamically call tmdb.getAdultRecommendations()');
    assert.match(homeCode, /animeService\.getAdultAnime\(\)/, 'Home.tsx must dynamically call animeService.getAdultAnime()');
  });

  // ============================================================================
  // 20. PLAYER HUD CONGESTION & ISOLATED GLASS PILLS
  // ============================================================================
  test('P1 Player HUD: Top bar uses isolated glass pills with responsive truncation', () => {
    const playerCode = fs.readFileSync('src/components/player/VideoPlayer.tsx', 'utf8');
    assert.match(playerCode, /min-w-0\s+max-w-\[55%\].*bg-black\/85\s+backdrop-blur-md.*rounded-2xl/, 'Embed mode top title must be in an isolated glass pill');
    assert.match(playerCode, /truncate.*title=\{title\}/, 'Embed mode title must have truncate and native title tooltip');
    assert.match(playerCode, /bg-black\/85\s+backdrop-blur-md\s+px-3\s+py-2\s+rounded-2xl/, 'Embed mode top actions must be in an isolated glass pill');

    const animePlayerCode = fs.readFileSync('src/components/player/anime/AnimeVideoPlayer.tsx', 'utf8');
    assert.match(animePlayerCode, /bg-black\/85\s+backdrop-blur-md.*rounded-2xl/, 'AnimeVideoPlayer top bar must use isolated glass pills');
    assert.match(animePlayerCode, /truncate.*title=\{anime\.title\}/, 'Anime title must have responsive truncation');
  });

  // ============================================================================
  // 21. CARD BADGE SYNCHRONIZATION & INTENTIONAL FALLBACKS
  // ============================================================================
  test('P1 Card Badges: Badges never float over empty cards and use intentional fallbacks', () => {
    const cardCode = fs.readFileSync('src/components/common/MovieCard.tsx', 'utf8');
    assert.match(cardCode, /const hasValidPoster\s*=/, 'MovieCard must determine if poster is valid');
    assert.match(cardCode, /const isVisualReady\s*=/, 'MovieCard must compute visual readiness');
    assert.match(cardCode, /const isShowingFallback\s*=/, 'MovieCard must track intentional fallback');
    assert.match(cardCode, /isVisualReady\s*\?\s*'opacity-100'\s*:\s*'opacity-0'/, 'Badges must remain hidden while poster is loading');

    const decisionCode = fs.readFileSync('src/pages/DecisionHelper.tsx', 'utf8');
    assert.match(decisionCode, /DecisionHelperCardPoster/, 'DecisionHelper must use DecisionHelperCardPoster');
  });

  // ============================================================================
  // 22. ANIME SECTION RESILIENCE & SKELETON LOADING
  // ============================================================================
  test('P1 Anime Resilience: Promise.allSettled and skeleton hero/shelves', () => {
    const animeCode = fs.readFileSync('src/pages/Anime.tsx', 'utf8');
    assert.match(animeCode, /Promise\.allSettled\(promises\)/, 'Anime.tsx must use Promise.allSettled to prevent single-endpoint failure');
    assert.match(animeCode, /<SkeletonHero\s*\/>/, 'Anime.tsx must mount SkeletonHero while loading');
    assert.match(animeCode, /<SkeletonShelf\s+hasHeader=\{true\}/, 'Anime.tsx must mount SkeletonShelf while loading');
    assert.match(animeCode, /Retry Connection/, 'Anime.tsx must offer retry connection button if all endpoints fail');
  });

  // ============================================================================
  // 23. REFINED PREMIUM GLOW BORDER ON MODALS & DIAGNOSTICS
  // ============================================================================
  test('P1 PremiumGlowBorder: Refined localized beam applied to all major modals', () => {
    const glowCode = fs.readFileSync('src/components/common/PremiumGlowBorder.tsx', 'utf8');
    assert.match(glowCode, /transparent\s+275deg/, 'PremiumGlowBorder must use localized arc beam');

    const prefCode = fs.readFileSync('src/components/modals/PreferencesModal.tsx', 'utf8');
    assert.match(prefCode, /<PremiumGlowBorder/, 'PreferencesModal must use PremiumGlowBorder');

    const onbCode = fs.readFileSync('src/components/modals/OnboardingModal.tsx', 'utf8');
    assert.match(onbCode, /<PremiumGlowBorder/, 'OnboardingModal must use PremiumGlowBorder');

    const trailCode = fs.readFileSync('src/components/common/TrailerModal.tsx', 'utf8');
    assert.match(trailCode, /<PremiumGlowBorder/, 'TrailerModal must use PremiumGlowBorder');

    const playerCode = fs.readFileSync('src/components/player/VideoPlayer.tsx', 'utf8');
    assert.match(playerCode, /<PremiumGlowBorder[^>]*intensity="medium"/, 'VideoPlayer diagnostics modal must use PremiumGlowBorder');
  });

  // ============================================================================
  // 24. ROUTE-AWARE NON-BLOCKING PIP & PLAYER RECOVERY
  // ============================================================================
  test('P1 PiP Route Awareness: PersistentPlayerHost does not block library browsing during PiP', () => {
    const hostCode = fs.readFileSync('src/components/player/PersistentPlayerHost.tsx', 'utf8');
    assert.match(hostCode, /location\.pathname\.startsWith\('\/watch'\)/, 'PersistentPlayerHost must check if user is on watch route');
    assert.match(hostCode, /fixed bottom-6 right-6/, 'PersistentPlayerHost must render docked mini-controller when user browses away from watch route');
    assert.match(hostCode, /Stream Currently Unavailable/, 'PersistentPlayerHost must render recoverable error screen instead of bare text');
    assert.match(hostCode, /Try Again/, 'PersistentPlayerHost error screen must have Try Again button');
  });
});


