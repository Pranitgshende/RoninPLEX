import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, CheckCircle2, ThumbsUp, ThumbsDown, Trash2, Play, Film, Tv, ArrowUpDown, Clock } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { RatingBadge } from '../components/common/RatingBadge';
import { TrailerModal } from '../components/common/TrailerModal';
import { getPosterUrl, getBackdropUrl } from '../utils/helpers';
import { formatDate } from '../utils/formatting';
import { useTrailer } from '../hooks/useTrailer';
import { MediaType } from '../types/tmdb';
import { WatchlistItem, WatchedItem, PlaybackProgress } from '../types/user';

export const Watchlist: React.FC = () => {
  const navigate = useNavigate();
  const {
    watchlist,
    watched,
    continueWatching,
    removeFromWatchlist,
    removeFromWatched,
    removePlaybackProgress,
    toggleWatched,
    toggleLike,
    toggleDislike
  } = useUser();

  const [activeTab, setActiveTab] = useState<'watchlist' | 'continue' | 'watched' | 'affinity'>('watchlist');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('date');
  const [selectedTrailer, setSelectedTrailer] = useState<{ id: number; type: MediaType; title: string } | null>(null);

  const { trailerKey } = useTrailer(selectedTrailer?.id, selectedTrailer?.type || 'movie');

  // Filter and sort watchlist
  const filteredWatchlist: WatchlistItem[] = watchlist
    .filter((item: WatchlistItem) => (filterType === 'all' ? true : item.mediaType === filterType))
    .sort((a: WatchlistItem, b: WatchlistItem) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });

  // Filter and sort watched
  const filteredWatched: WatchedItem[] = watched
    .filter((item: WatchedItem) => (filterType === 'all' ? true : item.mediaType === filterType))
    .sort((a: WatchedItem, b: WatchedItem) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime();
    });

  // Affinity items
  const likedItems: WatchedItem[] = watched.filter((w: WatchedItem) => w.userLiked);
  const dislikedItems: WatchedItem[] = watched.filter((w: WatchedItem) => w.userDisliked);

  const handleResume = (item: PlaybackProgress) => {
    if (item.mediaType === 'movie') {
      navigate(`/watch/movie/${item.id}`);
    } else {
      navigate(`/watch/tv/${item.id}/${item.seasonNumber || 1}/${item.episodeNumber || 1}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 pt-24 pb-20 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto space-y-8">
      {/* Title & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight">
            My Cinema Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Keep track of what you want to watch, in-progress streams, and logged viewing history.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-100 rounded-xl border border-white/5 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'watchlist'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>My List ({watchlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('continue')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'continue'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>In Progress ({continueWatching.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('watched')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'watched'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Watched ({watched.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('affinity')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'affinity'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Liked ({likedItems.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      {['watchlist', 'watched'].includes(activeTab) && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-100/50 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'all' ? 'bg-surface-50 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('movie')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filterType === 'movie' ? 'bg-surface-50 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3 text-brand-400" />
              <span>Movies</span>
            </button>
            <button
              onClick={() => setFilterType('tv')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filterType === 'tv' ? 'bg-surface-50 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3 h-3 text-cyan-400" />
              <span>TV Shows</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'date' | 'rating' | 'title')}
              className="px-3 py-1 rounded-lg bg-surface-200 border border-white/10 text-xs text-slate-200 focus:outline-none"
            >
              <option value="date">Date Added</option>
              <option value="rating">Rating (Highest)</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab 1: Watchlist (My List) */}
      {activeTab === 'watchlist' && (
        <div>
          {filteredWatchlist.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWatchlist.map((item: WatchlistItem) => {
                const detailsUrl = item.mediaType === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;
                const watchUrl = item.mediaType === 'movie' ? `/watch/movie/${item.id}` : `/watch/tv/${item.id}/1/1`;
                return (
                  <div
                    key={`${item.id}-${item.mediaType}`}
                    className="flex gap-3.5 p-3 rounded-2xl bg-surface-200/80 border border-white/5 hover:border-white/15 transition-all group"
                  >
                    <Link to={detailsUrl} className="w-24 aspect-[2/3] rounded-xl overflow-hidden bg-surface-300 flex-shrink-0">
                      <img
                        src={getPosterUrl(item.posterPath, 'medium')}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-surface-100 text-slate-300">
                            {item.mediaType}
                          </span>
                          <RatingBadge rating={item.rating} size="sm" />
                        </div>
                        <Link to={detailsUrl}>
                          <h3 className="text-sm font-bold text-white truncate hover:text-brand-300 transition-colors">
                            {item.title}
                          </h3>
                        </Link>
                        <span className="text-xs text-slate-400 block">{item.releaseYear || 'TBA'}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <Link
                          to={watchUrl}
                          className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-md shadow-brand-600/30"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Watch</span>
                        </Link>

                        <button
                          onClick={() => setSelectedTrailer({ id: item.id, type: item.mediaType, title: item.title })}
                          className="p-1.5 rounded-lg bg-surface-100 hover:bg-white/10 text-slate-300 transition-colors"
                          title="Watch Trailer"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => toggleWatched({
                            id: item.id,
                            mediaType: item.mediaType,
                            title: item.title,
                            posterPath: item.posterPath,
                            backdropPath: item.backdropPath,
                            rating: item.rating,
                            releaseYear: item.releaseYear,
                            genres: item.genres,
                            watchedAt: new Date().toISOString(),
                          })}
                          className="p-1.5 rounded-lg bg-surface-100 hover:bg-emerald-600/30 hover:text-emerald-300 text-slate-300 text-xs font-semibold border border-white/5 transition-colors"
                          title="Mark Watched"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => removeFromWatchlist(item.id, item.mediaType)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 ml-auto transition-colors"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4 bg-surface-100/30 rounded-2xl border border-white/5">
              <Bookmark className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">Your List is empty</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Explore recommended movies and TV shows and tap "Add to My List" to save them here.
              </p>
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-brand-600/30"
              >
                <span>Browse Discovery</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: In Progress (Continue Watching) */}
      {activeTab === 'continue' && (
        <div>
          {continueWatching.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {continueWatching.map((item: PlaybackProgress) => (
                <div
                  key={`${item.mediaType}-${item.id}-${item.seasonNumber || 0}-${item.episodeNumber || 0}`}
                  className="rounded-2xl overflow-hidden bg-surface-200/80 border border-white/5 hover:border-brand-500/40 transition-all group"
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
                      <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/70">
                      <div
                        className="h-full bg-brand-500"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.mediaType === 'tv'
                          ? `Season ${item.seasonNumber} · Episode ${item.episodeNumber} (${item.progressPercent}% finished)`
                          : `${item.progressPercent}% finished`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removePlaybackProgress(item.id, item.mediaType, item.seasonNumber, item.episodeNumber)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove from In Progress"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4 bg-surface-100/30 rounded-2xl border border-white/5">
              <Clock className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No In-Progress Titles</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When you start streaming any movie or series, RoninPLEX will remember your exact position so you can resume anytime.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Watched History */}
      {activeTab === 'watched' && (
        <div>
          {filteredWatched.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWatched.map((item: WatchedItem) => {
                const detailsUrl = item.mediaType === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;
                return (
                  <div
                    key={`${item.id}-${item.mediaType}`}
                    className="flex gap-3.5 p-3 rounded-2xl bg-surface-200/80 border border-white/5 hover:border-white/15 transition-all group"
                  >
                    <Link to={detailsUrl} className="w-24 aspect-[2/3] rounded-xl overflow-hidden bg-surface-300 flex-shrink-0">
                      <img
                        src={getPosterUrl(item.posterPath, 'medium')}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Logged {formatDate(item.watchedAt)}</span>
                          </span>
                          <RatingBadge rating={item.rating} size="sm" />
                        </div>
                        <Link to={detailsUrl}>
                          <h3 className="text-sm font-bold text-white truncate hover:text-brand-300 transition-colors">
                            {item.title}
                          </h3>
                        </Link>
                        <span className="text-xs text-slate-400 block">{item.releaseYear || 'TBA'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleLike(item.id, item.mediaType)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.userLiked ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Thumbs Up"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleDislike(item.id, item.mediaType)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.userDisliked ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Thumbs Down"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromWatched(item.id, item.mediaType)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4 bg-surface-100/30 rounded-2xl border border-white/5">
              <CheckCircle2 className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Watched Titles Logged Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Mark movies or series as watched to record your viewing history and calibrate future recommendations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Affinity (Likes and Dislikes) */}
      {activeTab === 'affinity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-display">
                Movies & Shows You Liked ({likedItems.length})
              </h3>
            </div>
            {likedItems.length > 0 ? (
              <div className="space-y-2">
                {likedItems.map((item: WatchedItem) => (
                  <div key={`${item.id}-${item.mediaType}`} className="flex items-center justify-between p-3 rounded-xl bg-surface-200/80 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getPosterUrl(item.posterPath, 'small')}
                        alt={item.title}
                        className="w-8 h-12 rounded object-cover bg-surface-300"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                        <span className="text-[10px] text-slate-400">{item.releaseYear} • {item.mediaType.toUpperCase()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleLike(item.id, item.mediaType)}
                      className="text-xs text-rose-400 hover:underline ml-2 flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No liked titles recorded yet.</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400">
                <ThumbsDown className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-display">
                Disliked Titles ({dislikedItems.length})
              </h3>
            </div>
            {dislikedItems.length > 0 ? (
              <div className="space-y-2">
                {dislikedItems.map((item: WatchedItem) => (
                  <div key={`${item.id}-${item.mediaType}`} className="flex items-center justify-between p-3 rounded-xl bg-surface-200/80 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getPosterUrl(item.posterPath, 'small')}
                        alt={item.title}
                        className="w-8 h-12 rounded object-cover bg-surface-300"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                        <span className="text-[10px] text-slate-400">{item.releaseYear} • {item.mediaType.toUpperCase()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleDislike(item.id, item.mediaType)}
                      className="text-xs text-slate-400 hover:text-white hover:underline ml-2 flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No disliked titles.</p>
            )}
          </div>
        </div>
      )}

      {/* Trailer Modal */}
      {selectedTrailer && (
        <TrailerModal
          isOpen={Boolean(selectedTrailer)}
          onClose={() => setSelectedTrailer(null)}
          trailerKey={trailerKey}
          title={selectedTrailer.title}
        />
      )}
    </div>
  );
};
