import React, { useState } from 'react';
import {
  Sparkles,
  X,
  ExternalLink,
  Download,
  FileCode,
  Package,
  Archive,
  CheckCircle2,
  Copy,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { ReleaseInfo, ReleaseAsset, updaterService } from '../../services/updater';
import { PremiumGlowBorder } from '../common/PremiumGlowBorder';
import { formatBytes } from '../../services/download/downloadService';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: ReleaseInfo | null;
  currentVersion: string;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  release,
  currentVersion,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !release) return null;

  const handleCopyLink = () => {
    if (release.htmlUrl) {
      navigator.clipboard.writeText(release.htmlUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenRelease = () => {
    updaterService.openReleaseInBrowser(release.htmlUrl);
  };

  const handleDownloadAsset = (asset: ReleaseAsset) => {
    updaterService.openReleaseInBrowser(asset.downloadUrl);
  };

  const getAssetIcon = (type: ReleaseAsset['type']) => {
    switch (type) {
      case 'installer':
        return <Package className="w-4 h-4 text-brand-400" />;
      case 'msi':
        return <Package className="w-4 h-4 text-indigo-400" />;
      case 'portable':
        return <Archive className="w-4 h-4 text-emerald-400" />;
      case 'checksum':
        return <FileCode className="w-4 h-4 text-amber-400" />;
      default:
        return <Download className="w-4 h-4 text-slate-400" />;
    }
  };

  const getAssetLabel = (asset: ReleaseAsset) => {
    if (asset.type === 'installer') return 'Windows Installer (.exe)';
    if (asset.type === 'msi') return 'Windows MSI Package (.msi)';
    if (asset.type === 'portable') return 'Portable Archive (.zip)';
    if (asset.type === 'checksum') return 'SHA256 Hashes (.txt)';
    return asset.name;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col">
        <PremiumGlowBorder
          borderRadius="rounded-2xl"
          intensity="medium"
          className="w-full h-full flex flex-col"
        >
          <div className="bg-surface-200/95 backdrop-blur-2xl rounded-2xl flex flex-col max-h-[85vh] overflow-hidden border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-start justify-between gap-4 bg-gradient-to-r from-brand-900/20 via-surface-200/40 to-transparent">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300 shadow-lg shadow-brand-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-display text-white">Update Available</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      v{release.version}
                    </span>
                    {release.isPrerelease && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Pre-release
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>Installed: v{currentVersion}</span>
                    {release.publishedAt && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(release.publishedAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
              {/* Release Title */}
              {release.name && release.name !== `v${release.version}` && (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">{release.name}</h3>
                </div>
              )}

              {/* Release Notes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Release Notes</h4>
                <div className="p-4 rounded-xl bg-surface-100/50 border border-white/5 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                  {release.body || 'No release notes provided for this version.'}
                </div>
              </div>

              {/* Assets / Downloads */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Assets</h4>
                {release.assets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {release.assets.map((asset) => (
                      <div
                        key={asset.name}
                        className="p-3 rounded-xl bg-surface-100/40 border border-white/5 hover:border-brand-500/40 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getAssetIcon(asset.type)}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
                              {getAssetLabel(asset)}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {formatBytes(asset.size)} • {asset.name}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadAsset(asset)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-brand-600 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1 shrink-0"
                          title={`Download ${asset.name}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Assets are published directly on the GitHub release page.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 bg-surface-200/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied URL' : 'Copy URL'}</span>
                </button>
                <button
                  onClick={handleOpenRelease}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>View on GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Later
                </button>
                {release.primaryAsset && (
                  <button
                    onClick={() => handleDownloadAsset(release.primaryAsset!)}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Installer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </PremiumGlowBorder>
      </div>
    </div>
  );
};
