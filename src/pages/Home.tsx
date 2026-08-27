import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Compass, Play, X, Clock, Film, Tv } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { recommendation } from '../services/recommendation';
import { Movie, TVShow } from '../types/tmdb';
import { ScoredMediaItem } from '../types/recommendation';
import { HeroBanner } from '../components/hero/HeroBanner';
import { MediaRow } from '../components/common/MediaRow';
import { TonightPicker } from '../components/decision/TonightPicker';
import { useUser } from '../context/UserContext';
import { getPosterUrl, getBackdropUrl } from '../utils/helpers';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, watchlist, watched, continueWatching, removePlaybackProgress } = useUser();

  const [heroItem, setHeroItem] = useState<Movie | TVShow | null>(null);
  const [heroReason, setHeroReason] = useState<string>('Top recommendation for you');
  const [recommendedItems, setRecommendedItems] = useState<ScoredMediaItem[]>([]);
  const [trendingItems, setTrendingItems] = useState<(Movie | TVShow)[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedItems, setTopRatedItems] = useState<Movie[]>([]);
  const [popularTV, setPopularTV] = useState<TVShow[]>([]);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTonightPickerOpen, setIsTonightPickerOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        const [trending, popMovies, topMovies, popTV, actionRes, sciFiRes, comedyRes] = await Promise.all([
          tmdb.getTrending('all', 'day'),
          tmdb.getPopularMovies(1),
          tmdb.getTopRatedMovies(1),
          tmdb.getPopularTV(1),
          tmdb.discoverMovies({ mediaType: 'movie', genreId: 28, sortBy: 'popularity.desc' }),
          tmdb.discoverMovies({ mediaType: 'movie', genreId: 878, sortBy: 'popularity.desc' }),
          tmdb.discoverMovies({ mediaType: 'movie', genreId: 35, sortBy: 'popularity.desc' }),
        ]);

        if (!isMounted) return;

        setTrendingItems(trending);
        setPopularMovies(popMovies.results);
        setTopRatedItems(topMovies.results);
        setPopularTV(popTV.results);
        setActionMovies(actionRes.results);
        setSciFiMovies(sciFiRes.results);
        setComedyMovies(comedyRes.results);

        const pool: (Movie | TVShow)[] = [
          ...trending,
          ...popMovies.results,
          ...topMovies.results,
          ...popTV.results,
        ];

        const uniqueMap = new Map<string, Movie | TVShow>();
        pool.forEach(item => {
          const type = 'title' in item ? 'movie' : 'tv';
          uniqueMap.set(`${type}-${item.id}`, item);
        });
        const uniquePool = Array.from(uniqueMap.values());

        const ranked = recommendation.rankMedia(uniquePool, preferences, watchlist, watched);
        setRecommendedItems(ranked);

        if (ranked.length > 0) {
          const topPick = uniquePool.find(item => item.id === ranked[0].id) || ranked[0];
          setHeroItem(topPick as Movie | TVShow);
          setHeroReason(ranked[0].recommendation.reason);
        } else if (trending.length > 0) {
          setHeroItem(trending[0]);
        }
      } catch (err) {
        console.error('Failed to load home page media:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [preferences, watchlist, watched]);

  const handleResume = (item: any) => {
    if (item.mediaType === 'movie') {
      navigate(`/watch/movie/${item.id}`);
    } else {
      navigate(`/watch/tv/${item.id}/${item.seasonNumber || 1}/${item.episodeNumber || 1}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 pb-20">
      {heroItem && (
        <HeroBanner
          item={heroItem}
          recommendationReason={heroReason}
          poolItems={trendingItems.length > 0 ? trendingItems : [heroItem]}
        />
      )}

      <div className="space-y-8 sm:space-y-10 -mt-8 sm:-mt-12 relative z-30">
        {/* CONTINUE WATCHING SHELF */}
        {continueWatching.length > 0 && (
          <div className="px-4 sm:px-8 md:px-12 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white font-display flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-400" />
                  <span>Continue Watching</span>
                </h2>
                <p className="text-xs text-slate-400">Pick up right where you left off</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {continueWatching.slice(0, 4).map((item) => (
                <div
                  key={`${item.mediaType}-${item.id}-${item.seasonNumber || 0}-${item.episodeNumber || 0}`}
                  className="group relative rounded-xl overflow-hidden bg-surface-100/60 border border-white/5 hover:border-brand-500/40 transition-all hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  <div
                    onClick={() => handleResume(item)}
                    className="aspect-video w-full relative bg-surface-300 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={getBackdropUrl(item.backdropPath, 'medium') || getPosterUrl(item.posterPath, 'medium')}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                      <div
                        className="h-full bg-brand-500"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-400">
                        {item.mediaType === 'tv'
                          ? `S${item.seasonNumber} E${item.episodeNumber} · ${item.progressPercent}% watched`
                          : `${item.progressPercent}% watched`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePlaybackProgress(item.id, item.mediaType, item.seasonNumber, item.episodeNumber);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Remove from Continue Watching"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECOMMENDED FOR YOU */}
        <MediaRow
          title="Recommended For You"
          subtitle="Tailored to your favorite genres, directors, and history"
          items={recommendedItems}
          isLoading={isLoading}
          badge="Personalized"
          viewAllLink="/discover?tab=for-you"
        />

        {/* DECISION HELPER BANNER */}
        <div className="px-4 sm:px-8 md:px-12 py-2">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-brand-900/60 via-surface-200 to-indigo-950/60 border border-brand-500/20 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Decision Helper</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                Can't decide what to watch tonight?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Answer 3 quick questions about your mood, available time, and format, and let our smart algorithm pick the perfect match with its trailer ready to roll.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsTonightPickerOpen(true)}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-brand-600 hover:from-amber-400 hover:to-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 flex-shrink-0"
            >
              <Compass className="w-4 h-4" />
              <span>Decide For Me</span>
            </button>
          </div>
        </div>

        {/* TRENDING TODAY */}
        <MediaRow
          title="Trending Today"
          subtitle="Top movies and TV shows buzz-worthy right now"
          items={trendingItems}
          isLoading={isLoading}
          viewAllLink="/discover?tab=trending"
        />

        {/* POPULAR MOVIES */}
        <MediaRow
          title="Popular Movies"
          subtitle="Most watched films worldwide"
          items={popularMovies}
          isLoading={isLoading}
          mediaType="movie"
          viewAllLink="/discover?tab=popular&type=movie"
        />

        {/* BINGE-WORTHY TV SHOWS */}
        <MediaRow
          title="Binge-Worthy TV Shows"
          subtitle="Top rated episodic storytelling"
          items={popularTV}
          isLoading={isLoading}
          mediaType="tv"
          viewAllLink="/discover?tab=popular&type=tv"
        />

        {/* ACTION THRILLERS */}
        {actionMovies.length > 0 && (
          <MediaRow
            title="High-Octane Action"
            subtitle="Adrenaline-fueled adventures and thrillers"
            items={actionMovies}
            isLoading={isLoading}
            mediaType="movie"
            viewAllLink="/discover?genre=28"
          />
        )}

        {/* SCI-FI & CYBERPUNK */}
        {sciFiMovies.length > 0 && (
          <MediaRow
            title="Sci-Fi & Futuristic Worlds"
            subtitle="Mind-bending space and dystopian wonders"
            items={sciFiMovies}
            isLoading={isLoading}
            mediaType="movie"
            viewAllLink="/discover?genre=878"
          />
        )}

        {/* COMEDY */}
        {comedyMovies.length > 0 && (
          <MediaRow
            title="Comedy & Laughs"
            subtitle="Lighthearted favorites to lift your spirits"
            items={comedyMovies}
            isLoading={isLoading}
            mediaType="movie"
            viewAllLink="/discover?genre=35"
          />
        )}

        {/* TOP RATED */}
        <MediaRow
          title="Top Rated Masterpieces"
          subtitle="Highest audience and critical reception of all time"
          items={topRatedItems}
          isLoading={isLoading}
          mediaType="movie"
          viewAllLink="/discover?tab=top-rated"
        />
      </div>

      <TonightPicker
        isOpen={isTonightPickerOpen}
        onClose={() => setIsTonightPickerOpen(false)}
        poolItems={[...trendingItems, ...popularMovies, ...popularTV]}
      />
    </div>
  );
};
