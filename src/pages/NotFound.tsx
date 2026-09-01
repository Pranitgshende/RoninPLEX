import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  useAppReadyWhen(true);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-20">
      <div className="text-center space-y-5 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center mx-auto shadow-2xl">
          <Film className="w-8 h-8" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black font-display text-white">404</h1>
        <h2 className="text-lg sm:text-xl font-bold text-slate-200">Lost in the Reel</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          The page you are looking for has been cut from the final edit or doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-brand-600/30"
        >
          <Home className="w-4 h-4" />
          <span>Back to Cinema Home</span>
        </Link>
      </div>
    </div>
  );
};
