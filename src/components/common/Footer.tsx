import React from 'react';
import { Film, Key } from 'lucide-react';
import { useApiKey } from '../../context/ApiKeyContext';

export const Footer: React.FC = () => {
  const { openModal } = useApiKey();

  return (
    <footer className="w-full bg-surface-300/80 border-t border-white/5 mt-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Film className="w-4 h-4" />
            </div>
            <span className="text-base font-black font-display text-white tracking-tight">
              RONIN<span className="text-brand-500">PLEX</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-sm text-center md:text-left">
            Your personal local cinema guide. Helping you decide what to watch tonight with tailored recommendations.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
          <div className="flex items-center gap-2">
            <button
              onClick={openModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-100 hover:glass-subtle text-slate-300 transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-brand-400" />
              <span>TMDB API Settings</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 max-w-md">
            This product uses the TMDB API but is not endorsed or certified by TMDB. YouTube video embeds are handled through the standard YouTube Player.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Runs 100% locally on your machine</span>
            <span>•</span>
            <span>No tracking or external servers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
