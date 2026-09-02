import React, { useEffect, useState } from 'react';
import { X, Copy, Trash2, ShieldAlert } from 'lucide-react';
import { diagnostics, DiagnosticEvent } from '../../services/diagnostics';

interface DiagnosticsViewerProps {
  onClose: () => void;
}

export const DiagnosticsViewer: React.FC<DiagnosticsViewerProps> = ({ onClose }) => {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Initial load
    setEvents(diagnostics.getEvents());

    // Subscribe to changes
    const unsubscribe = diagnostics.subscribe(() => {
      setEvents(diagnostics.getEvents());
    });

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleCopy = async () => {
    try {
      const text = JSON.stringify(events, null, 2);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback or ignore
    }
  };

  const handleClear = () => {
    diagnostics.clear();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="diagnostics-title"
    >
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-200 border border-white/10 rounded-2xl shadow-2xl flex flex-col animate-fade-in overflow-hidden glass-standard">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-surface-300/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id="diagnostics-title" className="text-lg font-bold text-white font-display">Developer Diagnostics</h2>
              <p className="text-xs text-slate-400">Memory-bounded event log (Sanitized)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            aria-label="Close diagnostics"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-surface-200 border-b border-white/5">
          <div className="text-xs text-slate-400 font-mono">
            {events.length} event(s) recorded
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              disabled={events.length === 0}
              className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 text-slate-300 hover:text-rose-400 text-xs font-medium border border-white/5 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              onClick={handleCopy}
              disabled={events.length === 0}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium border border-indigo-500/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-black/20">
          {events.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              No diagnostic events recorded in this session.
            </div>
          ) : (
            events.map((evt) => (
              <div key={evt.id} className="bg-surface-100 border border-white/5 rounded-xl p-3 sm:p-4 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      evt.severity === 'error' ? 'bg-rose-500/20 text-rose-400' :
                      evt.severity === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {evt.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400 bg-surface-200 px-2 py-0.5 rounded-md">
                      {evt.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(evt.timestamp).toISOString()}
                  </span>
                </div>
                <div className="text-sm text-slate-200 font-medium mb-2">{evt.message}</div>
                {evt.context && (
                  <pre className="text-[10px] text-slate-400 bg-surface-300/30 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono border border-white/5">
                    {JSON.stringify(evt.context, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
