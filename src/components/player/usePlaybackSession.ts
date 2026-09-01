import { useRef, useCallback, useEffect } from 'react';

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
) {
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
