import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface DownloadItem {
  id: string;
  title: string;
  media_type: 'movie' | 'tv' | 'anime';
  season_number?: number;
  episode_number?: number;
  source_url: string;
  target_path: string;
  file_name: string;
  total_bytes: number;
  downloaded_bytes: number;
  status: DownloadStatus;
  speed_bytes_per_sec: number;
  eta_seconds?: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface DownloadSettings {
  download_dir: string;
  max_concurrent_downloads: number;
  auto_resume_on_startup: boolean;
}

export interface StartDownloadPayload {
  title: string;
  media_type: 'movie' | 'tv' | 'anime';
  season_number?: number;
  episode_number?: number;
  direct_url: string;
  file_name: string;
  safe_extension?: string;
}

class DownloadService {
  private progressListeners: Set<(item: DownloadItem) => void> = new Set();
  private statusListeners: Set<(item: DownloadItem) => void> = new Set();
  private unlistenProgress: UnlistenFn | null = null;
  private unlistenStatus: UnlistenFn | null = null;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      this.unlistenProgress = await listen<DownloadItem>('download-progress', (event) => {
        this.progressListeners.forEach((listener) => {
          try {
            listener(event.payload);
          } catch (e) {
            console.error('[DownloadService] Progress listener error:', e);
          }
        });
      });

      this.unlistenStatus = await listen<DownloadItem>('download-status-changed', (event) => {
        this.statusListeners.forEach((listener) => {
          try {
            listener(event.payload);
          } catch (e) {
            console.error('[DownloadService] Status listener error:', e);
          }
        });
      });
    } catch {
      // In browser/mock environment
      console.warn('[DownloadService] Running in mock/browser mode without Tauri events');
    }
  }

  public async startDownload(payload: StartDownloadPayload): Promise<DownloadItem> {
    await this.init();
    try {
      return await invoke<DownloadItem>('start_download', { payload });
    } catch (err: any) {
      console.error('[DownloadService] Failed to start download:', err);
      throw new Error(err?.message || String(err));
    }
  }

  public async pauseDownload(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('pause_download', { id });
    } catch (err) {
      console.error('[DownloadService] Failed to pause download:', err);
      return false;
    }
  }

  public async resumeDownload(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('resume_download', { id });
    } catch (err) {
      console.error('[DownloadService] Failed to resume download:', err);
      return false;
    }
  }

  public async cancelDownload(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('cancel_download', { id });
    } catch (err) {
      console.error('[DownloadService] Failed to cancel download:', err);
      return false;
    }
  }

  public async deleteDownload(id: string, deleteFile: boolean = false): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_download', { id, deleteFile });
    } catch (err) {
      console.error('[DownloadService] Failed to delete download:', err);
      return false;
    }
  }

  public async getDownloads(): Promise<DownloadItem[]> {
    try {
      return await invoke<DownloadItem[]>('get_downloads');
    } catch (err) {
      console.error('[DownloadService] Failed to get downloads:', err);
      return [];
    }
  }

  public async getDownloadSettings(): Promise<DownloadSettings> {
    try {
      return await invoke<DownloadSettings>('get_download_settings');
    } catch (err) {
      console.error('[DownloadService] Failed to get download settings:', err);
      return {
        download_dir: '',
        max_concurrent_downloads: 3,
        auto_resume_on_startup: true,
      };
    }
  }

  public async updateDownloadSettings(settings: DownloadSettings): Promise<boolean> {
    try {
      await invoke('update_download_settings', { settings });
      return true;
    } catch (err) {
      console.error('[DownloadService] Failed to update download settings:', err);
      return false;
    }
  }

  public async openDownloadFolder(idOrPath?: string): Promise<boolean> {
    try {
      await invoke('open_download_folder', { idOrPath });
      return true;
    } catch (err) {
      console.error('[DownloadService] Failed to open download folder:', err);
      return false;
    }
  }

  public async openDownloadFile(id: string): Promise<boolean> {
    try {
      await invoke('open_download_file', { id });
      return true;
    } catch (err) {
      console.error('[DownloadService] Failed to open download file:', err);
      return false;
    }
  }

  public onProgress(callback: (item: DownloadItem) => void): () => void {
    this.progressListeners.add(callback);
    return () => {
      this.progressListeners.delete(callback);
    };
  }

  public onStatusChanged(callback: (item: DownloadItem) => void): () => void {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  public formatSpeed(bytesPerSec: number): string {
    return `${this.formatBytes(bytesPerSec)}/s`;
  }

  public formatEta(seconds?: number): string {
    if (!seconds || seconds <= 0 || !isFinite(seconds)) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  }
}

export const downloadService = new DownloadService();
export const formatBytes = (bytes: number) => downloadService.formatBytes(bytes);
export const formatSpeed = (bytesPerSec: number) => downloadService.formatSpeed(bytesPerSec);
export const formatEta = (seconds?: number) => downloadService.formatEta(seconds);
