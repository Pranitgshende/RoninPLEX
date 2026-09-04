import React from 'react';
import { Link } from 'react-router-dom';
import { Key, Cpu, Sparkles, ShieldCheck } from 'lucide-react';
import { useApiKey } from '../../context/ApiKeyContext';
import { RoninLogo } from './RoninLogo';

export const Footer: React.FC = () => {
  const { openModal } = useApiKey();

  return (
    <footer className="w-full bg-surface-300/40 border-t border-white/[0.06] mt-20 text-slate-400 text-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2.5">
          <div className="flex items-center gap-3">
            <RoninLogo size={28} showText={true} />
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
              v2.1.1
            </span>
          </div>
          <p className="text-xs text-slate-400/90 max-w-sm text-center md:text-left leading-relaxed">
            High-performance local cinema client and discovery engine. Direct provider streaming, native downloads, and privacy-first local playback.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
            <span className="inline-flex items-center gap-1 text-emerald-400/90">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Local Execution
            </span>
            <span>•</span>
            <span>Zero Telemetry Tracking</span>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right">
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-all text-xs font-medium focus-ring"
            >
              <Cpu className="w-3.5 h-3.5 text-brand-400" />
              <span>Architecture & About</span>
            </Link>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-all text-xs font-medium focus-ring"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>TMDB Configuration</span>
            </button>
            <Link
              to="/decision"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-all text-xs font-medium focus-ring"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Ronin AI</span>
            </Link>
          </div>
          <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
            This product uses the TMDB API but is not endorsed or certified by TMDB. Content availability and stream resolution are handled dynamically via configured streaming providers.
          </p>
        </div>
      </div>
    </footer>
  );
};
