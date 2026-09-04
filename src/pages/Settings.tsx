import React, { useState, useEffect } from 'react';
import { useAppReadyWhen } from '../hooks/useAppReadyWhen';
import { useUser } from '../context/UserContext';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { DiagnosticsViewer } from '../components/modals/DiagnosticsViewer';
import { HomeSectionItem, DEFAULT_HOME_SECTIONS, DeclarativeCustomProvider } from '../types/user';
import { useApiKey } from '../context/ApiKeyContext';
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
  Monitor,
  Cloud,
  Server,
  Palette,
  ShieldCheck,
  Plus,
  RefreshCw,
  Download,
  ExternalLink
} from 'lucide-react';
import { storage } from '../services/storage';
import { version } from '../../package.json';
import { RoninLogo } from '../components/common/RoninLogo';
import { streamingManager } from '../services/streaming/StreamingManager';
import { validateCustomProviderUrl } from '../services/streaming/providers/CustomConfigProvider';
import { updaterService, UpdateCheckResult, UpdateChannel } from '../services/updater';
import { UpdateModal } from '../components/modals/UpdateModal';
import { ArchitectureDiagram } from '../components/about/ArchitectureDiagram';
import { DownloadResolver } from '../services/download/DownloadResolver';

type SettingsTab = 'playback' | 'appearance' | 'home' | 'data' | 'services' | 'about';

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

  const { hasUserKey, isFallbackActive, isConnectionValid, updateApiKey, removeApiKey, checkConnectionState, isValidating } = useApiKey();
  const [tmdbInput, setTmdbInput] = useState('');

  const [activeTab, setActiveTab] = useState<SettingsTab>('playback');

  // Updater State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [updateChannel, setUpdateChannel] = useState<UpdateChannel>('stable');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);

  const handleCheckForUpdates = async (channel: UpdateChannel = updateChannel) => {
    setIsCheckingUpdate(true);
    try {
      const res = await updaterService.checkForUpdates(channel);
      setUpdateResult(res);
      setLastCheckedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (res.updateAvailable && res.release) {
        setIsUpdateModalOpen(true);
      }
    } catch (err: any) {
      setUpdateResult({
        updateAvailable: false,
        currentVersion: version,
        latestVersion: version,
        release: null,
        error: err?.message || 'Failed to check for updates.',
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  };
  
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

  // Custom Declarative Providers State
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMovieUrl, setCustomMovieUrl] = useState('');
  const [customTvUrl, setCustomTvUrl] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const handleAddCustomProvider = () => {
    setCustomError(null);
    if (!customName.trim()) {
      setCustomError('Provider name is required.');
      return;
    }
    const movieValidation = validateCustomProviderUrl(customMovieUrl);
    if (!movieValidation.valid) {
      setCustomError(`Movie URL error: ${movieValidation.error}`);
      return;
    }
    const tvValidation = validateCustomProviderUrl(customTvUrl);
    if (!tvValidation.valid) {
      setCustomError(`TV URL error: ${tvValidation.error}`);
      return;
    }

    const newProvider: DeclarativeCustomProvider = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      enabled: true,
      priority: 10,
      movieUrlTemplate: customMovieUrl.trim(),
      tvUrlTemplate: customTvUrl.trim(),
      supportedTypes: ['movie', 'tv'],
      mode: 'embed',
    };

    const updated = [...(preferences.customProviders || []), newProvider];
    updatePreferences({ customProviders: updated });
    setCustomName('');
    setCustomMovieUrl('');
    setCustomTvUrl('');
    setIsAddingProvider(false);
  };

  const handleDeleteCustomProvider = (id: string) => {
    const updated = (preferences.customProviders || []).filter(p => p.id !== id);
    updatePreferences({ customProviders: updated });
  };

  // Custom Download Endpoints State
  const [downloadMovieInput, setDownloadMovieInput] = useState(preferences.customDownloadMovieUrl || '');
  const [downloadTvInput, setDownloadTvInput] = useState(preferences.customDownloadTvUrl || '');
  const [downloadSaveMsg, setDownloadSaveMsg] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    setDownloadMovieInput(preferences.customDownloadMovieUrl || '');
    setDownloadTvInput(preferences.customDownloadTvUrl || '');
  }, [preferences.customDownloadMovieUrl, preferences.customDownloadTvUrl]);

  const handleSaveDownloadEndpoints = () => {
    setDownloadError(null);
    if (downloadMovieInput.trim()) {
      const v = DownloadResolver.validateUrl(downloadMovieInput.replace(/\{tmdbId\}|\{id\}|\{type\}/g, '123'));
      if (!v.isValid) {
        setDownloadError(`Movie download URL error: ${v.reason}`);
        return;
      }
    }
    if (downloadTvInput.trim()) {
      const v = DownloadResolver.validateUrl(downloadTvInput.replace(/\{tmdbId\}|\{id\}|\{season\}|\{episode\}|\{type\}/g, '123'));
      if (!v.isValid) {
        setDownloadError(`TV download URL error: ${v.reason}`);
        return;
      }
    }
    updatePreferences({
      customDownloadMovieUrl: downloadMovieInput.trim(),
      customDownloadTvUrl: downloadTvInput.trim(),
    });
    setDownloadSaveMsg('Custom download endpoints saved successfully.');
    setTimeout(() => setDownloadSaveMsg(null), 3000);
  };

  const handleTmdbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmdbInput.trim()) return;
    const success = await updateApiKey(tmdbInput);
    if (success) {
      await checkConnectionState();
      setTmdbInput('');
    } else {
      alert('Invalid TMDB API Key.');
    }
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
            type="button"
            onClick={() => setActiveTab('playback')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all focus-ring ${
              activeTab === 'playback' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PlaySquare className="w-4 h-4" />
            Playback
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all focus-ring ${
              activeTab === 'appearance' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Appearance & Motion
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all focus-ring ${
              activeTab === 'home' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layout className="w-4 h-4" />
            Home & Discovery
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all focus-ring ${
              activeTab === 'data' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4" />
            Data
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all focus-ring ${
              activeTab === 'services' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Services
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all focus-ring ${
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

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Play trailers on card hover</h3>
                    <p className="text-xs text-slate-400 mt-1">Preview video trailers when hovering over movie and TV cards.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.enableHoverTrailers === true}
                      onChange={(e) => handlePreferenceChange('enableHoverTrailers', e.target.checked)}
                      aria-label="Play trailers on card hover"
                    />
                    <div className="w-11 h-6 bg-surface-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
                  </label>
                </div>
              </section>
            </div>
          )}

          {/* APPEARANCE & MOTION */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-slide-up">
              {/* Glass Cards Styling Section */}
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-brand-400" />
                  Glass-Style Movie Cards
                </h2>
                <p className="text-xs text-slate-400">Customize the premium frosted-glass design tokens and physics for poster cards.</p>

                {/* Glass Cards ON/OFF */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Glass Cards</h3>
                    <p className="text-xs text-slate-400 mt-1">Enable translucent frosted-glass aesthetic with backdrop filters.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.enableGlassCards !== false}
                      onChange={(e) => handlePreferenceChange('enableGlassCards', e.target.checked)}
                      aria-label="Glass Cards"
                    />
                    <div className="w-11 h-6 bg-surface-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
                  </label>
                </div>

                {/* Card Glass Opacity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Glass Opacity ({preferences.cardGlassOpacity ?? 35}%)</h3>
                    <p className="text-xs text-slate-400 mt-1">Controls the density of the translucent glass card surface.</p>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={5}
                    value={preferences.cardGlassOpacity ?? 35}
                    onChange={(e) => handlePreferenceChange('cardGlassOpacity', Number(e.target.value))}
                    className="w-44 accent-brand-500"
                    aria-label="Card Glass Opacity"
                  />
                </div>

                {/* Card Blur Strength */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Blur Strength</h3>
                    <p className="text-xs text-slate-400 mt-1">Hardware-accelerated backdrop blur radius behind cards.</p>
                  </div>
                  <select
                    value={preferences.cardBlurStrength || 'md'}
                    onChange={(e) => handlePreferenceChange('cardBlurStrength', e.target.value)}
                    className="bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white outline-none focus:border-brand-500"
                    aria-label="Blur Strength"
                  >
                    <option value="none">None (0px)</option>
                    <option value="sm">Subtle (8px)</option>
                    <option value="md">Balanced (16px)</option>
                    <option value="lg">Deep Frost (24px)</option>
                  </select>
                </div>

                {/* Card Border Visibility */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Border Visibility</h3>
                    <p className="text-xs text-slate-400 mt-1">Render delicate translucent border edges on movie cards.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.cardBorderVisibility !== false}
                      onChange={(e) => handlePreferenceChange('cardBorderVisibility', e.target.checked)}
                      aria-label="Border Visibility"
                    />
                    <div className="w-11 h-6 bg-surface-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
                  </label>
                </div>

                {/* Card Glow */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Ambient Glow on Hover</h3>
                    <p className="text-xs text-slate-400 mt-1">Radiate subtle purple ambient neon aura on hovered cards.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.cardGlow !== false}
                      onChange={(e) => handlePreferenceChange('cardGlow', e.target.checked)}
                      aria-label="Ambient Glow on Hover"
                    />
                    <div className="w-11 h-6 bg-surface-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
                  </label>
                </div>

                {/* Card Corner Radius */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Corner Radius</h3>
                    <p className="text-xs text-slate-400 mt-1">Curvature of movie and TV card perimeters.</p>
                  </div>
                  <select
                    value={preferences.cardCornerRadius || 'rounded-xl'}
                    onChange={(e) => handlePreferenceChange('cardCornerRadius', e.target.value)}
                    className="bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white outline-none focus:border-brand-500"
                    aria-label="Corner Radius"
                  >
                    <option value="rounded-lg">Slight (Rounded Lg)</option>
                    <option value="rounded-xl">Classic (Rounded XL)</option>
                    <option value="rounded-2xl">Modern (Rounded 2XL)</option>
                  </select>
                </div>

                {/* Card Elevation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Card Shadow Elevation</h3>
                    <p className="text-xs text-slate-400 mt-1">Depth drop shadow intensity behind cards.</p>
                  </div>
                  <select
                    value={preferences.cardElevation || 'lg'}
                    onChange={(e) => handlePreferenceChange('cardElevation', e.target.value)}
                    className="bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white outline-none focus:border-brand-500"
                    aria-label="Card Shadow Elevation"
                  >
                    <option value="none">Flat (No Shadow)</option>
                    <option value="sm">Subtle</option>
                    <option value="md">Medium</option>
                    <option value="lg">Elevated (Default)</option>
                    <option value="2xl">Cinematic 2XL</option>
                  </select>
                </div>

                {/* Card Hover Lift */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Hover Motion Lift</h3>
                    <p className="text-xs text-slate-400 mt-1">Vertical displacement when hovering over media cards.</p>
                  </div>
                  <select
                    value={preferences.cardHoverIntensity || 'normal'}
                    onChange={(e) => handlePreferenceChange('cardHoverIntensity', e.target.value)}
                    className="bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white outline-none focus:border-brand-500"
                    aria-label="Hover Motion Lift"
                  >
                    <option value="subtle">Subtle (-2px)</option>
                    <option value="normal">Standard (-4px)</option>
                    <option value="lifted">Expressive (-8px)</option>
                  </select>
                </div>

                {/* Badge Style */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Card Badge Style</h3>
                    <p className="text-xs text-slate-400 mt-1">Format of Movie/TV/Anime type tags on card corners.</p>
                  </div>
                  <select
                    value={preferences.cardBadgeStyle || 'glass'}
                    onChange={(e) => handlePreferenceChange('cardBadgeStyle', e.target.value)}
                    className="bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white outline-none focus:border-brand-500"
                    aria-label="Card Badge Style"
                  >
                    <option value="glass">Glass Pill (Translucent)</option>
                    <option value="solid">High-Contrast Solid</option>
                    <option value="minimal">Minimalist Border</option>
                  </select>
                </div>

                {/* Badge Visibility */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Show Corner Badges</h3>
                    <p className="text-xs text-slate-400 mt-1">Display media type and rating badges on cards.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.cardBadgeVisibility !== false}
                      onChange={(e) => handlePreferenceChange('cardBadgeVisibility', e.target.checked)}
                      aria-label="Show Corner Badges"
                    />
                    <div className="w-11 h-6 bg-surface-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
                  </label>
                </div>
              </section>

              {/* Animation & Motion Section */}
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-400" />
                  Motion & Animations
                </h2>

                {/* Scramble Text Effect */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Scramble Text Animation</h3>
                    <p className="text-xs text-slate-400 mt-1">Futuristic decoding character shimmer on titles and section headers.</p>
                  </div>
                  <select
                    value={preferences.scrambleAnimationIntensity || 'cinematic'}
                    onChange={(e) => handlePreferenceChange('scrambleAnimationIntensity', e.target.value)}
                    className="bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white outline-none focus:border-brand-500"
                    aria-label="Scramble Text Animation"
                  >
                    <option value="cinematic">Cinematic (Smooth Reveal)</option>
                    <option value="fast">Fast (Instant Reveal)</option>
                    <option value="off">Off (Static Text)</option>
                  </select>
                </div>
                
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

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
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

          {/* SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-6 animate-slide-up">
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-brand-400" />
                  Connected Services
                </h2>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-white">The Movie Database (TMDB)</h3>
                    <p className="text-xs text-slate-400">
                      RoninPLEX uses TMDB for comprehensive metadata and discovery.
                    </p>
                  </div>

                  <div className="bg-surface-100/50 border border-white/5 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnectionValid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-sm font-medium text-slate-300">
                          {isConnectionValid
                            ? (hasUserKey ? 'Connected (Personal API Key)' : 'Connected (Default Configuration)')
                            : 'Disconnected'}
                        </span>
                      </div>
                      {hasUserKey && (
                        <button
                          onClick={async () => {
                            await removeApiKey();
                            await checkConnectionState();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors border border-rose-500/20"
                        >
                          Remove Key
                        </button>
                      )}
                    </div>

                    {!hasUserKey && (
                      <form onSubmit={handleTmdbSubmit} className="flex gap-2 mt-2">
                        <input
                          type="password"
                          value={tmdbInput}
                          onChange={(e) => setTmdbInput(e.target.value)}
                          placeholder="Enter your TMDB API Key (v3)"
                          className="flex-grow px-3 py-2 rounded-lg glass-subtle text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                        />
                        <button
                          type="submit"
                          disabled={isValidating || !tmdbInput.trim()}
                          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                        >
                          {isValidating ? 'Checking...' : 'Connect Key'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </section>

              {/* Streaming Providers & Custom Configuration */}
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-brand-400" />
                  Streaming Providers
                </h2>
                <p className="text-xs text-slate-400">Configure primary playback engine, multi-source fallbacks, and custom providers.</p>

                {/* Default Provider */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Default Primary Provider</h3>
                    <p className="text-xs text-slate-400 mt-1">First provider attempted when initiating playback.</p>
                  </div>
                  <select
                    value={preferences.defaultProvider || 'rive'}
                    onChange={(e) => {
                      handlePreferenceChange('defaultProvider', e.target.value);
                      streamingManager.setActiveProviderId(e.target.value);
                    }}
                    className="bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white outline-none focus:border-brand-500"
                    aria-label="Default Primary Provider"
                  >
                    <option value="rive">RiveStream (rivestream.app) [Recommended]</option>
                    <option value="vidsrc-me">VidSrc Me (vidsrcme.ru)</option>
                    <option value="vidsrc-to">VidSrc To (vidsrc2.to)</option>
                    <option value="2embed">2Embed (2embed.cc)</option>
                    <option value="vidlink">VidLink Pro</option>
                    <option value="custom">Custom Provider</option>
                  </select>
                </div>

                {/* Default Server for Rive */}
                {(preferences.defaultProvider === 'rive' || !preferences.defaultProvider) && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                    <div>
                      <h3 className="text-sm font-semibold text-white">RiveStream Server Engine</h3>
                      <p className="text-xs text-slate-400 mt-1">Default source endpoint for RiveStream embeds.</p>
                    </div>
                    <select
                      value={preferences.defaultServer || 'standard'}
                      onChange={(e) => {
                        handlePreferenceChange('defaultServer', e.target.value);
                        streamingManager.setProviderServer('rive', e.target.value);
                      }}
                      className="bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white outline-none focus:border-brand-500"
                      aria-label="RiveStream Server Engine"
                    >
                      <option value="standard">Standard (Fast Global CDN)</option>
                      <option value="aggregator">Aggregator (Multi-Source Fallback)</option>
                      <option value="torrent">Torrent (High Quality Stream)</option>
                    </select>
                  </div>
                )}

                {/* Auto Fallback */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Automatic Multi-Provider Fallback</h3>
                    <p className="text-xs text-slate-400 mt-1">Silently attempt next available providers if primary stream is unavailable.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.autoProviderFallback !== false}
                      onChange={(e) => handlePreferenceChange('autoProviderFallback', e.target.checked)}
                      aria-label="Automatic Multi-Provider Fallback"
                    />
                    <div className="w-11 h-6 bg-surface-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
                  </label>
                </div>

                {/* Advanced Custom Declarative Providers */}
                <div className="pt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-brand-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Advanced Custom Providers</h3>
                    </div>
                    {!isAddingProvider && (
                      <button
                        onClick={() => setIsAddingProvider(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Custom Provider
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Define custom declarative streaming providers. Requires validated HTTPS templates containing the <code className="text-brand-300">{"{tmdbId}"}</code> placeholder. No executable code or unsafe protocols are permitted.
                  </p>

                  {/* Add Provider Form */}
                  {isAddingProvider && (
                    <div className="p-4 rounded-xl bg-surface-100/60 border border-brand-500/30 space-y-3 animate-fade-in">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">New Custom Provider</h4>
                      {customError && (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                          {customError}
                        </div>
                      )}
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="Provider Name (e.g. My Custom Stream)"
                          className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                        />
                        <input
                          type="text"
                          value={customMovieUrl}
                          onChange={(e) => setCustomMovieUrl(e.target.value)}
                          placeholder="Movie URL Template (e.g. https://provider.app/embed/movie/{tmdbId})"
                          className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                        />
                        <input
                          type="text"
                          value={customTvUrl}
                          onChange={(e) => setCustomTvUrl(e.target.value)}
                          placeholder="TV URL Template (e.g. https://provider.app/embed/tv/{tmdbId}/{season}/{episode})"
                          className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            setIsAddingProvider(false);
                            setCustomError(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 text-slate-300 text-xs font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddCustomProvider}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
                        >
                          Save Provider
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Custom Providers */}
                  {(preferences.customProviders || []).length > 0 ? (
                    <div className="space-y-2">
                      {preferences.customProviders.map((cp) => (
                        <div key={cp.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-100/50 border border-white/5">
                          <div>
                            <p className="text-xs font-bold text-white">{cp.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono truncate max-w-md">{cp.movieUrlTemplate}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteCustomProvider(cp.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-colors"
                            title="Delete Provider"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 border border-dashed border-white/10 rounded-xl text-xs text-slate-500">
                      No custom providers configured yet. Standard built-in providers are active.
                    </div>
                  )}
                </div>
              </section>

              {/* Custom Download Endpoints */}
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      <Download className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Custom Download Endpoints</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Configure custom download resolver endpoints. Strict HTTPS and SSRF protection enforced.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Supports placeholders: <code className="text-brand-300">{"{tmdbId}"}</code>, <code className="text-brand-300">{"{season}"}</code>, <code className="text-brand-300">{"{episode}"}</code>. If empty, standard built-in resolver (RiveStream) is utilized.
                  </p>

                  {downloadError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                      {downloadError}
                    </div>
                  )}

                  {downloadSaveMsg && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>{downloadSaveMsg}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Movie Download URL Template</label>
                      <input
                        type="text"
                        value={downloadMovieInput}
                        onChange={(e) => setDownloadMovieInput(e.target.value)}
                        placeholder="e.g. https://my-download-service.com/movie/{tmdbId}"
                        className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">TV Show Download URL Template</label>
                      <input
                        type="text"
                        value={downloadTvInput}
                        onChange={(e) => setDownloadTvInput(e.target.value)}
                        placeholder="e.g. https://my-download-service.com/tv/{tmdbId}/{season}/{episode}"
                        className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={handleSaveDownloadEndpoints}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors shadow-lg shadow-brand-600/20"
                    >
                      Save Download Endpoints
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ABOUT & ARCHITECTURE */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-slide-up">
              {/* Brand & Overview */}
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle text-center flex flex-col items-center">
                <RoninLogo size={56} showText={false} className="mb-2" />
                <h2 className="text-xl font-bold text-white font-display">RoninPLEX</h2>
                <div className="text-sm text-slate-400 max-w-md mx-auto space-y-4">
                  <p className="font-mono text-xs text-brand-300">v{version} • Desktop Production</p>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    Developed with native DOM APIs, Webview2, and high-performance Rust Tauri runtime. Built on the principle of providing a cinematic, zero-compromise, offline-ready streaming environment.
                  </p>
                  <div className="pt-3 border-t border-white/10 flex flex-col items-center gap-1.5 text-xs">
                    <p className="text-slate-300">Developed by <span className="text-white font-semibold">Ronin Development Team</span></p>
                    <a
                      href="https://github.com/Pranitgshende/RoninPLEX"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors underline font-medium"
                    >
                      <span>https://github.com/Pranitgshende/RoninPLEX</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </section>

              {/* Updates Section */}
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      <Sparkles className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Software Updates</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dynamic GitHub Releases discovery with checksum validation.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={updateChannel}
                      onChange={(e) => {
                        const ch = e.target.value as UpdateChannel;
                        setUpdateChannel(ch);
                        handleCheckForUpdates(ch);
                      }}
                      className="bg-surface-100 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-brand-500"
                      aria-label="Update Channel"
                    >
                      <option value="stable">Stable Channel</option>
                      <option value="beta">Beta / Pre-releases</option>
                    </select>

                    <button
                      onClick={() => handleCheckForUpdates()}
                      disabled={isCheckingUpdate}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-brand-600/30"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                      <span>{isCheckingUpdate ? 'Checking...' : 'Check for Updates'}</span>
                    </button>
                  </div>
                </div>

                {/* Update Status Card */}
                {isCheckingUpdate && (
                  <div className="p-4 rounded-xl bg-surface-100/40 border border-white/5 flex items-center gap-3 text-xs text-slate-300">
                    <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin shrink-0" />
                    <span>Querying GitHub Releases for updates...</span>
                  </div>
                )}

                {updateResult && !isCheckingUpdate && (
                  <div className="space-y-3">
                    {updateResult.updateAvailable && updateResult.release ? (
                      <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 flex flex-wrap items-center justify-between gap-4 animate-fade-in">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                              v{updateResult.release.version}
                            </span>
                            <span className="text-xs font-bold text-white">New version available!</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Current: v{version} • Published: {new Date(updateResult.release.publishedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setIsUpdateModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-brand-600/20"
                        >
                          <span>View Release & Download</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : updateResult.error ? (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-2">
                        <span>{updateResult.error}</span>
                        <button
                          onClick={() => handleCheckForUpdates()}
                          className="text-xs underline hover:text-white shrink-0"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-2 text-xs text-emerald-300">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>RoninPLEX is up to date (v{version}).</span>
                        </div>
                        {lastCheckedTime && (
                          <span className="text-[11px] text-slate-400">Checked at {lastCheckedTime}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Architecture Section */}
              <section className="bg-surface-200/40 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 glass-subtle">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Architecture & Provider Pipeline</h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive technical blueprint of RoninPLEX v2.1.1 production subsystems.
                  </p>
                </div>
                <ArchitectureDiagram />
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

      {/* Software Update Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        release={updateResult?.release || null}
        currentVersion={version}
      />
    </div>
  );
};
