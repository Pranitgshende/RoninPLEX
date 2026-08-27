import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react';
import { useApiKey } from '../../context/ApiKeyContext';

export const ApiKeyModal: React.FC = () => {
  const { isModalOpen, closeModal, apiKey, updateApiKey, removeApiKey, isValidating } = useApiKey();
  const [inputKey, setInputKey] = useState(apiKey);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setInputKey(apiKey);
    setStatusMessage(null);
  }, [apiKey, isModalOpen]);

  if (!isModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const success = await updateApiKey(inputKey);
    setIsSubmitting(false);

    if (success) {
      setStatusMessage({
        type: 'success',
        text: inputKey.trim()
          ? 'TMDB API Key verified and active!'
          : 'Custom API Key removed. Using default offline mode.',
      });
      setTimeout(() => {
        closeModal();
      }, 1500);
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Invalid API Key. Please verify your TMDB key from your TMDB account settings.',
      });
    }
  };

  const handleClear = () => {
    removeApiKey();
    setInputKey('');
    setStatusMessage({
      type: 'success',
      text: 'API Key cleared. RoninPLEX will use its bundled dataset.',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-surface-200 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-surface-300/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 id="api-modal-title" className="text-lg font-bold text-white font-display">
                TMDB API Configuration
              </h3>
              <p className="text-xs text-slate-400">Connect to live movie & TV database</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-3.5 rounded-xl bg-surface-100/90 border border-white/5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Local & Private:</span> Your key is stored exclusively in your browser's local storage and used directly from your laptop to TMDB.
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="tmdb-key" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              TMDB API Key (v3 auth)
            </label>
            <div className="relative">
              <input
                id="tmdb-key"
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="e.g. 3a7b9c1d2e8f..."
                className="w-full px-4 py-2.5 rounded-xl bg-surface-300 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              {isValidating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="space-y-2 text-xs text-slate-400 border-t border-white/5 pt-4">
            <p className="font-medium text-slate-300">How to get a free TMDB API key:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Create a free account on <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline inline-flex items-center gap-0.5">TheMovieDB.org <ExternalLink className="w-3 h-3" /></a></li>
              <li>Go to Account Settings &rarr; API &rarr; Request API Key</li>
              <li>Select "Developer" and copy your API Key (v3 auth)</li>
            </ol>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            {apiKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
              >
                Clear Key
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition-colors flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Save & Connect</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
