import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  Film,
  Tv,
  Sparkles,
  RotateCcw,
  RotateCw,
  ChevronDown,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { animeService, AnimeItem } from '../services/anime/AnimeService';
import { recommendation } from '../services/recommendation';
import { Movie, TVShow, Genre, FilterOptions } from '../types/tmdb';
import { MovieCard } from '../components/common/MovieCard';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { MOCK_GENRES } from '../services/mockData';
import { useUser } from '../context/UserContext';
import { AdultBadge } from '../components/common/AdultBadge';

export type DiscoverMediaType = 'all' | 'movie' | 'tv' | 'anime';

export interface MovieDiscoverItem {
  id: number;
  mediaType: 'movie';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  releaseYear: string;
  genres: number[];
  adult: boolean;
  raw: Movie;
}

export interface TvDiscoverItem {
  id: number;
  mediaType: 'tv';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  releaseYear: string;
  genres: number[];
  adult: boolean;
  raw: TVShow;
}

export interface AnimeDiscoverItem {
  id: string;
  mediaType: 'anime';
  title: string;
  romajiTitle?: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  releaseYear: string;
  genres: string[];
  adult: boolean;
  raw: AnimeItem;
}

export type DiscoverItem = MovieDiscoverItem | TvDiscoverItem | AnimeDiscoverItem;

