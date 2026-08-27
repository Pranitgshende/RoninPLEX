import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Film, Tv, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { recommendation } from '../services/recommendation';
import { Movie, TVShow, Genre, MediaType, FilterOptions } from '../types/tmdb';
import { MovieCard } from '../components/common/MovieCard';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { MOCK_GENRES } from '../services/mockData';
import { useUser } from '../context/UserContext';

export const Discover: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { preferences, watchlist, watched } = useUser();

  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'for-you');
  const [mediaType, setMediaType] = useState<MediaType | 'all'>((searchParams.get('type') as MediaType) || 'all');
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>('popularity.desc');
  const [genres, setGenres] = useState<Genre[]>(MOCK_GENRES);

  const [items, setItems] = useState<(Movie | TVShow)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  useEffect(() => {
    tmdb.getGenres('movie').then(setGenres);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'for-you') {
        const [movies, tvs, trending] = await Promise.all([
          tmdb.getPopularMovies(1),
          tmdb.getPopularTV(1),
          tmdb.getTrending('all', 'week'),
        ]);
        const pool = [...trending, ...movies.results, ...tvs.results];
        const filtered = pool.filter(item => {
          const isMovie = 'title' in item;
          if (mediaType === 'movie' && !isMovie) return false;
          if (mediaType === 'tv' && isMovie) return false;

          const itemGenreIds = item.genre_ids || [];
          if (selectedGenreId && !itemGenreIds.includes(selectedGenreId)) return false;
          if (minRating > 0 && item.vote_average < minRating) return false;
          return true;
        });

        const ranked = recommendation.rankMedia(filtered, preferences, watchlist, watched);
        setItems(ranked.map(r => {
          const match = pool.find(p => p.id === r.id);
          return match || (r as unknown as Movie);
        }));
      } else if (activeTab === 'trending') {
        const results = await tmdb.getTrending(mediaType === 'all' ? 'all' : mediaType, 'week');
        setItems(results);
      } else if (activeTab === 'upcoming') {
        const results = await tmdb.getUpcomingMovies(1);
        setItems(results.results);
      } else if (activeTab === 'now-playing') {
        const results = await tmdb.getNowPlayingMovies(1);
        setItems(results.results);
      } else {
        const filterOpts: FilterOptions = {
          mediaType,
          genreId: selectedGenreId,
          year: selectedYear,
          minRating: minRating > 0 ? minRating : undefined,
          language: selectedLanguage || undefined,
          sortBy,
          page: 1,
        };

        if (mediaType === 'tv') {
          const res = await tmdb.discoverTV(filterOpts);
          setItems(res.results);
        } else if (mediaType === 'movie') {
          const res = await tmdb.discoverMovies(filterOpts);
          setItems(res.results);
        } else {
          const [movieRes, tvRes] = await Promise.all([
            tmdb.discoverMovies(filterOpts),
            tmdb.discoverTV(filterOpts),
          ]);
          setItems([...movieRes.results, ...tvRes.results]);
        }
      }
    } catch (err) {
      console.error('Failed to discover media:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, mediaType, selectedGenreId, selectedYear, minRating, selectedLanguage, sortBy, preferences, watchlist, watched]);

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

  const hasActiveFilters = selectedGenreId !== null || selectedYear !== null || minRating > 0 || selectedLanguage !== '' || sortBy !== 'popularity.desc';

  return (
    <div className="min-h-screen bg-background text-slate-100 pt-24 pb-20 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
          Explore & Discover
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Browse top curated categories, filter by your favorite genres, runtime, and ratings, or explore custom personalized recommendations.
        </p>
      </div>

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
                setSearchParams({ tab: tab.id });
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100/80 border border-white/5">
            <button
              onClick={() => setMediaType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                mediaType === 'all' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setMediaType('movie')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                mediaType === 'movie' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies</span>
            </button>
            <button
              onClick={() => setMediaType('tv')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                mediaType === 'tv' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV Shows</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors border flex items-center gap-2 ${
                filtersOpen || hasActiveFilters
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/50'
                  : 'bg-surface-100 text-slate-300 border-white/5 hover:bg-surface-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="p-5 rounded-2xl bg-surface-200 border border-white/10 space-y-5 animate-slide-up shadow-xl">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Filter by Genre
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedGenreId(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedGenreId === null
                      ? 'bg-brand-600 text-white border-brand-500'
                      : 'bg-surface-100 text-slate-300 border-white/5 hover:border-white/20'
                  }`}
                >
                  All Genres
                </button>
                {genres.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGenreId(selectedGenreId === g.id ? null : g.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedGenreId === g.id
                        ? 'bg-brand-600 text-white border-brand-500'
                        : 'bg-surface-100 text-slate-300 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-white/5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Release Year
                </label>
                <select
                  value={selectedYear || ''}
                  onChange={e => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-300 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">Any Year</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                  <option value="2019">2019</option>
                  <option value="2015">2015-2018</option>
                  <option value="2010">2010s</option>
                  <option value="2000">2000s</option>
                  <option value="1990">1990s</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Minimum Rating
                  </label>
                  <span className="text-xs text-amber-400 font-bold">
                    {minRating > 0 ? `★ ${minRating.toFixed(1)}+` : 'All'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="9.0"
                  step="0.5"
                  value={minRating}
                  onChange={e => setMinRating(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-surface-300 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Sort Order
                </label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as FilterOptions['sortBy'])}
                  className="w-full px-3 py-2 rounded-xl bg-surface-300 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="popularity.desc">Most Popular</option>
                  <option value="vote_average.desc">Highest Rated</option>
                  <option value="primary_release_date.desc">Newest Release</option>
                  <option value="revenue.desc">Box Office Revenue</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
            {items.map((item) => (
              <MovieCard
                key={`${item.id}-${'title' in item ? 'movie' : 'tv'}`}
                item={item}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 bg-surface-100/30 rounded-2xl border border-white/5">
            <Film className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No titles match your criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting or resetting your genre and rating filters to see more recommendations.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
