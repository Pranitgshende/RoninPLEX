import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/Toast';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { PreferencesModal } from './components/modals/PreferencesModal';
import { ApiKeyModal } from './components/modals/ApiKeyModal';
import { RoninIntro } from './components/startup/RoninIntro';

// Pages
import { Home } from './pages/Home';
import { Movies } from './pages/Movies';
import { TvShows } from './pages/TvShows';
import { Anime } from './pages/Anime';
import { AnimeDetails } from './pages/AnimeDetails';
import { Discover } from './pages/Discover';
import { DecisionHelper } from './pages/DecisionHelper';
import { Search } from './pages/Search';
import { MovieDetails } from './pages/MovieDetails';
import { TvDetails } from './pages/TvDetails';
import { Watch } from './pages/Watch';
import { Watchlist } from './pages/Watchlist';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

import { useAppLifecycle } from './context/AppLifecycleContext';

export const App: React.FC = () => {
  const location = useLocation();
  const isWatchPage = location.pathname.startsWith('/watch');
  const { isIntroComplete, completeIntro, appState } = useAppLifecycle();

  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-100 font-sans selection:bg-brand-600 selection:text-white">
      {!isIntroComplete && (
        <RoninIntro onComplete={completeIntro} isAppReady={appState === 'ready'} />
      )}

      {!isWatchPage && <Navbar />}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/tv" element={<TvShows />} />
          <Route path="/anime" element={<Anime />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/decision" element={<DecisionHelper />} />
          <Route path="/search" element={<Search />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/tv/:id" element={<TvDetails />} />
          <Route path="/anime/:id" element={<AnimeDetails />} />
          <Route path="/watch/movie/:id" element={<Watch />} />
          <Route path="/watch/tv/:id/:season/:episode" element={<Watch />} />
          <Route path="/watch/anime/:id/:episode" element={<Watch />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isWatchPage && <Footer />}

      {/* Global Modals & Notifications */}
      <OnboardingModal />
      <PreferencesModal />
      <ApiKeyModal />
      <ToastContainer />
    </div>
  );
};

export default App;
