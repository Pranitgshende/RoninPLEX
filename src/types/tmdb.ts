export type MediaType = 'movie' | 'tv';

export interface Genre {
  id: number;
  name: string;
}

export interface VideoResult {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: 'Trailer' | 'Teaser' | 'Clip' | 'Featurette' | 'Behind the Scenes' | 'Bloopers';
  official: boolean;
  published_at: string;
}

export interface VideosResponse {
  results: VideoResult[];
}

export interface CastMember {
  id: number;
  name: string;
  original_name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department?: string;
  popularity?: number;
}

export interface CrewMember {
  id: number;
  name: string;
  original_name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface CreditsResponse {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  genres?: Genre[];
  runtime?: number;
  tagline?: string;
  status?: string;
  budget?: number;
  revenue?: number;
  original_language: string;
  media_type?: 'movie';
  videos?: VideosResponse;
  credits?: CreditsResponse;
  similar?: { results: Movie[] };
  recommendations?: { results: Movie[] };
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  air_date: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  runtime?: number;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
  episodes?: Episode[];
}

export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  genres?: Genre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  tagline?: string;
  status?: string;
  original_language: string;
  media_type?: 'tv';
  videos?: VideosResponse;
  credits?: CreditsResponse;
  similar?: { results: TVShow[] };
  recommendations?: { results: TVShow[] };
}

export type MediaItem =
  | (Movie & { media_type: 'movie'; displayTitle: string; displayDate: string; displayYear: string })
  | (TVShow & { media_type: 'tv'; displayTitle: string; displayDate: string; displayYear: string });

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface FilterOptions {
  mediaType: MediaType | 'all';
  genreId?: number | null;
  year?: number | null;
  minRating?: number;
  language?: string;
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'revenue.desc' | 'title.asc';
  page?: number;
}
