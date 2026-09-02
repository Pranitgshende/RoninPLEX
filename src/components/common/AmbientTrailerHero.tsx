import React, { useEffect, useRef, useState } from 'react';
import { getBackdropUrl } from '../../utils/helpers';

interface AmbientTrailerHeroProps {
  backdropPath: string | null;
  trailerKey: string | null;
  title: string;
  children?: React.ReactNode;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const AmbientTrailerHero: React.FC<AmbientTrailerHeroProps> = ({
  backdropPath,
  trailerKey,
  title,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Lazy load trigger
  useEffect(() => {
    if (!trailerKey) return;
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 1500); // Wait for page transition and initial render
    return () => clearTimeout(timer);
  }, [trailerKey]);

  // Intersection Observer for pausing when out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load YT API
  useEffect(() => {
    if (!shouldLoad || !trailerKey || isApiLoaded) return;

    if (window.YT && window.YT.Player) {
      setIsApiLoaded(true);
      return;
    }

    const scriptId = 'youtube-iframe-api';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);

      window.onYouTubeIframeAPIReady = () => {
        setIsApiLoaded(true);
      };
    } else {
      // Script is loading but not ready, poll or rely on another component's callback
      // For safety, just set a timeout fallback
      const check = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setIsApiLoaded(true);
          clearInterval(check);
        }
      }, 500);
      return () => clearInterval(check);
    }
  }, [shouldLoad, trailerKey, isApiLoaded]);

  // Initialize Player
  useEffect(() => {
    if (!isApiLoaded || !shouldLoad || !trailerKey) return;
    if (playerRef.current) return;

    const playerElementId = 'ambient-trailer-player';
    
    // We create a div dynamically to hold the player so React doesn't complain about YT mutating DOM
    const playerContainer = document.getElementById(playerElementId);
    if (!playerContainer) return;

    playerRef.current = new window.YT.Player(playerElementId, {
      videoId: trailerKey,
      host: 'https://www.youtube-nocookie.com',
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        loop: 1,
        playlist: trailerKey,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3
      },
      events: {
        onReady: (event: any) => {
          if (isVisible) {
            event.target.playVideo();
          }
        },
        onStateChange: (event: any) => {
          // YT.PlayerState.PLAYING === 1
          if (event.data === 1) {
            setIsPlaying(true);
          }
        },
        onError: () => {
          // Fallback handled by keeping isPlaying = false
        }
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setIsPlaying(false);
    };
  }, [isApiLoaded, shouldLoad, trailerKey]); // We intentionally do not include isVisible here to avoid recreating

  // Play/Pause based on visibility
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      if (isVisible) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isVisible]);

  return (
    <div ref={containerRef} className="relative w-full h-[60vh] lg:h-[70vh] overflow-hidden bg-background">
      {/* Fallback / Initial Poster */}
      <img
        src={getBackdropUrl(backdropPath, 'original')}
        alt={title}
        className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 motion-reduce:transition-none motion-reduce:duration-0 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
      />
      
      {/* Trailer Container */}
      {shouldLoad && trailerKey && (
        <div className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 motion-reduce:transition-none motion-reduce:duration-0 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
          {/* 
            YT Player needs to act like object-cover. 
            We make it massive enough to bleed out of the edges.
          */}
          <div className="absolute top-1/2 left-1/2 w-[300vw] h-[168.75vw] md:w-[150vw] md:h-[84.375vw] xl:w-[120vw] xl:h-[67.5vw] -translate-x-1/2 -translate-y-1/2">
            <div id="ambient-trailer-player" className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-black/30 pointer-events-none" />
      <div className="absolute inset-0 bg-hero-side-gradient opacity-80 pointer-events-none" />

      {/* Passed Children (Back button, etc) */}
      {children}
    </div>
  );
};
