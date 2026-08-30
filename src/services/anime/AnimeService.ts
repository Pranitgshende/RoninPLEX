/**
 * RoninPLEX v2.0.0 � Anime Service Facade
 * Unified entry point for all Anime data and streaming operations.
 * Completely isolated from TMDB.
 */

import { AnimeItem, AnimeEpisode, AnimeStreamSource, ContentLanguage } from './AnimeTypes';
import { AnimeRepository, OFFLINE_FALLBACK_ANIME } from './AnimeRepository';
import { AnimeStreamService } from './AnimeStreamService';

export class AnimeService {
  /**
   * Get Spotlight / Featured Hero Anime.
   */
  public async getSpotlight(allowAdult: boolean = false): Promise<AnimeItem | null> {
    const trending = await this.getTrending(allowAdult);
    return trending.length > 0 ? trending[0] : (OFFLINE_FALLBACK_ANIME[0] || null);
  }

  /**
   * Get Trending Anime.
   */
  public async getTrending(allowAdult: boolean = false, page: number = 1): Promise<AnimeItem[]> {
    return AnimeRepository.fetchTrending(page, 20, allowAdult);
  }

  /**
   * Get Popular Anime.
   */
  public async getPopular(allowAdult: boolean = false, page: number = 1): Promise<AnimeItem[]> {
    return AnimeRepository.fetchPopular(page, 20, allowAdult);
  }

  /**
   * Get Top Rated Anime.
   */
  public async getTopRated(allowAdult: boolean = false, page: number = 1): Promise<AnimeItem[]> {
    return AnimeRepository.fetchTopRated(page, 20, allowAdult);
  }

  /**
   * Get Currently Airing Simulcasts.
   */
  public async getCurrentlyAiring(allowAdult: boolean = false, page: number = 1): Promise<AnimeItem[]> {
    return AnimeRepository.fetchCurrentlyAiring(page, 20, allowAdult);
  }

  /**
   * Get Seasonal Anime.
   */
  public async getSeasonal(allowAdult: boolean = false, page: number = 1): Promise<AnimeItem[]> {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    const season = month >= 0 && month <= 2 ? 'WINTER' : month >= 3 && month <= 5 ? 'SPRING' : month >= 6 && month <= 8 ? 'SUMMER' : 'FALL';
    return AnimeRepository.fetchSeasonal(season, year, page, 20, allowAdult);
  }

  /**
   * Get New Releases.
   */
  public async getNewReleases(allowAdult: boolean = false, page: number = 1): Promise<AnimeItem[]> {
    const date = new Date();
    const year = date.getFullYear();
    return AnimeRepository.fetchSeasonal('WINTER', year, page, 20, allowAdult);
  }

  /**
   * Get Dedicated 18+ Mature Anime (Hentai / Mature Seinen).
   */
  public async getAdultAnime(page: number = 1): Promise<AnimeItem[]> {
    return AnimeRepository.fetchAdultAnime(page, 20);
  }

  /**
   * Get Anime by Genre.
   */
  public async getByGenre(genre: string, allowAdult: boolean = false, page: number = 1): Promise<AnimeItem[]> {
    return AnimeRepository.fetchByGenre(genre, page, 20, allowAdult);
  }

  /**
   * Search Anime across title, romaji, and native names.
   */
  public async search(query: string, allowAdult: boolean = false, page: number = 1): Promise<AnimeItem[]> {
    return AnimeRepository.searchAnime(query, page, 20, allowAdult);
  }

  /**
   * Get Full Anime Details by ID.
   */
  public async getDetails(id: string): Promise<AnimeItem | null> {
    return AnimeRepository.fetchAnimeDetails(id);
  }

  /**
   * Get Episode List for an Anime.
   */
  public async getEpisodes(id: string): Promise<AnimeEpisode[]> {
    return AnimeRepository.fetchAnimeEpisodes(id);
  }

  /**
   * Get Latest Released Episodes with airing time and next episode countdown.
   */
  public async getLatestEpisodes(page: number = 1, perPage: number = 20): Promise<import('./AnimeTypes').LatestAiringEpisode[]> {
    return AnimeRepository.fetchLatestEpisodes(page, perPage);
  }

  /**
   * Get Upcoming Scheduled Episodes with countdown timers.
   */
  public async getUpcomingEpisodes(page: number = 1, perPage: number = 20): Promise<import('./AnimeTypes').UpcomingAiringEpisode[]> {
    return AnimeRepository.fetchUpcomingEpisodes(page, perPage);
  }

  /**
   * Resolve Direct Playable Video Stream for Episode.
   */
  public async resolveStream(
    animeTitle: string,
    episodeNumber: number,
    preferredLanguage: ContentLanguage = ContentLanguage.SUB
  ): Promise<AnimeStreamSource | null> {
    return AnimeStreamService.resolveEpisodeStream(animeTitle, episodeNumber, preferredLanguage);
  }
}

export const animeService = new AnimeService();
export * from './AnimeTypes';
export * from './AnimeCache';
export * from './AnimeMapper';
export * from './AnimeRepository';
export * from './AnimeStreamService';
export * from './AnimeSdkAdapter';
