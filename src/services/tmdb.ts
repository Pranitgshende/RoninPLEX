import { Movie, TVShow, TMDBResponse, Genre, FilterOptions, Season } from '../types/tmdb';
import { storage } from './storage';
import { MOCK_MOVIES, MOCK_TV_SHOWS, MOCK_GENRES } from './mockData';

const BASE_URL = 'https://api.themoviedb.org/3';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class TMDBService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlightRequests = new Map<string, Promise<unknown>>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('roninplex_api_key_change', () => {
        this.clearCache();
      });
    }
  }

  public clearCache(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
  }

  public getApiKey(): string {
    const customKey = storage.getCustomApiKey();
    if (customKey) return customKey;
    return (import.meta.env.VITE_TMDB_API_KEY as string) || '';
  }

  public hasApiKey(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key !== 'your_tmdb_api_key_here' && key.trim().length > 0);
  }

  private async fetchFromTMDB<T>(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T | null> {
    const apiKey = this.getApiKey();
    if (!this.hasApiKey()) {
      return null;
    }

    const queryParams = new URLSearchParams({
      api_key: apiKey,
    });

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        queryParams.append(k, String(v));
      }
    });

    const url = `${BASE_URL}${endpoint}?${queryParams.toString()}`;

    // 1. Memory Cache lookup
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }

    // 2. In-flight request deduplication
    if (this.inFlightRequests.has(url)) {
      return this.inFlightRequests.get(url) as Promise<T | null>;
    }

    const fetchPromise = (async (): Promise<T | null> => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 401) {
            console.warn('TMDB API Key is invalid or unauthorized.');
          } else {
            console.warn(`TMDB request failed with status: ${response.status}`);
          }
          return null;
        }
        const data = (await response.json()) as T;
        this.cache.set(url, { data, timestamp: Date.now() });
        return data;
      } catch (error) {
        console.warn(`Network error fetching from TMDB (${endpoint}):`, error);
        return null;
      } finally {
        this.inFlightRequests.delete(url);
      }
    })();

    this.inFlightRequests.set(url, fetchPromise);
    return fetchPromise;
  }

  // --- Trending ---
  async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'day', page: number = 1): Promise<(Movie | TVShow)[]> {
    const data = await this.fetchFromTMDB<TMDBResponse<Movie | TVShow>>(`/trending/${mediaType}/${timeWindow}`, { page });
    if (data && data.results) {
      return data.results;
    }
    // Fallback
    if (mediaType === 'movie') return MOCK_MOVIES;
    if (mediaType === 'tv') return MOCK_TV_SHOWS;
    return [...MOCK_MOVIES, ...MOCK_TV_SHOWS];
  }

  // --- Movies ---
  async getPopularMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    const data = await this.fetchFromTMDB<TMDBResponse<Movie>>('/movie/popular', { page });
    if (data && data.results) return data;
    return {
      page: 1,
      results: MOCK_MOVIES,
      total_pages: 1,
      total_results: MOCK_MOVIES.length,
    };
  }

  async getTopRatedMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    const data = await this.fetchFromTMDB<TMDBResponse<Movie>>('/movie/top_rated', { page });
    if (data && data.results) return data;
    return {
      page: 1,
      results: [...MOCK_MOVIES].sort((a, b) => b.vote_average - a.vote_average),
      total_pages: 1,
      total_results: MOCK_MOVIES.length,
    };
  }

  async getUpcomingMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    const data = await this.fetchFromTMDB<TMDBResponse<Movie>>('/movie/upcoming', { page });
    if (data && data.results) return data;
    return {
      page: 1,
      results: MOCK_MOVIES.slice(0, 4),
      total_pages: 1,
      total_results: 4,
    };
  }

  async getNowPlayingMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    const data = await this.fetchFromTMDB<TMDBResponse<Movie>>('/movie/now_playing', { page });
    if (data && data.results) return data;
    return {
      page: 1,
      results: MOCK_MOVIES.slice(0, 5),
      total_pages: 1,
      total_results: 5,
    };
  }

  async getMovieDetails(id: number): Promise<Movie | null> {
    const data = await this.fetchFromTMDB<Movie>(`/movie/${id}`, {
      append_to_response: 'videos,credits,similar,recommendations',
    });
    if (data) return data;
    return MOCK_MOVIES.find(m => m.id === id) || null;
  }

  // --- TV Shows ---
  async getPopularTV(page: number = 1): Promise<TMDBResponse<TVShow>> {
    const data = await this.fetchFromTMDB<TMDBResponse<TVShow>>('/tv/popular', { page });
    if (data && data.results) return data;
    return {
      page: 1,
      results: MOCK_TV_SHOWS,
      total_pages: 1,
      total_results: MOCK_TV_SHOWS.length,
    };
  }

  async getTopRatedTV(page: number = 1): Promise<TMDBResponse<TVShow>> {
    const data = await this.fetchFromTMDB<TMDBResponse<TVShow>>('/tv/top_rated', { page });
    if (data && data.results) return data;
    return {
      page: 1,
      results: [...MOCK_TV_SHOWS].sort((a, b) => b.vote_average - a.vote_average),
      total_pages: 1,
      total_results: MOCK_TV_SHOWS.length,
    };
  }

  async getTVDetails(id: number): Promise<TVShow | null> {
    const data = await this.fetchFromTMDB<TVShow>(`/tv/${id}`, {
      append_to_response: 'videos,credits,similar,recommendations',
    });
    if (data) return data;
    return MOCK_TV_SHOWS.find(t => t.id === id) || null;
  }

  async getTVSeason(tvId: number, seasonNumber: number): Promise<Season | null> {
    const data = await this.fetchFromTMDB<Season>(`/tv/${tvId}/season/${seasonNumber}`);
    if (data) return data;
    const show = MOCK_TV_SHOWS.find(t => t.id === tvId);
    return show?.seasons?.find(s => s.season_number === seasonNumber) || null;
  }

  // --- Search ---
  async searchMulti(query: string, page: number = 1): Promise<TMDBResponse<Movie | TVShow>> {
    if (!query.trim()) {
      return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }

    const data = await this.fetchFromTMDB<TMDBResponse<Movie | TVShow>>('/search/multi', {
      query: query.trim(),
      page,
      include_adult: false,
    });

    if (data && data.results) {
      // Filter out people or entries without title/name
      const filtered = data.results.filter(item => {
        const asMovie = item as Movie;
        const asTv = item as TVShow;
        return Boolean(asMovie.title || asTv.name);
      });
      return { ...data, results: filtered };
    }

    // Mock search fallback
    const q = query.toLowerCase();
    const movieMatches = MOCK_MOVIES.filter(m => m.title.toLowerCase().includes(q) || m.overview.toLowerCase().includes(q));
    const tvMatches = MOCK_TV_SHOWS.filter(t => t.name.toLowerCase().includes(q) || t.overview.toLowerCase().includes(q));
    const combined = [...movieMatches, ...tvMatches];

    return {
      page: 1,
      results: combined,
      total_pages: 1,
      total_results: combined.length,
    };
  }

  async searchMovies(query: string, page: number = 1): Promise<TMDBResponse<Movie>> {
    const data = await this.fetchFromTMDB<TMDBResponse<Movie>>('/search/movie', {
      query: query.trim(),
      page,
    });
    if (data && data.results) return data;
    const q = query.toLowerCase();
    const matches = MOCK_MOVIES.filter(m => m.title.toLowerCase().includes(q) || m.overview.toLowerCase().includes(q));
    return {
      page: 1,
      results: matches,
      total_pages: 1,
      total_results: matches.length,
    };
  }

  async searchTV(query: string, page: number = 1): Promise<TMDBResponse<TVShow>> {
    const data = await this.fetchFromTMDB<TMDBResponse<TVShow>>('/search/tv', {
      query: query.trim(),
      page,
    });
    if (data && data.results) return data;
    const q = query.toLowerCase();
    const matches = MOCK_TV_SHOWS.filter(t => t.name.toLowerCase().includes(q) || t.overview.toLowerCase().includes(q));
    return {
      page: 1,
      results: matches,
      total_pages: 1,
      total_results: matches.length,
    };
  }

  // --- Discovery / Advanced Filtering ---
  async discoverMovies(filters: FilterOptions): Promise<TMDBResponse<Movie>> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: filters.page || 1,
      sort_by: filters.sortBy || 'popularity.desc',
      'vote_average.gte': filters.minRating || undefined,
      with_genres: filters.genreId || undefined,
      primary_release_year: filters.year || undefined,
      with_original_language: filters.language || undefined,
    };

    const data = await this.fetchFromTMDB<TMDBResponse<Movie>>('/discover/movie', params);
    if (data && data.results) return data;

    // Filter fallback mock data
    let filtered = [...MOCK_MOVIES];
    if (filters.genreId) {
      filtered = filtered.filter(m => m.genre_ids.includes(filters.genreId!));
    }
    if (filters.minRating) {
      filtered = filtered.filter(m => m.vote_average >= filters.minRating!);
    }
    if (filters.year) {
      filtered = filtered.filter(m => m.release_date.startsWith(String(filters.year)));
    }
    return {
      page: 1,
      results: filtered,
      total_pages: 1,
      total_results: filtered.length,
    };
  }

  async discoverTV(filters: FilterOptions): Promise<TMDBResponse<TVShow>> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: filters.page || 1,
      sort_by: filters.sortBy || 'popularity.desc',
      'vote_average.gte': filters.minRating || undefined,
      with_genres: filters.genreId || undefined,
      first_air_date_year: filters.year || undefined,
      with_original_language: filters.language || undefined,
    };

    const data = await this.fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', params);
    if (data && data.results) return data;

    let filtered = [...MOCK_TV_SHOWS];
    if (filters.genreId) {
      filtered = filtered.filter(t => t.genre_ids.includes(filters.genreId!));
    }
    if (filters.minRating) {
      filtered = filtered.filter(t => t.vote_average >= filters.minRating!);
    }
    if (filters.year) {
      filtered = filtered.filter(t => t.first_air_date.startsWith(String(filters.year)));
    }
    return {
      page: 1,
      results: filtered,
      total_pages: 1,
      total_results: filtered.length,
    };
  }

  // --- Genres ---
  async getGenres(mediaType: 'movie' | 'tv' = 'movie'): Promise<Genre[]> {
    const data = await this.fetchFromTMDB<{ genres: Genre[] }>(`/genre/${mediaType}/list`);
    if (data && data.genres) return data.genres;
    return MOCK_GENRES;
  }

  // --- Validation ---
  async testApiKey(keyToTest: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/authentication?api_key=${keyToTest.trim()}`);
      const data = await res.json();
      return Boolean(data && data.success);
    } catch {
      return false;
    }
  }
}

export const tmdb = new TMDBService();
