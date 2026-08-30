import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Film, Tv, Sparkles, X, AlertCircle } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { animeService, AnimeItem } from '../services/anime/AnimeService';
import { Movie, TVShow } from '../types/tmdb';
import { MovieCard } from '../components/common/MovieCard';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { useDebounce } from '../hooks/useDebounce';
import { useUser } from '../context/UserContext';

type SearchMediaType = 'all' | 'movie' | 'tv' | 'anime';

interface SearchResultItem {
  id: string | number;
  mediaType: 'movie' | 'tv' | 'anime';
  raw: Movie | TVShow | AnimeItem | any;
}

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { preferences } = useUser();
  const showAdult = preferences.showAdultRecommendations ?? false;

  const [query, setQuery] = useState<string>(initialQuery);
  const [activeType, setActiveType] = useState<SearchMediaType>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
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
    setSearchParams({ q: debouncedQuery.trim(), type: activeType });

    const performSearch = async () => {
      try {
        let items: SearchResultItem[] = [];

        if (activeType === 'anime') {
          const animeRes = await animeService.search(debouncedQuery.trim(), showAdult);
          items = animeRes.map((a) => ({
            id: a.id,
            mediaType: 'anime',
            raw: a,
          }));
        } else if (activeType === 'movie') {
          const res = await tmdb.searchMovies(debouncedQuery.trim(), 1);
          items = res.results.map((m) => ({
            id: m.id,
            mediaType: 'movie',
            raw: m,
          }));
        } else if (activeType === 'tv') {
          const res = await tmdb.searchTV(debouncedQuery.trim(), 1);
          items = res.results.map((t) => ({
            id: t.id,
            mediaType: 'tv',
            raw: t,
          }));
        } else {
          // 'all' -> Search TMDB (movies/tv) + Anime SDK / AniList
          const [tmdbRes, animeRes] = await Promise.all([
            tmdb.searchMulti(debouncedQuery.trim(), 1, showAdult),
            animeService.search(debouncedQuery.trim(), showAdult),
          ]);

          const tmdbItems: SearchResultItem[] = tmdbRes.results
            .filter((item) => (item as any).media_type === 'movie' || (item as any).media_type === 'tv')
            .map((item) => ({
              id: item.id,
              mediaType: (item as any).media_type || ('title' in item ? 'movie' : 'tv'),
              raw: item,
            }));

          const animeItems: SearchResultItem[] = animeRes.map((a) => ({
            id: a.id,
            mediaType: 'anime',
            raw: a,
          }));

          // Interleave results
          items = [...animeItems.slice(0, 4), ...tmdbItems, ...animeItems.slice(4)];
        }

        if (isMounted) {
          // Strict deduplication
          const seen = new Set<string>();
          const deduped: SearchResultItem[] = [];
          for (const it of items) {
            const key = `${it.mediaType}:${it.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(it);
            }
          }
          setResults(deduped);
        }
      } catch (err) {
        console.error('Search failed:', err);
        if (isMounted) setResults([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, activeType, showAdult]);

  return (
    <div className="min-h-screen bg-background text-slate-100 pt-24 pb-20 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto space-y-8">
      {/* Search Header */}
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
          Universal Search
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Find movies, television series, and anime series across global libraries with intelligent matching.
        </p>

        {/* Search Input Bar */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, director, romaji, or keyword..."
            autoFocus
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-surface-100/80 border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:bg-surface-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-xl"
          />
          <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs: ALL | MOVIES | TV | ANIME */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-100/80 border border-white/5 w-fit overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Media', icon: null },
          { id: 'movie', label: 'Movies', icon: Film },
          { id: 'tv', label: 'TV Shows', icon: Tv },
          { id: 'anime', label: 'Anime', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id as SearchMediaType)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isActive
                  ? tab.id === 'anime'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Results Header */}
      {searchedQuery && (
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-3">
          <span>
            Found <strong className="text-white">{results.length}</strong> results for &ldquo;
            {searchedQuery}&rdquo;
          </span>
          <span className="uppercase tracking-wider font-semibold text-[10px]">
            {activeType}
          </span>
        </div>
      )}

      {/* Grid or Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
          {results.map((item) => (
            <MovieCard
              key={`${item.mediaType}-${item.id}`}
              item={item.raw}
              mediaType={item.mediaType}
            />
          ))}
        </div>
      ) : searchedQuery ? (
        <div className="text-center py-20 bg-surface-100/40 rounded-3xl border border-white/5 p-8 max-w-md mx-auto space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-white text-sm font-semibold">No matches found</p>
          <p className="text-xs text-slate-400">
            We couldn&apos;t find anything matching &ldquo;{searchedQuery}&rdquo;. Try checking your spelling or searching for a different title.
          </p>
        </div>
      ) : null}
    </div>
  );
};
