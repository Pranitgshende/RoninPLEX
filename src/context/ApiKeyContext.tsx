import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tmdb } from '../services/tmdb';
import { 
  storeTMDBUserCredential, 
  removeTMDBUserCredential, 
  isTMDBUserCredentialConfigured, 
  resolveTMDBCredential 
} from '../services/credentials';
import { storage } from '../services/storage';

interface ApiKeyContextType {
  hasUserKey: boolean;
  isFallbackActive: boolean;
  isConnectionValid: boolean | null;
  isValidating: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  updateApiKey: (newKey: string) => Promise<boolean>;
  removeApiKey: () => Promise<void>;
  checkConnectionState: () => Promise<void>;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasUserKey, setHasUserKey] = useState<boolean>(false);
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(false);
  const [isConnectionValid, setIsConnectionValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const checkConnectionState = useCallback(async () => {
    // Check if user key is configured
    const userConfigured = await isTMDBUserCredentialConfigured();
    setHasUserKey(userConfigured);

    // See what the resolver uses
    const cred = await resolveTMDBCredential();
    if (cred) {
      setIsFallbackActive(cred.isFallback);
      
      // If we have a cred, let's validate it in the background if we don't know the status
      // We don't block on this
      tmdb.testApiKey(cred.key).then(valid => {
        setIsConnectionValid(valid);
      });
    } else {
      setIsFallbackActive(false);
      setIsConnectionValid(false);
    }
  }, []);

  useEffect(() => {
    checkConnectionState();

    const handleKeyChange = () => {
      checkConnectionState();
    };

    window.addEventListener('roninplex_api_key_change', handleKeyChange);
    return () => {
      window.removeEventListener('roninplex_api_key_change', handleKeyChange);
    };
  }, [checkConnectionState]);

  const updateApiKey = async (newKey: string): Promise<boolean> => {
    const trimmed = newKey.trim();
    if (!trimmed) {
      await removeApiKey();
      return true;
    }
    setIsValidating(true);
    const valid = await tmdb.testApiKey(trimmed);
    setIsValidating(false);
    
    if (valid) {
      await storeTMDBUserCredential(trimmed);
      
      // Clean up legacy keys
      storage.saveCustomApiKey(''); 
      
      setIsConnectionValid(true);
      window.dispatchEvent(new Event('roninplex_api_key_change'));
      return true;
    } else {
      setIsConnectionValid(false);
      return false;
    }
  };

  const removeApiKey = async () => {
    await removeTMDBUserCredential();
    storage.saveCustomApiKey(''); // cleanup legacy
    window.dispatchEvent(new Event('roninplex_api_key_change'));
  };

  return (
    <ApiKeyContext.Provider
      value={{
        hasUserKey,
        isFallbackActive,
        isConnectionValid,
        isValidating,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        updateApiKey,
        removeApiKey,
        checkConnectionState
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
