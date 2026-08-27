import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useUser, ToastMessage } from '../../context/UserContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useUser();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-400 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-surface-100/95',
    info: 'border-brand-500/30 bg-surface-100/95',
    warning: 'border-amber-500/30 bg-surface-100/95',
    error: 'border-rose-500/30 bg-surface-100/95',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-xl animate-slide-up transition-all ${borders[toast.type]}`}
      role="alert"
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white leading-tight">{toast.title}</h4>
        {toast.message && <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>}
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
