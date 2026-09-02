import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Bookmark,
  BookmarkCheck,
  Star,
  Calendar,
  Layers,
  ChevronLeft,
  Clock,
  Search,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { animeService, AnimeItem, AnimeEpisode } from '../services/anime/AnimeService';
import { useUser } from '../context/UserContext';
import { AdultBadge } from '../components/common/AdultBadge';

const CHUNK_SIZE = 100;

export const AnimeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useUser();

  const [anime, setAnime] = useState<AnimeItem | null>(null);
  const [episodes, setEpisodes] = useState<AnimeEpisode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Pagination & Search for 1100+ episodes
  const [selectedChunk, setSelectedChunk] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [jumpInput, setJumpInput] = useState<string>('');

  const inWatchlist = anime ? isInWatchlist(anime.id as any, 'anime') : false;
  useAppReadyWhen(!isLoading);


  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      animeService.getDetails(id),
      animeService.getEpisodes(id),
    ])
      .then(([details, epList]) => {
        if (!isMounted) return;
        setAnime(details);
        setEpisodes(epList || details?.episodes || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load anime details:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const totalEpisodesCount = useMemo(() => {
    return anime?.episodeCount || episodes.length || 12;
  }, [anime, episodes]);

  // Total Chunks (e.g. 1175 episodes -> 12 chunks of 100)
  const totalChunks = Math.ceil(totalEpisodesCount / CHUNK_SIZE);

  // Filtered & Paginated Episodes
  const visibleEpisodes = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return episodes.filter(
        (e) => String(e.number).includes(q) || e.title.toLowerCase().includes(q)
      );
    }

    const start = selectedChunk * CHUNK_SIZE;
    const end = start + CHUNK_SIZE;
    return episodes.slice(start, end);
  }, [episodes, selectedChunk, searchQuery]);

  const handleJumpToEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    const epNum = parseInt(jumpInput.trim(), 10);
    if (!isNaN(epNum) && epNum >= 1 && epNum <= totalEpisodesCount) {
      // Set chunk to contain that episode
      const targetChunk = Math.floor((epNum - 1) / CHUNK_SIZE);
      setSelectedChunk(targetChunk);
      navigate(`/watch/anime/${anime?.id}/${epNum}`);
    }
  };

  const handleWatchlist = () => {
    if (!anime) return;
    toggleWatchlist({
      id: anime.id as any,
      mediaType: 'anime',
      title: anime.title,
      posterPath: anime.poster,
      backdropPath: anime.banner || anime.poster,
      rating: anime.score || 0,
      releaseYear: anime.year ? String(anime.year) : '',
      genres: anime.genres || [],
      addedAt: new Date().toISOString(),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold font-display text-white mb-2">Anime Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">Could not load details for this title.</p>
        <button
          onClick={() => navigate('/anime')}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
        >
          Return to Anime Realm
        </button>
      </div>
    );
  }

  const latestEpisodeNum = anime.latestEpisode || totalEpisodesCount;

  return (
    <div className="min-h-screen bg-background text-slate-100 pb-24">
      {/* Top Banner Backdrop */}
      <div className="relative h-[380px] sm:h-[480px] w-full overflow-hidden">
        <img
          src={anime.banner || anime.poster}
          alt={anime.title}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => navigate('/anime')}
          className="absolute top-20 left-4 sm:left-8 z-20 px-3.5 py-2 rounded-xl bg-surface-100/80 hover:bg-surface-200/90 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md border border-white/10 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Anime</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 -mt-44 sm:-mt-56 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Card */}
          <div className="w-48 sm:w-60 md:w-64 flex-shrink-0 rounded-2xl overflow-hidden glass-standard border border-white/10 shadow-2xl">
            <img
              src={anime.poster}
              alt={anime.title}
              className="w-full aspect-[2/3] object-cover"
            />
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-4">
            {/* Badges & Rating */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-600/30 border border-brand-500/40 text-brand-300">
                {anime.format || 'Anime Series'}
              </span>
              {anime.isAdult ? (
                <AdultBadge size="md" />
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-300">
                  {anime.status}
                </span>
              )}
              {anime.score && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {anime.score.toFixed(1)} / 10
                </span>
              )}
              {anime.studios && anime.studios.length > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold glass-subtle text-slate-300">
                  {anime.studios.join(', ')}
                </span>
              )}
            </div>

            {/* Title & Japanese / Romaji Names */}
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display leading-tight">
                {anime.title}
              </h1>
              {anime.romajiTitle && (
                <p className="text-sm text-brand-300 font-medium mt-1">
                  {anime.romajiTitle} {anime.nativeTitle && `• ${anime.nativeTitle}`}
                </p>
              )}
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              {anime.year && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{anime.year}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-white font-bold">{totalEpisodesCount} Episodes Available</span>
              </div>
              {anime.episodeDuration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{anime.episodeDuration} min / ep</span>
                </div>
              )}
            </div>

            {/* Next Airing Countdown Banner if Airing */}
            {anime.nextAiringEpisode && (
              <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-between gap-4 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-brand-400" />
                  <div>
                    <p className="text-xs font-bold text-white">
                      Next Episode {anime.nextAiringEpisode.episode} Airing Soon
                    </p>
                    <p className="text-[11px] text-brand-300">
                      Scheduled in {Math.floor(anime.nextAiringEpisode.timeUntilAiring / 86400)}d {Math.floor((anime.nextAiringEpisode.timeUntilAiring % 86400) / 3600)}h
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-600 text-white uppercase tracking-wider">
                  Simulcast
                </span>
              </div>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {anime.genres?.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-surface-100/70 border border-white/10 text-slate-300"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 max-w-3xl">
              {anime.synopsis}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => navigate(`/watch/anime/${anime.id}/1`)}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Episode 1</span>
              </button>

              {totalEpisodesCount > 1 && (
                <button
                  onClick={() => navigate(`/watch/anime/${anime.id}/${latestEpisodeNum}`)}
                  className="px-5 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-brand-300 text-xs font-bold border border-brand-500/30 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  <span>Latest (Ep {latestEpisodeNum})</span>
                </button>
              )}

              <button
                onClick={handleWatchlist}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                  inWatchlist
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                    : 'bg-surface-100/80 hover:bg-surface-200 text-slate-200 border-white/10'
                }`}
              >
                {inWatchlist ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-brand-400" />
                    <span>In Watchlist</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Add to Watchlist</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Episode Selector Section with Chunked Pagination for 1100+ Episodes */}
        <div className="mt-14 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white font-display">Episodes</h2>
              <p className="text-xs text-slate-400">
                Displaying {episodes.length} episodes across the series
              </p>
            </div>

            {/* Jump to Episode & Search Bar */}
            <div className="flex items-center gap-3">
              <form onSubmit={handleJumpToEpisode} className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={totalEpisodesCount}
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  placeholder="Jump to ep #..."
                  className="w-28 px-3 py-1.5 rounded-xl glass-subtle text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <span>Go</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter episodes..."
                  className="pl-8 pr-3 py-1.5 rounded-xl glass-subtle text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Episode Range Tabs (1-100, 101-200, ..., 1101+) */}
          {!searchQuery && totalChunks > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
              {Array.from({ length: totalChunks }, (_, i) => {
                const s = i * CHUNK_SIZE + 1;
                const e = Math.min((i + 1) * CHUNK_SIZE, totalEpisodesCount);
                const isActive = selectedChunk === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedChunk(i)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                        : 'bg-surface-100 hover:bg-surface-200 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    Episodes {s}–{e}
                  </button>
                );
              })}
            </div>
          )}

          {/* Paginated Episode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleEpisodes.map((ep) => (
              <div
                key={ep.id}
                onClick={() => navigate(`/watch/anime/${anime.id}/${ep.number}`)}
                className="p-3.5 rounded-2xl bg-surface-100/60 hover:bg-surface-200/90 border border-white/10 hover:border-brand-500/40 cursor-pointer transition-all duration-200 group flex gap-3.5 items-center glass-standard"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-300 flex-shrink-0 flex items-center justify-center text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-md">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                    Episode {ep.number}
                  </span>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate mt-0.5">
                    {ep.title}
                  </p>
                  {ep.availableLanguages && (
                    <span className="text-[9px] text-slate-400">
                      {ep.availableLanguages.join(' / ').toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
