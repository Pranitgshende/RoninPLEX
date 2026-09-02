import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { diagnostics } from '../../services/diagnostics';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    diagnostics.error('unexpected', 'Uncaught application error', {
      error,
      componentStack: errorInfo.componentStack
    });
  }

  private handleReset = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface-200/90 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Something went wrong</h2>
              <p className="text-sm text-slate-300">
                The application encountered an unexpected error and needs to reload.
              </p>
            </div>
            
            <div className="flex items-center justify-center pt-2">
              <button 
                onClick={this.handleReset} 
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
