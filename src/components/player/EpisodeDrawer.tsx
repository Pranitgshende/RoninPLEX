import React, { useEffect, useRef } from 'react';
import { X, Play, Clock, ChevronDown } from 'lucide-react';
import { Episode, Season, TVShow } from '../../types/tmdb';
import { getStillUrl } from '../../utils/helpers';
import { useUser } from '../../context/UserContext';

interface EpisodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tvShow: TVShow | null;
  currentSeasonNumber: number;
  currentEpisodeNumber: number;
  selectedSeasonNumber: number;
  onSelectSeason: (seasonNum: number) => void;
  episodes: Episode[];
  isLoading: boolean;
  onSelectEpisode: (seasonNum: number, episodeNum: number) => void;
}

export const EpisodeDrawer: React.FC<EpisodeDrawerProps> = ({
  isOpen,
  onClose,
  tvShow,
  currentSeasonNumber,
  currentEpisodeNumber,
  selectedSeasonNumber,
  onSelectSeason,
  episodes,
  isLoading,
  onSelectEpisode,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const { continueWatching } = useUser();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter out season 0 (specials) unless it's the only one
  const availableSeasons = (tvShow?.seasons || []).filter(
    s => s.season_number > 0 || tvShow?.seasons?.length === 1
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md sm:max-w-lg h-full bg-surface-200/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col animate-slide-left text-white overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-4 bg-surface-300/60">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold font-display truncate">
              {tvShow?.name || 'Episodes'}
            </h2>
            
            {/* Season Selector */}
            <div className="relative inline-block mt-1.5">
              <select
                value={selectedSeasonNumber}
                onChange={(e) => onSelectSeason(Number(e.target.value))}
                className="appearance-none bg-white/10 hover:bg-white/15 text-xs sm:text-sm font-semibold text-brand-300 px-3 py-1.5 pr-8 rounded-lg border border-white/10 focus:outline-none focus:border-brand-400 cursor-pointer transition-colors"
              >
                {availableSeasons.map((s) => (
                  <option key={s.id || s.season_number} value={s.season_number} className="bg-surface-200 text-white">
                    {s.name || `Season ${s.season_number}`} ({s.episode_count} Episodes)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-brand-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Close Episodes (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Episode List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs gap-3">
              <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
              <span>Loading episodes...</span>
            </div>
          ) : episodes.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              No episodes available for this season.
            </div>
          ) : (
            episodes.map((ep) => {
              const isCurrent = 
                selectedSeasonNumber === currentSeasonNumber && 
                ep.episode_number === currentEpisodeNumber;

              // Check watch progress
              const progressItem = continueWatching?.find(
                (c) => c.id === tvShow?.id && c.seasonNumber === selectedSeasonNumber && c.episodeNumber === ep.episode_number
              );
              const progressPct = progressItem && progressItem.duration > 0
                ? Math.min(100, (progressItem.currentTime / progressItem.duration) * 100)
                : 0;

              return (
                <div
                  key={ep.id || ep.episode_number}
                  onClick={() => {
                    onSelectEpisode(selectedSeasonNumber, ep.episode_number);
                    onClose();
                  }}
                  className={`group relative rounded-xl p-3 border transition-all cursor-pointer flex gap-3.5 items-start ${
                    isCurrent
                      ? 'bg-brand-500/15 border-brand-500/50 shadow-lg shadow-brand-500/10'
                      : 'bg-surface-100/50 hover:bg-surface-100/90 border-white/5 hover:border-white/20'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-28 sm:w-36 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-surface-300 border border-white/5">
                    {ep.still_path ? (
                      <img
                        src={getStillUrl(ep.still_path, 'medium')}
                        alt={ep.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                        S{selectedSeasonNumber}E{ep.episode_number}
                      </div>
                    )}

                    {/* Progress Bar */}
                    {progressPct > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-brand-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    )}

                    {/* Play Overlay */}
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <div className="p-2 rounded-full bg-brand-600 text-white shadow-lg">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {ep.episode_number}.
                      </span>
                      <h3 className={`text-xs sm:text-sm font-bold truncate ${
                        isCurrent ? 'text-brand-300' : 'text-white group-hover:text-brand-200'
                      }`}>
                        {ep.name || `Episode ${ep.episode_number}`}
                      </h3>
                    </div>

                    {ep.runtime ? (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{ep.runtime}m</span>
                        {isCurrent && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-brand-500/20 text-brand-300 font-bold">
                            Playing
                          </span>
                        )}
                      </div>
                    ) : isCurrent ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-brand-500/20 text-brand-300 font-bold">
                        Playing
                      </span>
                    ) : null}

                    {ep.overview && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed pt-0.5">
                        {ep.overview}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
