import { useMotionPresence } from '../../animation/hooks/useMotionPresence';
import React, { useState } from 'react';
import { Sparkles, Check, Film, Sliders, Globe, User } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { MOCK_GENRES } from '../../services/mockData';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, closeOnboarding, preferences, updatePreferences } = useUser();

  const [selectedGenres, setSelectedGenres] = useState<number[]>(preferences.favoriteGenreIds);
  const [minRating, setMinRating] = useState<number>(preferences.minRatingThreshold);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(preferences.preferredLanguages[0] || 'en');
  const [actorInput, setActorInput] = useState<string>('');
  const [actorsList, setActorsList] = useState<string[]>(preferences.favoriteActors);
  const [directorInput, setDirectorInput] = useState<string>('');
  const [directorsList, setDirectorsList] = useState<string[]>(preferences.favoriteDirectors);

  const { ref, shouldRender } = useMotionPresence(isOnboardingOpen, 'slideUp');
  if (!shouldRender) return null;

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]
    );
  };

  const handleAddActor = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (('key' in e && e.key === 'Enter') || e.type === 'click') {
      e.preventDefault();
      if (actorInput.trim() && !actorsList.includes(actorInput.trim())) {
        setActorsList(prev => [...prev, actorInput.trim()]);
        setActorInput('');
      }
    }
  };

  const handleRemoveActor = (actor: string) => {
    setActorsList(prev => prev.filter(a => a !== actor));
  };

  const handleAddDirector = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (('key' in e && e.key === 'Enter') || e.type === 'click') {
      e.preventDefault();
      if (directorInput.trim() && !directorsList.includes(directorInput.trim())) {
        setDirectorsList(prev => [...prev, directorInput.trim()]);
        setDirectorInput('');
      }
    }
  };

  const handleRemoveDirector = (director: string) => {
    setDirectorsList(prev => prev.filter(d => d !== director));
  };

  const handleSave = () => {
    updatePreferences({
      favoriteGenreIds: selectedGenres.length > 0 ? selectedGenres : [28, 878, 53],
      minRatingThreshold: minRating,
      preferredLanguages: [selectedLanguage],
      favoriteActors: actorsList,
      favoriteDirectors: directorsList,
      onboardingCompleted: true,
    });
    closeOnboarding();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] glass-elevated rounded-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="px-6 py-6 bg-gradient-to-r from-brand-900/40 via-surface-300/40 to-surface-300/40 border-b border-white/5">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-lg shadow-brand-500/20">
              <Sparkles className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h2 id="onboarding-title" className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
                Welcome to RoninPLEX
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Let's tailor your personal movie & TV recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Genres */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Select Your Favorite Genres
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Pick 3 or more genres to kickstart your personalized feeds.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {MOCK_GENRES.slice(0, 16).map(genre => {
                const isSelected = selectedGenres.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => toggleGenre(genre.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-400 shadow-md shadow-brand-600/30 scale-105'
                        : 'bg-surface-100/70 text-slate-300 border-white/5 hover:border-white/20 hover:bg-surface-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{genre.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Minimum Rating & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
            {/* Rating */}
            <div className="space-y-2 p-4 rounded-xl glass-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Min Rating
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ★ {minRating.toFixed(1)} / 10
                </span>
              </div>
              <input
                type="range"
                min="5.0"
                max="8.5"
                step="0.5"
                value={minRating}
                onChange={e => setMinRating(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-300 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>5.0 (All picks)</span>
                <span>8.0+ (Must-watch)</span>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2 p-4 rounded-xl glass-subtle">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Primary Language
              </span>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass-subtle text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="ja">Japanese (ja)</option>
                <option value="ko">Korean (ko)</option>
                <option value="de">German (de)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="it">Italian (it)</option>
              </select>
              <p className="text-[10px] text-slate-500">Can be changed anytime in discover</p>
            </div>
          </div>

          {/* Step 3: Favorite Directors & Actors (Optional) */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Favorite Creators & Actors (Optional)
              </h3>
            </div>

            {/* Directors */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Directors you love (e.g. Christopher Nolan, Denis Villeneuve):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={directorInput}
                  onChange={e => setDirectorInput(e.target.value)}
                  onKeyDown={handleAddDirector}
                  placeholder="Type director name and press enter..."
                  className="flex-1 px-3 py-1.5 rounded-lg glass-subtle text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={handleAddDirector}
                  className="px-3 py-1.5 rounded-lg bg-surface-50 hover:bg-surface-100 text-xs text-slate-200 border border-white/10"
                >
                  Add
                </button>
              </div>
              {directorsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {directorsList.map(d => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-brand-500/20 text-brand-300 border border-brand-500/30"
                    >
                      {d}
                      <button onClick={() => handleRemoveDirector(d)} className="hover:text-white font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actors */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-slate-400">Actors you enjoy (e.g. Leonardo DiCaprio, Zendaya):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={actorInput}
                  onChange={e => setActorInput(e.target.value)}
                  onKeyDown={handleAddActor}
                  placeholder="Type actor name and press enter..."
                  className="flex-1 px-3 py-1.5 rounded-lg glass-subtle text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={handleAddActor}
                  className="px-3 py-1.5 rounded-lg bg-surface-50 hover:bg-surface-100 text-xs text-slate-200 border border-white/10"
                >
                  Add
                </button>
              </div>
              {actorsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {actorsList.map(a => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    >
                      {a}
                      <button onClick={() => handleRemoveActor(a)} className="hover:text-white font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-300 border-t border-white/5 flex items-center justify-between">
          <button
            type="button"
            onClick={closeOnboarding}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-brand-600/30 transition-all transform hover:scale-[1.02] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Discovering</span>
          </button>
        </div>
      </div>
    </div>
  );
};
