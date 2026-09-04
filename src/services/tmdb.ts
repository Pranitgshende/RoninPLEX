import { Movie, TVShow, TMDBResponse, Genre, FilterOptions, Season } from '../types/tmdb';
import { storage } from './storage';
import { MOCK_MOVIES, MOCK_TV_SHOWS, MOCK_GENRES } from './mockData';

const BASE_URL = 'https://api.themoviedb.org/3';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

import { resolveTMDBCredential } from './credentials';

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

  private async fetchFromTMDB<T>(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T | null> {
    const cred = await resolveTMDBCredential();
    if (!cred) {
      return null;
    }
    const apiKey = cred.key;

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

    const request = (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          import('./diagnostics').then(({ diagnostics }) => {
            diagnostics.warn('network', `TMDB request failed`, { status: response.status, endpoint });
          });
          return null;
        }
        const data = (await response.json()) as T;
        this.cache.set(url, { data, timestamp: Date.now() });
        return data;
      } catch (error) {
        import('./diagnostics').then(({ diagnostics }) => {
          diagnostics.warn('network', `Network error fetching from TMDB`, { endpoint, error });
        });
        return null;
      } finally {
        this.inFlightRequests.delete(url);
      }
    })();

    this.inFlightRequests.set(url, request);
    return request as Promise<T | null>;
  }

  private filterAnimeFromTVShows<T extends { original_language?: string; genre_ids?: number[] }>(results: T[]): T[] {
    return results.filter(item => {
      // 16 is Animation in TMDB. origin country is usually JP.
      const isAnime = item.original_language === 'ja' && item.genre_ids?.includes(16);
      return !isAnime;
    });
  }

  // --- Trending ---
  async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'day', page: number = 1): Promise<(Movie | TVShow)[]> {
    const data = await this.fetchFromTMDB<TMDBResponse<Movie | TVShow>>(`/trending/${mediaType}/${timeWindow}`, { page });
    if (data && data.results) {
      if (mediaType === 'tv') {
        return this.filterAnimeFromTVShows(data.results) as (Movie | TVShow)[];
      }
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
    if (data && data.results) { return { ...data, results: this.filterAnimeFromTVShows(data.results) }; }
    return {
      page: 1,
      results: MOCK_MOVIES,
      total_pages: 1,
      total_results: MOCK_MOVIES.length,
    };
  }

  async getTopRatedMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    const data = await this.fetchFromTMDB<TMDBResponse<Movie>>('/movie/top_rated', { page });
    if (data && data.results) { return { ...data, results: this.filterAnimeFromTVShows(data.results) }; }
    return {
      page: 1,
      results: [...MOCK_MOVIES].sort((a, b) => b.vote_average - a.vote_average),
      total_pages: 1,
      total_results: MOCK_MOVIES.length,
    };
  }

  async getUpcomingMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    const data = await this.fetchFromTMDB<TMDBResponse<Movie>>('/movie/upcoming', { page });
    if (data && data.results) { return { ...data, results: this.filterAnimeFromTVShows(data.results) }; }
    return {
      page: 1,
      results: MOCK_MOVIES.slice(0, 4),
      total_pages: 1,
      total_results: 4,
    };
  }

  async getNowPlayingMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    const data = await this.fetchFromTMDB<TMDBResponse<Movie>>('/movie/now_playing', { page });
    if (data && data.results) { return { ...data, results: this.filterAnimeFromTVShows(data.results) }; }
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
    if (data && data.results) {
      return { ...data, results: this.filterAnimeFromTVShows(data.results) };
    }
    return {
      page: 1,
      results: MOCK_TV_SHOWS,
      total_pages: 1,
      total_results: MOCK_TV_SHOWS.length,
    };
  }

  async getTopRatedTV(page: number = 1): Promise<TMDBResponse<TVShow>> {
    const data = await this.fetchFromTMDB<TMDBResponse<TVShow>>('/tv/top_rated', { page });
    if (data && data.results) {
      return { ...data, results: this.filterAnimeFromTVShows(data.results) };
    }
    return {
      page: 1,
      results: MOCK_TV_SHOWS,
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
  async searchMulti(query: string, page: number = 1, includeAdult: boolean = false): Promise<TMDBResponse<Movie | TVShow>> {
    if (!query.trim()) {
      return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }

    const data = await this.fetchFromTMDB<TMDBResponse<Movie | TVShow>>('/search/multi', {
      query: query.trim(),
      page,
      include_adult: includeAdult,
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
    if (data && data.results) { return { ...data, results: this.filterAnimeFromTVShows(data.results) }; }
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
    if (data && data.results) {
      return { ...data, results: this.filterAnimeFromTVShows(data.results) };
    }
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
    if (data && data.results) { return { ...data, results: this.filterAnimeFromTVShows(data.results) }; }

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
    if (data && data.results) { return { ...data, results: this.filterAnimeFromTVShows(data.results) }; }

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

  // --- Mature / 18+ Recommendations ---
  async getAdultRecommendations(): Promise<(Movie | TVShow)[]> {
    try {
      const [moviesRes, tvRes] = await Promise.allSettled([
        this.fetchFromTMDB<TMDBResponse<Movie>>('/discover/movie', {
          certification_country: 'US',
          certification: 'R',
          sort_by: 'popularity.desc',
          page: 1,
        }),
        this.fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', {
          with_genres: '18,80',
          sort_by: 'popularity.desc',
          page: 1,
        }),
      ]);

      const items: (Movie | TVShow)[] = [];

      if (moviesRes.status === 'fulfilled' && moviesRes.value?.results) {
        const movies = moviesRes.value.results
          .filter(m => m.poster_path && m.backdrop_path)
          .slice(0, 10)
          .map(m => ({ ...m, adult: true, media_type: 'movie' as const }));
        items.push(...movies);
      }

      if (tvRes.status === 'fulfilled' && tvRes.value?.results) {
        const tvShows = tvRes.value.results
          .filter(t => t.poster_path && t.backdrop_path)
          .slice(0, 8)
          .map(t => ({
            ...t,
            adult: true,
            media_type: 'tv' as const,
          }));
        items.push(...tvShows);
      }

      if (items.length >= 8) {
        return items;
      }
    } catch {
      // Fall through to curated fallback list
    }

    // High-quality verified fallback list (with 200 OK TMDB poster paths)
    return [
      {
        id: 293660,
        title: 'Deadpool',
        original_title: 'Deadpool',
        original_language: 'en',
        overview: 'A wisecracking mercenary gets experimented on and becomes immortal but ugly, and sets out to track down the man who ruined his looks.',
        poster_path: '/3E53WEZJqP6aM84D8CckXx4pIHw.jpg',
        backdrop_path: '/rFj9IKlL75B2pXhZA60jkNWvxeW.jpg',
        vote_average: 7.6,
        vote_count: 29000,
        popularity: 90,
        adult: true,
        media_type: 'movie' as const,
        release_date: '2016-02-09',
        genre_ids: [28, 12, 35],
      },
      {
        id: 550,
        title: 'Fight Club',
        original_title: 'Fight Club',
        original_language: 'en',
        overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
        poster_path: '/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg',
        backdrop_path: '/c6OLXfKAk5BKeR6broC8pYiCquX.jpg',
        vote_average: 8.4,
        vote_count: 28000,
        popularity: 85,
        adult: true,
        media_type: 'movie' as const,
        release_date: '1999-10-15',
        genre_ids: [18],
      },
      {
        id: 680,
        title: 'Pulp Fiction',
        original_title: 'Pulp Fiction',
        original_language: 'en',
        overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in this sprawling crime caper.',
        poster_path: '/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg',
        backdrop_path: '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
        vote_average: 8.5,
        vote_count: 26500,
        popularity: 92,
        adult: true,
        media_type: 'movie' as const,
        release_date: '1994-09-10',
        genre_ids: [53, 80],
      },
      {
        id: 105248,
        name: 'Cyberpunk: Edgerunners',
        original_name: 'Cyberpunk: Edgerunners',
        original_language: 'ja',
        overview: 'A street kid trying to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he chooses to stay alive by becoming an edgerunner.',
        poster_path: '/lqcDVZ8pyk08AVftMBildDR3QUK.jpg',
        backdrop_path: '/w0lU7U89Fm4K8BQD4hJQpQthxu9.jpg',
        vote_average: 8.6,
        vote_count: 1400,
        popularity: 88,
        adult: true,
        media_type: 'tv' as const,
        first_air_date: '2022-09-13',
        genre_ids: [16, 28, 878],
      },
      {
        id: 76479,
        name: 'The Boys',
        original_name: 'The Boys',
        original_language: 'en',
        overview: 'A fun and irreverent take on what happens when superheroes, who are as popular as celebrities, abuse their superpowers rather than use them for good.',
        poster_path: '/in1R2dDc421JxsoRWaIIAqVI2KE.jpg',
        backdrop_path: '/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg',
        vote_average: 8.5,
        vote_count: 9800,
        popularity: 150,
        adult: true,
        media_type: 'tv' as const,
        first_air_date: '2019-07-26',
        genre_ids: [10765, 10759],
      },
      {
        id: 1396,
        name: 'Breaking Bad',
        original_name: 'Breaking Bad',
        original_language: 'en',
        overview: 'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and decides to enter the dangerous world of drugs to provide for his family.',
        poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
        backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
        vote_average: 8.9,
        vote_count: 14000,
        popularity: 180,
        adult: true,
        media_type: 'tv' as const,
        first_air_date: '2008-01-20',
        genre_ids: [18, 80],
      },
      {
        id: 872585,
        title: 'Oppenheimer',
        original_title: 'Oppenheimer',
        original_language: 'en',
        overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II.',
        poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        backdrop_path: '/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
        vote_average: 8.1,
        vote_count: 8500,
        popularity: 110,
        adult: true,
        media_type: 'movie' as const,
        release_date: '2023-07-19',
        genre_ids: [18, 36],
      },
      {
        id: 475557,
        title: 'Joker',
        original_title: 'Joker',
        original_language: 'en',
        overview: 'During the 1980s, a failed stand-up comedian is driven insane and turns to a life of crime and chaos in Gotham City while becoming an infamous psychopathic crime figure.',
        poster_path: '/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
        backdrop_path: '/f5F4cRhQdU3bu0dLSSzC7hyP9IZ.jpg',
        vote_average: 8.2,
        vote_count: 24000,
        popularity: 95,
        adult: true,
        media_type: 'movie' as const,
        release_date: '2019-10-02',
        genre_ids: [80, 53, 18],
      },
      {
        id: 68718,
        title: 'Django Unchained',
        original_title: 'Django Unchained',
        original_language: 'en',
        overview: 'With the help of a German bounty-hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.',
        poster_path: '/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg',
        backdrop_path: '/2oZAvhud9HGtATVI49604epF70Q.jpg',
        vote_average: 8.2,
        vote_count: 25000,
        popularity: 88,
        adult: true,
        media_type: 'movie' as const,
        release_date: '2012-12-25',
        genre_ids: [18, 37],
      },
      {
        id: 807,
        title: 'Se7en',
        original_title: 'Se7en',
        original_language: 'en',
        overview: 'Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives.',
        poster_path: '/191nKfP0ehp3uIvWqgPbFmI4lv9.jpg',
        backdrop_path: '/ba4Cpvnw26u8g3rwhbZt24JbVwN.jpg',
        vote_average: 8.4,
        vote_count: 20000,
        popularity: 82,
        adult: true,
        media_type: 'movie' as const,
        release_date: '1995-09-22',
        genre_ids: [80, 9648, 53],
      },
      {
        id: 98,
        title: 'Gladiator',
        original_title: 'Gladiator',
        original_language: 'en',
        overview: 'In the year 180, the death of emperor Marcus Aurelius throws the Roman Empire into turmoil. Maximus, one of the Roman army\'s most capable generals, is betrayed and forced into slavery as a gladiator.',
        poster_path: '/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
        backdrop_path: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
        vote_average: 8.2,
        vote_count: 17500,
        popularity: 80,
        adult: true,
        media_type: 'movie' as const,
        release_date: '2000-05-04',
        genre_ids: [28, 18, 12],
      },
      {
        id: 1399,
        name: 'Game of Thrones',
        original_name: 'Game of Thrones',
        original_language: 'en',
        overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.',
        poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
        backdrop_path: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
        vote_average: 8.4,
        vote_count: 22000,
        popularity: 210,
        adult: true,
        media_type: 'tv' as const,
        first_air_date: '2011-04-17',
        genre_ids: [10765, 18, 10759],
      }
    ];
  }

  // --- Genres ---
  async getGenres(mediaType: 'movie' | 'tv' = 'movie'): Promise<Genre[]> {
    const data = await this.fetchFromTMDB<{ genres: Genre[] }>(`/genre/${mediaType}/list`);
    if (data && data.genres) return data.genres;
    return MOCK_GENRES;
  }

  // --- Watch Providers (Legal Streaming Options) ---
  async getWatchProviders(mediaType: 'movie' | 'tv', id: number): Promise<WatchProvidersData | null> {
    const data = await this.fetchFromTMDB<{ id: number; results: Record<string, WatchProvidersData> }>(
      `/${mediaType}/${id}/watch/providers`
    );
    if (!data || !data.results) return null;
    const results = data.results;
    return results['US'] || results['GB'] || results['CA'] || Object.values(results)[0] || null;
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

export interface WatchProviderItem {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProvidersData {
  link?: string;
  flatrate?: WatchProviderItem[];
  rent?: WatchProviderItem[];
  buy?: WatchProviderItem[];
  free?: WatchProviderItem[];
  ads?: WatchProviderItem[];
}

export const tmdb = new TMDBService();
