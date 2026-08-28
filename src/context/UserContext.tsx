import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WatchlistItem, WatchedItem, UserPreferences, PlaybackProgress, HomeSectionItem } from '../types/user';
import { storage } from '../services/storage';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface UserContextType {
  watchlist: WatchlistItem[];
  watched: WatchedItem[];
  continueWatching: PlaybackProgress[];
  preferences: UserPreferences;
  homeLayout: HomeSectionItem[];
  isOnboardingOpen: boolean;
  isPreferencesOpen: boolean;
  toasts: ToastMessage[];
  // Watchlist Actions
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (id: number, mediaType: 'movie' | 'tv') => void;
  isInWatchlist: (id: number, mediaType: 'movie' | 'tv') => boolean;
  toggleWatchlist: (item: WatchlistItem) => void;
  clearWatchlist: () => void;
  // Watched Actions
  addToWatched: (item: WatchedItem) => void;
  removeFromWatched: (id: number, mediaType: 'movie' | 'tv') => void;
  isWatched: (id: number, mediaType: 'movie' | 'tv') => boolean;
  toggleWatched: (item: WatchedItem) => void;
  rateWatchedItem: (id: number, mediaType: 'movie' | 'tv', rating: number) => void;
  toggleLike: (id: number, mediaType: 'movie' | 'tv', itemFallback?: Partial<WatchedItem>) => void;
  toggleDislike: (id: number, mediaType: 'movie' | 'tv', itemFallback?: Partial<WatchedItem>) => void;
  clearWatched: () => void;
  // Continue Watching Actions
  savePlaybackProgress: (progress: PlaybackProgress) => void;
  removePlaybackProgress: (id: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => void;
  clearContinueWatching: () => void;
  // Preferences Actions
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  // Home Layout Actions
  updateHomeLayout: (layout: HomeSectionItem[]) => void;
  resetHomeLayout: () => void;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
  // Toast
  showToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  dismissToast: (id: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => storage.getWatchlist());
  const [watched, setWatched] = useState<WatchedItem[]>(() => storage.getWatched());
  const [continueWatching, setContinueWatching] = useState<PlaybackProgress[]>(() => storage.getContinueWatchingList());
  const [preferences, setPreferences] = useState<UserPreferences>(() => storage.getPreferences());
  const [homeLayout, setHomeLayout] = useState<HomeSectionItem[]>(() => storage.getHomeLayout());
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => !preferences.onboardingCompleted);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Listen for storage events
  useEffect(() => {
    const handleStorageChange = () => {
      setWatchlist(storage.getWatchlist());
      setWatched(storage.getWatched());
      setContinueWatching(storage.getContinueWatchingList());
      setPreferences(storage.getPreferences());
      setHomeLayout(storage.getHomeLayout());
    };

    const handleHomeLayoutChange = () => {
      setHomeLayout(storage.getHomeLayout());
    };

    window.addEventListener('roninplex_storage_change', handleStorageChange);
    window.addEventListener('roninplex_home_layout_change', handleHomeLayoutChange);
    return () => {
      window.removeEventListener('roninplex_storage_change', handleStorageChange);
      window.removeEventListener('roninplex_home_layout_change', handleHomeLayoutChange);
    };
  }, []);

  // Watchlist methods
  const addToWatchlist = (item: WatchlistItem) => {
    const success = storage.addToWatchlist(item);
    if (success) {
      setWatchlist(storage.getWatchlist());
      showToast('success', 'Added to Watchlist', `"${item.title}" is ready for your next movie night.`);
    }
  };

  const removeFromWatchlist = (id: number, mediaType: 'movie' | 'tv') => {
    const item = watchlist.find(w => w.id === id && w.mediaType === mediaType);
    storage.removeFromWatchlist(id, mediaType);
    setWatchlist(storage.getWatchlist());
    showToast('info', 'Removed from Watchlist', item ? `"${item.title}" removed.` : undefined);
  };

  const isInWatchlist = (id: number, mediaType: 'movie' | 'tv') => {
    return watchlist.some(i => i.id === id && i.mediaType === mediaType);
  };

  const toggleWatchlist = (item: WatchlistItem) => {
    if (isInWatchlist(item.id, item.mediaType)) {
      removeFromWatchlist(item.id, item.mediaType);
    } else {
      addToWatchlist(item);
    }
  };

  const clearWatchlist = () => {
    storage.clearWatchlist();
    setWatchlist([]);
    showToast('info', 'Watchlist Cleared', 'All saved items removed.');
  };

  // Watched methods
  const addToWatched = (item: WatchedItem) => {
    storage.addToWatched(item);
    setWatched(storage.getWatched());
    if (isInWatchlist(item.id, item.mediaType)) {
      storage.removeFromWatchlist(item.id, item.mediaType);
      setWatchlist(storage.getWatchlist());
    }
    showToast('success', 'Marked as Watched', `Logged "${item.title}".`);
  };

  const removeFromWatched = (id: number, mediaType: 'movie' | 'tv') => {
    const item = watched.find(w => w.id === id && w.mediaType === mediaType);
    storage.removeFromWatched(id, mediaType);
    setWatched(storage.getWatched());
    showToast('info', 'Removed from History', item ? `"${item.title}" removed.` : undefined);
  };

  const isWatched = (id: number, mediaType: 'movie' | 'tv') => {
    return watched.some(i => i.id === id && i.mediaType === mediaType);
  };

  const toggleWatched = (item: WatchedItem) => {
    if (isWatched(item.id, item.mediaType)) {
      removeFromWatched(item.id, item.mediaType);
    } else {
      addToWatched(item);
    }
  };

  const rateWatchedItem = (id: number, mediaType: 'movie' | 'tv', rating: number) => {
    storage.updateWatchedRating(id, mediaType, rating);
    setWatched(storage.getWatched());
    showToast('success', 'Rating Saved', `Rated ${rating}/10.`);
  };

  const toggleLike = (id: number, mediaType: 'movie' | 'tv', itemFallback?: Partial<WatchedItem>) => {
    const existing = watched.find(w => w.id === id && w.mediaType === mediaType);
    if (!existing && itemFallback) {
      const newItem: WatchedItem = {
        id,
        mediaType,
        title: itemFallback.title || 'Untitled',
        posterPath: itemFallback.posterPath || null,
        backdropPath: itemFallback.backdropPath || null,
        rating: itemFallback.rating || 0,
        releaseYear: itemFallback.releaseYear || '',
        genres: itemFallback.genres || [],
        watchedAt: new Date().toISOString(),
        userLiked: true,
        userDisliked: false,
      };
      addToWatched(newItem);
      return;
    }

    const currentLiked = existing?.userLiked ?? false;
    storage.updateWatchedRating(id, mediaType, undefined, !currentLiked, false);
    setWatched(storage.getWatched());
    showToast('info', !currentLiked ? 'Liked' : 'Like removed', 'Your recommendations will be tailored accordingly.');
  };

  const toggleDislike = (id: number, mediaType: 'movie' | 'tv', itemFallback?: Partial<WatchedItem>) => {
    const existing = watched.find(w => w.id === id && w.mediaType === mediaType);
    if (!existing && itemFallback) {
      const newItem: WatchedItem = {
        id,
        mediaType,
        title: itemFallback.title || 'Untitled',
        posterPath: itemFallback.posterPath || null,
        backdropPath: itemFallback.backdropPath || null,
        rating: itemFallback.rating || 0,
        releaseYear: itemFallback.releaseYear || '',
        genres: itemFallback.genres || [],
        watchedAt: new Date().toISOString(),
        userLiked: false,
        userDisliked: true,
      };
      addToWatched(newItem);
      return;
    }

    const currentDisliked = existing?.userDisliked ?? false;
    storage.updateWatchedRating(id, mediaType, undefined, false, !currentDisliked);
    setWatched(storage.getWatched());
    showToast('info', !currentDisliked ? 'Disliked' : 'Dislike removed', 'We will show fewer titles like this.');
  };

  const clearWatched = () => {
    storage.clearWatched();
    setWatched([]);
    showToast('info', 'Viewing History Cleared', 'All watched logs removed.');
  };

  // Continue Watching methods
  const savePlaybackProgress = (progress: PlaybackProgress) => {
    storage.savePlaybackProgress(progress);
    setContinueWatching(storage.getContinueWatchingList());
  };

  const removePlaybackProgress = (id: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
    storage.removePlaybackProgress(id, mediaType, season, episode);
    setContinueWatching(storage.getContinueWatchingList());
    showToast('info', 'Removed from Continue Watching');
  };

  const clearContinueWatching = () => {
    storage.clearPlaybackProgress();
    setContinueWatching([]);
    showToast('info', 'Continue Watching Cleared');
  };

  // Preferences methods
  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    const updated = storage.savePreferences(prefs);
    setPreferences(updated);
    showToast('success', 'Preferences Updated', 'Recommendation feed re-calibrated.');
  };

  const resetPreferences = () => {
    const reset = storage.resetPreferences();
    setPreferences(reset);
    showToast('info', 'Preferences Reset', 'Restored default settings.');
  };

  // Home Layout methods
  const updateHomeLayout = (layout: HomeSectionItem[]) => {
    storage.saveHomeLayout(layout);
    setHomeLayout(layout);
    showToast('success', 'Home Layout Updated', 'Home page sections re-ordered.');
  };

  const resetHomeLayout = () => {
    const reset = storage.resetHomeLayout();
    setHomeLayout(reset);
    showToast('info', 'Layout Reset', 'Restored default Home page layout.');
  };

  return (
    <UserContext.Provider
      value={{
        watchlist,
        watched,
        continueWatching,
        preferences,
        homeLayout,
        isOnboardingOpen,
        isPreferencesOpen,
        toasts,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        toggleWatchlist,
        clearWatchlist,
        addToWatched,
        removeFromWatched,
        isWatched,
        toggleWatched,
        rateWatchedItem,
        toggleLike,
        toggleDislike,
        clearWatched,
        savePlaybackProgress,
        removePlaybackProgress,
        clearContinueWatching,
        updatePreferences,
        resetPreferences,
        updateHomeLayout,
        resetHomeLayout,
        openOnboarding: () => setIsOnboardingOpen(true),
        closeOnboarding: () => setIsOnboardingOpen(false),
        openPreferences: () => setIsPreferencesOpen(true),
        closePreferences: () => setIsPreferencesOpen(false),
        showToast,
        dismissToast,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
