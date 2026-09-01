import './shims';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ApiKeyProvider } from './context/ApiKeyContext';
import { AppLifecycleProvider } from './context/AppLifecycleContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ApiKeyProvider>
        <UserProvider>
          <AppLifecycleProvider>
            <App />
          </AppLifecycleProvider>
        </UserProvider>
      </ApiKeyProvider>
    </HashRouter>
  </React.StrictMode>,
);
