import { AnimeEpisode } from '../../../services/anime/AnimeTypes';

export interface EpisodeNavigationState {
  currentEpisode: number;
  totalEpisodes: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export class AnimeEpisodeController {
  public static getNavigationState(
    currentNumber: number,
    episodes: AnimeEpisode[],
    totalCount?: number
  ): EpisodeNavigationState {
    const maxEp = Math.max(totalCount || 0, episodes.length, currentNumber);
    return {
      currentEpisode: currentNumber,
      totalEpisodes: maxEp,
      hasPrevious: currentNumber > 1,
      hasNext: currentNumber < maxEp,
    };
  }

  public static getNextEpisodeNumber(currentNumber: number, totalCount?: number): number | null {
    if (totalCount && currentNumber >= totalCount) return null;
    return currentNumber + 1;
  }

  public static getPrevEpisodeNumber(currentNumber: number): number | null {
    if (currentNumber <= 1) return null;
    return currentNumber - 1;
  }
}