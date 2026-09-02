import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { diagnostics } from '../../services/diagnostics';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PlayerErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    diagnostics.error('playback', 'PlayerErrorBoundary caught runtime error', {
      error,
      componentStack: errorInfo.componentStack
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full h-full min-h-[400px] bg-black flex items-center justify-center p-4">
          <div className="relative z-10 max-w-md w-full bg-surface-200/90 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Playback Failed</h2>
              <p className="text-sm text-slate-300">
                The video player encountered an unexpected error. Please try reloading the player or go back.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button 
                onClick={this.handleBack} 
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 font-bold text-sm border border-white/5 flex items-center justify-center gap-2 transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>Go Back</span>
              </button>
              
              <button 
                onClick={this.handleReset} 
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Playback</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
