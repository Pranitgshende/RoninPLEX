import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Play, Bookmark, BookmarkCheck, Star, User, ArrowRight, RotateCcw, ShieldAlert } from 'lucide-react';
import { aiService, ChatMessage } from '../services/ai/AIService';
import { Movie, TVShow } from '../types/tmdb';
import { useUser } from '../context/UserContext';
import { getPosterUrl } from '../utils/helpers';
import { RoninAvatar, RoninState } from '../components/ronin/RoninAvatar';
import { AdultBadge } from '../components/common/AdultBadge';

const QUICK_PROMPTS = [
  'I want a Marvel movie',
  'Recommend an epic anime series',
  "What is trending across the realm right now?",
  'Dark psychological thriller for tonight',
  'Mind-bending sci-fi like Interstellar',
  'Feel-good comedy to unwind',
];

export const DecisionHelper: React.FC = () => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useUser();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial',
      sender: 'ronin',
      text: 'Greetings, traveler. I am Ronin, your guide through the endless cinema. What journey does your spirit seek tonight?',
      timestamp: Date.now(),
    },
  ]);
  const [avatarState, setAvatarState] = useState<RoninState>('idle');
  const [isThinking, setIsThinking] = useState(false);
  const [isTypingStream, setIsTypingStream] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isTypingStream]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isThinking || isTypingStream) return;

    setInput('');

    // 1. Append User Message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Ronin Thinking State with intentional pacing
    setIsThinking(true);
    setAvatarState('thinking');

    try {
      const response = await aiService.getRoninResponse(query);

      // Intentional conversational variable delay (1.0s - 2.5s)
      const thinkingDelay = Math.floor(Math.random() * 1500) + 1000;
      await new Promise((resolve) => setTimeout(resolve, thinkingDelay));
      setIsThinking(false);

      // 3. Progressive Text Rendering (Simulated natural typing stream)
      setIsTypingStream(true);
      setAvatarState('talking');

      const fullText = response.text;
      const placeholderId = `ronin-${Date.now()}`;

      // Add empty message placeholder
      setMessages((prev) => [
        ...prev,
        {
          id: placeholderId,
          sender: 'ronin',
          text: '',
          timestamp: Date.now(),
        },
      ]);

      // Stream words
      const words = fullText.split(' ');
      let currentString = '';

      for (let i = 0; i < words.length; i++) {
        currentString += (i === 0 ? '' : ' ') + words[i];
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === placeholderId ? { ...msg, text: currentString } : msg
          )
        );
        // Variable delay per word for smooth human-like stream
        const typingDelay = Math.floor(Math.random() * 30) + 20;
        await new Promise((resolve) => setTimeout(resolve, typingDelay));
      }

      setIsTypingStream(false);

      // 4. Attach recommendations once typing is done
      if (response.recommendations && response.recommendations.length > 0) {
        setAvatarState('recommending');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === placeholderId
              ? { ...msg, recommendations: response.recommendations }
              : msg
          )
        );
      } else {
        setAvatarState('idle');
      }
    } catch (err) {
      console.error('Error fetching Ronin recommendation:', err);
      setIsThinking(false);
      setIsTypingStream(false);
      setAvatarState('idle');
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ronin',
          text: 'The archives flickered in the storm. Forgive me, traveler. What direction shall we try next?',
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleReset = () => {
    aiService.resetSession();
    setMessages([
      {
        id: 'initial',
        sender: 'ronin',
        text: 'The slate is cleansed. Sit by the fire once more, traveler. What journey does your spirit seek tonight?',
        timestamp: Date.now(),
      },
    ]);
    setAvatarState('idle');
  };

  const handleWatch = (item: any) => {
    if (item.mediaType === 'anime') {
      navigate(`/watch/anime/${item.id}/1`);
      return;
    }
    const isMovie = item.mediaType === 'movie' || ('title' in item && !('name' in item));
    if (isMovie) {
      navigate(`/watch/movie/${item.id}`);
    } else {
      navigate(`/watch/tv/${item.id}/1/1`);
    }
  };

  const handleDetails = (item: any) => {
    if (item.mediaType === 'anime') {
      navigate(`/anime/${item.id}`);
      return;
    }
    const isMovie = item.mediaType === 'movie' || ('title' in item && !('name' in item));
    navigate(`/${isMovie ? 'movie' : 'tv'}/${item.id}`);
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col pt-20 pb-8 px-4 sm:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <RoninAvatar size="md" state={avatarState} interactive={true} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display">Ronin AI</h1>
            <p className="text-xs text-slate-400">Conversational cinema guide with bespoke samurai intelligence</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="p-2 rounded-xl bg-surface-100 hover:bg-surface-200 border border-white/10 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1.5"
          title="Reset conversation"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">New Journey</span>
        </button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="py-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isThinking || isTypingStream}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface-100/80 hover:bg-brand-600/20 border border-white/10 hover:border-brand-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap flex-shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-6 py-4 pr-1 min-h-[450px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ronin' && (
              <div className="flex-shrink-0 mt-0.5">
                <RoninAvatar size="sm" state={isTypingStream ? 'talking' : 'idle'} interactive={false} />
              </div>
            )}

            <div className={`space-y-3 max-w-2xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm ml-auto'
                    : 'bg-surface-100/90 border border-white/10 text-slate-200 rounded-tl-sm glass-panel'
                }`}
              >
                {msg.text || (isTypingStream ? '...' : '')}
              </div>

              {/* Recommendations Embedded in Message */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="flex overflow-x-auto gap-4 pt-4 pb-2 w-full no-scrollbar snap-x snap-mandatory pr-6 -mx-2 px-2">
                  {msg.recommendations.map((item: any) => {
                    const isAnime = 'romajiTitle' in item || 'synopsis' in item || !('poster_path' in item);
                    const isMovie = !isAnime && 'title' in item;
                    const title = item.title || item.name || 'Untitled';
                    const date = isAnime ? item.year : isMovie ? item.release_date : item.first_air_date;
                    const yearStr = date ? String(date).split('-')[0] : '';
                    const inList = isInWatchlist(item.id as any, isAnime ? 'anime' : isMovie ? 'movie' : 'tv');
                    const roninDesc = aiService.generateRoninDescription(item);
                    const posterUrl = item.poster || getPosterUrl(item.poster_path, 'small');
                    const detailsUrl = isAnime ? `/anime/${item.id}` : isMovie ? `/movie/${item.id}` : `/tv/${item.id}`;
                    const watchUrl = isAnime ? `/watch/anime/${item.id}/1` : isMovie ? `/watch/movie/${item.id}` : `/watch/tv/${item.id}/1/1`;

                    return (
                      <div
                        key={item.id}
                        className="min-w-[280px] max-w-[280px] p-3.5 rounded-2xl bg-surface-200/90 border border-white/10 flex flex-col justify-between hover:border-brand-500/40 transition-all shadow-xl glass-card group snap-start"
                      >
                        <div className="flex gap-3 relative z-10">
                          <div className="w-20 aspect-[2/3] rounded-xl overflow-hidden bg-surface-300 flex-shrink-0 relative shadow-md">
                            <img
                              src={posterUrl}
                              alt={title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {item.adult && (
                              <div className="absolute top-1 left-1">
                                <AdultBadge size="sm" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] uppercase font-bold text-brand-400">
                                  {isAnime ? 'Anime Series' : isMovie ? 'Feature Film' : 'Series'}
                                </span>
                                {item.vote_average ? (
                                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    {item.vote_average.toFixed(1)}
                                  </span>
                                ) : null}
                              </div>

                              <h4 className="text-sm font-bold text-white truncate mt-0.5 group-hover:text-brand-300 transition-colors" title={title}>
                                {title}
                              </h4>

                              {yearStr && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {yearStr}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <button
                                onClick={() => handleWatch(item)}
                                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-md shadow-brand-600/30 transition-all"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Watch</span>
                              </button>

                              <button
                                onClick={() => handleDetails(item)}
                                className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 border border-white/10 text-slate-300 hover:text-white text-[11px] font-bold transition-all"
                              >
                                Details
                              </button>

                              <button
                                onClick={() =>
                                  toggleWatchlist({
                                    id: item.id,
                                    mediaType: isAnime ? 'anime' : isMovie ? 'movie' : 'tv',
                                    title,
                                    posterPath: item.poster_path,
                                    backdropPath: item.backdrop_path,
                                    rating: item.vote_average || 0,
                                    releaseYear: yearStr,
                                    genres: [],
                                    addedAt: new Date().toISOString(),
                                  })
                                }
                                className="p-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 text-slate-400 hover:text-white transition-all ml-auto"
                                title={inList ? 'Remove from Watchlist' : 'Add to Watchlist'}
                              >
                                {inList ? (
                                  <BookmarkCheck className="w-3.5 h-3.5 text-brand-400" />
                                ) : (
                                  <Bookmark className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Ronin Grounded Persona Description */}
                        <div className="mt-3 pt-2.5 border-t border-white/5">
                          <p className="text-[11px] text-slate-300 italic leading-relaxed">
                            {roninDesc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3.5 justify-start items-center pl-1 animate-fade-in">
            <div className="flex-shrink-0">
              <RoninAvatar size="sm" state="thinking" interactive={false} />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-surface-100/80 border border-brand-500/20 text-xs text-brand-300 flex items-center gap-2 shadow-lg glass-panel">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
              <span>Ronin is reflecting upon the cinematic archives...</span>
            </div>
          </div>
        )}

        <div />
      </div>

      {/* Input Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell Ronin what kind of story you seek tonight..."
          disabled={isThinking || isTypingStream}
          className="w-full pl-5 pr-14 py-3.5 rounded-2xl bg-surface-100/90 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-xl transition-all disabled:opacity-50 glass-panel"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking || isTypingStream}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-30 disabled:hover:bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
