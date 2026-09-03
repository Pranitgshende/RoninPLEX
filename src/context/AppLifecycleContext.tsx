import React, { createContext, useContext, useState, useCallback } from 'react';
import { storage } from '../services/storage';

export type AppState = 'initializing' | 'ready';

interface AppLifecycleContextType {
  appState: AppState;
  isIntroComplete: boolean;
  isOnboardingBlocking: boolean;
  canAnimatePage: boolean;
  completeIntro: () => void;
  markAppReady: () => void;
  setIsOnboardingBlocking: (blocking: boolean) => void;
}

const AppLifecycleContext = createContext<AppLifecycleContextType | undefined>(undefined);

export const AppLifecycleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>('initializing');
  const [isIntroComplete, setIntroComplete] = useState(() => {
    return storage.getPreferences().skipIntro || false;
  });
  const [isOnboardingBlocking, setIsOnboardingBlocking] = useState<boolean>(() => {
    try {
      const seen = sessionStorage.getItem('roninplex_tmdb_onboarding_session_seen');
      return !seen;
    } catch {
      return false;
    }
  });

  const completeIntro = useCallback(() => {
    setIntroComplete(true);
  }, []);

  const markAppReady = useCallback(() => {
    setAppState((prev) => (prev !== 'ready' ? 'ready' : prev));
  }, []);

  const canAnimatePage = isIntroComplete && !isOnboardingBlocking;

  return (
    <AppLifecycleContext.Provider
      value={{
        appState,
        isIntroComplete,
        isOnboardingBlocking,
        canAnimatePage,
        completeIntro,
        markAppReady,
        setIsOnboardingBlocking,
      }}
    >
      {children}
    </AppLifecycleContext.Provider>
  );
};

export const useAppLifecycle = (): AppLifecycleContextType => {
  const context = useContext(AppLifecycleContext);
  if (!context) {
    throw new Error('useAppLifecycle must be used within an AppLifecycleProvider');
  }
  return context;
};
