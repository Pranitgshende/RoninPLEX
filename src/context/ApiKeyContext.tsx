import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tmdb } from '../services/tmdb';
import { storage } from '../services/storage';

interface ApiKeyContextType {
  apiKey: string;
  hasKey: boolean;
  isValid: boolean | null;
  isValidating: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  updateApiKey: (newKey: string) => Promise<boolean>;
  removeApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string>(() => tmdb.getApiKey());
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const validateKey = useCallback(async (key: string) => {
    if (!key || key === 'your_tmdb_api_key_here') {
      setIsValid(null);
      return;
    }
    setIsValidating(true);
    const valid = await tmdb.testApiKey(key);
    setIsValid(valid);
    setIsValidating(false);
  }, []);

  useEffect(() => {
    const currentKey = tmdb.getApiKey();
    setApiKey(currentKey);
    if (currentKey && currentKey !== 'your_tmdb_api_key_here') {
      validateKey(currentKey);
    }

    const handleKeyChange = () => {
      const updated = tmdb.getApiKey();
      setApiKey(updated);
      validateKey(updated);
    };

    window.addEventListener('roninplex_api_key_change', handleKeyChange);
    window.addEventListener('cinepulse_api_key_change', handleKeyChange);
    return () => {
      window.removeEventListener('roninplex_api_key_change', handleKeyChange);
      window.removeEventListener('cinepulse_api_key_change', handleKeyChange);
    };
  }, [validateKey]);

  const updateApiKey = async (newKey: string): Promise<boolean> => {
    const trimmed = newKey.trim();
    if (!trimmed) {
      removeApiKey();
      return true;
    }
    setIsValidating(true);
    const valid = await tmdb.testApiKey(trimmed);
    setIsValidating(false);
    if (valid) {
      storage.saveCustomApiKey(trimmed);
      setApiKey(trimmed);
      setIsValid(true);
      return true;
    } else {
      setIsValid(false);
      return false;
    }
  };

  const removeApiKey = () => {
    storage.saveCustomApiKey('');
    setApiKey('');
    setIsValid(null);
  };

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        hasKey: Boolean(apiKey && apiKey !== 'your_tmdb_api_key_here'),
        isValid,
        isValidating,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        updateApiKey,
        removeApiKey,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
