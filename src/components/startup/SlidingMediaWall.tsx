import React, { useMemo } from 'react';
import { useReducedMotion } from '../../animation/hooks/useReducedMotion';
import { getBackdropUrl } from '../../utils/helpers';

interface MediaCardData {
  id: number | string;
  title: string;
  imageUrl: string;
}

// Curated cinematic list of titles from RoninPLEX library
const WALL_ITEMS: MediaCardData[] = [
  // Row 1 items (Cinema Blockbusters)
  { id: 'dune2', title: 'Dune: Part Two', imageUrl: getBackdropUrl('/xOMo8BRK7PfcJv9JCnx7s520ewq.jpg', 'medium') },
  { id: 'oppenheimer', title: 'Oppenheimer', imageUrl: getBackdropUrl('/nb3FtI8s79Tq4XumZ29TyDx0nhv.jpg', 'medium') },
  { id: 'spiderverse', title: 'Across the Spider-Verse', imageUrl: getBackdropUrl('/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg', 'medium') },
  { id: 'interstellar', title: 'Interstellar', imageUrl: getBackdropUrl('/xJHokMbljvjADYdit5fK5VQsXEG.jpg', 'medium') },
  { id: 'bladerunner', title: 'Blade Runner 2049', imageUrl: getBackdropUrl('/sAtoMqDVhNDQBc3QJL3RF6hlxGq.jpg', 'medium') },
  { id: 'batman', title: 'The Batman', imageUrl: getBackdropUrl('/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg', 'medium') },
  
  // Row 2 items (Prestige Series)
  { id: 'arcane', title: 'Arcane', imageUrl: getBackdropUrl('/fqv8v6A90792pq4tq6ikoo2qXur.jpg', 'medium') },
  { id: 'shogun', title: 'Shōgun', imageUrl: getBackdropUrl('/77i125EaM918tZ7KjU3d2Z5b5F9.jpg', 'medium') },
  { id: 'strangerthings', title: 'Stranger Things', imageUrl: getBackdropUrl('/56v2KjBlU4XaOv9rVYEQypROD7P.jpg', 'medium') },
  { id: 'lastofus', title: 'The Last of Us', imageUrl: getBackdropUrl('/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg', 'medium') },
  { id: 'severance', title: 'Severance', imageUrl: getBackdropUrl('/9faGSFi5jam6pDWGNd0ip8JYrTe.jpg', 'medium') },
  { id: 'fallout', title: 'Fallout', imageUrl: getBackdropUrl('/2meO59Qf7W5Y1b7Q8J2rQ5O5w5h.jpg', 'medium') },

  // Row 3 items (Anime Legends)
  { id: 'demonslayer', title: 'Demon Slayer', imageUrl: getBackdropUrl('/nTvM4mhqZlHIgwRLSIQ10Y2NTUm.jpg', 'medium') },
  { id: 'jjk', title: 'Jujutsu Kaisen', imageUrl: getBackdropUrl('/gmECVPkvn9w5k5L03m8P5M0xQ7e.jpg', 'medium') },
  { id: 'aot', title: 'Attack on Titan', imageUrl: getBackdropUrl('/2cWk3Z5T4m8L03m8P5M0xQ7e04h.jpg', 'medium') },
  { id: 'edgerunners', title: 'Cyberpunk: Edgerunners', imageUrl: getBackdropUrl('/7gY19F6cO5M4P2L03m8P5M0xQ7e.jpg', 'medium') },
  { id: 'chainsawman', title: 'Chainsaw Man', imageUrl: getBackdropUrl('/y4a18F6cO5M4P2L03m8P5M0xQ7e.jpg', 'medium') },
  { id: 'spiritedaway', title: 'Spirited Away', imageUrl: getBackdropUrl('/bX5L03m8P5M0xQ7e04h9F6cO5M4.jpg', 'medium') },

  // Row 4 items (Epic Action & Thrillers)
  { id: 'inception', title: 'Inception', imageUrl: getBackdropUrl('/8ZTVqvKDQ8emSGUEMjsS4yUMCqP.jpg', 'medium') },
  { id: 'darkknight', title: 'The Dark Knight', imageUrl: getBackdropUrl('/dqK9Hag1054tghRQSqLSPo9q9nF.jpg', 'medium') },
  { id: 'matrix', title: 'The Matrix', imageUrl: getBackdropUrl('/fNG7i7rqMErkcqhohV2a6JWdlv9.jpg', 'medium') },
  { id: 'gladiator', title: 'Gladiator', imageUrl: getBackdropUrl('/ArWJn2Nqfyv2S96YRTbeujue37R.jpg', 'medium') },
  { id: 'avatar', title: 'Avatar: The Way of Water', imageUrl: getBackdropUrl('/s16H6tpK2utvwDtzZIMQvR6EalL.jpg', 'medium') },
  { id: 'topgun', title: 'Top Gun: Maverick', imageUrl: getBackdropUrl('/AaV1YIdWKnjAiaOe0UUKNJm925r.jpg', 'medium') },

  // Row 5 items (Cinematic Masterpieces)
  { id: 'godfather', title: 'The Godfather', imageUrl: getBackdropUrl('/tmU7GeKVybMWFButWEGl2M4GeiP.jpg', 'medium') },
  { id: 'pulpfiction', title: 'Pulp Fiction', imageUrl: getBackdropUrl('/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg', 'medium') },
  { id: 'fightclub', title: 'Fight Club', imageUrl: getBackdropUrl('/hZkgoQYus5vegHoetLkCJzb17zJ.jpg', 'medium') },
  { id: 'goodfellas', title: 'GoodFellas', imageUrl: getBackdropUrl('/sw7mordbZxgITU877yTpZCud90M.jpg', 'medium') },
  { id: 'lotr', title: 'The Lord of the Rings', imageUrl: getBackdropUrl('/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg', 'medium') },
  { id: 'yourname', title: 'Your Name', imageUrl: getBackdropUrl('/dIWwZW7dJJ1qC6CFs9YpNT3xlC6.jpg', 'medium') },
];

