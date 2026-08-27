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
  Monitor
} from 'lucide-react';
import { providerConfigService } from '../services/streaming/providerConfig';
import { ProviderConfig, DEFAULT_PROVIDER_CONFIG } from '../services/streaming/types';
import { streamingManager } from '../services/streaming/StreamingManager';
import { useUser } from '../context/UserContext';
import { useApiKey } from '../context/ApiKeyContext';
import { tmdb } from '../services/tmdb';

export const Settings: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    resetPreferences,
    watchlist,
    watched,
    continueWatching,
    clearWatchlist,
    clearWatched,
    clearContinueWatching,
    showToast,
  } = useUser();

  const { apiKey: customTmdbKey, updateApiKey, removeApiKey } = useApiKey();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'streaming' | 'tmdb' | 'general' | 'preferences' | 'storage' | 'about'>('streaming');

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
        {/* Navigation Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0 bg-surface-200/60 rounded-2xl border border-white/5 p-2 space-y-1">
          <button
            onClick={() => setActiveTab('streaming')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'streaming'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Streaming Provider</span>
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
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'general'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>General & Playback</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'preferences'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Movie Preferences</span>
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
          {/* SECTION 1: STREAMING PROVIDER */}
          {activeTab === 'streaming' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-display">Streaming Provider</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure your authorized streaming provider. The application UI remains decoupled from specific APIs.
                </p>
              </div>

              {/* Active Provider Selector */}
              <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5 space-y-3">
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
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-100 border border-white/5">
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">API Base URL</label>
                    <input
                      type="text"
                      value={providerConfig.baseUrl}
                      onChange={(e) => setProviderConfig({ ...providerConfig, baseUrl: e.target.value })}
                      placeholder="https://api.your-provider.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
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
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-surface-100 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
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
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-surface-100 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
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
                        className="w-full px-3 py-2 rounded-lg bg-surface-100 border border-white/10 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium">TV Endpoint:</span>
                      <input
                        type="text"
                        value={providerConfig.tvEndpoint}
                        onChange={(e) => setProviderConfig({ ...providerConfig, tvEndpoint: e.target.value })}
                        placeholder="/tv/{tmdbId}"
                        className="w-full px-3 py-2 rounded-lg bg-surface-100 border border-white/10 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium">Episode Endpoint:</span>
                      <input
                        type="text"
                        value={providerConfig.episodeEndpoint}
                        onChange={(e) => setProviderConfig({ ...providerConfig, episodeEndpoint: e.target.value })}
                        placeholder="/tv/{tmdbId}/season/{season}/episode/{episode}"
                        className="w-full px-3 py-2 rounded-lg bg-surface-100 border border-white/10 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium">Search Endpoint:</span>
                      <input
                        type="text"
                        value={providerConfig.searchEndpoint}
                        onChange={(e) => setProviderConfig({ ...providerConfig, searchEndpoint: e.target.value })}
                        placeholder="/search?q={query}"
                        className="w-full px-3 py-2 rounded-lg bg-surface-100 border border-white/10 text-xs text-white font-mono"
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
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-surface-100 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
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

                <div className="p-4 rounded-xl bg-surface-100 border border-white/5 text-xs text-slate-300 space-y-2">
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

          {/* SECTION 3: GENERAL & PLAYBACK */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-display">General & Playback</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Customize card interactions, video autoplay, and motion effects.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-xl bg-surface-100/60 border border-white/5 cursor-pointer hover:bg-surface-100 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white">Enable Hover Trailer Previews</div>
                    <div className="text-[11px] text-slate-400">
                      Hovering on a movie card for 400ms automatically starts a muted trailer preview.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.enableHoverTrailers !== false}
                    onChange={(e) => updatePreferences({ enableHoverTrailers: e.target.checked })}
                    className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl bg-surface-100/60 border border-white/5 cursor-pointer hover:bg-surface-100 transition-colors">
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

                <label className="flex items-center justify-between p-4 rounded-xl bg-surface-100/60 border border-white/5 cursor-pointer hover:bg-surface-100 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white">Reduced Motion</div>
                    <div className="text-[11px] text-slate-400">
                      Disable card zooms and background transitions for accessibility.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.reduceMotion === true}
                    onChange={(e) => updatePreferences({ reduceMotion: e.target.checked })}
                    className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* SECTION 4: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-display">Recommendation Preferences</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Fine-tune what RoninPLEX surfaces on your home and discovery feeds.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Favorite Genres</label>
                  <div className="flex flex-wrap gap-2">
                    {availableGenres.map(g => {
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

                <div className="space-y-2 pt-2">
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
          )}

          {/* SECTION 5: STORAGE & PRIVACY */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-display">Storage & Privacy</h2>
                <p className="text-xs text-slate-400 mt-1">
                  All viewing history, progress, and settings reside strictly on your local laptop.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5 space-y-2">
                  <div className="text-xs text-slate-400">Continue Watching</div>
                  <div className="text-2xl font-bold text-white">{continueWatching.length} titles</div>
                  <button
                    type="button"
                    onClick={clearContinueWatching}
                    className="w-full py-1.5 rounded-lg bg-surface-50 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors"
                  >
                    Clear Progress
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5 space-y-2">
                  <div className="text-xs text-slate-400">Watchlist</div>
                  <div className="text-2xl font-bold text-white">{watchlist.length} saved</div>
                  <button
                    type="button"
                    onClick={clearWatchlist}
                    className="w-full py-1.5 rounded-lg bg-surface-50 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors"
                  >
                    Clear Watchlist
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5 space-y-2">
                  <div className="text-xs text-slate-400">Watched History</div>
                  <div className="text-2xl font-bold text-white">{watched.length} watched</div>
                  <button
                    type="button"
                    onClick={clearWatched}
                    className="w-full py-1.5 rounded-lg bg-surface-50 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors"
                  >
                    Clear History
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all RoninPLEX settings, history, and preferences to defaults?')) {
                      resetPreferences();
                      clearWatchlist();
                      clearWatched();
                      clearContinueWatching();
                      handleResetProvider();
                      showToast('info', 'Factory Reset Complete', 'All application state restored to defaults.');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset All Local Application Data</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 6: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-display">About RoninPLEX</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Personal cinema streaming and discovery application for Windows.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Application:</span>
                    <span className="text-white font-bold">RoninPLEX Desktop</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Version:</span>
                    <span className="text-brand-400 font-bold">1.1.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Desktop Engine:</span>
                    <span className="text-white font-semibold">Tauri 2 (Rust / WebView2)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Frontend:</span>
                    <span className="text-white font-semibold">React 19 + TypeScript + Vite + Tailwind CSS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Streaming Engine:</span>
                    <span className="text-white font-semibold">HLS.js + HTML5 Video Player + Embed Engine</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  RoninPLEX combines TMDB metadata, YouTube trailer playback, and a completely modular streaming provider architecture. Built exclusively for personal, private laptop usage.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
