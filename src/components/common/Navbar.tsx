import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Film, Search, Sliders, Key, Menu, X, Settings as SettingsIcon } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useApiKey } from '../../context/ApiKeyContext';
import { useDebounce } from '../../hooks/useDebounce';
import { tmdb } from '../../services/tmdb';
import { Movie, TVShow } from '../../types/tmdb';
import { normalizeMedia, getPosterUrl } from '../../utils/helpers';
import { RatingBadge } from './RatingBadge';

export const Navbar: React.FC = () => {
  const { watchlist, openPreferences } = useUser();
  const { openModal: openApiKeyModal, hasKey, isValid } = useApiKey();
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<(Movie | TVShow)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 280);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setIsSearchFocused(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    tmdb.searchMulti(debouncedQuery, 1).then(res => {
      if (isMounted) {
        setSuggestions(res.results.slice(0, 5));
        setIsSearching(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Discover', path: '/discover' },
    { label: 'Movies', path: '/discover?type=movie' },
    { label: 'TV Shows', path: '/discover?type=tv' },
    {
      label: 'My List',
      path: '/watchlist',
      badge: watchlist.length > 0 ? watchlist.length : undefined,
    },
    { label: 'Settings', path: '/settings' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'glass-nav py-3 shadow-xl shadow-black/50'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black font-display tracking-tight text-white group-hover:text-brand-300 transition-colors leading-none">
              RONIN<span className="text-brand-500">PLEX</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold leading-none mt-0.5">
              Personal Cinema
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-surface-100/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span>{link.label}</span>
              {link.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-400 text-slate-950">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Search Bar & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div ref={searchContainerRef} className="relative hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search movies & shows..."
                className="w-44 lg:w-56 pl-8 pr-3 py-1.5 rounded-full bg-surface-100/70 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:w-64 focus:bg-surface-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-300"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface-200 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-scale-in">
                <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-slate-400">Searching TMDB...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((item) => {
                      const norm = normalizeMedia(item);
                      const link = norm.media_type === 'movie' ? `/movie/${norm.id}` : `/tv/${norm.id}`;
                      return (
                        <Link
                          key={`${norm.id}-${norm.media_type}`}
                          to={link}
                          onClick={() => setIsSearchFocused(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-colors group"
                        >
                          <img
                            src={getPosterUrl(norm.poster_path, 'small')}
                            alt={norm.displayTitle}
                            className="w-9 h-13 object-cover rounded-lg bg-surface-300 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-white truncate group-hover:text-brand-300">
                              {norm.displayTitle}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span className="uppercase font-bold text-slate-300">{norm.media_type}</span>
                              <span>•</span>
                              <span>{norm.displayYear || 'TBA'}</span>
                            </div>
                          </div>
                          <RatingBadge rating={norm.vote_average} size="sm" />
                        </Link>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">No matching titles</div>
                  )}
                </div>
                <div className="p-2 bg-surface-300 border-t border-white/5 text-center">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    View all results for "{searchQuery}" &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full bg-surface-100/70 hover:bg-surface-50 text-slate-300 hover:text-white border border-white/5 transition-colors"
            title="Application Settings"
            aria-label="Application Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={openPreferences}
            className="p-2 rounded-full bg-surface-100/70 hover:bg-surface-50 text-slate-300 hover:text-white border border-white/5 transition-colors"
            title="Recommendation Preferences"
            aria-label="Recommendation Preferences"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={openApiKeyModal}
            className={`p-2 rounded-full border transition-colors relative ${
              hasKey
                ? isValid === false
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-surface-100/70 text-slate-300 border-white/5 hover:bg-surface-50'
            }`}
            title={hasKey ? (isValid === false ? 'API Key Error' : 'TMDB Connected') : 'Configure TMDB API Key'}
            aria-label="Configure TMDB API Key"
          >
            <Key className="w-4 h-4" />
            {hasKey && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-surface-100 lg:hidden text-slate-300 hover:text-white border border-white/10 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-300 border-b border-white/10 px-4 py-5 space-y-4 animate-slide-up shadow-2xl">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies & shows..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-100 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/5'
                  }`
                }
              >
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-400 text-slate-950">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-brand-300 font-semibold"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openApiKeyModal();
              }}
              className="flex items-center gap-1.5 text-slate-300"
            >
              <Key className="w-4 h-4" />
              <span>{hasKey ? 'TMDB Connected' : 'Set TMDB Key'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
