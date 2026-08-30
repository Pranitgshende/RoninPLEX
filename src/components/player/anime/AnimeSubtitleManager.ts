import { SubtitleTrack } from '../../../services/anime/AnimeTypes';

export class AnimeSubtitleManager {
  private tracks: SubtitleTrack[] = [];
  private activeTrack: SubtitleTrack | null = null;

  constructor(initialTracks: SubtitleTrack[] = []) {
    this.tracks = initialTracks;
    this.activeTrack = initialTracks.find(t => t.language.toLowerCase().startsWith('en')) || initialTracks[0] || null;
  }

  public getTracks(): SubtitleTrack[] {
    return this.tracks;
  }

  public getActiveTrack(): SubtitleTrack | null {
    return this.activeTrack;
  }

  public setTrack(language: string | null): void {
    if (!language || language === 'off') {
      this.activeTrack = null;
      return;
    }
    const found = this.tracks.find(t => t.language.toLowerCase() === language.toLowerCase());
    this.activeTrack = found || null;
  }

  public addTrack(track: SubtitleTrack): void {
    if (!this.tracks.some(t => t.url === track.url)) {
      this.tracks.push(track);
      if (!this.activeTrack && track.language.toLowerCase().startsWith('en')) {
        this.activeTrack = track;
      }
    }
  }
}