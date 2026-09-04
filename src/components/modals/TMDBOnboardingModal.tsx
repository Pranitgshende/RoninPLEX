import { useMotionPresence } from '../../animation/hooks/useMotionPresence';
import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, Loader2, Database, ShieldCheck, X } from 'lucide-react';
import { useApiKey } from '../../context/ApiKeyContext';
import { useAppLifecycle } from '../../context/AppLifecycleContext';
import { PremiumGlowBorder } from '../common/PremiumGlowBorder';

const SESSION_ONBOARDING_KEY = 'roninplex_tmdb_onboarding_session_seen';

export const TMDBOnboardingModal: React.FC = () => {
  const { hasUserKey, updateApiKey, checkConnectionState } = useApiKey();
  const { setIsOnboardingBlocking } = useAppLifecycle();
  const [isOpen, setIsOpen] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Clear legacy localStorage key to ensure fresh session checks
    try {
      localStorage.removeItem('roninplex_tmdb_onboarding_seen');
    } catch {}

    const hasSeenThisSession = sessionStorage.getItem(SESSION_ONBOARDING_KEY);
    if (!hasSeenThisSession && !hasUserKey) {
      setIsOpen(true);
      setIsOnboardingBlocking(true);
    } else {
      setIsOnboardingBlocking(false);
    }
  }, [hasUserKey, setIsOnboardingBlocking]);

  // Lock background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const { ref, shouldRender } = useMotionPresence(isOpen, 'slideUp');
  if (!shouldRender) return null;

  const markSeenAndClose = () => {
    sessionStorage.setItem(SESSION_ONBOARDING_KEY, 'true');
    setIsOnboardingBlocking(false);
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    const success = await updateApiKey(inputKey);
    setIsSubmitting(false);

    if (success) {
      await checkConnectionState();
      markSeenAndClose();
    } else {
      setErrorMsg('Invalid API Key. Please verify your TMDB key.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tmdb-onboarding-title"
    >
      <div ref={ref} className="w-full max-w-lg animate-scale-in">
        <PremiumGlowBorder borderRadius="rounded-2xl" intensity="subtle" innerClassName="bg-surface-200/95 backdrop-blur-2xl">
          <div className="relative overflow-hidden flex flex-col">
            <div className="px-6 py-6 bg-gradient-to-r from-brand-900/40 via-surface-300/40 to-surface-300/40 border-b border-white/5 relative">
              <button
                onClick={markSeenAndClose}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-lg shadow-brand-500/20">
              <Database className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h2 id="tmdb-onboarding-title" className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
                Connect RoninPLEX to TMDB
              </h2>
            </div>
          </div>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            RoninPLEX uses TMDB for movie and TV metadata, artwork, and discovery.
          </p>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            You can connect your own TMDB API key for your personal API access. Your key stays on this device and is never shown in diagnostics or the app interface.
          </p>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            You can also continue using RoninPLEX with default application configuration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="onboarding-tmdb-key" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              TMDB API Key
            </label>
            <div className="relative">
              <input
                id="onboarding-tmdb-key"
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="e.g. 3a7b9c1d2e8f..."
                className="w-full px-4 py-2.5 rounded-xl glass-subtle text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
            {errorMsg && (
              <p className="text-rose-400 text-xs mt-1 font-medium">{errorMsg}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <a 
              href="https://www.themoviedb.org/settings/api" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-1 w-fit"
            >
              Get a TMDB API Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={markSeenAndClose}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Later
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !inputKey.trim()}
              className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Validate & Connect</span>
                </>
              )}
              </button>
            </div>
          </form>
        </div>
      </PremiumGlowBorder>
    </div>
  </div>
);
};
