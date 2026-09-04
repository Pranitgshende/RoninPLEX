import React, { useEffect, useRef } from 'react';
import { Server, X, Check, Loader2, AlertTriangle } from 'lucide-react';
import { PremiumGlowBorder } from '../common/PremiumGlowBorder';
import { streamingManager } from '../../services/streaming/StreamingManager';

export interface ProviderMenuProps {
  activeProviderId: string;
  activeProviderName: string;
  mediaType: 'movie' | 'tv' | 'anime';
  onSelectProvider: (providerId: string) => Promise<boolean | void> | void;
  onSelectMode?: (modeId: string) => Promise<boolean | void> | void;
  currentMode?: string;
  isResolving?: boolean;
  resolvingProviderId?: string | null;
  resolutionStatus?: string;
  resolutionError?: string | null;
  onClose: () => void;
  align?: 'left' | 'right';
}

export const ProviderMenu: React.FC<ProviderMenuProps> = ({
  activeProviderId,
  activeProviderName,
  mediaType,
  onSelectProvider,
  onSelectMode,
  currentMode = 'standard',
  isResolving = false,
  resolvingProviderId = null,
  resolutionStatus = '',
  resolutionError = null,
  onClose,
  align = 'right',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Capability-filtered providers (strictly non-parked, content-matched)
  const eligibleProviders = streamingManager.getEligibleProviders(mediaType);
  const healthSummary = streamingManager.getProviderHealthSummary();

  const isRiveActive = activeProviderId === 'rive';
  const riveModes = isRiveActive ? streamingManager.getAvailableModes('rive') : [];

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 w-76 z-50 animate-fade-in player-control-surface select-none`}
    >
      <PremiumGlowBorder borderRadius="rounded-2xl" intensity="subtle">
        <div className="bg-surface-200/95 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl shadow-2xl space-y-3 text-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Streaming Provider
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Close Menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Providers List */}
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
            {eligibleProviders.map((provider) => {
              const pId = provider.getId();
              const isCurrent = activeProviderId === pId;
              const isResolvingThis = isResolving && resolvingProviderId === pId;
              const health = healthSummary[pId];
              const hasRecentFailures = health && health.failureCount > 0;

              return (
                <button
                  key={pId}
                  disabled={isResolving}
                  onClick={() => {
                    if (!isCurrent || isResolving) {
                      onSelectProvider(pId);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all ${
                    isCurrent
                      ? 'bg-brand-500/25 text-brand-300 border border-brand-500/40 font-semibold shadow-sm'
                      : 'hover:bg-white/10 text-slate-300 hover:text-white border border-transparent'
                  } ${isResolving ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {/* Status Dot */}
                    {isResolvingThis ? (
                      <Loader2 className="w-3 h-3 animate-spin text-brand-400 shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 shrink-0" />
                    ) : hasRecentFailures ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Recent failover reported" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-500/60 shrink-0" />
                    )}

                    <span className="truncate">{provider.getName()}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCurrent && !isResolvingThis && (
                      <Check className="w-3.5 h-3.5 text-brand-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rive Modes (Standard, Aggregator, Torrent) */}
          {isRiveActive && riveModes.length > 0 && (
            <div className="border-t border-white/10 pt-2.5 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                Rive Mode
              </span>
              <div className="grid grid-cols-1 gap-1">
                {riveModes.map((mode) => {
                  const isCurrentMode = currentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      disabled={isResolving}
                      onClick={() => {
                        if (!isCurrentMode && onSelectMode) {
                          onSelectMode(mode.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left transition-all ${
                        isCurrentMode
                          ? 'bg-brand-500/25 text-brand-300 border border-brand-500/40 font-semibold'
                          : 'hover:bg-white/10 text-slate-300 hover:text-white border border-transparent'
                      } ${isResolving ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
                    >
                      <div>
                        <p className="font-medium leading-tight">{mode.name}</p>
                        {mode.description && (
                          <p className="text-[10px] text-slate-400 leading-tight">{mode.description}</p>
                        )}
                      </div>
                      {isCurrentMode && <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resolution Error Banner */}
          {resolutionError && (
            <div className="flex items-start gap-2 text-[11px] text-rose-300 bg-rose-500/15 p-2 rounded-xl border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-tight">{resolutionError}</span>
            </div>
          )}

          {/* Live Resolution Status Indicator */}
          {resolutionStatus && !resolutionError && (
            <div className="text-[11px] text-brand-300 bg-brand-500/10 px-2.5 py-1.5 rounded-xl border border-brand-500/20 truncate flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-brand-400 shrink-0" />
              <span className="truncate">{resolutionStatus}</span>
            </div>
          )}
        </div>
      </PremiumGlowBorder>
    </div>
  );
};
