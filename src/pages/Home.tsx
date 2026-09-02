import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Compass, Play, X, Clock, Bookmark } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { recommendation } from '../services/recommendation';
import { Movie, TVShow } from '../types/tmdb';
import { ScoredMediaItem } from '../types/recommendation';
import { HeroBanner } from '../components/hero/HeroBanner';
import { MediaRow } from '../components/common/MediaRow';
import { TonightPicker } from '../components/decision/TonightPicker';
import { useUser } from '../context/UserContext';
import { getPosterUrl, getBackdropUrl } from '../utils/helpers';
import { DEFAULT_HOME_SECTIONS } from '../types/user';
import { AdultBadge } from '../components/common/AdultBadge';
import { animeService } from '../services/anime/AnimeService';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, watchlist, watched, continueWatching, removePlaybackProgress, homeLayout } = useUser();

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
  const [adultItems, setAdultItems] = useState<(Movie | TVShow)[]>([]);
  const [animeItems, setAnimeItems] = useState<(Movie | TVShow)[]>([]);
  const [roninPicks, setRoninPicks] = useState<ScoredMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTonightPickerOpen, setIsTonightPickerOpen] = useState<boolean>(false);

  const activeLayout = useMemo(() => {
    return homeLayout && homeLayout.length > 0 ? homeLayout : DEFAULT_HOME_SECTIONS;
  }, [homeLayout]);

  const isSectionEnabled = (id: string): boolean => {
    const section = activeLayout.find(s => s.id === id);
    return section ? section.enabled : true;
  };
  useAppReadyWhen(!isLoading);


  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        // Optimization: Only query endpoints needed for enabled sections
        const needTrending = isSectionEnabled('trending') || isSectionEnabled('hero') || isSectionEnabled('recommended');
        const needPopMovies = isSectionEnabled('popular_movies') || isSectionEnabled('hero') || isSectionEnabled('recommended');
        const needTopMovies = isSectionEnabled('top_rated_movies');
        const needPopTV = isSectionEnabled('popular_tv');
        const needAction = isSectionEnabled('action_movies');
        const needSciFi = isSectionEnabled('scifi_movies');
        const needComedy = isSectionEnabled('comedy_movies');

        const filterAdult = <T extends { adult?: boolean }>(items: T[]): T[] => {
          if (preferences.showAdultRecommendations) return items;
          return items.filter(item => !item.adult);
        };

        const [trending, popMovies, topMovies, popTV, actionRes, sciFiRes, comedyRes, animeList] = await Promise.all([
          needTrending ? tmdb.getTrending('all', 'day') : Promise.resolve([]),
          needPopMovies ? tmdb.getPopularMovies(1) : Promise.resolve({ page: 1, results: [], total_pages: 1, total_results: 0 }),
          needTopMovies ? tmdb.getTopRatedMovies(1) : Promise.resolve({ page: 1, results: [], total_pages: 1, total_results: 0 }),
          needPopTV ? tmdb.getPopularTV(1) : Promise.resolve({ page: 1, results: [], total_pages: 1, total_results: 0 }),
          needAction ? tmdb.discoverMovies({ mediaType: 'movie', genreId: 28, sortBy: 'popularity.desc' }) : Promise.resolve({ page: 1, results: [], total_pages: 1, total_results: 0 }),
          needSciFi ? tmdb.discoverMovies({ mediaType: 'movie', genreId: 878, sortBy: 'popularity.desc' }) : Promise.resolve({ page: 1, results: [], total_pages: 1, total_results: 0 }),
          needComedy ? tmdb.discoverMovies({ mediaType: 'movie', genreId: 35, sortBy: 'popularity.desc' }) : Promise.resolve({ page: 1, results: [], total_pages: 1, total_results: 0 }),
          animeService.getTrending(preferences.showAdultRecommendations).then(list => list.map(a => ({
            id: a.id as any,
            title: a.title,
            name: a.title,
            overview: a.synopsis,
            poster_path: a.poster,
            backdrop_path: a.banner || a.poster,
            vote_average: a.score || 0,
            vote_count: 500,
            popularity: a.popularity || 0,
            adult: a.isAdult,
            media_type: 'tv' as const,
            first_air_date: a.year ? `${a.year}-01-01` : '',
            genre_ids: [],
          }))).catch(() => []),
        ]);

        if (!isMounted) return;

        setTrendingItems(filterAdult(trending));
        setPopularMovies(filterAdult(popMovies.results));
        setTopRatedItems(filterAdult(topMovies.results));
        setPopularTV(filterAdult(popTV.results));
        setActionMovies(filterAdult(actionRes.results));
        setSciFiMovies(filterAdult(sciFiRes.results));
        setComedyMovies(filterAdult(comedyRes.results));
        setAnimeItems(animeList as any);

        if (preferences.showAdultRecommendations) {
          setAdultItems([
            {
              id: 550,
              title: 'Fight Club',
              overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
              poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
              backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
              vote_average: 8.4,
              vote_count: 27000,
              release_date: '1999-10-15',
              genre_ids: [18, 53],
              adult: true,
              popularity: 88.5,
              original_language: 'en',
              original_title: 'Fight Club',
            },
            {
              id: 293660,
              title: 'Deadpool',
              overview: 'Wade Wilson is a former Special Forces operative who now works as a mercenary. His world comes crashing down when an evil scientist tortures and disfigures him.',
              poster_path: '/fSRb7vyIP8rQpL0I47P3qUsRIXq.jpg',
              backdrop_path: '/en971MEXui9vgYrL00uq0eZWz2L.jpg',
              vote_average: 7.6,
              vote_count: 29000,
              release_date: '2016-02-09',
              genre_ids: [28, 12, 35],
              adult: true,
              popularity: 75.2,
              original_language: 'en',
              original_title: 'Deadpool',
            },
            {
              id: 680,
              title: 'Pulp Fiction',
              overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in this sprawling comedic crime caper.',
              poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
              backdrop_path: '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
              vote_average: 8.5,
              vote_count: 26000,
              release_date: '1994-09-10',
              genre_ids: [53, 80],
              adult: true,
              popularity: 92.4,
              original_language: 'en',
              original_title: 'Pulp Fiction',
            },
            {
              id: 105248,
              name: 'Cyberpunk: Edgerunners',
              overview: 'A street kid trying to survive in a technology and body modification-obsessed city of the future.',
              poster_path: '/7jSWLnsZqzftgL7qZ5T1lZc4Vb4.jpg',
              backdrop_path: '/s1x6vt2EuqC4u5G4hWnJ8K5u7a5.jpg',
              vote_average: 8.6,
              vote_count: 1400,
              first_air_date: '2022-09-13',
              genre_ids: [16, 28, 878],
              adult: true,
              popularity: 65.0,
              original_language: 'ja',
              original_name: 'Cyberpunk: Edgerunners',
            } as any,
          ]);
        } else {
          setAdultItems([]);
        }

        const pool: (Movie | TVShow)[] = filterAdult([
          ...trending,
          ...popMovies.results,
          ...topMovies.results,
          ...popTV.results,
        ]);

        const uniqueMap = new Map<string, Movie | TVShow>();
        pool.forEach(item => {
          const type = 'title' in item ? 'movie' : 'tv';
          uniqueMap.set(`${type}-${item.id}`, item);
        });
        const uniquePool = Array.from(uniqueMap.values());

        const ranked = recommendation.rankMedia(uniquePool, preferences, watchlist, watched);
        setRecommendedItems(ranked);
        setRoninPicks(ranked.slice(0, 10));

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
  }, [preferences, watchlist, watched, activeLayout]);

  const handleResume = (item: any) => {
    if (item.mediaType === 'movie') {
      navigate(`/watch/movie/${item.id}`);
    } else if (item.mediaType === 'anime') {
      navigate(`/watch/anime/${item.id}/${item.episodeNumber || 1}`);
    } else {
      navigate(`/watch/tv/${item.id}/${item.seasonNumber || 1}/${item.episodeNumber || 1}`);
    }
  };
  const formatRemainingTime = (duration?: number, currentTime?: number) => {
    if (!duration || !currentTime || duration <= 0) return null;
    const remaining = Math.max(0, duration - currentTime);
    if (remaining < 60) return '< 1m left';
    if (remaining < 3600) return `${Math.ceil(remaining / 60)}m left`;
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.ceil((remaining % 3600) / 60);
    return `${hours}h ${minutes}m left`;
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'continue_watching':
        if (continueWatching.length === 0) return null;
        return (
          <div key="continue_watching" className="px-4 sm:px-8 md:px-12 space-y-3">
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
              {continueWatching.slice(0, 4).map((item) => {
                const remainingFormatted = formatRemainingTime(item.duration, item.currentTime);
                return (
                  <div
                    key={`${item.mediaType}-${item.id}-${item.seasonNumber || 0}-${item.episodeNumber || 0}`}
                    className="group relative rounded-xl overflow-hidden glass-subtle hover:border-brand-500/40 transition-all hover:shadow-xl hover:shadow-indigo-500/10"
                  >
                    <div
                      onClick={() => handleResume(item)}
                      className="aspect-video w-full relative bg-surface-300 cursor-pointer overflow-hidden"
                    >
                      <img
                        src={getBackdropUrl(item.backdropPath, 'medium') || getPosterUrl(item.posterPath, 'medium')}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
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
                          {item.mediaType === 'tv' || item.mediaType === 'anime'
                            ? `S${item.seasonNumber} E${item.episodeNumber}${
                                remainingFormatted ? ` • ${remainingFormatted}` : ` • ${item.progressPercent}%`
                              }`
                            : remainingFormatted
                              ? `${remainingFormatted} (${item.progressPercent}%)`
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
                );
              })}
            </div>
          </div>
        );

      case 'watchlist':
        if (watchlist.length === 0) return null;
        return (
          <div key="watchlist" className="px-4 sm:px-8 md:px-12 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white font-display flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-brand-400" />
                  <span>My Watchlist</span>
                </h2>
                <p className="text-xs text-slate-400">Titles you've saved for later</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {watchlist.slice(0, 4).map((item) => {
                const detailsUrl = item.mediaType === 'movie' ? `/movie/${item.id}` : item.mediaType === 'anime' ? `/anime/${item.id}` : `/tv/${item.id}`;
                return (
                  <div
                    key={`${item.mediaType}-${item.id}`}
                    onClick={() => navigate(detailsUrl)}
                    className="group relative rounded-xl overflow-hidden glass-subtle hover:border-brand-500/40 transition-all hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer flex gap-3 p-3"
                  >
                    <div className="w-20 aspect-[2/3] rounded-lg overflow-hidden bg-surface-300 flex-shrink-0">
                      <img
                        src={getPosterUrl(item.posterPath, 'small')}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-brand-400 mb-1">{item.mediaType}</span>
                      <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'decision_helper':
        return (
          <div key="decision_helper" className="px-4 sm:px-8 md:px-12 py-2">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-brand-900/60 via-surface-200 to-indigo-950/60 border border-brand-500/20 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ronin AI</span>
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
        );

      case 'recommended':
        return (
          <MediaRow
            key="recommended"
            title="Recommended For You"
            subtitle="Tailored to your favorite genres, directors, and history"
            items={recommendedItems}
            isLoading={isLoading}
            badge="Personalized"
            viewAllLink="/discover?tab=for-you"
          />
        );

      case 'trending':
        return (
          <MediaRow
            key="trending"
            title="Trending Today"
            subtitle="Top movies and TV shows buzz-worthy right now"
            items={trendingItems}
            isLoading={isLoading}
            viewAllLink="/discover?tab=trending"
          />
        );

      case 'popular_movies':
        return (
          <MediaRow
            key="popular_movies"
            title="Popular Movies"
            subtitle="Most watched films worldwide"
            items={popularMovies}
            isLoading={isLoading}
            mediaType="movie"
            viewAllLink="/discover?tab=popular&type=movie"
          />
        );

      case 'popular_tv':
        return (
          <MediaRow
            key="popular_tv"
            title="Binge-Worthy TV Shows"
            subtitle="Top rated episodic storytelling"
            items={popularTV}
            isLoading={isLoading}
            mediaType="tv"
            viewAllLink="/discover?tab=popular&type=tv"
          />
        );

      case 'action_movies':
        return actionMovies.length > 0 ? (
          <MediaRow
            key="action_movies"
            title="High-Octane Action"
            subtitle="Adrenaline-fueled adventures and thrillers"
            items={actionMovies}
            isLoading={isLoading}
            mediaType="movie"
            viewAllLink="/discover?genre=28"
          />
        ) : null;

      case 'scifi_movies':
        return sciFiMovies.length > 0 ? (
          <MediaRow
            key="scifi_movies"
            title="Sci-Fi & Futuristic Worlds"
            subtitle="Mind-bending space and dystopian wonders"
            items={sciFiMovies}
            isLoading={isLoading}
            mediaType="movie"
            viewAllLink="/discover?genre=878"
          />
        ) : null;

      case 'comedy_movies':
        return comedyMovies.length > 0 ? (
          <MediaRow
            key="comedy_movies"
            title="Comedy & Laughs"
            subtitle="Lighthearted favorites to lift your spirits"
            items={comedyMovies}
            isLoading={isLoading}
            mediaType="movie"
            viewAllLink="/discover?genre=35"
          />
        ) : null;

      case 'top_rated_movies':
        return (
          <MediaRow
            key="top_rated_movies"
            title="Top Rated Masterpieces"
            subtitle="Highest audience and critical reception of all time"
            items={topRatedItems}
            isLoading={isLoading}
            mediaType="movie"
            viewAllLink="/discover?tab=top-rated"
          />
        );

      case 'anime_spotlight':
        return animeItems.length > 0 ? (
          <MediaRow
            key="anime_spotlight"
            title="Anime Realm Spotlight"
            subtitle="Masterpiece Japanese animation and legendary seasonal epics"
            items={animeItems}
            isLoading={isLoading}
            badge="Anime"
            viewAllLink="/anime"
          />
        ) : null;

      case 'ronin_picks':
        return roninPicks.length > 0 ? (
          <MediaRow
            key="ronin_picks"
            title="Ronin AI Curated Picks"
            subtitle="Hand-picked cinema gems matched to your taste profile"
            items={roninPicks}
            isLoading={isLoading}
            badge="Ronin AI"
            viewAllLink="/decision"
          />
        ) : null;

      case 'adult_content':
        if (!preferences.showAdultRecommendations || adultItems.length === 0) return null;
        return (
          <div key="adult_content" className="space-y-2">
            <div className="px-4 sm:px-8 md:px-12 flex items-center gap-2">
              <AdultBadge size="sm" />
              <span className="text-xs text-rose-400 font-bold tracking-wider uppercase">Mature 18+ Content</span>
            </div>
            <MediaRow
              title="Mature & 18+ Recommendations"
              subtitle="Curated R-rated films, mature anime, and gritty TV sagas"
              items={adultItems}
              isLoading={isLoading}
              badge="18+ Mature"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const isHeroEnabled = isSectionEnabled('hero');

  return (
    <div className="min-h-screen bg-background text-slate-100 pb-20">
      {isHeroEnabled && heroItem && (
        <HeroBanner
          item={heroItem}
          recommendationReason={heroReason}
          poolItems={trendingItems.length > 0 ? trendingItems : [heroItem]}
        />
      )}

      <div className={`space-y-8 sm:space-y-10 relative z-30 ${isHeroEnabled && heroItem ? '-mt-8 sm:-mt-12' : 'pt-8'}`}>
        {activeLayout
          .filter((s) => s.id !== 'hero' && s.enabled)
          .map((s) => renderSection(s.id))}
      </div>

      <TonightPicker
        isOpen={isTonightPickerOpen}
        onClose={() => setIsTonightPickerOpen(false)}
        poolItems={[...trendingItems, ...popularMovies, ...popularTV]}
      />
    </div>
  );
};
