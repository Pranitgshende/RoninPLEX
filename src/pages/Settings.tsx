import React, { useState, useEffect } from 'react';
import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import { useUser } from '../context/UserContext';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { DiagnosticsViewer } from '../components/modals/DiagnosticsViewer';
import { HomeSectionItem, DEFAULT_HOME_SECTIONS } from '../types/user';
import {
  PlaySquare,
  Sparkles,
  Layout,
  Database,
  Info,
  Check,
  RotateCcw,
  Trash2,
  ChevronUp,
  ChevronDown,
  Monitor
} from 'lucide-react';
import { storage } from '../services/storage';
import { version } from '../../package.json';

type SettingsTab = 'playback' | 'appearance' | 'home' | 'data' | 'about';

export const Settings: React.FC = () => {
  useAppReadyWhen(true);
  const {
    preferences,
    updatePreferences,
    resetPreferences,
    homeLayout,
    updateHomeLayout,
    clearContinueWatching,
    clearWatched,
    clearWatchlist
  } = useUser();

  const [activeTab, setActiveTab] = useState<SettingsTab>('playback');
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel: string;
    isDestructive: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmLabel: 'Confirm',
    isDestructive: true
  });

  const requestConfirmation = (
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
    isDestructive = true
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmLabel,
      isDestructive
    });
  };

  // Home Layout State for UI Reordering
  const [localHomeLayout, setLocalHomeLayout] = useState<HomeSectionItem[]>(homeLayout);

  useEffect(() => {
    setLocalHomeLayout(homeLayout);
  }, [homeLayout]);

  const moveHomeSection = (index: number, direction: -1 | 1) => {
    if ((index === 0 && direction === -1) || (index === localHomeLayout.length - 1 && direction === 1)) return;
    
    const newLayout = [...localHomeLayout];
    const temp = newLayout[index];
    newLayout[index] = newLayout[index + direction];
    newLayout[index + direction] = temp;
    
    setLocalHomeLayout(newLayout);
    updateHomeLayout(newLayout);
  };

  const toggleHomeSection = (id: string, enabled: boolean) => {
    const newLayout = localHomeLayout.map(s => s.id === id ? { ...s, enabled } : s);
    setLocalHomeLayout(newLayout);
    updateHomeLayout(newLayout);
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: any) => {
    updatePreferences({ [key]: value });
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 pt-24 pb-20 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-display">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure playback, appearance, and local data.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0 bg-surface-200/60 rounded-2xl border border-white/5 p-2 space-y-1">
          <button
            onClick={() => setActiveTab('playback')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'playback' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PlaySquare className="w-4 h-4" />
            Playback
          </button>
          
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'appearance' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Appearance & Motion
          </button>
          
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'home' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layout className="w-4 h-4" />
            Home & Discovery
          </button>
          
          <button
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'data' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4" />
            Data
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'about' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Info className="w-4 h-4" />
            About
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-grow w-full max-w-3xl space-y-6">
          
          {/* PLAYBACK */}
          {activeTab === 'playback' && (
            <div className="space-y-6 animate-slide-up">
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlaySquare className="w-5 h-5 text-brand-400" />
                  Playback Settings
                </h2>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Autoplay Next Episode</h3>
                    <p className="text-xs text-slate-400 mt-1">Automatically play the next episode when watching TV shows or Anime.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.autoNextEpisode !== false}
                      onChange={(e) => handlePreferenceChange('autoNextEpisode', e.target.checked)}
                      aria-label="Autoplay Next Episode"
                    />
                    <div className="w-11 h-6 bg-surface-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Seek Amount</h3>
                    <p className="text-xs text-slate-400 mt-1">Skip forward and backward duration.</p>
                  </div>
                  <select
                    value={preferences.seekAmount || 10}
                    onChange={(e) => handlePreferenceChange('seekAmount', Number(e.target.value))}
                    className="bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white outline-none focus:border-brand-500"
                    aria-label="Seek Amount"
                  >
                    <option value={5}>5 Seconds</option>
                    <option value={10}>10 Seconds</option>
                    <option value={15}>15 Seconds</option>
                    <option value={30}>30 Seconds</option>
                  </select>
                </div>
              </section>
            </div>
          )}

          {/* APPEARANCE & MOTION */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-slide-up">
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-400" />
                  Appearance & Motion
                </h2>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Reduced Motion</h3>
                    <p className="text-xs text-slate-400 mt-1">Disable complex UI animations and cinematic effects. Defaults to OS preference.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.reduceMotion === true}
                      onChange={(e) => handlePreferenceChange('reduceMotion', e.target.checked)}
                      aria-label="Reduced Motion"
                    />
                    <div className="w-11 h-6 bg-surface-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Skip Intro Animation</h3>
                    <p className="text-xs text-slate-400 mt-1">Skip the startup cinematic intro when opening RoninPLEX.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.skipIntro === true}
                      onChange={(e) => handlePreferenceChange('skipIntro', e.target.checked)}
                      aria-label="Skip Intro Animation"
                    />
                    <div className="w-11 h-6 bg-surface-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
                  </label>
                </div>
              </section>
            </div>
          )}

          {/* HOME & DISCOVERY */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-slide-up">
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layout className="w-5 h-5 text-brand-400" />
                  Home Layout
                </h2>
                <p className="text-xs text-slate-400">Reorder or disable sections on the Home page.</p>
                
                <div className="space-y-2 mt-4">
                  {localHomeLayout.map((section, index) => (
                    <div key={section.id} className="flex items-center justify-between p-3 bg-surface-100/50 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={section.enabled}
                            onChange={(e) => toggleHomeSection(section.id, e.target.checked)}
                            aria-label={`Show ${section.label}`}
                          />
                          <div className="w-9 h-5 bg-surface-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                        </label>
                        <span className={`text-sm font-medium ${section.enabled ? 'text-white' : 'text-slate-500'}`}>
                          {section.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveHomeSection(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg bg-surface-200 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                          aria-label="Move Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveHomeSection(index, 1)}
                          disabled={index === localHomeLayout.length - 1}
                          className="p-1.5 rounded-lg bg-surface-200 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                          aria-label="Move Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* DATA */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-slide-up">
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-brand-400" />
                  Data Management
                </h2>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-surface-100/50 border border-white/5 rounded-xl p-4 flex flex-col items-start gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">Continue Watching</h3>
                      <p className="text-xs text-slate-400 mt-1">Clear your current playback progress across all titles.</p>
                    </div>
                    <button
                      onClick={() => requestConfirmation(
                        'Clear Continue Watching',
                        'Are you sure you want to clear your in-progress playback? This cannot be undone.',
                        'Clear Progress',
                        clearContinueWatching,
                        true
                      )}
                      className="mt-auto px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-xs font-bold rounded-lg transition-colors border border-rose-500/20"
                    >
                      Clear Continue Watching
                    </button>
                  </div>
                  
                  <div className="bg-surface-100/50 border border-white/5 rounded-xl p-4 flex flex-col items-start gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">Watched History</h3>
                      <p className="text-xs text-slate-400 mt-1">Remove all watched titles from your history.</p>
                    </div>
                    <button
                      onClick={() => requestConfirmation(
                        'Clear Watched History',
                        'Are you sure you want to delete your entire watched history? This cannot be undone.',
                        'Clear History',
                        clearWatched,
                        true
                      )}
                      className="mt-auto px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-xs font-bold rounded-lg transition-colors border border-rose-500/20"
                    >
                      Clear Watched History
                    </button>
                  </div>
                  
                  <div className="bg-surface-100/50 border border-white/5 rounded-xl p-4 flex flex-col items-start gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">Watchlist</h3>
                      <p className="text-xs text-slate-400 mt-1">Remove all titles currently saved to your Watchlist.</p>
                    </div>
                    <button
                      onClick={() => requestConfirmation(
                        'Clear Watchlist',
                        'Are you sure you want to empty your watchlist? This cannot be undone.',
                        'Clear Watchlist',
                        clearWatchlist,
                        true
                      )}
                      className="mt-auto px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-xs font-bold rounded-lg transition-colors border border-rose-500/20"
                    >
                      Clear Watchlist
                    </button>
                  </div>

                  <div className="bg-surface-100/50 border border-white/5 rounded-xl p-4 flex flex-col items-start gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">Reset Preferences</h3>
                      <p className="text-xs text-slate-400 mt-1">Restore default settings. Keeps your watchlist and history.</p>
                    </div>
                    <button
                      onClick={() => requestConfirmation(
                        'Reset Preferences',
                        'Restore all playback, appearance, and home layout settings to defaults? Your history and watchlist will be kept.',
                        'Reset to Defaults',
                        () => {
                          resetPreferences();
                          setLocalHomeLayout(DEFAULT_HOME_SECTIONS);
                        },
                        false
                      )}
                      className="mt-auto px-4 py-2 bg-surface-200 hover:bg-surface-300 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-white/10"
                    >
                      Reset Preferences
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-slide-up">
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle text-center flex flex-col items-center">
                <Monitor className="w-12 h-12 text-brand-500 mb-2" />
                <h2 className="text-xl font-bold text-white font-display">RoninPLEX</h2>
                <div className="text-sm text-slate-400 max-w-md mx-auto space-y-4">
                  <p>Version {version} — Phase 13</p>
                  <p>Developed with native DOM APIs and minimal dependencies. Built on the principle of providing a cinematic, accessible, and offline-first streaming experience.</p>
                  <div className="inline-block mt-4 px-3 py-1 bg-brand-500/20 text-brand-400 rounded-full text-xs font-mono">
                    always_on: true
                  </div>
                </div>
              </section>
            </div>
          )}
          
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        confirmLabel={confirmModal.confirmLabel}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
};
