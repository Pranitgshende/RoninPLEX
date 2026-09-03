import './shims';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ApiKeyProvider } from './context/ApiKeyContext';
import { AppLifecycleProvider } from './context/AppLifecycleContext';
import { PlaybackProvider } from './context/PlaybackContext';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { PiPWindowApp } from './components/player/PiPWindowApp';
import App from './App';
import './index.css';

const isPipWindow = window.location.hash.startsWith('#/pip');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      {isPipWindow ? (
        <HashRouter>
          <UserProvider>
            <PiPWindowApp />
          </UserProvider>
        </HashRouter>
      ) : (
        <HashRouter>
          <ApiKeyProvider>
            <UserProvider>
              <AppLifecycleProvider>
                <PlaybackProvider>
                  <App />
                </PlaybackProvider>
              </AppLifecycleProvider>
            </UserProvider>
          </ApiKeyProvider>
        </HashRouter>
      )}
    </GlobalErrorBoundary>
  </React.StrictMode>,
);
