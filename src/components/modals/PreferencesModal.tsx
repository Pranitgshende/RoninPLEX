import { useMotionPresence } from '../../animation/hooks/useMotionPresence';
import React, { useState, useEffect } from 'react';
import { X, Sliders, Check, Film, Globe, User, Save, RotateCcw } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { MOCK_GENRES } from '../../services/mockData';
import { DEFAULT_USER_PREFERENCES } from '../../types/user';
import { AdultBadge } from '../common/AdultBadge';

export const PreferencesModal: React.FC = () => {
  const { isPreferencesOpen, closePreferences, preferences, updatePreferences } = useUser();

  const [selectedGenres, setSelectedGenres] = useState<number[]>(preferences.favoriteGenreIds);
  const [minRating, setMinRating] = useState<number>(preferences.minRatingThreshold);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(preferences.preferredLanguages[0] || 'en');
  const [actorInput, setActorInput] = useState<string>('');
  const [actorsList, setActorsList] = useState<string[]>(preferences.favoriteActors);
  const [directorInput, setDirectorInput] = useState<string>('');
  const [directorsList, setDirectorsList] = useState<string[]>(preferences.favoriteDirectors);
  const [showAdult, setShowAdult] = useState<boolean>(preferences.showAdultRecommendations || false);

  useEffect(() => {
    if (isPreferencesOpen) {
      setSelectedGenres(preferences.favoriteGenreIds);
      setMinRating(preferences.minRatingThreshold);
      setSelectedLanguage(preferences.preferredLanguages[0] || 'en');
      setActorsList(preferences.favoriteActors);
      setDirectorsList(preferences.favoriteDirectors);
      setShowAdult(preferences.showAdultRecommendations || false);
    }
  }, [isPreferencesOpen, preferences]);

  const { ref, shouldRender } = useMotionPresence(isPreferencesOpen, 'slideUp');
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

  const handleAddDirector = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (('key' in e && e.key === 'Enter') || e.type === 'click') {
      e.preventDefault();
      if (directorInput.trim() && !directorsList.includes(directorInput.trim())) {
        setDirectorsList(prev => [...prev, directorInput.trim()]);
        setDirectorInput('');
      }
    }
  };

  const handleReset = () => {
    setSelectedGenres(DEFAULT_USER_PREFERENCES.favoriteGenreIds);
    setMinRating(DEFAULT_USER_PREFERENCES.minRatingThreshold);
    setSelectedLanguage(DEFAULT_USER_PREFERENCES.preferredLanguages[0]);
    setActorsList(DEFAULT_USER_PREFERENCES.favoriteActors);
    setDirectorsList(DEFAULT_USER_PREFERENCES.favoriteDirectors);
    setShowAdult(DEFAULT_USER_PREFERENCES.showAdultRecommendations || false);
  };

  const handleSave = () => {
    updatePreferences({
      favoriteGenreIds: selectedGenres,
      minRatingThreshold: minRating,
      preferredLanguages: [selectedLanguage],
      favoriteActors: actorsList,
      favoriteDirectors: directorsList,
      showAdultRecommendations: showAdult,
    });
    closePreferences();
  };

  return (
    <div ref={ref}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
      onClick={closePreferences}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-title"
    >
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] glass-elevated rounded-2xl overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-surface-300/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 id="preferences-title" className="text-lg font-bold text-white font-display">
                Recommendation Preferences
              </h3>
              <p className="text-xs text-slate-400">Customize how RoninPLEX calculates your feed</p>
            </div>
          </div>
          <button
            onClick={closePreferences}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close preferences"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Favorite Genres */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-brand-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Favorite Genres
              </h4>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {MOCK_GENRES.map(genre => {
                const isSelected = selectedGenres.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => toggleGenre(genre.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-400 shadow-md shadow-brand-600/30'
                        : 'bg-surface-100 text-slate-300 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{genre.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <div className="space-y-2 p-4 rounded-xl glass-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Minimum TMDB Rating
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ★ {minRating.toFixed(1)}
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
            </div>

            <div className="space-y-2 p-4 rounded-xl glass-subtle">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Language
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
              </select>
            </div>
          </div>

          {/* Creators and Actors */}
          <div className="space-y-4 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Creators & Actors Affinity
              </h4>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Favorite Directors:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={directorInput}
                  onChange={e => setDirectorInput(e.target.value)}
                  onKeyDown={handleAddDirector}
                  placeholder="e.g. Christopher Nolan, Denis Villeneuve..."
                  className="flex-1 px-3 py-1.5 rounded-lg glass-subtle text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddDirector}
                  className="px-3 py-1.5 rounded-lg bg-surface-50 text-xs text-slate-200 border border-white/10"
                >
                  Add
                </button>
              </div>
              {directorsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {directorsList.map(d => (
                    <span key={d} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      {d}
                      <button onClick={() => setDirectorsList(prev => prev.filter(item => item !== d))} className="hover:text-white ml-1 font-bold">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Favorite Actors:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={actorInput}
                  onChange={e => setActorInput(e.target.value)}
                  onKeyDown={handleAddActor}
                  placeholder="e.g. Leonardo DiCaprio, Zendaya..."
                  className="flex-1 px-3 py-1.5 rounded-lg glass-subtle text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddActor}
                  className="px-3 py-1.5 rounded-lg bg-surface-50 text-xs text-slate-200 border border-white/10"
                >
                  Add
                </button>
              </div>
              {actorsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {actorsList.map(a => (
                    <span key={a} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {a}
                      <button onClick={() => setActorsList(prev => prev.filter(item => item !== a))} className="hover:text-white ml-1 font-bold">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 18+ Mature Content Toggle */}
            <div className="p-4 rounded-xl bg-surface-100/80 border border-white/5 flex items-center justify-between mt-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Mature & 18+ Recommendations</span>
                  <AdultBadge size="sm" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Include mature and adult recommendations on Home</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={showAdult}
                  onChange={(e) => setShowAdult(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-300 border-t border-white/5 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closePreferences}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
