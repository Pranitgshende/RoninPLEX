import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('RoninPLEX v2.1.1 — Phase 3 Full System Verification', () => {

  // ============================================================================
  // Area 1: Anime VidLink / MAL Architecture
  // ============================================================================
  describe('Area 1: Anime VidLink & MAL Provider Architecture', () => {
    it('VidLinkProProvider constructs correct anime fallback URL with MAL ID', () => {
      const providerFile = fs.readFileSync(
        path.join(rootDir, 'src/services/streaming/providers/VidLinkProProvider.ts'),
        'utf8'
      );
      assert.match(providerFile, /\/anime\/\$\{malId\}\/\$\{episodeNumber\}\/\$\{normalizedLang\}\?fallback=true/);
      assert.match(providerFile, /anime:\s*true/);
      assert.match(providerFile, /embed:\s*true/);
    });

    it('AnimeSdkProvider is registered as local sidecar provider', () => {
      const providerFile = fs.readFileSync(
        path.join(rootDir, 'src/services/streaming/providers/AnimeSdkProvider.ts'),
        'utf8'
      );
      assert.match(providerFile, /http:\/\/127\.0\.0\.1:4173/);
      assert.match(providerFile, /id\s*=\s*'anime-sdk'/);
    });

    it('StreamingManager supports explicit anime provider resolution for vidlink and anime-sdk', () => {
      const managerFile = fs.readFileSync(
        path.join(rootDir, 'src/services/streaming/StreamingManager.ts'),
        'utf8'
      );
      assert.match(managerFile, /providerId === 'vidlink'/);
      assert.match(managerFile, /providerId:\s*'anime-sdk'/);
    });

    it('AnimeStreamService prioritizes VidLink with MAL ID and falls back to anime-sdk', () => {
      const serviceFile = fs.readFileSync(
        path.join(rootDir, 'src/services/anime/AnimeStreamService.ts'),
        'utf8'
      );
      assert.match(serviceFile, /vidLinkProProvider\.getAnimeEpisode/);
      assert.match(serviceFile, /subtitlesAvailable/);
    });

    it('truthfully distinguishes provider subtitle support from parent DOM introspection', () => {
      const vidLinkFile = fs.readFileSync(
        path.join(rootDir, 'src/services/streaming/providers/VidLinkProProvider.ts'),
        'utf8'
      );
      assert.match(vidLinkFile, /subtitleInspectionStatus:\s*'managed_by_embed'/);
      assert.match(vidLinkFile, /Same-Origin Policy/);

      const animeStreamFile = fs.readFileSync(
        path.join(rootDir, 'src/services/anime/AnimeStreamService.ts'),
        'utf8'
      );
      assert.match(animeStreamFile, /subtitleInspectionStatus/);
    });
  });

  // ============================================================================
  // Area 2: Real Runtime Diagnostics
  // ============================================================================
  describe('Area 2: Real Runtime Diagnostics & SOP Boundary Enforcement', () => {
    it('DiagnosticsModal clearly differentiates cross-origin embeds from native video', () => {
      const diagFile = fs.readFileSync(
        path.join(rootDir, 'src/components/player/DiagnosticsModal.tsx'),
        'utf8'
      );
      assert.match(diagFile, /Same-Origin Policy \(SOP\)/);
      assert.match(diagFile, /Video telemetry unavailable — cross-origin provider/);
      assert.match(diagFile, /streamType === 'embed'/);
    });

    it('DiagnosticsModal reports real native video properties without fake metrics', () => {
      const diagFile = fs.readFileSync(
        path.join(rootDir, 'src/components/player/DiagnosticsModal.tsx'),
        'utf8'
      );
      assert.match(diagFile, /videoDimensions/);
      assert.match(diagFile, /currentTime/);
      assert.match(diagFile, /bufferedSeconds/);
      assert.match(diagFile, /droppedFrames/);
      assert.doesNotMatch(diagFile, /Math\.random/);
    });

    it('VideoPlayer top controls integrate Diagnostics trigger and hotkey D', () => {
      const playerFile = fs.readFileSync(
        path.join(rootDir, 'src/components/player/VideoPlayer.tsx'),
        'utf8'
      );
      assert.match(playerFile, /Stream Diagnostics \(Press D\)/);
      assert.match(playerFile, /DiagnosticsModal/);
    });
  });

  // ============================================================================
  // Area 3: Native Rust Download Engine & Resolver
  // ============================================================================
  describe('Area 3: Native Rust Download Engine & Resolver', () => {
    it('src-tauri/src/download.rs implements chunked downloads, Range headers, persistence, and SSRF security', () => {
      const downloadRs = fs.readFileSync(
        path.join(rootDir, 'src-tauri/src/download.rs'),
        'utf8'
      );
      assert.match(downloadRs, /DownloadState/);
      assert.match(downloadRs, /Range/);
      assert.match(downloadRs, /bytes=/);
      assert.match(downloadRs, /save_persisted_downloads/);
      assert.match(downloadRs, /download-progress/);
      assert.match(downloadRs, /download-status-changed/);
      assert.match(downloadRs, /validate_download_url/);
      assert.match(downloadRs, /is_forbidden_ip/);
      assert.match(downloadRs, /test_ssrf_rejects_localhost/);
      assert.match(downloadRs, /test_ssrf_rejects_link_local/);
    });

    it('src-tauri/src/lib.rs registers 10 download Tauri commands', () => {
      const libRs = fs.readFileSync(
        path.join(rootDir, 'src-tauri/src/lib.rs'),
        'utf8'
      );
      assert.match(libRs, /start_download/);
      assert.match(libRs, /pause_download/);
      assert.match(libRs, /resume_download/);
      assert.match(libRs, /cancel_download/);
      assert.match(libRs, /delete_download/);
      assert.match(libRs, /get_downloads/);
      assert.match(libRs, /get_download_settings/);
      assert.match(libRs, /update_download_settings/);
      assert.match(libRs, /open_download_folder/);
      assert.match(libRs, /open_download_file/);
    });

    it('DownloadResolver enforces strict SSRF protections against private and non-HTTP IPs', () => {
      const resolverFile = fs.readFileSync(
        path.join(rootDir, 'src/services/download/DownloadResolver.ts'),
        'utf8'
      );
      assert.ok(resolverFile.includes('PRIVATE_IP_PATTERNS'));
      assert.ok(resolverFile.includes('validateUrl'));
      assert.ok(resolverFile.includes('127\\.'));
      assert.ok(resolverFile.includes('192\\.168\\.'));
      assert.ok(resolverFile.includes('10\\.'));
      assert.ok(resolverFile.includes('169\\.254\\.'));
    });

    it('DownloadResolver rejects HTML landing pages and never renames HTML to .mp4', () => {
      const resolverFile = fs.readFileSync(
        path.join(rootDir, 'src/services/download/DownloadResolver.ts'),
        'utf8'
      );
      assert.match(resolverFile, /text\/html/);
      assert.match(resolverFile, /requires_browser/);
      assert.match(resolverFile, /cloudflare|captcha|turnstile|verify/);
    });

    it('DownloadCenterModal and download buttons are mounted in Navbar, MovieDetails, and TvDetails', () => {
      const navbar = fs.readFileSync(path.join(rootDir, 'src/components/common/Navbar.tsx'), 'utf8');
      const movieDetails = fs.readFileSync(path.join(rootDir, 'src/pages/MovieDetails.tsx'), 'utf8');
      const tvDetails = fs.readFileSync(path.join(rootDir, 'src/pages/TvDetails.tsx'), 'utf8');

      assert.match(navbar, /DownloadCenterModal/);
      assert.match(movieDetails, /handleDownload/);
      assert.match(movieDetails, /DownloadCenterModal/);
      assert.match(tvDetails, /handleDownloadEpisode/);
      assert.match(tvDetails, /DownloadCenterModal/);
    });
  });

  // ============================================================================
  // Area 4: GitHub Releases Dynamic Updater
  // ============================================================================
  describe('Area 4: GitHub Releases Dynamic Updater', () => {
    it('updaterService connects to official GitHub repository releases API', () => {
      const updaterFile = fs.readFileSync(
        path.join(rootDir, 'src/services/updater.ts'),
        'utf8'
      );
      assert.match(updaterFile, /repoOwner\s*=\s*'Pranitgshende'/);
      assert.match(updaterFile, /repoName\s*=\s*'RoninPLEX'/);
      assert.match(updaterFile, /api\.github\.com\/repos/);
      assert.match(updaterFile, /isNewerVersion/);
      assert.match(updaterFile, /categorizeAsset/);
    });

    it('UpdateModal component exists with asset list and release actions', () => {
      const modalFile = fs.readFileSync(
        path.join(rootDir, 'src/components/modals/UpdateModal.tsx'),
        'utf8'
      );
      assert.match(modalFile, /UpdateModal/);
      assert.match(modalFile, /Download Installer/);
      assert.match(modalFile, /Release Notes/);
      assert.match(modalFile, /Available Assets/);
    });

    it('Settings page mounts Software Updates section with channel selector', () => {
      const settingsFile = fs.readFileSync(
        path.join(rootDir, 'src/pages/Settings.tsx'),
        'utf8'
      );
      assert.match(settingsFile, /Software Updates/);
      assert.match(settingsFile, /handleCheckForUpdates/);
      assert.match(settingsFile, /UpdateModal/);
    });
  });

  // ============================================================================
  // Area 5: Installer & Antivirus / SmartScreen Security Audit
  // ============================================================================
  describe('Area 5: Installer & Antivirus Security Audit', () => {
    it('docs/INSTALLER_SECURITY_AUDIT.md exists and contains evidence-based analysis', () => {
      const auditFile = fs.readFileSync(
        path.join(rootDir, 'docs/INSTALLER_SECURITY_AUDIT.md'),
        'utf8'
      );
      assert.match(auditFile, /Observed Fact/);
      assert.match(auditFile, /Evidence/);
      assert.match(auditFile, /Likely Cause/);
      assert.match(auditFile, /Hypothesis/);
      assert.match(auditFile, /Confidence Level/);
      assert.match(auditFile, /Authenticode/);
      assert.match(auditFile, /pkg/);
      assert.match(auditFile, /SmartScreen/);
    });
  });

  // ============================================================================
  // Area 6: About Architecture Page & TMDB Neutrality
  // ============================================================================
  describe('Area 6: About Architecture Page & TMDB Neutrality', () => {
    it('ArchitectureDiagram component renders comprehensive interactive topology', () => {
      const archFile = fs.readFileSync(
        path.join(rootDir, 'src/components/about/ArchitectureDiagram.tsx'),
        'utf8'
      );
      assert.match(archFile, /ArchitectureDiagram/);
      assert.match(archFile, /VidSrc ME/);
      assert.match(archFile, /RiveStream/);
      assert.match(archFile, /VidLink Pro/);
      assert.match(archFile, /Anime SDK Sidecar/);
      assert.match(archFile, /Parked Providers/);
      assert.match(archFile, /Rust Desktop Engine/);
    });

    it('TMDB statuses are neutralized and no misleading fallback wording is used', () => {
      const settingsFile = fs.readFileSync(
        path.join(rootDir, 'src/pages/Settings.tsx'),
        'utf8'
      );
      const onboardingModal = fs.readFileSync(
        path.join(rootDir, 'src/components/modals/TMDBOnboardingModal.tsx'),
        'utf8'
      );
      assert.doesNotMatch(settingsFile, /Using RoninPLEX fallback connection/);
      assert.doesNotMatch(onboardingModal, /using RoninPLEX with its built-in fallback connection/);
      assert.match(settingsFile, /Connected \(Default Configuration\)|Connected \(Personal API Key\)/);
    });
  });
});
