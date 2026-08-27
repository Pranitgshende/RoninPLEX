import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Film, Tv, X, AlertCircle } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { Movie, TVShow, MediaType } from '../types/tmdb';
import { MovieCard } from '../components/common/MovieCard';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { useDebounce } from '../hooks/useDebounce';

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState<string>(initialQuery);
  const [activeType, setActiveType] = useState<MediaType | 'all'>('all');
  const [results, setResults] = useState<(Movie | TVShow)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchedQuery, setSearchedQuery] = useState<string>(initialQuery);

  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      setSearchedQuery('');
      setSearchParams({});
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setSearchedQuery(debouncedQuery.trim());
    setSearchParams({ q: debouncedQuery.trim() });

    const performSearch = async () => {
      try {
        let res;
        if (activeType === 'movie') {
          res = await tmdb.searchMovies(debouncedQuery, 1);
        } else if (activeType === 'tv') {
          res = await tmdb.searchTV(debouncedQuery, 1);
        } else {
          res = await tmdb.searchMulti(debouncedQuery, 1);
        }

        if (isMounted) {
          setResults(res.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, activeType, setSearchParams]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearchedQuery('');
    setSearchParams({});
  };

  const filteredResults = results.filter(item => {
    if (activeType === 'movie' && !('title' in item)) return false;
    if (activeType === 'tv' && 'title' in item) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-slate-100 pt-24 pb-20 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto space-y-8">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight">
          Search Films & Shows
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Instant search across thousands of movies, TV series, trailers, and cast.
        </p>

        <div className="relative pt-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, director, keyword..."
            autoFocus
            className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-2xl bg-surface-200 border border-white/10 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-2xl transition-all"
          />
          <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 mt-1" />
          {query && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white absolute right-4 top-1/2 -translate-y-1/2 mt-1 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {searchedQuery && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setActiveType('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                activeType === 'all'
                  ? 'bg-brand-600 text-white border-brand-500'
                  : 'bg-surface-100 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => setActiveType('movie')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                activeType === 'movie'
                  ? 'bg-brand-600 text-white border-brand-500'
                  : 'bg-surface-100 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies</span>
            </button>
            <button
              onClick={() => setActiveType('tv')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                activeType === 'tv'
                  ? 'bg-brand-600 text-white border-brand-500'
                  : 'bg-surface-100 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV Shows</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {searchedQuery && (
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-3">
            <span>
              {isLoading ? (
                'Searching...'
              ) : (
                <>Found <strong className="text-white">{filteredResults.length}</strong> results for "{searchedQuery}"</>
              )}
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
            {filteredResults.map((item) => (
              <MovieCard
                key={`${item.id}-${'title' in item ? 'movie' : 'tv'}`}
                item={item}
              />
            ))}
          </div>
        ) : searchedQuery ? (
          <div className="py-20 text-center space-y-3 bg-surface-100/30 rounded-2xl border border-white/5">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No matches found for "{searchedQuery}"</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Check your spelling or try searching for another title, actor, or genre.
            </p>
          </div>
        ) : (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center text-slate-500 mx-auto border border-white/5">
              <SearchIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-200">Start typing to search</h3>
              <p className="text-xs text-slate-500">
                Search over 800,000 movies and TV series
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
              <span className="text-xs text-slate-500 mr-1">Try searching:</span>
              {['Oppenheimer', 'Dune', 'Arcane', 'Inception', 'Severance', 'Sci-Fi'].map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-surface-100 hover:bg-surface-50 text-slate-300 border border-white/10 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
