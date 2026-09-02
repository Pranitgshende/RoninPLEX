import React, { useState } from 'react';
import { Sparkles, Film, Tv, Clock, Compass, X, Play, BookmarkCheck, Bookmark, RefreshCw } from 'lucide-react';
import { MOODS, recommendation } from '../../services/recommendation';
import { MoodType, ScoredMediaItem } from '../../types/recommendation';
import { Movie, TVShow } from '../../types/tmdb';
import { getBackdropUrl } from '../../utils/helpers';
import { RatingBadge } from '../common/RatingBadge';
import { TrailerModal } from '../common/TrailerModal';
import { useUser } from '../../context/UserContext';

interface TonightPickerProps {
  isOpen: boolean;
  onClose: () => void;
  poolItems: (Movie | TVShow)[];
}

export const TonightPicker: React.FC<TonightPickerProps> = ({
  isOpen,
  onClose,
  poolItems,
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodType>('mind-bending');
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv'>('all');
  const [maxMinutes, setMaxMinutes] = useState<number | undefined>(undefined);
  const [result, setResult] = useState<ScoredMediaItem | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState<boolean>(false);

  const { isInWatchlist, toggleWatchlist } = useUser();

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsSpinning(true);
    setTimeout(() => {
      const pick = recommendation.pickTonight(poolItems, selectedMood, maxMinutes, mediaType);
      setResult(pick);
      setIsSpinning(false);
    }, 450);
  };

  const handleToggleWatchlist = () => {
    if (!result) return;
    toggleWatchlist({
      id: result.id,
      mediaType: result.mediaType,
      title: result.title,
      posterPath: result.posterPath,
      backdropPath: result.backdropPath,
      rating: result.rating,
      releaseYear: result.releaseYear,
      genres: result.genres || [],
      addedAt: new Date().toISOString(),
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tonight-picker-title"
      >
        <div
          className="relative w-full max-w-2xl glass-elevated rounded-2xl overflow-hidden flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-surface-300/80">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/30 to-brand-500/30 text-amber-300 border border-amber-500/30 shadow-lg">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 id="tonight-picker-title" className="text-lg font-bold text-white font-display">
                  What Should I Watch Tonight?
                </h3>
                <p className="text-xs text-slate-400">Tell us your mood and let RoninPLEX decide your evening</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {!result ? (
              <div className="space-y-6">
                {/* 1. Mood selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    1. What vibe are you feeling?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {MOODS.map((mood) => {
                      const isSelected = selectedMood === mood.id;
                      return (
                        <button
                          key={mood.id}
                          type="button"
                          onClick={() => setSelectedMood(mood.id)}
                          className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-brand-600/20 border-brand-500 shadow-md shadow-brand-500/10 scale-[1.02]'
                              : 'bg-surface-100/70 border-white/5 hover:border-white/15 hover:bg-surface-100'
                          }`}
                        >
                          <span className="text-2xl mb-1">{mood.emoji}</span>
                          <span className={`text-xs font-bold ${isSelected ? 'text-brand-300' : 'text-slate-200'}`}>
                            {mood.label}
                          </span>
                          <span className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                            {mood.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Media Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    2. Movie or TV Series?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaType('all')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        mediaType === 'all'
                          ? 'bg-brand-600 text-white border-brand-500'
                          : 'bg-surface-100 text-slate-300 border-white/5'
                      }`}
                    >
                      Surprise Me
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('movie')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                        mediaType === 'movie'
                          ? 'bg-brand-600 text-white border-brand-500'
                          : 'bg-surface-100 text-slate-300 border-white/5'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Movie</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('tv')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                        mediaType === 'tv'
                          ? 'bg-brand-600 text-white border-brand-500'
                          : 'bg-surface-100 text-slate-300 border-white/5'
                      }`}
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>TV Show</span>
                    </button>
                  </div>
                </div>

                {/* 3. Runtime constraint */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    3. Time Available
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMaxMinutes(undefined)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                        maxMinutes === undefined
                          ? 'bg-brand-600/30 text-brand-300 border-brand-500/50'
                          : 'bg-surface-100 text-slate-400 border-white/5'
                      }`}
                    >
                      Any Duration
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaxMinutes(105)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                        maxMinutes === 105
                          ? 'bg-brand-600/30 text-brand-300 border-brand-500/50'
                          : 'bg-surface-100 text-slate-400 border-white/5'
                      }`}
                    >
                      Under 1h 45m
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaxMinutes(140)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                        maxMinutes === 140
                          ? 'bg-brand-600/30 text-brand-300 border-brand-500/50'
                          : 'bg-surface-100 text-slate-400 border-white/5'
                      }`}
                    >
                      Under 2h 20m
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isSpinning}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-brand-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-600/25 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                >
                  <Sparkles className="w-5 h-5 text-amber-200" />
                  <span>{isSpinning ? 'Consulting the Oracle...' : 'Decide What to Watch Tonight'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-scale-in">
                <div className="relative rounded-2xl overflow-hidden glass-subtle aspect-video group">
                  <img
                    src={getBackdropUrl(result.backdropPath, 'large')}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-300 via-surface-300/60 to-transparent" />
                  
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/30 text-amber-200 border border-amber-500/40 backdrop-blur-md flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Tonight's Perfect Match ({result.recommendation.score}% match)
                    </span>
                    <RatingBadge rating={result.rating} size="md" />
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="uppercase font-bold tracking-wider text-brand-300">
                        {result.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                      </span>
                      <span>•</span>
                      <span>{result.releaseYear}</span>
                      {result.genres && result.genres.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300">{result.genres.slice(0, 2).join(', ')}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white font-display leading-tight">
                      {result.title}
                    </h3>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs text-brand-200">
                  <span className="font-semibold text-brand-100">Why this pick: </span>
                  {result.recommendation.reason}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                  {result.overview}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTrailerModalOpen(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch Trailer</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleWatchlist}
                    className={`py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors border flex items-center gap-1.5 ${
                      isInWatchlist(result.id, result.mediaType)
                        ? 'bg-brand-500/20 text-brand-300 border-brand-500/50'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                    }`}
                  >
                    {isInWatchlist(result.id, result.mediaType) ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-brand-400 fill-current" />
                        <span>Saved to Watchlist</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        <span>Add to Watchlist</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 border border-white/10 transition-colors"
                    title="Try another pick"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {result && (
        <TrailerModal
          isOpen={isTrailerModalOpen}
          onClose={() => setIsTrailerModalOpen(false)}
          trailerKey={result.trailerKey}
          title={result.title}
        />
      )}
    </>
  );
};
