import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Star,
  Clock,
  Play,
  Flame,
  Layers,
  Calendar,
  ShieldAlert,
  Zap,
  Radio,
  Swords,
  Heart,
  Rocket,
  Wand2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  animeService,
  AnimeItem,
  LatestAiringEpisode,
  UpcomingAiringEpisode,
} from '../services/anime/AnimeService';
import { useUser } from '../context/UserContext';
import { AdultBadge } from '../components/common/AdultBadge';
import { ScrambleText } from '../animation/components/ScrambleText';
import { useAppLifecycle } from '../context/AppLifecycleContext';
import { MovieCard } from '../components/common/MovieCard';
import { SkeletonHero } from '../components/common/skeleton/SkeletonHero';
import { SkeletonShelf } from '../components/common/skeleton/SkeletonShelf';

export const Anime: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, continueWatching } = useUser();
  const { isIntroComplete } = useAppLifecycle();
  const showAdult = preferences.showAdultRecommendations ?? false;

  const [trendingAnime, setTrendingAnime] = useState<AnimeItem[]>([]);
  const [popularAnime, setPopularAnime] = useState<AnimeItem[]>([]);
  const [airingAnime, setAiringAnime] = useState<AnimeItem[]>([]);
  const [topRatedAnime, setTopRatedAnime] = useState<AnimeItem[]>([]);
  const [seasonalAnime, setSeasonalAnime] = useState<AnimeItem[]>([]);
  const [adultAnime, setAdultAnime] = useState<AnimeItem[]>([]);
  
  // New Genre Sections
  const [actionAnime, setActionAnime] = useState<AnimeItem[]>([]);
  const [romanceAnime, setRomanceAnime] = useState<AnimeItem[]>([]);
  const [fantasyAnime, setFantasyAnime] = useState<AnimeItem[]>([]);
  const [sciFiAnime, setSciFiAnime] = useState<AnimeItem[]>([]);

  const [latestEpisodes, setLatestEpisodes] = useState<LatestAiringEpisode[]>([]);
  const [upcomingEpisodes, setUpcomingEpisodes] = useState<UpcomingAiringEpisode[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AnimeItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Spotlight Hero Anime (fallback to popular or airing if trending is empty)
  const heroAnime = trendingAnime[0] || popularAnime[0] || airingAnime[0] || null;

  // Filter user continue watching for anime
  const animeContinueWatching = useMemo(() => {
    return continueWatching.filter((item) => {
      return (item.mediaType as string) === 'anime' || (item as any).isAnime;
    });
  }, [continueWatching]);
  useAppReadyWhen(!isLoading);


  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const promises: Promise<any>[] = [
      animeService.getTrending(showAdult),
      animeService.getPopular(showAdult),
      animeService.getCurrentlyAiring(showAdult),
      animeService.getTopRated(showAdult),
      animeService.getSeasonal(showAdult),
      animeService.getByGenre('Action', showAdult, 1),
      animeService.getByGenre('Romance', showAdult, 1),
      animeService.getByGenre('Fantasy', showAdult, 1),
      animeService.getByGenre('Sci-Fi', showAdult, 1),
      animeService.getLatestEpisodes(1, 15),
      animeService.getUpcomingEpisodes(1, 15),
    ];

    if (showAdult) {
      promises.push(animeService.getAdultAnime());
    }

    Promise.allSettled(promises)
      .then((results) => {
        if (!isMounted) return;
        const getValue = <T,>(res: PromiseSettledResult<T> | undefined, fallback: T): T =>
          res && res.status === 'fulfilled' && res.value ? res.value : fallback;

        setTrendingAnime(getValue(results[0], []));
        setPopularAnime(getValue(results[1], []));
        setAiringAnime(getValue(results[2], []));
        setTopRatedAnime(getValue(results[3], []));
        setSeasonalAnime(getValue(results[4], []));
        setActionAnime(getValue(results[5], []));
        setRomanceAnime(getValue(results[6], []));
        setFantasyAnime(getValue(results[7], []));
        setSciFiAnime(getValue(results[8], []));
        setLatestEpisodes(getValue(results[9], []));
        setUpcomingEpisodes(getValue(results[10], []));
        if (showAdult && results[11]) {
          setAdultAnime(getValue(results[11], []));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        import('../services/diagnostics').then(({ diagnostics }) => diagnostics.error('network', 'Error loading anime realm', { error: err }));
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showAdult, reloadKey]);

  // Handle Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await animeService.search(searchQuery.trim(), showAdult);
      setSearchResults(results);
    } catch (err) {
      import('../services/diagnostics').then(({ diagnostics }) => diagnostics.error('network', 'Anime search error', { error: err }));
    }
  };

  const genres = ['All', 'Action', 'Adventure', 'Fantasy', 'Sci-Fi', 'Mystery', 'Shonen'];

  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return 'Airing soon';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const renderCard = (anime: AnimeItem) => (
    <div key={anime.id} className="group relative flex-shrink-0 w-36 sm:w-44 md:w-48 cursor-pointer select-none">
      <MovieCard item={anime} mediaType="anime" />
    </div>
  );

  const renderShelf = (
    title: string,
    items: AnimeItem[],
    icon: React.ReactNode,
    subtitle?: string,
    isAdultShelf?: boolean
  ) => {
    if (!items || items.length === 0) return null;

    return (
      <section className="mb-10 max-w-7xl mx-auto px-4 sm:px-8 md:px-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isAdultShelf
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
              }`}
            >
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                  <ScrambleText text={title} autoStart={false} />
                </h2>
                {isAdultShelf && <AdultBadge size="sm" />}
              </div>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
          {items.map((anime) => renderCard(anime))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 pb-24 pt-20 sm:pt-24">
      {/* Top Header & Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2.5 text-brand-400 text-xs font-bold uppercase tracking-widest">
              <Flame className="w-4 h-4" />
              <span>Dojo of Legends • 浪人の道</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display mt-1">
              <ScrambleText text="Anime Realm" autoStart={isIntroComplete} />
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Immerse yourself in Japanese animation masterpieces, seasonal simulcasts, and legendary shonen epics.
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative max-w-md w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anime by English, Romaji, or Japanese title..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-100/70 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        {/* Quick Genre & 18+ Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGenre === genre
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'bg-surface-100/60 hover:bg-surface-200/80 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {genre}
            </button>
          ))}
          {showAdult && (
            <button
              onClick={() => setSelectedGenre('18+')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedGenre === '18+'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>18+</span>
            </button>
          )}
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
              className="text-xs font-semibold text-brand-400 hover:text-brand-300"
            >
              Clear Search
            </button>
          </div>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.map((anime) => renderCard(anime))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-surface-100/40 rounded-2xl border border-white/5">
              No anime matched your search query.
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && !isSearching && (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-8 md:px-12 mb-12">
          <SkeletonHero />
          <SkeletonShelf hasHeader={true} count={6} />
          <SkeletonShelf hasHeader={true} count={6} />
          <SkeletonShelf hasHeader={true} count={6} />
        </div>
      )}

      {/* Empty / Error Recovery State */}
      {!isLoading && !isSearching && !heroAnime && popularAnime.length === 0 && airingAnime.length === 0 && (
        <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-surface-200/60 border border-white/10 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Anime Realm Temporarily Unavailable</h3>
          <p className="text-xs text-slate-400">
            We couldn't reach the anime service. Please check your connection and try again.
          </p>
          <button
            onClick={() => setReloadKey(k => k + 1)}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Spotlight Hero Banner for Anime */}
      {!isLoading && !isSearching && selectedGenre === 'All' && heroAnime && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 mb-12 animate-fade-in">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 glass-elevated shadow-2xl">
            {/* Banner Backdrop */}
            <div className="relative h-80 sm:h-96 w-full overflow-hidden">
              <img
                src={heroAnime.banner || heroAnime.poster}
                alt={heroAnime.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent w-full md:w-3/4" />
            </div>

            {/* Hero Details Overlay */}
            <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40 backdrop-blur-md">
                  Spotlight Series
                </span>
                {heroAnime.isAdult ? (
                  <AdultBadge size="sm" />
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300">
                    {heroAnime.status}
                  </span>
                )}
                {heroAnime.score && (
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {heroAnime.score.toFixed(1)}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight leading-tight">
                <ScrambleText text={heroAnime.title} autoStart={isIntroComplete} />
              </h2>

              {heroAnime.romajiTitle && (
                <p className="text-xs sm:text-sm text-brand-300 font-medium mt-1">
                  {heroAnime.romajiTitle} {heroAnime.nativeTitle && `• ${heroAnime.nativeTitle}`}
                </p>
              )}

              <p className="text-xs text-slate-300 line-clamp-3 mt-2 mb-6">
                {heroAnime.synopsis}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/watch/anime/${heroAnime.id}/1`)}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Watch Episode 1</span>
                </button>
                <button
                  onClick={() => navigate(`/anime/${heroAnime.id}`)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md transition-all"
                >
                  Episodes & Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Shelves */}
      {!isLoading && !isSearching && (
        <div className="space-y-4">
          {selectedGenre === 'All' ? (
            <>
              {/* UPCOMING EPISODES (Schedule/Countdown Section) */}
              {upcomingEpisodes.length > 0 && (
                <section className="mb-10 max-w-7xl mx-auto px-4 sm:px-8 md:px-12">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                          <ScrambleText text="Upcoming Episodes" autoStart={false} />
                        </h2>
                        <p className="text-xs text-slate-400">
                          Scheduled releases and countdowns
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
                    {upcomingEpisodes.map((ep) => (
                      <div
                        key={`${ep.animeId}-${ep.episodeNumber}`}
                        onClick={() => navigate(`/anime/${ep.animeId}`)}
                        className="group relative flex-shrink-0 w-44 sm:w-52 cursor-pointer select-none transition-all duration-300 hover:-translate-y-2"
                      >
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden glass-standard border border-white/10 group-hover:border-amber-500/50 shadow-lg">
                          <img
                            src={ep.banner || ep.poster}
                            alt={ep.animeTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                            loading="lazy"
                          />
                          
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-3 flex flex-col justify-end">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black mb-1 w-fit">
                              EP {ep.episodeNumber}
                            </span>
                            <h3 className="text-sm font-bold text-white line-clamp-1 leading-tight group-hover:text-amber-400 transition-colors">
                              {ep.animeTitle}
                            </h3>
                            <p className="text-xs text-slate-300 font-medium mt-1 tabular-nums">
                              {new Date(ep.airingAt * 1000).toLocaleString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* LATEST EPISODES (Recently Released Airing Section) */}
              {latestEpisodes.length > 0 && (
                <section className="mb-10 max-w-7xl mx-auto px-4 sm:px-8 md:px-12">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                          <ScrambleText text="Latest Episodes" autoStart={false} />
                        </h2>
                        <p className="text-xs text-slate-400">
                          Freshly aired simulcast episodes updated weekly
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
                    {latestEpisodes.map((ep) => (
                      <div
                        key={ep.id}
                        onClick={() => navigate(`/watch/anime/${ep.animeId}/${ep.episodeNumber}`)}
                        className="group relative flex-shrink-0 w-44 sm:w-52 cursor-pointer select-none transition-all duration-300 hover:-translate-y-2"
                      >
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden glass-standard border border-white/10 group-hover:border-rose-500/50 shadow-lg">
                          <img
                            src={ep.banner || ep.poster}
                            alt={ep.animeTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[10px] font-bold">
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            <span>Episode {ep.episodeNumber}</span>
                          </div>

                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-xs font-bold text-white truncate">
                              {ep.animeTitle}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                              <span>{ep.releaseDateText}</span>
                              {ep.nextEpisode && (
                                <span className="text-rose-300 font-semibold">
                                  Next: {formatCountdown(ep.nextEpisode.timeUntilAiring)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 1. Trending Anime */}
              {renderShelf(
                'Trending in the Dojo',
                trendingAnime,
                <Flame className="w-4 h-4" />,
                'The most watched and talked-about series right now'
              )}

              {/* 2. Popular of All Time */}
              {renderShelf(
                'Legendary Masterpieces',
                popularAnime,
                <Sparkles className="w-4 h-4" />,
                'Top-rated anime loved worldwide'
              )}

              {/* 3. Currently Airing Simulcasts */}
              {renderShelf(
                'Simulcast Airing',
                airingAnime,
                <Calendar className="w-4 h-4" />,
                'Fresh episodes releasing weekly'
              )}

              {/* 4. Top Rated */}
              {renderShelf(
                'Critically Acclaimed',
                topRatedAnime,
                <Star className="w-4 h-4" />,
                'Highest audience ratings on the global archives'
              )}

              {/* 5. Seasonal Releases */}
              {renderShelf(
                'Seasonal Highlights',
                seasonalAnime,
                <Layers className="w-4 h-4" />,
                'New anime this season'
              )}

              {/* Action Masterpieces */}
              {renderShelf(
                'Action Masterpieces',
                actionAnime,
                <Swords className="w-4 h-4" />,
                'High-octane battles and epic showdowns'
              )}

              {/* Fantasy Worlds */}
              {renderShelf(
                'Fantasy Worlds',
                fantasyAnime,
                <Wand2 className="w-4 h-4" />,
                'Magic, isekai, and mythical realms'
              )}

              {/* Sci-Fi & Mecha */}
              {renderShelf(
                'Sci-Fi & Mecha',
                sciFiAnime,
                <Rocket className="w-4 h-4" />,
                'Futuristic dystopias and giant robots'
              )}

              {/* Romantic Tales */}
              {renderShelf(
                'Romantic Tales',
                romanceAnime,
                <Heart className="w-4 h-4" />,
                'Heartwarming love stories and drama'
              )}

              {/* 10. Dedicated 18+ Anime Shelf (when enabled) */}
              {showAdult &&
                renderShelf(
                  '18+ Mature & Uncensored Anime',
                  adultAnime,
                  <ShieldAlert className="w-4 h-4" />,
                  'Mature themes, dark seinen, and uncensored Japanese animation',
                  true
                )}
            </>
          ) : selectedGenre === '18+' ? (
            <section className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white font-display">18+ Mature Anime</h2>
                    <AdultBadge size="md" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Explicit mature anime enabled via Settings
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {adultAnime.map((anime) => renderCard(anime))}
              </div>
            </section>
          ) : (
            <section className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12">
              <h2 className="text-xl font-bold text-white mb-6 font-display">
                {selectedGenre} Anime
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {trendingAnime
                  .filter((a) =>
                    a.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
                  )
                  .map((anime) => renderCard(anime))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
