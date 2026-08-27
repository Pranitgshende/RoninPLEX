import React, { useState, useEffect } from 'react';

interface TrailerPlayerProps {
  trailerKey: string | null;
  title: string;
  fallbackBackdrop?: string | null;
  onEnded?: () => void;
  className?: string;
}

export const TrailerPlayer: React.FC<TrailerPlayerProps> = ({
  trailerKey,
  title,
  fallbackBackdrop,
  className = 'w-full h-full',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [trailerKey]);

  if (!trailerKey || hasError) {
    if (fallbackBackdrop) {
      return (
        <img
          src={fallbackBackdrop}
          alt={title}
          className={`object-cover ${className}`}
        />
      );
    }
    return (
      <div className={`bg-surface-300 flex items-center justify-center text-xs text-slate-400 ${className}`}>
        Trailer Unavailable
      </div>
    );
  }

  // Use youtube-nocookie with autoplay, muted, no controls, loop for hover preview
  const embedUrl = `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${trailerKey}&playsinline=1&enablejsapi=1`;

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {!isLoaded && fallbackBackdrop && (
        <img
          src={fallbackBackdrop}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}
      <iframe
        src={embedUrl}
        title={`${title} Trailer Preview`}
        className={`w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        allow="autoplay; encrypted-media"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};
