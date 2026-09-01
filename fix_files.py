
import os

with open('src/components/player/usePlaybackSession.ts', 'w', encoding='utf-8') as f:
    f.write("""import { useRef, useCallback, useEffect } from 'react';

export type PlaybackLifecycleState = 'resolving' | 'initializing' | 'ready' | 'playing' | 'stalled' | 'error' | 'disposed';

export interface PlaybackSession {
  sessionId: string;
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'anime';
  seasonNumber?: number;
  episodeNumber?: number;
  providerId: string | null;
  streamType: string;
  url: string;
  createdAt: number;
  state: PlaybackLifecycleState;
}

export function usePlaybackSession(
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'anime',
  seasonNumber: number | undefined,
  episodeNumber: number | undefined,
  providerId: string | null,
  streamType: string,
  url: string
+ {
  const currentSessionIdRef = useRef<string>('');
  const sessionStateRef = useRef<PlaybackLifecycleState>('resolving');
  const timersRef = useRef<Set<number>>(new Set());
  const intervalsRef = useRef<Set<number>>(new Set());

  // Generate a new session whenever core identity props change
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    currentSessionIdRef.current = newSessionId;
    sessionStateRef.current = 'initializing';
    
    return () => {
      disposeCurrentSession(newSessionId);
    };
  }, [mediaId, mediaType, seasonNumber, episodeNumber, url]);

  const disposeCurrentSession = useCallback((targetSessionId?: string) => {
    const idToDispose = targetSessionId || currentSessionIdRef.current;
    if (!targetSessionId || targetSessionId === currentSessionIdRef.current) {
      sessionStateRef.current = 'disposed';
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();
    }
  }, []);

  const getActiveSessionId = useCallback(() => currentSessionIdRef.current, []);

  const setSessionState = useCallback((state: PlaybackLifecycleState) => {
    if (sessionStateRef.current !== 'disposed') {
      sessionStateRef.current = state;
    }
  }, []);

  const getSessionState = useCallback(() => sessionStateRef.current, []);

  const isSessionActive = useCallback((sessionId: string) => {
    return sessionId === currentSessionIdRef.current && sessionStateRef.current !== 'disposed';
  }, []);

  const runIfActive = useCallback(<T extends (...args: any[]) => any>(sessionId: string, fn: T) => {
    return (...args: Parameters<T>): ReturnType<T> | void => {
      if (isSessionActive(sessionId)) {
        return fn(...args);
      }
    };
  }, [isSessionActive]);

  const setSessionInterval = useCallback((sessionId: string, fn: () => void, delay: number) => {
    if (!isSessionActive(sessionId)) return null;
    const safeFn = runIfActive(sessionId, fn);
    const interval = window.setInterval(safeFn, delay);
    intervalsRef.current.add(interval);
    return interval;
  }, [isSessionActive, runIfActive]);

  const setSessionTimeout = useCallback((sessionId: string, fn: () => void, delay: number) => {
    if (!isSessionActive(sessionId)) return null;
    const safeFn = runIfActive(sessionId, fn);
    const timeout = window.setTimeout(() => {
      timersRef.current.delete(timeout);
      safeFn();
    }, delay);
    timersRef.current.add(timeout);
    return timeout;
  }, [isSessionActive, runIfActive]);

  const clearSessionInterval = useCallback((intervalId: number) => {
    clearInterval(intervalId);
    intervalsRef.current.delete(intervalId);
  }, []);

  const clearSessionTimeout = useCallback((timeoutId: number) => {
    clearTimeout(timeoutId);
    timersRef.current.delete(timeoutId);
  }, []);

  return {
    getActiveSessionId,
    setSessionState,
    getSessionState,
    isSessionActive,
    runIfActive,
    setSessionInterval,
    setSessionTimeout,
    clearSessionInterval,
    clearSessionTimeout,
    disposeCurrentSession
  };
}
""")

with open('src/components/player/PlayerErrorBoundary.tsx', 'w', encoding='utf-8') as f:
    f.write("""import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
    console.error('PlayerErrorBoundary caught a runtime React error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className=\"relative w-full h-screen bg-black flex,items-center justify-center p-4\">
          <div className=\"relative z-10 max-w-lg w-full bg-surface-200/90 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl\">
            <div className=\"w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto\">
              <AlertCircle className=\"w-8 h-8\" />
            </div>
            <div className=\"space-y-2\">
              <h2 className=\"text-xl sm:text-2xl font-bold text-white font-display\">Player Crash Detected</h2>
              <p className=\"text-xs sm:text-sm text-slate-300\">The video player encountered a critical runtime error.</p>
            </div>
            <div className=\"p-3.5 rounded-xl bg-surface-100/80 border border-white/5 text-left text-xs text-slate-400 space-y-1.5 overflow-auto max-h-32 font-mono\">
              <div className=\"text-rose-400\">{this.state.error?.message || 'Unknown React error'}</div>
            </div>
            <div className=\"flex items-center justify-center pt-2\">
              <button onClick={this.handleReset} className=\"w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex,items-center justify-center gap-2 transition-all\">
                <RefreshCw className=\"w-4 h-4\" />
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
)"""

