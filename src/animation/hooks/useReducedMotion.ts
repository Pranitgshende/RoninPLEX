import { useState, useEffect } from 'react';
import { storage } from '../../services/storage';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    return storage.getPreferences().reduceMotion || (typeof window !== 'undefined' ? window.matchMedia(REDUCED_MOTION_QUERY).matches : false);
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
    
    const updatePref = () => {
      const userPref = storage.getPreferences().reduceMotion;
      setPrefersReducedMotion(userPref || mediaQueryList.matches);
    };

    const mqListener = (event: MediaQueryListEvent) => {
      updatePref();
    };

    const storageListener = () => {
      updatePref();
    };

    updatePref(); // sync initially

    mediaQueryList.addEventListener('change', mqListener);
    window.addEventListener('roninplex_preferences_change', storageListener);

    return () => {
      mediaQueryList.removeEventListener('change', mqListener);
      window.removeEventListener('roninplex_preferences_change', storageListener);
    };
  }, []);

  return prefersReducedMotion;
}
