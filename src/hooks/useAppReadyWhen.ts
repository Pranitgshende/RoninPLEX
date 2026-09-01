import { useEffect } from 'react';
import { useAppLifecycle } from '../context/AppLifecycleContext';

export const useAppReadyWhen = (condition: boolean) => {
  const { markAppReady } = useAppLifecycle();
  
  useEffect(() => {
    if (condition) {
      markAppReady();
    }
  }, [condition, markAppReady]);
};
