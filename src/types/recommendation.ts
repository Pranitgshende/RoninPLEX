import { MediaType } from './tmdb';

export type MoodType = 
  | 'mind-bending' 
  | 'adrenaline' 
  | 'feel-good' 
  | 'dark-gritty' 
  | 'binge-worthy' 
  | 'chill-comedy'
  | 'heartfelt'
  | 'edge-of-seat';

export interface MoodOption {
  id: MoodType;
  label: string;
  emoji: string;
  description: string;
  genreIds: number[];
}

export interface RecommendationScore {
  score: number; // 0 to 100
  reason: string; // e.g. "Because you love Sci-Fi and Christopher Nolan"
  breakdown: {
    genreMatch: number;
    ratingWeight: number;
    actorDirectorMatch: number;
    similarityBonus: number;
  };
}

export interface ScoredMediaItem {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  voteCount: number;
  releaseDate: string;
  releaseYear: string;
  genreIds: number[];
  genres?: string[];
  recommendation: RecommendationScore;
  trailerKey?: string | null;
}
