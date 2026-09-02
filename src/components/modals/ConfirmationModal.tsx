import React, { useRef, useEffect } from 'react';
import { useMotionPresence } from '../../animation/hooks/useMotionPresence';
import { AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = true,
}) => {
  const { ref, shouldRender } = useMotionPresence(isOpen, 'fade');
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div
        ref={ref as any}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        className="relative w-full max-w-sm bg-surface-200 border border-white/10 rounded-2xl shadow-2xl p-6 glass-elevated"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-3 rounded-full ${isDestructive ? 'bg-rose-500/20 text-rose-400' : 'bg-brand-500/20 text-brand-400'}`}>
            <AlertCircle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 id="confirm-modal-title" className="text-xl font-bold text-white font-display">
              {title}
            </h2>
            <p id="confirm-modal-desc" className="text-sm text-slate-300">
              {message}
            </p>
          </div>
          
          <div className="flex gap-3 w-full pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 text-sm font-semibold transition-colors glass-interactive"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-colors shadow-lg glass-interactive ${
                isDestructive 
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30' 
                  : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/30'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