export const Discover: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { preferences } = useUser();
  const showAdult = preferences.showAdultRecommendations ?? false;

  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'for-you');
  const [mediaType, setMediaType] = useState<DiscoverMediaType>(
    (searchParams.get('type') as DiscoverMediaType) || 'all'
  );
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>('popularity.desc');
  const [genres, setGenres] = useState<Genre[]>(MOCK_GENRES);

  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  // Cancellation token counter to eliminate race conditions
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    tmdb.getGenres('movie').then(setGenres);
  }, []);

  const loadData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      let candidateItems: DiscoverItem[] = [];

      // 1. Fetch Anime Candidates if mediaType is 'all' or 'anime'
      const shouldFetchAnime = mediaType === 'all' || mediaType === 'anime';
      let animeCandidates: AnimeDiscoverItem[] = [];

      if (shouldFetchAnime) {
        try {
          let rawAnime: AnimeItem[] = [];
          if (activeTab === 'top-rated') {
            rawAnime = await animeService.getTopRated(showAdult, page);
          } else if (activeTab === 'popular') {
            rawAnime = await animeService.getPopular(showAdult, page);
          } else if (activeTab === 'upcoming') {
            rawAnime = await animeService.getSeasonal(showAdult, page);
          } else {
            rawAnime = await animeService.getTrending(showAdult, page);
          }

          animeCandidates = rawAnime.map((a) => ({
            id: a.id,
            mediaType: 'anime',
            title: a.title,
            romajiTitle: a.romajiTitle,
            posterPath: a.poster,
            backdropPath: a.banner || a.poster,
            rating: a.score || 0,
            releaseYear: a.year ? String(a.year) : '',
            genres: a.genres || [],
            adult: a.isAdult,
            raw: a,
          }));
        } catch (err) {
          console.warn('Discover anime fetch error:', err);
        }
      }

      // 2. Fetch Movies / TV Candidates if mediaType is not 'anime'
      let movieTvCandidates: (MovieDiscoverItem | TvDiscoverItem)[] = [];
      const shouldFetchMovieTv = mediaType !== 'anime';

      if (shouldFetchMovieTv) {
        if (activeTab === 'for-you') {
          const [movies, tvs, trending] = await Promise.all([
            tmdb.getPopularMovies(page),
            tmdb.getPopularTV(page),
            tmdb.getTrending('all', 'week', page),
          ]);
          const pool = [...trending, ...movies.results, ...tvs.results];
          
          if (preferences?.favoriteGenreIds?.length > 0) {
            pool.sort((a, b) => {
              const aMatch = (a.genre_ids || []).filter(g => preferences.favoriteGenreIds.includes(g)).length;
              const bMatch = (b.genre_ids || []).filter(g => preferences.favoriteGenreIds.includes(g)).length;
              return bMatch - aMatch;
            });
          }
          
          movieTvCandidates = pool.map((item) => {
            const isMovie = 'title' in item;
            if (isMovie) {
              const m = item as Movie;
              return {
                id: m.id,
                mediaType: 'movie',
                title: m.title,
                posterPath: m.poster_path,
                backdropPath: m.backdrop_path,
                rating: m.vote_average || 0,
                releaseYear: m.release_date ? m.release_date.substring(0, 4) : '',
                genres: m.genre_ids || [],
                adult: Boolean(m.adult),
                raw: m,
              };
            } else {
              const t = item as TVShow;
              return {
                id: t.id,
                mediaType: 'tv',
                title: t.name,
                posterPath: t.poster_path,
                backdropPath: t.backdrop_path,
                rating: t.vote_average || 0,
                releaseYear: t.first_air_date ? t.first_air_date.substring(0, 4) : '',
                genres: t.genre_ids || [],
                adult: Boolean(t.adult),
                raw: t,
              };
            }
          });
        } else if (activeTab === 'trending') {
          const target = mediaType === 'all' ? 'all' : (mediaType as 'movie' | 'tv');
          const results = await tmdb.getTrending(target, 'week', page);
          movieTvCandidates = results.map((item) => {
            const isMovie = 'title' in item;
            return {
              id: item.id,
              mediaType: isMovie ? 'movie' : 'tv',
              title: isMovie ? (item as Movie).title : (item as TVShow).name,
              posterPath: item.poster_path,
              backdropPath: item.backdrop_path,
              rating: item.vote_average || 0,
              releaseYear: isMovie
                ? (item as Movie).release_date?.substring(0, 4) || ''
                : (item as TVShow).first_air_date?.substring(0, 4) || '',
              genres: item.genre_ids || [],
              adult: Boolean(item.adult),
              raw: item as any,
            };
          });
        } else if (activeTab === 'popular') {
          if (mediaType === 'movie') {
            const res = await tmdb.getPopularMovies(page);
            movieTvCandidates = res.results.map((m) => ({
              id: m.id,
              mediaType: 'movie',
              title: m.title,
              posterPath: m.poster_path,
              backdropPath: m.backdrop_path,
              rating: m.vote_average || 0,
              releaseYear: m.release_date ? m.release_date.substring(0, 4) : '',
              genres: m.genre_ids || [],
              adult: Boolean(m.adult),
              raw: m,
            }));
          } else if (mediaType === 'tv') {
            const res = await tmdb.getPopularTV(page);
            movieTvCandidates = res.results.map((t) => ({
              id: t.id,
              mediaType: 'tv',
              title: t.name,
              posterPath: t.poster_path,
              backdropPath: t.backdrop_path,
              rating: t.vote_average || 0,
              releaseYear: t.first_air_date ? t.first_air_date.substring(0, 4) : '',
              genres: t.genre_ids || [],
              adult: Boolean(t.adult),
              raw: t,
            }));
          } else {
            const [mRes, tRes] = await Promise.all([tmdb.getPopularMovies(page), tmdb.getPopularTV(page)]);
            const mList: MovieDiscoverItem[] = mRes.results.map((m) => ({
              id: m.id,
              mediaType: 'movie',
              title: m.title,
              posterPath: m.poster_path,
              backdropPath: m.backdrop_path,
              rating: m.vote_average || 0,
              releaseYear: m.release_date ? m.release_date.substring(0, 4) : '',
              genres: m.genre_ids || [],
              adult: Boolean(m.adult),
              raw: m,
            }));
            const tList: TvDiscoverItem[] = tRes.results.map((t) => ({
              id: t.id,
              mediaType: 'tv',
              title: t.name,
              posterPath: t.poster_path,
              backdropPath: t.backdrop_path,
              rating: t.vote_average || 0,
              releaseYear: t.first_air_date ? t.first_air_date.substring(0, 4) : '',
              genres: t.genre_ids || [],
              adult: Boolean(t.adult),
              raw: t,
            }));
            movieTvCandidates = [...mList, ...tList];
          }
        } else if (activeTab === 'top-rated') {
          if (mediaType === 'movie') {
            const res = await tmdb.getTopRatedMovies(page);
            movieTvCandidates = res.results.map((m) => ({
              id: m.id,
              mediaType: 'movie',
              title: m.title,
              posterPath: m.poster_path,
              backdropPath: m.backdrop_path,
              rating: m.vote_average || 0,
              releaseYear: m.release_date ? m.release_date.substring(0, 4) : '',
              genres: m.genre_ids || [],
              adult: Boolean(m.adult),
              raw: m,
            }));
          } else if (mediaType === 'tv') {
            const res = await tmdb.getTopRatedTV(page);
            movieTvCandidates = res.results.map((t) => ({
              id: t.id,
              mediaType: 'tv',
              title: t.name,
              posterPath: t.poster_path,
              backdropPath: t.backdrop_path,
              rating: t.vote_average || 0,
              releaseYear: t.first_air_date ? t.first_air_date.substring(0, 4) : '',
              genres: t.genre_ids || [],
              adult: Boolean(t.adult),
              raw: t,
            }));
          } else {
            const [mRes, tRes] = await Promise.all([tmdb.getTopRatedMovies(page), tmdb.getTopRatedTV(page)]);
            const mList: MovieDiscoverItem[] = mRes.results.map((m) => ({
              id: m.id,
              mediaType: 'movie',
              title: m.title,
              posterPath: m.poster_path,
              backdropPath: m.backdrop_path,
              rating: m.vote_average || 0,
              releaseYear: m.release_date ? m.release_date.substring(0, 4) : '',
              genres: m.genre_ids || [],
              adult: Boolean(m.adult),
              raw: m,
            }));
            const tList: TvDiscoverItem[] = tRes.results.map((t) => ({
              id: t.id,
              mediaType: 'tv',
              title: t.name,
              posterPath: t.poster_path,
              backdropPath: t.backdrop_path,
              rating: t.vote_average || 0,
              releaseYear: t.first_air_date ? t.first_air_date.substring(0, 4) : '',
              genres: t.genre_ids || [],
              adult: Boolean(t.adult),
              raw: t,
            }));
            movieTvCandidates = [...mList, ...tList];
          }
        } else if (activeTab === 'upcoming') {
          const res = await tmdb.getUpcomingMovies(page);
          movieTvCandidates = res.results.map((m) => ({
            id: m.id,
            mediaType: 'movie',
            title: m.title,
            posterPath: m.poster_path,
            backdropPath: m.backdrop_path,
            rating: m.vote_average || 0,
            releaseYear: m.release_date ? m.release_date.substring(0, 4) : '',
            genres: m.genre_ids || [],
            adult: Boolean(m.adult),
            raw: m,
          }));
        } else if (activeTab === 'now-playing') {
          const res = await tmdb.getNowPlayingMovies(page);
          movieTvCandidates = res.results.map((m) => ({
            id: m.id,
            mediaType: 'movie',
            title: m.title,
            posterPath: m.poster_path,
            backdropPath: m.backdrop_path,
            rating: m.vote_average || 0,
            releaseYear: m.release_date ? m.release_date.substring(0, 4) : '',
            genres: m.genre_ids || [],
            adult: Boolean(m.adult),
            raw: m,
          }));
        } else {
          const filterOpts: FilterOptions = {
            mediaType: mediaType === 'all' ? 'all' : (mediaType as any),
            genreId: selectedGenreId,
            year: selectedYear,
            minRating: minRating > 0 ? minRating : undefined,
            language: selectedLanguage || undefined,
            sortBy,
            page: 1,
          };

          if (mediaType === 'tv') {
            const res = await tmdb.discoverTV(filterOpts);
            movieTvCandidates = res.results.map((t) => ({
              id: t.id,
              mediaType: 'tv',
              title: t.name,
              posterPath: t.poster_path,
              backdropPath: t.backdrop_path,
              rating: t.vote_average || 0,
              releaseYear: t.first_air_date ? t.first_air_date.substring(0, 4) : '',
              genres: t.genre_ids || [],
              adult: Boolean(t.adult),
              raw: t,
            }));
          } else if (mediaType === 'movie') {
            const res = await tmdb.discoverMovies(filterOpts);
            movieTvCandidates = res.results.map((m) => ({
              id: m.id,
              mediaType: 'movie',
              title: m.title,
              posterPath: m.poster_path,
              backdropPath: m.backdrop_path,
              rating: m.vote_average || 0,
              releaseYear: m.release_date ? m.release_date.substring(0, 4) : '',
              genres: m.genre_ids || [],
              adult: Boolean(m.adult),
              raw: m,
            }));
          } else {
            const [movieRes, tvRes] = await Promise.all([
              tmdb.discoverMovies(filterOpts),
              tmdb.discoverTV(filterOpts),
            ]);
            const mList: MovieDiscoverItem[] = movieRes.results.map((m) => ({
              id: m.id,
              mediaType: 'movie',
              title: m.title,
              posterPath: m.poster_path,
              backdropPath: m.backdrop_path,
              rating: m.vote_average || 0,
              releaseYear: m.release_date ? m.release_date.substring(0, 4) : '',
              genres: m.genre_ids || [],
              adult: Boolean(m.adult),
              raw: m,
            }));
            const tList: TvDiscoverItem[] = tvRes.results.map((t) => ({
              id: t.id,
              mediaType: 'tv',
              title: t.name,
              posterPath: t.poster_path,
              backdropPath: t.backdrop_path,
              rating: t.vote_average || 0,
              releaseYear: t.first_air_date ? t.first_air_date.substring(0, 4) : '',
              genres: t.genre_ids || [],
              adult: Boolean(t.adult),
              raw: t,
            }));
            movieTvCandidates = [...mList, ...tList];
          }
        }
      }

      // 3. Combine Candidates based on selected mediaType
      if (mediaType === 'anime') {
        candidateItems = animeCandidates;
      } else if (mediaType === 'movie') {
        candidateItems = movieTvCandidates.filter((i) => i.mediaType === 'movie');
      } else if (mediaType === 'tv') {
        candidateItems = movieTvCandidates.filter((i) => i.mediaType === 'tv');
      } else {
        // 'all' -> Interleave Movie/TV and Anime seamlessly
        candidateItems = [...movieTvCandidates, ...animeCandidates];
      }

      // 4. Strict Deduplication by compound stable key `${item.mediaType}:${item.id}`
      const seenKeys = new Set<string>();
      const deduplicated: DiscoverItem[] = [];

      for (const item of candidateItems) {
        if (!item || !item.id) continue;

        // Strict mediaType filter check
        if (mediaType !== 'all' && item.mediaType !== mediaType) continue;

        // Adult filter
        if (!showAdult && item.adult) continue;

        // Minimum Rating filter
        if (minRating > 0 && item.rating < minRating) continue;

        // Year filter
        if (selectedYear && item.releaseYear && !item.releaseYear.startsWith(String(selectedYear))) {
          continue;
        }

        const stableKey = `${item.mediaType}:${item.id}`;
        if (!seenKeys.has(stableKey)) {
          seenKeys.add(stableKey);
          deduplicated.push(item);
        }
      }

      // Check cancellation token before updating state
      if (currentRequestId === requestIdRef.current) {
        setItems(deduplicated);
      }
    } catch (err) {
      console.error('Failed to discover media:', err);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    activeTab,
    mediaType,
    selectedGenreId,
    selectedYear,
    minRating,
    selectedLanguage,
    sortBy,
    preferences,
    showAdult,
    page,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setSelectedGenreId(null);
    setSelectedYear(null);
    setMinRating(0);
    setSelectedLanguage('');
    setSortBy('popularity.desc');
  };

  const hasActiveFilters =
    selectedGenreId !== null ||
    selectedYear !== null ||
    minRating > 0 ||
    selectedLanguage !== '' ||
    sortBy !== 'popularity.desc';

  return (
    <div className="min-h-screen bg-background text-slate-100 pt-24 pb-20 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
          Explore & Discover
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Unified discovery across Movies, TV Shows, and Anime. Filter by your favorite genres,
          runtime, and ratings, or explore personalized recommendations.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-white/5">
        {[
          { id: 'for-you', label: 'For You', icon: Sparkles },
          { id: 'trending', label: 'Trending', icon: null },
          { id: 'popular', label: 'Popular', icon: null },
          { id: 'top-rated', label: 'Top Rated', icon: null },
          { id: 'upcoming', label: 'Upcoming', icon: null },
          { id: 'now-playing', label: 'In Theatres', icon: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchParams({ tab: tab.id, type: mediaType });
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'bg-surface-100/70 text-slate-400 hover:text-white hover:bg-surface-50'
              }`}
            >
              {Icon && <Icon className="w-4 h-4 text-brand-300" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {/* Media Type Selector: ALL | MOVIES | TV | ANIME */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100/80 border border-white/5">
            <button
              onClick={() => {
                setMediaType('all');
                setSearchParams({ tab: activeTab, type: 'all' });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mediaType === 'all'
                  ? 'bg-surface-50 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All Media</span>
            </button>
            <button
              onClick={() => {
                setMediaType('movie');
                setSearchParams({ tab: activeTab, type: 'movie' });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mediaType === 'movie'
                  ? 'bg-surface-50 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies Only</span>
            </button>
            <button
              onClick={() => {
                setMediaType('tv');
                setSearchParams({ tab: activeTab, type: 'tv' });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mediaType === 'tv'
                  ? 'bg-surface-50 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV Shows Only</span>
            </button>
            <button
              onClick={() => {
                setMediaType('anime');
                setSearchParams({ tab: activeTab, type: 'anime' });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mediaType === 'anime'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Anime Only</span>
            </button>
          </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border border-white/5 bg-surface-100 text-slate-300 hover:text-white hover:bg-surface-50 transition-all"
                title="Shuffle Recommendations"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shuffle</span>
              </button>

              {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1.5"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                filtersOpen || hasActiveFilters
                  ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                  : 'bg-surface-100 border-white/5 text-slate-300 hover:text-white hover:bg-surface-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  filtersOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Expandable Filter Tray */}
        {filtersOpen && (
          <div className="p-5 rounded-2xl bg-surface-100/90 border border-white/5 backdrop-blur-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
            {/* Genre Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Genre
              </label>
              <select
                value={selectedGenreId || ''}
                onChange={(e) =>
                  setSelectedGenreId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full px-3 py-2 rounded-xl bg-surface-200 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">All Genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Rating Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Min Rating ({minRating > 0 ? `${minRating}+` : 'Any'})
              </label>
              <input
                type="range"
                min="0"
                max="9"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>

            {/* Release Year */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Release Year
              </label>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-xl bg-surface-200 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">Any Year</option>
                {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as FilterOptions['sortBy'])}
                className="w-full px-3 py-2 rounded-xl bg-surface-200 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="popularity.desc">Most Popular</option>
                <option value="vote_average.desc">Highest Rated</option>
                <option value="primary_release_date.desc">Release Date (Newest)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid Display */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
          {items.map((item) => (
            <MovieCard
              key={`${item.mediaType}-${item.id}`}
              item={item.raw}
              mediaType={item.mediaType as any}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface-100/40 rounded-3xl border border-white/5 p-8">
          <p className="text-slate-400 text-sm">No titles matched your selected filters.</p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
