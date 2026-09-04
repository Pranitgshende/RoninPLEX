import { version as currentVersion } from '../../package.json';

export interface ReleaseAsset {
  name: string;
  size: number;
  downloadUrl: string;
  type: 'installer' | 'msi' | 'portable' | 'checksum' | 'other';
}

export interface ReleaseInfo {
  version: string;
  tagName: string;
  name: string;
  publishedAt: string;
  body: string;
  htmlUrl: string;
  isPrerelease: boolean;
  assets: ReleaseAsset[];
  primaryAsset: ReleaseAsset | null;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  release: ReleaseInfo | null;
  error: string | null;
}

export type UpdateChannel = 'stable' | 'beta';

export function parseSemver(v: string): [number, number, number] | null {
  const match = v.replace(/^v/, '').trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

export function isNewerVersion(current: string, target: string): boolean {
  const curr = parseSemver(current);
  const tgt = parseSemver(target);
  if (!curr || !tgt) return false;
  if (tgt[0] > curr[0]) return true;
  if (tgt[0] < curr[0]) return false;
  if (tgt[1] > curr[1]) return true;
  if (tgt[1] < curr[1]) return false;
  return tgt[2] > curr[2];
}

function categorizeAsset(name: string): ReleaseAsset['type'] {
  const lower = name.toLowerCase();
  if (lower.endsWith('.msi')) return 'msi';
  if (lower.endsWith('.zip') && (lower.includes('portable') || lower.includes('win'))) return 'portable';
  if (lower.endsWith('.exe') || lower.includes('setup')) return 'installer';
  if (lower.includes('sha256') || lower.includes('checksum') || lower.endsWith('.txt')) return 'checksum';
  return 'other';
}

class UpdaterService {
  private repoOwner = 'Pranitgshende';
  private repoName = 'RoninPLEX';

  public getCurrentVersion(): string {
    return currentVersion;
  }

  public async checkForUpdates(channel: UpdateChannel = 'stable'): Promise<UpdateCheckResult> {
    try {
      const endpoint = channel === 'beta'
        ? `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases?per_page=5`
        : `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`;

      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': `RoninPLEX-App/${currentVersion}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            updateAvailable: false,
            currentVersion,
            latestVersion: currentVersion,
            release: null,
            error: null,
          };
        }
        if (response.status === 403) {
          return {
            updateAvailable: false,
            currentVersion,
            latestVersion: currentVersion,
            release: null,
            error: 'GitHub API rate limit exceeded. Please try again in a few minutes.',
          };
        }
        throw new Error(`GitHub API HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let targetReleaseData: any = null;

      if (channel === 'beta' && Array.isArray(data)) {
        targetReleaseData = data[0] || null;
      } else if (!Array.isArray(data)) {
        targetReleaseData = data;
      }

      if (!targetReleaseData) {
        return {
          updateAvailable: false,
          currentVersion,
          latestVersion: currentVersion,
          release: null,
          error: null,
        };
      }

      const tagName = targetReleaseData.tag_name || '';
      const versionStr = tagName.replace(/^v/, '').trim();
      const rawAssets: any[] = targetReleaseData.assets || [];

      const assets: ReleaseAsset[] = rawAssets.map((a: any) => ({
        name: a.name || 'unknown',
        size: a.size || 0,
        downloadUrl: a.browser_download_url || '',
        type: categorizeAsset(a.name || ''),
      }));

      const primaryAsset =
        assets.find(a => a.type === 'installer') ||
        assets.find(a => a.type === 'msi') ||
        assets.find(a => a.type === 'portable') ||
        null;

      const release: ReleaseInfo = {
        version: versionStr,
        tagName,
        name: targetReleaseData.name || tagName,
        publishedAt: targetReleaseData.published_at || '',
        body: targetReleaseData.body || '',
        htmlUrl: targetReleaseData.html_url || `https://github.com/${this.repoOwner}/${this.repoName}/releases/tag/${tagName}`,
        isPrerelease: !!targetReleaseData.prerelease,
        assets,
        primaryAsset,
      };

      const hasUpdate = isNewerVersion(currentVersion, versionStr);

      return {
        updateAvailable: hasUpdate,
        currentVersion,
        latestVersion: versionStr,
        release,
        error: null,
      };
    } catch (err: any) {
      return {
        updateAvailable: false,
        currentVersion,
        latestVersion: currentVersion,
        release: null,
        error: err?.message || 'Failed to check for updates.',
      };
    }
  }

  public async openReleaseInBrowser(url: string): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_in_browser', { url });
    } catch {
      window.open(url, '_blank');
    }
  }
}

export const updaterService = new UpdaterService();
