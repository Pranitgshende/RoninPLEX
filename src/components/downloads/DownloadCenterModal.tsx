import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Play,
  Pause,
  Trash2,
  FolderOpen,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  HardDrive,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { PremiumGlowBorder } from '../common/PremiumGlowBorder';
import {
  downloadService,
  DownloadItem,
  DownloadSettings as SettingsType,
} from '../../services/download/downloadService';

export interface DownloadCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadCenterModal: React.FC<DownloadCenterModalProps> = ({ isOpen, onClose }) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [settings, setSettings] = useState<SettingsType>({
    download_dir: '',
    max_concurrent_downloads: 3,
    auto_resume_on_startup: true,
  });
  const [activeTab, setActiveTab] = useState<'downloads' | 'settings'>('downloads');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [deleteFileOnDisk, setDeleteFileOnDisk] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load initial downloads and settings
  const refreshData = async () => {
    const list = await downloadService.getDownloads();
    setDownloads(list);
    const s = await downloadService.getDownloadSettings();
    setSettings(s);
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshData();

    // Subscribe to live progress and status events
    const unsubProgress = downloadService.onProgress((updatedItem) => {
      setDownloads((prev) =>
        prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
    });

    const unsubStatus = downloadService.onStatusChanged((updatedItem) => {
      setDownloads((prev) => {
        const exists = prev.some((item) => item.id === updatedItem.id);
        if (exists) {
          return prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
        }
        return [updatedItem, ...prev];
      });
    });

    return () => {
      unsubProgress();
      unsubStatus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeCount = downloads.filter(
    (d) => d.status === 'downloading' || d.status === 'queued'
  ).length;

  const completedCount = downloads.filter((d) => d.status === 'completed').length;

  const handlePause = async (id: string) => {
    await downloadService.pauseDownload(id);
    refreshData();
  };

  const handleResume = async (id: string) => {
    await downloadService.resumeDownload(id);
    refreshData();
  };

  const handleCancel = async (id: string) => {
    await downloadService.cancelDownload(id);
    refreshData();
  };

  const handleDelete = async (id: string) => {
    await downloadService.deleteDownload(id, deleteFileOnDisk);
    setDeleteConfirmationId(null);
    setDeleteFileOnDisk(false);
    refreshData();
  };

  const handleSaveSettings = async () => {
    await downloadService.updateDownloadSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <PremiumGlowBorder className="w-full bg-surface-100/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surface-200/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Download Center</span>
                  {activeCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 animate-pulse">
                      {activeCount} Active
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  Native Rust stream downloader with chunked resume
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadService.openDownloadFolder()}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Open Downloads Folder"
              >
                <FolderOpen className="w-4 h-4 text-brand-400" />
                <span className="hidden sm:inline">Folder</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-4 px-6 border-b border-white/5 bg-surface-200/20 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('downloads')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'downloads'
                  ? 'border-brand-500 text-brand-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileVideo className="w-4 h-4" />
              <span>Downloads ({downloads.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'border-brand-500 text-brand-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>

          {/* Tab Content: Downloads List */}
          {activeTab === 'downloads' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {downloads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-3">
                  <Download className="w-12 h-12 text-slate-600 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-slate-300">No downloads queued yet</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Downloads initiated from movies, TV episodes, or verified direct streams will appear here.
                  </p>
                </div>
              ) : (
                downloads.map((item) => {
                  const percent =
                    item.total_bytes > 0
                      ? Math.min(100, Math.round((item.downloaded_bytes / item.total_bytes) * 100))
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-surface-200/60 border border-white/5 hover:border-white/10 transition-colors space-y-3"
                    >
                      {/* Title & Status Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate" title={item.title}>
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            {item.media_type === 'tv' && item.season_number && item.episode_number && (
                              <span className="text-brand-400 font-semibold">
                                S{item.season_number} E{item.episode_number}
                              </span>
                            )}
                            {item.media_type === 'anime' && item.episode_number && (
                              <span className="text-rose-400 font-semibold">
                                Episode {item.episode_number}
                              </span>
                            )}
                            <span className="font-mono text-slate-500 truncate max-w-xs" title={item.file_name}>
                              {item.file_name}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.status === 'downloading' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                              <span>{percent}%</span>
                            </span>
                          )}
                          {item.status === 'paused' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Paused
                            </span>
                          )}
                          {item.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Done</span>
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1" title={item.error_message || 'Download failed'}>
                              <AlertCircle className="w-3 h-3" />
                              <span>Failed</span>
                            </span>
                          )}
                          {item.status === 'cancelled' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            item.status === 'completed'
                              ? 'bg-emerald-500'
                              : item.status === 'failed'
                              ? 'bg-rose-500'
                              : item.status === 'paused'
                              ? 'bg-amber-500'
                              : 'bg-brand-500'
                          }`}
                          style={{ width: `${item.status === 'completed' ? 100 : percent}%` }}
                        />
                      </div>

                      {/* Metrics and Action Controls */}
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                          <span>
                            {downloadService.formatBytes(item.downloaded_bytes)}
                            {item.total_bytes > 0 && ` / ${downloadService.formatBytes(item.total_bytes)}`}
                          </span>
                          {item.status === 'downloading' && (
                            <>
                              <span className="text-brand-400 font-bold">
                                {downloadService.formatSpeed(item.speed_bytes_per_sec)}
                              </span>
                              <span>ETA: {downloadService.formatEta(item.eta_seconds)}</span>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          {item.status === 'downloading' && (
                            <button
                              onClick={() => handlePause(item.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                              title="Pause"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          )}

                          {(item.status === 'paused' || item.status === 'failed') && (
                            <button
                              onClick={() => handleResume(item.id)}
                              className="p-1.5 rounded-lg bg-brand-600/30 hover:bg-brand-600 text-brand-300 hover:text-white transition-colors"
                              title="Resume"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}

                          {item.status === 'completed' && (
                            <>
                              <button
                                onClick={() => downloadService.openDownloadFile(item.id)}
                                className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors"
                                title="Open File"
                              >
                                <FileVideo className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => downloadService.openDownloadFolder(item.id)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                title="Show in Folder"
                              >
                                <FolderOpen className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setDeleteConfirmationId(item.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Delete Confirmation Overlay */}
                      {deleteConfirmationId === item.id && (
                        <div className="p-3 rounded-lg bg-surface-300/90 border border-rose-500/30 mt-2 space-y-2">
                          <p className="text-xs font-semibold text-white">
                            Remove this download from the list?
                          </p>
                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={deleteFileOnDisk}
                              onChange={(e) => setDeleteFileOnDisk(e.target.checked)}
                              className="accent-rose-500 rounded"
                            />
                            <span>Also delete file from disk</span>
                          </label>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmationId(null);
                                setDeleteFileOnDisk(false);
                              }}
                              className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab Content: Settings */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Download Directory
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={settings.download_dir}
                    onChange={(e) =>
                      setSettings({ ...settings, download_dir: e.target.value })
                    }
                    placeholder="e.g. C:\Users\Username\Videos\RoninPLEX"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-200 border border-white/10 text-xs text-white outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    onClick={() => downloadService.openDownloadFolder()}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    <FolderOpen className="w-4 h-4 text-brand-400" />
                    <span>Browse</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Default folder where downloaded movies, TV episodes, and anime streams are saved.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Max Concurrent Downloads
                </label>
                <select
                  value={settings.max_concurrent_downloads}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      max_concurrent_downloads: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-200 border border-white/10 text-xs text-white outline-none focus:border-brand-500"
                >
                  <option value={1}>1 download at a time</option>
                  <option value={2}>2 downloads at a time</option>
                  <option value={3}>3 downloads at a time (Recommended)</option>
                  <option value={5}>5 downloads at a time</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-2"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Settings Saved</span>
                    </>
                  ) : (
                    <span>Save Settings</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </PremiumGlowBorder>
      </div>
    </div>
  );
};
