import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import React, { useState, useEffect } from 'react';
import {
  Server,
  Key,
  Sliders,
  Database,
  Info,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Film,
  Monitor,
  Layout,
  PlaySquare,
  ChevronUp,
  ChevronDown,
  Check,
  ExternalLink,
  Palette,
} from 'lucide-react';
import { providerConfigService } from '../services/streaming/providerConfig';
import { ProviderConfig, DEFAULT_PROVIDER_CONFIG } from '../services/streaming/types';
import { streamingManager } from '../services/streaming/StreamingManager';
import { useUser } from '../context/UserContext';
import { useApiKey } from '../context/ApiKeyContext';
import { tmdb } from '../services/tmdb';
import { SeekAmount } from '../types/user';
import { AdultBadge } from '../components/common/AdultBadge';

export type SettingsTab = 'home' | 'playback' | 'streaming' | 'tmdb' | 'appearance' | 'storage' | 'about';

export const Settings: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    resetPreferences,
    homeLayout,
    updateHomeLayout,
    resetHomeLayout,
    watchlist,
    watched,
    continueWatching,
    clearWatchlist,
    clearWatched,
    clearContinueWatching,
    showToast,
  } = useUser();

  const { apiKey: customTmdbKey, updateApiKey, removeApiKey } = useApiKey();

  // Active Tab: 7 desktop categories
  const [activeTab, setActiveTab] = useState<SettingsTab>('home');

  // Home Page Section Reordering & Toggles
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= homeLayout.length) return;
    const updated = [...homeLayout];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    updateHomeLayout(updated);
  };

  const handleToggleSection = (id: string) => {
    const updated = homeLayout.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    updateHomeLayout(updated);
  };

  // Streaming Provider State
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>(() => providerConfigService.getConfig());
  const [activeProviderId, setActiveProviderId] = useState<string>(() => providerConfigService.getActiveProviderId());
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiToken, setShowApiToken] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState<string>('');

  // TMDB Key State
  const [tmdbInput, setTmdbInput] = useState<string>(customTmdbKey);
  const [showTmdbKey, setShowTmdbKey] = useState(false);
  const [tmdbStatus, setTmdbStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');

  // Genres available
  const availableGenres = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Sci-Fi' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
  ];

  // Save Streaming Config
  const handleSaveProviderConfig = (e: React.FormEvent) => {
    e.preventDefault();
    providerConfigService.saveConfig(providerConfig);
    providerConfigService.setActiveProviderId(activeProviderId);
    showToast('success', 'Provider Configuration Saved', 'Active streaming provider updated.');
  };

  // Test Streaming Connection
  const handleTestProviderConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMessage('Testing provider endpoint connectivity...');

    try {
      const isConnected = await streamingManager.testConnection();
      if (isConnected) {
        setConnectionStatus('connected');
        setConnectionMessage('Connected! Provider API endpoint is responding.');
        showToast('success', 'Connected', 'Streaming provider endpoint reached successfully.');
      } else {
        setConnectionStatus('error');
        setConnectionMessage('Connection failed. Verify Base URL and authentication credentials.');
        showToast('error', 'Connection Failed', 'Could not reach provider endpoint.');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMessage(err.message || 'Network error.');
      showToast('error', 'Connection Error', err.message);
    }
  };

  // Reset Provider to Default
  const handleResetProvider = () => {
    const defaultCfg = providerConfigService.resetConfig();
    setProviderConfig(defaultCfg);
    setActiveProviderId('vidsrc-to');
    setConnectionStatus('idle');
    setConnectionMessage('');
    showToast('info', 'Reset Provider', 'Restored VidSrc default provider.');
  };

  // Test TMDB Key
  const handleTestTmdbKey = async () => {
    if (!tmdbInput.trim()) {
      setTmdbStatus('idle');
      return;
    }

    setTmdbStatus('testing');
    const valid = await updateApiKey(tmdbInput.trim());
    if (valid) {
      setTmdbStatus('connected');
      showToast('success', 'TMDB Connected', 'Valid TMDB API key activated.');
    } else {
      setTmdbStatus('error');
      showToast('error', 'Invalid TMDB Key', 'TMDB rejected this API key.');
    }
  };

  const handleClearTmdbKey = () => {
    setTmdbInput('');
    removeApiKey();
    setTmdbStatus('idle');
    showToast('info', 'TMDB Key Cleared', 'Fallback to default environment key or offline mode.');
  };

  const toggleGenre = (genreId: number) => {
    const current = preferences.favoriteGenreIds || [];
    const next = current.includes(genreId)
      ? current.filter(id => id !== genreId)
      : [...current, genreId];
    updatePreferences({ favoriteGenreIds: next });
  };
  useAppReadyWhen(true);


  return (
    <div className="min-h-screen bg-background text-slate-100 pt-24 pb-20 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto space-y-8">
      {/* Settings Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
          Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure streaming providers, TMDB metadata, desktop playback preferences, and local data.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation Sidebar Tabs (7 Desktop Categories) */}
        <div className="w-full lg:w-64 flex-shrink-0 bg-surface-200/60 rounded-2xl border border-white/5 p-2 space-y-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'home'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Home Page</span>
          </button>

          <button
            onClick={() => setActiveTab('playback')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'playback'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PlaySquare className="w-4 h-4" />
            <span>Playback Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('streaming')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'streaming'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Streaming</span>
          </button>

          <button
            onClick={() => setActiveTab('tmdb')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'tmdb'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>TMDB Metadata</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'appearance'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'storage'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Storage & Privacy</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'about'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About RoninPLEX</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full bg-surface-200/40 rounded-2xl border border-white/5 p-6 sm:p-8">
          {/* SECTION 1: HOME PAGE CUSTOMIZATION */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white font-display">Home Page Customization</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Reorder and toggle content shelves on your home feed. Sections disabled here will skip API network calls completely to maximize launch speed and conserve bandwidth.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetHomeLayout();
                    showToast('info', 'Layout Restored', 'Restored default Home page arrangement.');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 hover:text-white text-xs font-semibold border border-white/5 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Layout</span>
                </button>
              </div>

              <div className="space-y-2">
                {homeLayout.map((section, idx) => (
                  <div
                    key={section.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      section.enabled
                        ? 'bg-surface-100/70 border-white/10'
                        : 'bg-surface-100/20 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-surface-200 text-[11px] font-mono font-bold text-slate-400 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">{section.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono">id: {section.id}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === homeLayout.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Toggle Enabled */}
                      <label className="flex items-center gap-2 pl-2 border-l border-white/10 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={() => handleToggleSection(section.id)}
                          className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                        />
                        <span className="text-[11px] font-medium text-slate-300">
                          {section.enabled ? 'Enabled' : 'Hidden'}
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* 18+ Content Controls */}
              <div className="p-5 rounded-2xl bg-surface-100/60 border border-white/10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Mature & 18+ Content Recommendations</h3>
                      <AdultBadge size="sm" />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      When enabled, mature 18+ titles and a dedicated Adult Recommendations shelf will appear on your Home page with explicit 18+ badges. When disabled, adult and age-restricted titles are completely filtered from all recommendations and shelves.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={preferences.showAdultRecommendations === true}
                      onChange={(e) => updatePreferences({ showAdultRecommendations: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PLAYBACK ENGINE */}
          {activeTab === 'playback' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-display">Built-in Playback Engine</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure seek duration, gesture actions, and episode transitions.
                </p>
              </div>

              {/* Central Seek Amount */}
              <div className="p-5 rounded-2xl bg-surface-100/60 border border-white/10 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Default Seek Step</h3>
                  <p className="text-xs text-slate-300">
                    Controls skip interval for keyboard arrow keys, double-click edge gestures, and player skip buttons.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {([5, 10, 15, 30] as SeekAmount[]).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => updatePreferences({ seekAmount: amt })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        (preferences.seekAmount || 10) === amt
                          ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/30'
                          : 'bg-surface-200 text-slate-300 border-white/5 hover:text-white hover:bg-surface-100'
                      }`}
                    >
                      {amt} Seconds {amt === 10 && '(Default)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* TV Auto-Next Episode */}
              <div className="p-5 rounded-2xl bg-surface-100/60 border border-white/10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Auto-Play Next TV Episode</h3>
                    <p className="text-xs text-slate-300">
                      When an episode finishes, show an animated countdown card and automatically transition to the next episode.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={preferences.autoNextEpisode !== false}
                      onChange={(e) => updatePreferences({ autoNextEpisode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                {preferences.autoNextEpisode !== false && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-xs font-semibold text-slate-300">Countdown Duration:</span>
                    <div className="flex gap-2">
                      {[5, 10, 15].map((secs) => (
                        <button
                          key={secs}
                          type="button"
                          onClick={() => updatePreferences({ autoNextCountdown: secs })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            (preferences.autoNextCountdown || 10) === secs
                              ? 'bg-brand-600 text-white border-brand-500'
                              : 'bg-surface-200 text-slate-300 border-white/5 hover:text-white'
                          }`}
                        >
                          {secs} Seconds {secs === 10 && '(Default)'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Default Playback Speed */}
              <div className="p-5 rounded-2xl bg-surface-100/60 border border-white/10 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Default Playback Speed</h3>
                  <p className="text-xs text-slate-300">Set preferred starting playback rate for all video sessions.</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => updatePreferences({ defaultPlaybackSpeed: spd })}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        (preferences.defaultPlaybackSpeed || 1) === spd
                          ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/30'
                          : 'bg-surface-200 text-slate-300 border-white/5 hover:text-white'
                      }`}
                    >
                      {spd}x {spd === 1 && '(Normal)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: STREAMING PROVIDER */}
          {activeTab === 'streaming' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-display">Streaming Provider</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure your authorized streaming provider. The application UI remains decoupled from specific APIs.
                </p>
              </div>

              {/* Active Provider Selector */}
              <div className="p-4 rounded-xl glass-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Preferred Streaming Provider:
                  </label>
                  <span className="text-[10px] text-brand-400 font-medium">
                    Automatic multi-provider fallback active
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProviderId('vidsrc-me');
                      setProviderConfig(prev => ({ ...prev, isEnabled: true }));
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      activeProviderId === 'vidsrc-me' && providerConfig.isEnabled
                        ? 'bg-brand-600/20 border-brand-500 text-white'
                        : 'bg-surface-200/50 border-white/5 text-slate-400 hover:bg-surface-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>VidSrc Me</span>
                      {activeProviderId === 'vidsrc-me' && providerConfig.isEnabled && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/30 text-brand-300">Preferred</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">vidsrcme.ru streaming API</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveProviderId('vidsrc-to');
                      setProviderConfig(prev => ({ ...prev, isEnabled: true }));
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      (activeProviderId === 'vidsrc-to' || activeProviderId === 'vidsrc') && providerConfig.isEnabled
                        ? 'bg-brand-600/20 border-brand-500 text-white'
                        : 'bg-surface-200/50 border-white/5 text-slate-400 hover:bg-surface-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>VidSrc (to)</span>
                      {(activeProviderId === 'vidsrc-to' || activeProviderId === 'vidsrc') && providerConfig.isEnabled && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/30 text-brand-300">Preferred</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">vidsrc.to streaming API</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveProviderId('2embed');
                      setProviderConfig(prev => ({ ...prev, isEnabled: true }));
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      activeProviderId === '2embed' && providerConfig.isEnabled
                        ? 'bg-brand-600/20 border-brand-500 text-white'
                        : 'bg-surface-200/50 border-white/5 text-slate-400 hover:bg-surface-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>2Embed</span>
                      {activeProviderId === '2embed' && providerConfig.isEnabled && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/30 text-brand-300">Preferred</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">2embed.cc streaming API</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveProviderId('vidsrc-dev');
                      setProviderConfig(prev => ({ ...prev, isEnabled: true }));
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      activeProviderId === 'vidsrc-dev' && providerConfig.isEnabled
                        ? 'bg-brand-600/20 border-brand-500 text-white'
                        : 'bg-surface-200/50 border-white/5 text-slate-400 hover:bg-surface-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>VidSrc Dev</span>
                      {activeProviderId === 'vidsrc-dev' && providerConfig.isEnabled && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/30 text-brand-300">Preferred</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">vidsrc.dev streaming API</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveProviderId('vidlink');
                      setProviderConfig(prev => ({ ...prev, isEnabled: true }));
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      activeProviderId === 'vidlink' && providerConfig.isEnabled
                        ? 'bg-brand-600/20 border-brand-500 text-white'
                        : 'bg-surface-200/50 border-white/5 text-slate-400 hover:bg-surface-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>VidLink Pro</span>
                      {activeProviderId === 'vidlink' && providerConfig.isEnabled && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/30 text-brand-300">Preferred</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">vidlink.pro streaming API</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveProviderId('custom');
                      setProviderConfig(prev => ({ ...prev, isEnabled: true }));
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      activeProviderId === 'custom' && providerConfig.isEnabled
                        ? 'bg-brand-600/20 border-brand-500 text-white'
                        : 'bg-surface-200/50 border-white/5 text-slate-400 hover:bg-surface-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Custom API</span>
                      {activeProviderId === 'custom' && providerConfig.isEnabled && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/30 text-brand-300">Preferred</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Configured endpoints below</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveProviderId('disabled');
                      setProviderConfig(prev => ({ ...prev, isEnabled: false }));
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      activeProviderId === 'disabled' || !providerConfig.isEnabled
                        ? 'bg-brand-600/20 border-brand-500 text-white'
                        : 'bg-surface-200/50 border-white/5 text-slate-400 hover:bg-surface-200'
                    }`}
                  >
                    <div className="font-bold text-xs">Disabled</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Discovery & trailers only</div>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl glass-subtle">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connectionStatus === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : connectionStatus === 'error'
                        ? 'bg-rose-500'
                        : connectionStatus === 'testing'
                        ? 'bg-amber-500 animate-spin'
                        : 'bg-slate-500'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-semibold text-white">Status: </span>
                    <span className="text-xs text-slate-300 capitalize">
                      {connectionStatus === 'idle' ? 'Not Tested' : connectionStatus}
                    </span>
                    {connectionMessage && (
                      <span className="text-[11px] text-slate-400 block">{connectionMessage}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestProviderConnection}
                  disabled={connectionStatus === 'testing'}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-50 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>
              </div>

              {/* Provider Health & Failover Diagnostics Table */}
              <div className="p-4 rounded-xl glass-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Provider Health & Failover Diagnostics
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Automatic 5m penalty expiration</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="pb-2 font-semibold">Provider</th>
                        <th className="pb-2 font-semibold">ID</th>
                        <th className="pb-2 font-semibold">Health Status</th>
                        <th className="pb-2 font-semibold">Failures</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.entries(streamingManager.getProviderHealthSummary()).map(([id, info]) => (
                        <tr key={id} className="text-slate-300">
                          <td className="py-2.5 font-medium text-white">
                            {id === 'vidsrc-me'
                              ? 'VidSrc Me'
                              : id === 'vidsrc-to'
                              ? 'VidSrc (to)'
                              : id === '2embed'
                              ? '2Embed'
                              : id === 'vidlink'
                              ? 'VidLink Pro'
                              : id === 'vidsrc-dev'
                              ? 'VidSrc Dev (Parked)'
                              : id === 'custom'
                              ? 'Custom API Server'
                              : id}
                          </td>
                          <td className="py-2.5 font-mono text-[11px] text-slate-400">{id}</td>
                          <td className="py-2.5">
                            {info.isDead ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                                Dead / Parked
                              </span>
                            ) : info.isHealthy ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                Healthy & Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                Penalized (Fast-Failing)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 font-mono text-[11px]">{info.failureCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Provider Config Form */}
              <form onSubmit={handleSaveProviderConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Provider Name</label>
                    <input
                      type="text"
                      value={providerConfig.name}
                      onChange={(e) => setProviderConfig({ ...providerConfig, name: e.target.value })}
                      placeholder="e.g. My Authorized Stream Server"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-subtle text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">API Base URL</label>
                    <input
                      type="text"
                      value={providerConfig.baseUrl}
                      onChange={(e) => setProviderConfig({ ...providerConfig, baseUrl: e.target.value })}
                      placeholder="https://api.your-provider.com"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-subtle text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={providerConfig.apiKey}
                        onChange={(e) => setProviderConfig({ ...providerConfig, apiKey: e.target.value })}
                        placeholder="Optional X-API-Key header"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl glass-subtle text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Bearer Token</label>
                    <div className="relative">
                      <input
                        type={showApiToken ? 'text' : 'password'}
                        value={providerConfig.apiToken}
                        onChange={(e) => setProviderConfig({ ...providerConfig, apiToken: e.target.value })}
                        placeholder="Optional Authorization Bearer token"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl glass-subtle text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiToken(!showApiToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showApiToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Endpoint URI Templates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium">Movie Endpoint:</span>
                      <input
                        type="text"
                        value={providerConfig.movieEndpoint}
                        onChange={(e) => setProviderConfig({ ...providerConfig, movieEndpoint: e.target.value })}
                        placeholder="/movies/{tmdbId}"
                        className="w-full px-3 py-2 rounded-lg glass-subtle text-xs text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium">TV Endpoint:</span>
                      <input
                        type="text"
                        value={providerConfig.tvEndpoint}
                        onChange={(e) => setProviderConfig({ ...providerConfig, tvEndpoint: e.target.value })}
                        placeholder="/tv/{tmdbId}"
                        className="w-full px-3 py-2 rounded-lg glass-subtle text-xs text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium">Episode Endpoint:</span>
                      <input
                        type="text"
                        value={providerConfig.episodeEndpoint}
                        onChange={(e) => setProviderConfig({ ...providerConfig, episodeEndpoint: e.target.value })}
                        placeholder="/tv/{tmdbId}/season/{season}/episode/{episode}"
                        className="w-full px-3 py-2 rounded-lg glass-subtle text-xs text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium">Search Endpoint:</span>
                      <input
                        type="text"
                        value={providerConfig.searchEndpoint}
                        onChange={(e) => setProviderConfig({ ...providerConfig, searchEndpoint: e.target.value })}
                        placeholder="/search?q={query}"
                        className="w-full px-3 py-2 rounded-lg glass-subtle text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Advisory Callout */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5 mt-4">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 text-amber-400" />
                  <div className="space-y-1 leading-relaxed text-[11px]">
                    <strong className="font-semibold block text-amber-200">Security Architecture Notice:</strong>
                    Any API keys or tokens entered here are persisted in your local Windows storage. If your provider requires a private secret that should never be sent from browser runtime, configure a local lightweight proxy server.
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-colors"
                  >
                    Save Provider Configuration
                  </button>

                  <button
                    type="button"
                    onClick={handleResetProvider}
                    className="px-4 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 text-xs font-medium border border-white/5 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Default</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 2: TMDB METADATA */}
          {activeTab === 'tmdb' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-display">TMDB Metadata Service</h2>
                <p className="text-xs text-slate-400 mt-1">
                  The Movie Database (TMDB) provides cast, posters, backdrops, ratings, synopsis, and trailer mappings.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">TMDB API Key (v3 auth)</label>
                  <div className="relative max-w-lg">
                    <input
                      type={showTmdbKey ? 'text' : 'password'}
                      value={tmdbInput}
                      onChange={(e) => setTmdbInput(e.target.value)}
                      placeholder="Enter your free 32-character TMDB API Key"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl glass-subtle text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTmdbKey(!showTmdbKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showTmdbKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestTmdbKey}
                    disabled={tmdbStatus === 'testing'}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${tmdbStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>Validate & Save Key</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearTmdbKey}
                    className="px-4 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 text-xs font-medium border border-white/5 transition-colors"
                  >
                    Clear Key
                  </button>
                </div>

                <div className="p-4 rounded-xl glass-subtle text-xs text-slate-300 space-y-2">
                  <h4 className="font-semibold text-white">Need a TMDB API Key?</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    TMDB API keys are 100% free for personal use. Simply create an account at{' '}
                    <a
                      href="https://www.themoviedb.org/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-400 hover:underline font-medium"
                    >
                      themoviedb.org
                    </a>
                    , go to Settings &rarr; API, and generate an API key.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: APPEARANCE & DISCOVERY PREFERENCES */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-display">Appearance & Discovery Preferences</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Customize interface animations, hover behaviors, and algorithm recommendation weighting.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-surface-100/60 border border-white/10 space-y-4">
                  <h3 className="text-sm font-bold text-white">Visuals & Motion</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3.5 rounded-xl glass-subtle cursor-pointer hover:bg-surface-50 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-white">Enable Hover Trailer Previews</div>
                        <div className="text-[11px] text-slate-400">
                          Hovering on a poster card automatically initiates a discreet preview after 400ms.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.enableHoverTrailers !== false}
                        onChange={(e) => updatePreferences({ enableHoverTrailers: e.target.checked })}
                        className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl glass-subtle cursor-pointer hover:bg-surface-50 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-white">Autoplay Hero Trailer</div>
                        <div className="text-[11px] text-slate-400">
                          Play featured cinematic background video on the homepage hero banner.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.autoplayTrailer !== false}
                        onChange={(e) => updatePreferences({ autoplayTrailer: e.target.checked })}
                        className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl glass-subtle cursor-pointer hover:bg-surface-50 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-white">Reduced Motion</div>
                        <div className="text-[11px] text-slate-400">
                          Disable card zooms and background motion effects for improved accessibility and battery life.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.reduceMotion === true}
                        onChange={(e) => updatePreferences({ reduceMotion: e.target.checked })}
                        className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl glass-subtle cursor-pointer hover:bg-surface-50 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-white">Include Adult Content</div>
                        <div className="text-[11px] text-slate-400">
                          Allow 18+ titles to appear in search and discovery feeds.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.adultContent === true}
                        onChange={(e) => updatePreferences({ adultContent: e.target.checked })}
                        className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-surface-100/60 border border-white/10 space-y-4">
                  <h3 className="text-sm font-bold text-white">Personal Taste & Genres</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Favorite Genres</label>
                    <div className="flex flex-wrap gap-2">
                      {availableGenres.map((g) => {
                        const isSelected = preferences.favoriteGenreIds?.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => toggleGenre(g.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              isSelected
                                ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/30'
                                : 'bg-surface-100 text-slate-400 border-white/5 hover:text-white'
                            }`}
                          >
                            {g.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>Minimum Audience Rating:</span>
                      <span className="text-amber-400 font-bold">★ {preferences.minRatingThreshold || 6.5}+</span>
                    </div>
                    <input
                      type="range"
                      min="4.0"
                      max="9.0"
                      step="0.5"
                      value={preferences.minRatingThreshold || 6.5}
                      onChange={(e) => updatePreferences({ minRatingThreshold: parseFloat(e.target.value) })}
                      className="w-full accent-brand-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: STORAGE & PRIVACY */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-display">Storage & Privacy</h2>
                <p className="text-xs text-slate-400 mt-1">
                  All viewing history, progress, and settings reside strictly on your local computer. Zero remote tracking or telemetry.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl glass-subtle space-y-2">
                  <div className="text-xs text-slate-400">Continue Watching</div>
                  <div className="text-2xl font-bold text-white">{continueWatching.length} titles</div>
                  <button
                    type="button"
                    onClick={() => {
                      clearContinueWatching();
                      showToast('info', 'Progress Cleared', 'Continue Watching shelf has been cleared.');
                    }}
                    className="w-full py-1.5 rounded-lg bg-surface-50 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors"
                  >
                    Clear Progress
                  </button>
                </div>

                <div className="p-4 rounded-xl glass-subtle space-y-2">
                  <div className="text-xs text-slate-400">Watchlist</div>
                  <div className="text-2xl font-bold text-white">{watchlist.length} saved</div>
                  <button
                    type="button"
                    onClick={() => {
                      clearWatchlist();
                      showToast('info', 'Watchlist Cleared', 'Your watchlist has been cleared.');
                    }}
                    className="w-full py-1.5 rounded-lg bg-surface-50 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors"
                  >
                    Clear Watchlist
                  </button>
                </div>

                <div className="p-4 rounded-xl glass-subtle space-y-2">
                  <div className="text-xs text-slate-400">Watched History</div>
                  <div className="text-2xl font-bold text-white">{watched.length} watched</div>
                  <button
                    type="button"
                    onClick={() => {
                      clearWatched();
                      showToast('info', 'History Cleared', 'Your watched history has been cleared.');
                    }}
                    className="w-full py-1.5 rounded-lg bg-surface-50 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors"
                  >
                    Clear History
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-surface-100/60 border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white">Stream & Resolution Cache</h3>
                <p className="text-xs text-slate-400">
                  RoninPLEX caches resolved stream URLs in memory and local session storage for 30 minutes to reduce latency. Clear this cache if you encounter expired stream sessions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    streamingManager.clearCache();
                    showToast('success', 'Cache Cleared', 'Resolved stream cache purged.');
                  }}
                  className="px-4 py-2 rounded-xl bg-surface-50 hover:bg-surface-100 text-slate-200 text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Purge Stream URL Cache</span>
                </button>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all playback, discovery, and UI preferences to defaults? Your watchlist and history will be kept.')) {
                      resetPreferences();
                      showToast('info', 'Preferences Reset', 'Restored default playback and UI preferences.');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Preferences to Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Factory Reset: Reset all RoninPLEX settings, home layout, watchlist, history, and providers?')) {
                      resetPreferences();
                      resetHomeLayout();
                      clearWatchlist();
                      clearWatched();
                      clearContinueWatching();
                      handleResetProvider();
                      streamingManager.clearCache();
                      showToast('info', 'Factory Reset Complete', 'All application state restored to defaults.');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Factory Reset Application</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 7: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-display">About RoninPLEX</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Sovereign desktop cinema streaming & discovery studio for Windows.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-5 rounded-2xl bg-surface-100/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-slate-400">Application:</span>
                    <span className="text-white font-bold">RoninPLEX Desktop</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-slate-400">Release Version:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-brand-400 font-bold font-mono">v2.0.1</span>
                      <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold">
                        Production
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-slate-400">Desktop Framework:</span>
                    <span className="text-white font-semibold">Tauri 2 (Rust / WebView2)</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-slate-400">Frontend Stack:</span>
                    <span className="text-white font-semibold">React 19 + TypeScript + Vite + Tailwind CSS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Playback Engine:</span>
                    <span className="text-white font-semibold">Built-in HLS.js + HTML5 Video Engine</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-100/40 border border-white/5 space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">v2.0.0 Highlights</h4>
                  <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1">
                    <li>Dedicated Experiences: Distinct first-class Movies, TV Shows, Anime, and Discover sections</li>
                    <li>Built-in Playback Engine: Resilient HLS, MP4, and embed playback with multi-provider failover</li>
                    <li>Central Seek Engine: Configurable 5s, 10s, 15s, 30s jump intervals with visual badge animation</li>
                    <li>Double-Click Player Gestures: Edge zones seek forward/backward with single-click disambiguation</li>
                    <li>Auto-Next Episode: Automated countdown transition card with next episode preview and cancel control</li>
                    <li>Multi-Provider Health Manager: 5-minute fast-fail penalty expiration and automated fallback</li>
                  </ul>
                </div>

                <p className="text-[11px] text-slate-400">
                  RoninPLEX combines TMDB metadata, YouTube trailer playback, and a modular decoupled streaming engine. Built exclusively for private personal laptop usage.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
