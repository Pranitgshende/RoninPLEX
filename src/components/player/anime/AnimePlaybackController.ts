export type AnimePlayerState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'error'
  | 'failover';

export interface PlaybackProgress {
  currentTime: number;
  duration: number;
  progressPercent: number;
  timestamp: number;
}

export class AnimePlaybackController {
  private static readonly STORAGE_PREFIX = 'ronin_anime_progress_';

  public static saveProgress(animeId: string, episodeNumber: number, currentTime: number, duration: number): void {
    if (!animeId || !currentTime || !duration || duration <= 0) return;
    try {
      const key = `${this.STORAGE_PREFIX}${animeId}_ep_${episodeNumber}`;
      const data: PlaybackProgress = {
        currentTime,
        duration,
        progressPercent: Math.round((currentTime / duration) * 100),
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }

  public static getSavedProgress(animeId: string, episodeNumber: number): number | null {
    try {
      const key = `${this.STORAGE_PREFIX}${animeId}_ep_${episodeNumber}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data: PlaybackProgress = JSON.parse(raw);
      // Resume if at least 15s in and not in the last 60s
      if (data.currentTime > 15 && (data.duration - data.currentTime) > 60) {
        return data.currentTime;
      }
    } catch {
      return null;
    }
    return null;
  }
}