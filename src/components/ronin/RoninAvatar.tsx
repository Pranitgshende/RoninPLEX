import React, { useState, useEffect } from 'react';

export type RoninAvatarState = RoninState;
export type RoninState =
  | 'idle'
  | 'thinking'
  | 'talking'
  | 'happy'
  | 'curious'
  | 'recommending'
  | 'surprised'
  | 'sword-practice'
  | 'celebrating';

export interface RoninAvatarProps {
  state?: RoninState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: string;
  onClick?: () => void;
  interactive?: boolean;
  className?: string;
  showSpeechBubble?: boolean;
  speechText?: string;
}

export const RoninAvatar: React.FC<RoninAvatarProps> = ({
  state = 'idle',
  size = 'md',
  mood,
  onClick,
  interactive = true,
  className = '',
  showSpeechBubble = false,
  speechText,
}) => {
  const [internalState, setInternalState] = useState<RoninState>(state);
  const [isHovered, setIsHovered] = useState(false);
  const [slashActive, setSlashActive] = useState(false);

  useEffect(() => {
    setInternalState(state);
  }, [state]);

  // Subtle ambient sword practice while idle (once every 30s)
  useEffect(() => {
    if (!interactive || state !== 'idle') return;
    const interval = setInterval(() => {
      setSlashActive(true);
      setInternalState('sword-practice');
      setTimeout(() => {
        setSlashActive(false);
        setInternalState('idle');
      }, 1200);
    }, 30000);

    return () => clearInterval(interval);
  }, [interactive, state]);

  const sizeMap = {
    sm: { container: 'w-10 h-10', svg: 40 },
    md: { container: 'w-16 h-16', svg: 64 },
    lg: { container: 'w-24 h-24', svg: 96 },
    xl: { container: 'w-36 h-36', svg: 144 },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const handleClick = () => {
    if (!interactive) return;
    if (internalState === 'idle') {
      setSlashActive(true);
      setInternalState('sword-practice');
      setTimeout(() => {
        setSlashActive(false);
        setInternalState('idle');
      }, 1200);
    }
    onClick?.();
  };

  const moodAccent =
    mood === 'action' ? '#ef4444' :
    mood === 'sci-fi' ? '#06b6d4' :
    mood === 'comedy' ? '#f59e0b' :
    mood === 'thriller' ? '#8b5cf6' :
    internalState === 'celebrating' || internalState === 'happy' ? '#f59e0b' :
    internalState === 'recommending' ? '#f43f5e' :
    internalState === 'curious' ? '#38bdf8' :
    '#6366f1';

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
      title={interactive ? 'Click Ronin for sword practice!' : 'Ronin Companion'}
    >
      {/* Ambient Aura / Glow */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 pointer-events-none ${
          internalState === 'thinking' ? 'opacity-80 scale-125' :
          internalState === 'talking' ? 'opacity-90 scale-110' :
          internalState === 'recommending' ? 'opacity-100 scale-140' :
          internalState === 'celebrating' ? 'opacity-100 scale-150 animate-pulse' :
          internalState === 'sword-practice' ? 'opacity-100 scale-150' :
          'opacity-40 scale-100'
        }`}
        style={{
          background: `radial-gradient(circle, ${moodAccent}66 0%, transparent 70%)`,
        }}
      />

      {/* SVG Character */}
      <div
        className={`relative ${currentSize.container} transition-transform duration-300 ${
          isHovered && interactive ? 'scale-105' : ''
        } ${
          internalState === 'idle' ? 'animate-ronin-breathe' :
          internalState === 'thinking' ? 'animate-ronin-thinking' :
          internalState === 'talking' ? 'animate-ronin-talking' :
          internalState === 'celebrating' ? 'animate-bounce' : ''
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-lg overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor={moodAccent} />
            </linearGradient>
            <filter id="eyeGlow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Katana on Back */}
          <g className={internalState === 'sword-practice' ? 'animate-ronin-slash' : ''}>
            <path
              d="M 28 85 L 78 20"
              stroke="#1e293b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 78 20 L 88 7"
              stroke="#475569"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 80 17 L 82 15 M 83 13 L 85 11"
              stroke={moodAccent}
              strokeWidth="2"
            />
            <ellipse cx="78" cy="20" rx="3.5" ry="1.8" fill="#cbd5e1" transform="rotate(-52 78 20)" />
          </g>

          {/* Torso / Haori Robe */}
          <path
            d="M 30 85 C 32 68, 40 60, 50 60 C 60 60, 68 68, 70 85 Z"
            fill="#0f172a"
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          {/* Inner Kimono Collar */}
          <path
            d="M 42 62 L 50 75 L 58 62"
            stroke={moodAccent}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Shaded Face */}
          <path
            d="M 38 45 C 38 56, 43 62, 50 62 C 57 62, 62 56, 62 45 Z"
            fill="#020617"
          />

          {/* Glowing Eyes Based on State */}
          <g filter="url(#eyeGlow)">
            {internalState === 'thinking' ? (
              <>
                <line x1="43" y1="49" x2="47" y2="49" stroke={moodAccent} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="53" y1="49" x2="57" y2="49" stroke={moodAccent} strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : internalState === 'talking' ? (
              <>
                <ellipse cx="45" cy="48" rx="2.5" ry="1.8" fill="#ffffff" />
                <ellipse cx="55" cy="48" rx="2.5" ry="1.8" fill="#ffffff" />
                <circle cx="45" cy="48" r="1.5" fill={moodAccent} />
                <circle cx="55" cy="48" r="1.5" fill={moodAccent} />
              </>
            ) : internalState === 'happy' || internalState === 'celebrating' ? (
              <>
                <path d="M 43 51 Q 45 47 47 51" stroke={moodAccent} strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M 53 51 Q 55 47 57 51" stroke={moodAccent} strokeWidth="2" fill="none" strokeLinecap="round" />
              </>
            ) : internalState === 'curious' ? (
              <>
                <circle cx="45" cy="48" r="2.2" fill={moodAccent} />
                <ellipse cx="55" cy="50" rx="2" ry="1" fill={moodAccent} />
              </>
            ) : internalState === 'surprised' ? (
              <>
                <circle cx="44" cy="49" r="2.5" fill="#ffffff" />
                <circle cx="56" cy="49" r="2.5" fill="#ffffff" />
                <circle cx="44" cy="49" r="1.2" fill={moodAccent} />
                <circle cx="56" cy="49" r="1.2" fill={moodAccent} />
              </>
            ) : internalState === 'recommending' ? (
              <>
                <polygon points="43,49 47,47 47,51" fill={moodAccent} />
                <polygon points="57,49 53,47 53,51" fill={moodAccent} />
              </>
            ) : (
              // Default stoic Ronin gaze
              <>
                <ellipse cx="44" cy="49" rx="2.5" ry="1.2" fill={moodAccent} />
                <ellipse cx="56" cy="49" rx="2.5" ry="1.2" fill={moodAccent} />
              </>
            )}
          </g>

          {/* Traditional Kasa Hat */}
          <path
            d="M 12 43 C 25 47, 75 47, 88 43 C 82 50, 18 50, 12 43 Z"
            fill="#000000"
            opacity="0.6"
          />
          <path
            d="M 10 44 Q 50 20 90 44 C 75 36, 25 36, 10 44 Z"
            fill="url(#hatGrad)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          <path
            d="M 50 25 L 18 43 M 50 25 L 34 42 M 50 25 L 50 41 M 50 25 L 66 42 M 50 25 L 82 43"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <circle cx="50" cy="25" r="2.5" fill={moodAccent} />

          {/* Slash Arc Effect */}
          {(internalState === 'sword-practice' || slashActive) && (
            <path
              d="M 10 80 Q 50 10 95 65"
              fill="none"
              stroke="url(#bladeGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-slash-arc"
            />
          )}
        </svg>
      </div>

      {/* Speech Bubble */}
      {showSpeechBubble && speechText && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-xl bg-surface-100 border border-brand-500/30 text-[11px] font-medium text-slate-200 shadow-xl backdrop-blur-md animate-fade-in pointer-events-none z-30">
          <span>{speechText}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-surface-100" />
        </div>
      )}
    </div>
  );
};