const ROW_CONFIGS = [
  { direction: 'left' as const, duration: 48, startIndex: 0, count: 6 },
  { direction: 'right' as const, duration: 56, startIndex: 6, count: 6 },
  { direction: 'left' as const, duration: 42, startIndex: 12, count: 6 },
  { direction: 'right' as const, duration: 52, startIndex: 18, count: 6 },
  { direction: 'left' as const, duration: 46, startIndex: 24, count: 6 },
];

export const SlidingMediaWall: React.FC = () => {
  const reducedMotion = useReducedMotion();

  // Create card slices for each of the 5 rows
  const rowData = useMemo(() => {
    return ROW_CONFIGS.map((config) => {
      const items = WALL_ITEMS.slice(config.startIndex, config.startIndex + config.count);
      // Double the array for seamless infinite looping
      return {
        ...config,
        items: [...items, ...items],
      };
    });
  }, []);

  return (
    <div 
      className="absolute -inset-10 z-0 overflow-hidden pointer-events-none select-none flex flex-col justify-around opacity-45 transform -rotate-1 scale-105"
      aria-hidden="true"
    >
      {rowData.map((row, rowIdx) => {
        const animationClass = reducedMotion
          ? ''
          : row.direction === 'left'
          ? 'animate-media-wall-left'
          : 'animate-media-wall-right';

        return (
          <div 
            key={`row-${rowIdx}`}
            className="flex items-center overflow-hidden py-1"
            style={{
              ['--media-wall-duration' as any]: `${row.duration}s`,
            }}
          >
            <div className={`flex items-center gap-3.5 shrink-0 ${animationClass}`}>
              {row.items.map((card, cardIdx) => (
                <div
                  key={`${card.id}-${cardIdx}`}
                  className="w-48 sm:w-56 md:w-64 aspect-[16/9] rounded-xl overflow-hidden relative bg-surface-200/90 border border-white/10 shadow-lg shadow-black/40 shrink-0"
                >
                  <img
                    src={card.imageUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      // Graceful fallback to dark styled placeholder
                      const target = e.currentTarget;
                      target.style.display = 'none';
                    }}
                    className="w-full h-full object-cover brightness-75 contrast-110"
                  />
                  {/* Subtle card sheen */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/5 pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Cinematic Radial Scrim: Darkens the center behind the fixed logo for sharp contrast */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(9, 10, 15, 0.88) 0%, rgba(9, 10, 15, 0.5) 45%, rgba(9, 10, 15, 0.95) 100%)',
        }}
      />
    </div>
  );
};
