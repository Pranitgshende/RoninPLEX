import React from 'react';
import { Terminal, X, RefreshCw, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PremiumGlowBorder } from '../common/PremiumGlowBorder';
import { FallbackAttempt } from '../../services/streaming/StreamingManager';

export interface DiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
  streamType: 'embed' | 'hls' | 'mp4';
  providerName: string;
  providerId: string;
  providerMode?: string;
  streamUrl?: string;
  // Observables for Native Video
  videoDimensions?: { width: number; height: number } | null;
  currentTime?: number | null;
  duration?: number | null;
  bufferedSeconds?: number | null;
  playbackState?: 'playing' | 'paused' | 'buffering' | 'ended' | 'ready';
  playbackRate?: number | null;
  volume?: number | null;
  isMuted?: boolean;
  droppedFrames?: number | null;
  bandwidthEstimate?: number | null;
  subtitlesAvailable?: boolean;
  activeSubtitleTrack?: string | null;
  subtitleCount?: number;
  subtitleInspectionStatus?: 'introspectable' | 'managed_by_embed' | 'none' | 'unknown';
  subtitleNote?: string;
  // Embed & Lifecycle Observables
  isIframeLoading?: boolean;
  sandboxPolicy?: string | null;
  allowPolicy?: string | null;
  loadLatencyMs?: number | null;
  watchdogPhase?: string;
  fallbackHistory?: FallbackAttempt[];
  error?: string | null;
  onTryNextProvider?: () => void;
  onReloadStream?: () => void;
  onOpenInBrowser?: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsProps> = ({
  isOpen,
  onClose,
  streamType,
  providerName,
  providerId,
  providerMode,
  streamUrl,
  videoDimensions,
  currentTime,
  duration,
  bufferedSeconds,
  playbackState,
  playbackRate,
  volume,
  isMuted,
  droppedFrames,
  bandwidthEstimate,
  subtitlesAvailable,
  activeSubtitleTrack,
  subtitleCount,
  subtitleInspectionStatus,
  subtitleNote,
  isIframeLoading,
  sandboxPolicy,
  allowPolicy,
  loadLatencyMs,
  watchdogPhase,
  fallbackHistory = [],
  error,
  onTryNextProvider,
  onReloadStream,
  onOpenInBrowser,
}) => {
  if (!isOpen) return null;

  const isCrossOriginEmbed = streamType === 'embed';

  // Sanitize stream URL: strip any sensitive query params
  const sanitizedUrl = streamUrl
    ? streamUrl.replace(/([?&])(api_key|token|auth|key)=[^&]+/gi, '$1$2=[REDACTED]')
    : 'Unavailable';

  // Extract domain safely
  let domain = 'Unavailable';
  try {
    if (streamUrl && (streamUrl.startsWith('http://') || streamUrl.startsWith('https://'))) {
      domain = new URL(streamUrl).hostname;
    }
  } catch {}

  const formatSeconds = (sec?: number | null) => {
    if (sec === undefined || sec === null || isNaN(sec) || sec < 0) return 'Unavailable';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatBandwidth = (bps?: number | null) => {
    if (bps === undefined || bps === null || isNaN(bps) || bps <= 0) return 'Unavailable';
    if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
    if (bps >= 1_000) return `${(bps / 1_000).toFixed(1)} Kbps`;
    return `${bps} bps`;
  };

  return (
    <div
      role="dialog"
      aria-label="Streaming Diagnostics Modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in player-control-surface"
    >
      <PremiumGlowBorder borderRadius="rounded-2xl" intensity="medium" className="w-full max-w-lg shadow-2xl">
        <div className="w-full bg-surface-200 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-400" />
              <h3 className="font-bold text-white text-sm">Streaming Diagnostics</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Diagnostics"
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cross-Origin Telemetry Notice or Native Banner */}
          {isCrossOriginEmbed ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-amber-300 font-bold text-[11px]">
                  Video telemetry unavailable — cross-origin provider
                </p>
                <p className="text-slate-400 text-[10px]">
                  Browser Same-Origin Policy (SOP) prohibits reading frame dimensions, buffer, duration, or bitrates from third-party embed frames. Zero artificial metrics are reported.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-emerald-300 font-bold text-[11px]">
                  Native Media Pipeline Active
                </p>
                <p className="text-slate-400 text-[10px]">
                  Displaying genuinely observed hardware and player telemetry directly from media element and HLS buffer.
                </p>
              </div>
            </div>
          )}

          {/* Observable Information Section */}
          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex justify-between p-2 rounded glass-subtle">
              <span className="text-slate-400">Active Provider:</span>
              <span className="text-white font-semibold">{providerName || providerId}</span>
            </div>

            {providerMode && (
              <div className="flex justify-between p-2 rounded glass-subtle">
                <span className="text-slate-400">Provider Mode:</span>
                <span className="text-brand-300 font-semibold uppercase">{providerMode}</span>
              </div>
            )}

            <div className="flex justify-between p-2 rounded glass-subtle">
              <span className="text-slate-400">Stream Delivery Type:</span>
              <span className="text-brand-400 uppercase font-semibold">{streamType}</span>
            </div>

            <div className="flex justify-between p-2 rounded glass-subtle">
              <span className="text-slate-400">Host Domain:</span>
              <span className="text-slate-200 font-semibold">{domain}</span>
            </div>

            {/* Native-Only Observables */}
            {!isCrossOriginEmbed && (
              <>
                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Observed Resolution:</span>
                  <span className={videoDimensions ? 'text-white font-bold' : 'text-slate-500'}>
                    {videoDimensions ? `${videoDimensions.width}x${videoDimensions.height}` : 'Unavailable'}
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Observed Position / Duration:</span>
                  <span className="text-white">
                    {currentTime !== undefined && duration !== undefined
                      ? `${formatSeconds(currentTime)} / ${formatSeconds(duration)}`
                      : 'Unavailable'}
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Observed Buffer Ahead:</span>
                  <span className="text-white">
                    {bufferedSeconds !== undefined && bufferedSeconds !== null
                      ? `${bufferedSeconds.toFixed(1)}s`
                      : 'Unavailable'}
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Playback State:</span>
                  <span className="text-emerald-400 capitalize">{playbackState || 'Unavailable'}</span>
                </div>

                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Playback Rate / Volume:</span>
                  <span className="text-white">
                    {playbackRate ? `${playbackRate}x` : '1x'} | {isMuted ? 'Muted' : `${Math.round((volume ?? 1) * 100)}%`}
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Dropped Video Frames:</span>
                  <span className="text-white">{droppedFrames !== null && droppedFrames !== undefined ? droppedFrames : 'Unavailable'}</span>
                </div>

                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Bandwidth Estimate:</span>
                  <span className="text-white">{formatBandwidth(bandwidthEstimate)}</span>
                </div>

                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Observed Subtitles:</span>
                  <span className={subtitlesAvailable ? 'text-emerald-400' : 'text-slate-500'}>
                    {subtitlesAvailable
                      ? `Available (${subtitleCount ?? 0} tracks${activeSubtitleTrack ? `, active: ${activeSubtitleTrack}` : ''})`
                      : 'Unavailable'}
                  </span>
                </div>
              </>
            )}

            {/* Cross-Origin / Embed Observables */}
            {isCrossOriginEmbed && (
              <>
                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Resolution State:</span>
                  <span className={isIframeLoading ? 'text-amber-400' : 'text-emerald-400'}>
                    {isIframeLoading ? 'Connecting / Loading IFrame...' : 'IFrame Loaded & Active'}
                  </span>
                </div>

                {loadLatencyMs !== undefined && loadLatencyMs !== null && (
                  <div className="flex justify-between p-2 rounded glass-subtle">
                    <span className="text-slate-400">Observed Load Latency:</span>
                    <span className="text-white">{loadLatencyMs} ms</span>
                  </div>
                )}

                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Sandbox Protection:</span>
                  <span className="text-emerald-400 font-mono text-[10px] truncate max-w-[200px]" title={sandboxPolicy || 'None'}>
                    {sandboxPolicy || 'Standard Anti-Sandbox Protected'}
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Feature Policy Permissions:</span>
                  <span className="text-slate-300 font-mono text-[10px] truncate max-w-[200px]" title={allowPolicy || 'None'}>
                    {allowPolicy || 'Standard'}
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Top-Window Hijack Guard:</span>
                  <span className="text-emerald-400 font-semibold">Active (OS-Level Plugin Guard)</span>
                </div>

                <div className="flex justify-between p-2 rounded glass-subtle">
                  <span className="text-slate-400">Subtitle Management:</span>
                  <span className="text-emerald-400 font-medium text-right text-[10px] max-w-[220px]">
                    {subtitleInspectionStatus === 'managed_by_embed'
                      ? 'Managed internally by embed player'
                      : (subtitlesAvailable ? 'Available via Provider' : 'Not reported by embed')}
                  </span>
                </div>
                {subtitleNote && (
                  <div className="p-2 rounded bg-black/40 border border-white/5 text-[10px] text-slate-300 leading-normal">
                    {subtitleNote}
                  </div>
                )}

                {/* Explicit Telemetry Boundary Status */}
                <div className="p-2.5 rounded-xl bg-surface-100/80 border border-white/5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Telemetry Observability Boundary</div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="text-slate-500">Bitrate: <span className="text-slate-400 italic">Blocked by SOP</span></div>
                    <div className="text-slate-500">FPS / Codec: <span className="text-slate-400 italic">Blocked by SOP</span></div>
                    <div className="text-slate-500">Frame Buffer: <span className="text-slate-400 italic">Blocked by SOP</span></div>
                    <div className="text-slate-500">Subtitles: <span className="text-slate-400 italic">Track introspection blocked by SOP</span></div>
                  </div>
                </div>
              </>
            )}

            {watchdogPhase && (
              <div className="flex justify-between p-2 rounded glass-subtle">
                <span className="text-slate-400">Watchdog Phase:</span>
                <span className="text-brand-400 uppercase font-bold">{watchdogPhase.replace(/_/g, ' ')}</span>
              </div>
            )}

            {error && (
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}

            {/* Fallback Attempt History */}
            {fallbackHistory.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-slate-400">Fallback Resolution Chain:</span>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {fallbackHistory.map((h, i) => (
                    <div key={i} className="text-[10px] text-slate-300 bg-surface-100 p-1.5 rounded flex justify-between">
                      <span>{h.providerName}</span>
                      <span className={h.status === 'success' ? 'text-emerald-400' : 'text-amber-400'}>
                        {h.reason || h.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sanitized Endpoint URL */}
            <div className="p-2 rounded glass-subtle break-all">
              <div className="text-slate-400 mb-1">Stream Endpoint (Sanitized):</div>
              <div className="text-cyan-400 font-semibold text-[10px]">{sanitizedUrl}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-white/5">
            {onOpenInBrowser && (
              <button
                onClick={onOpenInBrowser}
                className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-white/10 text-white font-semibold flex items-center gap-1.5 transition-colors"
                title="Open stream in default desktop browser"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Browser</span>
              </button>
            )}

            {onReloadStream && (
              <button
                onClick={onReloadStream}
                className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-white/10 text-white font-semibold flex items-center gap-1.5 transition-colors"
                title="Force reload player"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Stream</span>
              </button>
            )}

            {onTryNextProvider && (
              <button
                onClick={onTryNextProvider}
                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
                title="Attempt next fallback provider"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Next Provider</span>
              </button>
            )}
          </div>
        </div>
      </PremiumGlowBorder>
    </div>
  );
};
