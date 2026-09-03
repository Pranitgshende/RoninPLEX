import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Search, Star, Clock, Play, Layers } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { TVShow, Genre } from '../types/tmdb';
import { MovieCard } from '../components/common/MovieCard';
import { MediaRow } from '../components/common/MediaRow';
import { useUser } from '../context/UserContext';
import { useAppLifecycle } from '../context/AppLifecycleContext';
import { ScrambleText } from '../animation/components/ScrambleText';
import { getBackdropUrl } from '../utils/helpers';

export const TvShows: React.FC = () => {
  const navigate = useNavigate();
  const { continueWatching, removePlaybackProgress } = useUser();
  const { isIntroComplete } = useAppLifecycle();

  const [trendingTV, setTrendingTV] = useState<TVShow[]>([]);
  const [popularTV, setPopularTV] = useState<TVShow[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<TVShow[]>([]);
  const [genreTV, setGenreTV] = useState<TVShow[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TVShow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Hero feature TV show (top trending)
  const heroShow = trendingTV[0] || popularTV[0] || null;

  // Filter continue watching to TV only
  const tvContinueWatching = useMemo(() => {
    return continueWatching.filter(item => item.mediaType === 'tv');
  }, [continueWatching]);
  useAppReadyWhen(!isLoading);


  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      tmdb.getTrending('tv', 'day'),
      tmdb.getPopularTV(1),
      tmdb.getTopRatedTV(1),
      tmdb.getGenres('tv'),
    ])
      .then(([trending, popular, topRated, genreList]) => {
        if (!isMounted) return;
        setTrendingTV(trending as TVShow[]);
        setPopularTV(popular.results);
        setTopRatedTV(topRated.results);
        setGenres(genreList);
        setIsLoading(false);
      })
      .catch((err) => {
        import('../services/diagnostics').then(({ diagnostics }) => diagnostics.error('network', 'Error loading TV shows', { error: err }));
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter by genre
  useEffect(() => {
    if (!selectedGenreId) {
      setGenreTV([]);
      return;
    }
    tmdb.discoverTV({ mediaType: 'tv', genreId: selectedGenreId, sortBy: 'popularity.desc' })
      .then((res) => setGenreTV(res.results))
      .catch((err) => import('../services/diagnostics').then(({ diagnostics }) => diagnostics.error('network', 'TV genre discover error', { error: err })));
  }, [selectedGenreId]);

  // Quick search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await tmdb.searchTV(searchQuery.trim(), 1);
      setSearchResults(res.results);
    } catch (err) {
      import('../services/diagnostics').then(({ diagnostics }) => diagnostics.error('network', 'TV search error', { error: err }));
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 pb-20 pt-20 sm:pt-24">
      {/* TV Shows Header & Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2.5 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              <Tv className="w-4 h-4" />
              <span>Series Studio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display mt-1">
              <ScrambleText text="TV Shows & Series" autoStart={isIntroComplete} />
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Binge critically acclaimed television dramas, addictive docuseries, and seasonal serialized sagas.
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative max-w-md w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TV shows & series..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-100/70 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        {/* Genre Quick Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar scroll-smooth">
          <button
            onClick={() => setSelectedGenreId(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedGenreId === null
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-surface-100/60 hover:bg-white/10 text-slate-300'
            }`}
          >
            All Genres
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGenreId(g.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGenreId === g.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-surface-100/60 hover:bg-white/10 text-slate-300'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Display */}
      {isSearching && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 mb-12 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Search Results for "{searchQuery}"</span>
              <span className="text-xs text-slate-400">({searchResults.length} series)</span>
            </h2>
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearching(false);
                setSearchResults([]);
              }}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Clear Search
            </button>
          </div>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.map((show) => (
                <MovieCard key={show.id} item={show} mediaType="tv" />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-surface-100/40 rounded-2xl border border-white/5">
              No TV series matched your search query.
            </div>
          )}
        </div>
      )}

      {/* Genre Filter Results */}
      {selectedGenreId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 mb-12 animate-fade-in">
          <h2 className="text-lg font-bold text-white mb-4">
            {genres.find(g => g.id === selectedGenreId)?.name} Shows
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {genreTV.map((show) => (
              <MovieCard key={show.id} item={show} mediaType="tv" />
            ))}
          </div>
        </div>
      )}

      {/* Spotlight Hero Banner for TV */}
      {!isSearching && !selectedGenreId && heroShow && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 mb-12">
          <div className="relative rounded-3xl overflow-hidden aspect-[21/9] min-h-[280px] sm:min-h-[360px] border border-white/10 shadow-2xl group">
            <img
              src={getBackdropUrl(heroShow.backdrop_path, 'original')}
              alt={heroShow.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

            <div className="absolute bottom-0 left-0 p-6 sm:p-10 max-w-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-cyan-600 text-white font-bold text-[10px] uppercase tracking-wider">
                  Featured Series
                </span>
                <span className="text-xs text-slate-300 font-semibold">
                  {heroShow.first_air_date ? heroShow.first_air_date.split('-')[0] : 'TBA'}
                </span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  {heroShow.vote_average ? heroShow.vote_average.toFixed(1) : 'N/A'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white font-display leading-tight">
                <ScrambleText text={heroShow.name} autoStart={isIntroComplete} />
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {heroShow.overview}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => navigate(`/watch/tv/${heroShow.id}/1/1`)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start S1 E1</span>
                </button>
                <button
                  onClick={() => navigate(`/tv/${heroShow.id}`)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 backdrop-blur-md flex items-center gap-1.5 transition-all"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Seasons & Episodes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Continue Watching (TV) */}
      {!isSearching && !selectedGenreId && tvContinueWatching.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 mb-10">
          <h2 className="text-lg font-bold text-white mb-3.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <ScrambleText text="Continue Watching Series" autoStart={false} />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tvContinueWatching.map((item) => (
              <div
                key={`${item.id}-${item.seasonNumber}-${item.episodeNumber}`}
                onClick={() => navigate(`/watch/tv/${item.id}/${item.seasonNumber || 1}/${item.episodeNumber || 1}`)}
                className="group relative rounded-2xl overflow-hidden glass-standard hover:border-cyan-400/50 transition-all cursor-pointer shadow-2xl backdrop-blur-xl border border-white/10 hover:shadow-cyan-500/20"
              >
                <div className="aspect-video relative overflow-hidden bg-surface-200">
                  <img
                    src={getBackdropUrl(item.backdropPath, 'small')}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/50">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                      className="h-full bg-cyan-500"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      S{item.seasonNumber || 1} E{item.episodeNumber || 1}  {Math.round(item.progressPercent)}%
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePlaybackProgress(item.id, 'tv');
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1 text-xs transition-colors"
                    title="Remove from continue watching"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main TV Content Rows */}
      {!isSearching && !selectedGenreId && (
        <div className="space-y-8">
          <MediaRow
            title="Trending TV Series"
            items={trendingTV}
            mediaType="tv"
            isLoading={isLoading}
          />
          <MediaRow
            title="Popular TV Shows"
            items={popularTV}
            mediaType="tv"
            isLoading={isLoading}
          />
          <MediaRow
            title="Top Rated Masterpieces"
            items={topRatedTV}
            mediaType="tv"
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};
export default TvShows;
