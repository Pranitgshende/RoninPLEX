/**
 * RoninPLEX v2.0.0 — Normalized Anime Domain Model
 * Completely isolated from TMDB.
 */

export enum ContentLanguage {
  SUB = 'sub',
  DUB = 'dub',
  RAW = 'raw'
}

export interface AnimeEpisode {
  id: string;
  animeId: string;
  number: number;
  title: string;
  synopsis?: string;
  thumbnail?: string;
  airDate?: string;
  isFiller?: boolean;
  isRecap?: boolean;
  availableLanguages?: ContentLanguage[];
}

export interface NextAiringSchedule {
  episode: number;
  airingAt: number; // Unix timestamp
  timeUntilAiring: number; // seconds
}

export interface AnimeRelation {
  id: string;
  relationType: string;
  title: string;
  format?: string;
  status?: string;
  poster?: string;
}

export interface AnimeItem {
  id: string; // Native Anime ID (e.g. "21" for One Piece)
  anilistId?: number;
  malId?: number;
  anidbId?: number;
  title: string; // English or primary display title
  englishTitle?: string;
  romajiTitle?: string;
  nativeTitle?: string;
  synopsis: string;
  genres: string[];
  studios: string[];
  season?: string;
  year?: number;
  status: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS' | string;
  episodeCount?: number;
  latestEpisode?: number;
  nextAiringEpisode?: NextAiringSchedule;
  episodeDuration?: number;
  score?: number; // 0 - 10
  popularity?: number;
  rankings?: number;
  poster: string;
  banner?: string;
  trailer?: string;
  isAdult: boolean; // 18+ Classification
  ageRating?: string;
  format?: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | string;
  episodes?: AnimeEpisode[];
  totalEpisodes?: number;
  relations?: AnimeRelation[];
}

export interface LatestAiringEpisode {
  id: string;
  animeId: string;
  animeTitle: string;
  romajiTitle?: string;
  episodeNumber: number;
  episodeTitle?: string;
  airingAt: number;
  releaseDateText: string;
  status: string;
  poster: string;
  banner?: string;
  isAdult: boolean;
  nextEpisode?: {
    episodeNumber: number;
    airingAt: number;
    timeUntilAiring: number;
  };
}

export interface UpcomingAiringEpisode {
  id: string;
  animeId: string;
  animeTitle: string;
  romajiTitle?: string;
  episodeNumber: number;
  airingAt: number;
  timeUntilAiring: number;
  poster: string;
  banner?: string;
}

export interface SubtitleTrack {
  language: string;
  label: string;
  url: string;
}

export interface AnimeStreamSource {
  sourceUrl: string;
  isHLS: boolean;
  quality: '1080p' | '720p' | '480p' | '360p' | 'auto' | string;
  providerId: string;
  language?: ContentLanguage;
  headers?: Record<string, string>;
  subtitles?: SubtitleTrack[];
  qualities?: { url: string; quality: string; isHLS: boolean }[];
  audioModes?: { language: ContentLanguage; url: string }[];
}

export type AnimeBrowseCategory =
  | 'trending'
  | 'popular'
  | 'top_rated'
  | 'airing'
  | 'seasonal'
  | 'new_releases'
  | 'latest_episodes'
  | 'adult_18';
