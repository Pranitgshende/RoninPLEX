import React, { useEffect, useCallback } from 'react';
import { X, Play, AlertCircle } from 'lucide-react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerKey: string | null | undefined;
  title: string;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({
  isOpen,
  onClose,
  trailerKey,
  title,
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-modal-title"
    >
      <div 
        className="relative w-full max-w-5xl glass-elevated rounded-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-surface-300/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <h3 id="trailer-modal-title" className="text-base sm:text-lg font-semibold text-white line-clamp-1">
              {title} — Official Trailer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 active:scale-95"
            aria-label="Close trailer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player or Fallback */}
        <div className="relative w-full aspect-video bg-black">
          {trailerKey ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
              title={`${title} Trailer`}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-500" />
              <p className="text-base font-medium text-slate-300">No official trailer available for this title.</p>
              <p className="text-sm text-slate-500 max-w-md">
                Try searching for "{title}" on YouTube or check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
