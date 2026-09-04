import { Movie, TVShow } from '../types/tmdb';
import { UserPreferences, WatchedItem, WatchlistItem } from '../types/user';
import { ScoredMediaItem, MoodType, MoodOption, RecommendationScore } from '../types/recommendation';
import { extractBestTrailerKey, normalizeMedia } from '../utils/helpers';
import { MOCK_GENRES } from './mockData';

export const MOODS: MoodOption[] = [
  {
    id: 'mind-bending',
    label: 'Mind-Bending',
    emoji: '🌀',
    description: 'Complex narratives, twists, sci-fi and reality-shifting puzzles.',
    genreIds: [878, 9648, 53], // Sci-Fi, Mystery, Thriller
  },
  {
    id: 'adrenaline',
    label: 'Adrenaline Rush',
    emoji: '⚡',
    description: 'High-octane action, chases, edge-of-seat survival and battles.',
    genreIds: [28, 12, 10759, 53], // Action, Adventure, Action & Adventure, Thriller
  },
  {
    id: 'feel-good',
    label: 'Feel-Good & Fun',
    emoji: '✨',
    description: 'Uplifting stories, laughter, heartwarming journeys and family fun.',
    genreIds: [35, 10751, 16], // Comedy, Family, Animation
  },
  {
    id: 'dark-gritty',
    label: 'Dark & Gritty',
    emoji: '🌑',
    description: 'Intense crime dramas, psychological thrillers, and neo-noir tales.',
    genreIds: [80, 18, 53], // Crime, Drama, Thriller
  },
  {
    id: 'binge-worthy',
    label: 'Binge-Worthy',
    emoji: '🍿',
    description: 'Addictive episodic series and gripping multi-character arcs.',
    genreIds: [18, 9648, 10765], // Drama, Mystery, Sci-Fi & Fantasy
  },
  {
    id: 'edge-of-seat',
    label: 'Spine-Chilling',
    emoji: '👻',
    description: 'Tense suspense, supernatural horrors, and eerie atmospheres.',
    genreIds: [27, 9648, 53], // Horror, Mystery, Thriller
  },
  {
    id: 'heartfelt',
    label: 'Deep & Emotional',
    emoji: '❤️',
    description: 'Compelling character dramas, romantic bonds, and human stories.',
    genreIds: [18, 10749, 36], // Drama, Romance, History
  }
];

class RecommendationEngine {
  private getGenreName(id: number): string {
    const found = MOCK_GENRES.find(g => g.id === id);
    return found ? found.name : 'Popular';
  }

  /**
   * Evaluates and scores an individual media item against user preferences and history
   */
  scoreItem(
    item: Movie | TVShow,
    preferences: UserPreferences,
    watchlist: WatchlistItem[],
    watched: WatchedItem[]
  ): RecommendationScore {
    const normalized = normalizeMedia(item);
    const itemGenreIds = item.genre_ids || (item.genres ? item.genres.map(g => g.id) : []);

    let genreScore = 0;
    const matchingFavoriteGenres: string[] = [];

    // 1. Favorite Genres Match (Up to 40 points)
    preferences.favoriteGenreIds.forEach(favId => {
      if (itemGenreIds.includes(favId)) {
        genreScore += 15;
        matchingFavoriteGenres.push(this.getGenreName(favId));
      }
    });
    const genreMatch = Math.min(genreScore, 40);

    // 2. TMDB Rating & Quality Weight (Up to 30 points)
    const rawRating = item.vote_average || 0;
    const ratingWeight = Math.min(Math.round((rawRating / 10) * 30), 30);

    // 3. User History & Affinities (Up to 20 points)
    let similarityBonus = 0;
    const likedItems = watched.filter(w => w.userLiked);
    const dislikedItems = watched.filter(w => w.userDisliked);

    // Severe penalty if already disliked
    const isDisliked = dislikedItems.some(d => d.id === item.id && d.mediaType === normalized.media_type);
    if (isDisliked) {
      return {
        score: 5,
        reason: 'Previously marked as not interested',
        breakdown: { genreMatch: 0, ratingWeight: 5, actorDirectorMatch: 0, similarityBonus: 0 }
      };
    }

    // Similarity boost from liked items
    if (likedItems.length > 0) {
      similarityBonus += 10;
    }

    // Is it in watchlist? Small interest signal
    const inWatchlist = watchlist.some(w => w.id === item.id && w.mediaType === normalized.media_type);
    if (inWatchlist) {
      similarityBonus += 10;
    }

    // 4. Actor & Director Match (Up to 10 points)
    let actorDirectorMatch = 0;
    const itemCredits = item.credits;
    if (itemCredits && preferences.favoriteActors.length > 0) {
      const castNames = itemCredits.cast.map(c => c.name.toLowerCase());
      const hasFavActor = preferences.favoriteActors.some(actor => castNames.includes(actor.toLowerCase()));
      if (hasFavActor) actorDirectorMatch += 5;
    }
    if (itemCredits && preferences.favoriteDirectors.length > 0) {
      const directorNames = itemCredits.crew.filter(c => c.job === 'Director').map(c => c.name.toLowerCase());
      const hasFavDirector = preferences.favoriteDirectors.some(dir => directorNames.includes(dir.toLowerCase()));
      if (hasFavDirector) actorDirectorMatch += 5;
    }

    // Base quality score if above minimum rating threshold
    if (rawRating >= preferences.minRatingThreshold) {
      similarityBonus += 5;
    }

    const totalScore = Math.min(genreMatch + ratingWeight + similarityBonus + actorDirectorMatch, 100);

    // Generate human-readable reason
    let reason = '';
    if (matchingFavoriteGenres.length > 0) {
      reason = `Matches your favorite genres: ${matchingFavoriteGenres.slice(0, 2).join(' & ')}`;
    } else if (rawRating >= 8.0) {
      reason = `Critically acclaimed with a ${rawRating.toFixed(1)} TMDB score`;
    } else if (inWatchlist) {
      reason = 'Saved on your personal Watchlist';
    } else {
      reason = 'Trending pick curated for your profile';
    }

    return {
      score: totalScore,
      reason,
      breakdown: {
        genreMatch,
        ratingWeight,
        actorDirectorMatch,
        similarityBonus,
      }
    };
  }

  /**
   * Sorts and enhances a list of media items with recommendation metrics
   */
  rankMedia(
    items: (Movie | TVShow)[],
    preferences: UserPreferences,
    watchlist: WatchlistItem[],
    watched: WatchedItem[]
  ): ScoredMediaItem[] {
    const scoredList: ScoredMediaItem[] = items.map(item => {
      const normalized = normalizeMedia(item);
      const recommendation = this.scoreItem(item, preferences, watchlist, watched);
      const trailerKey = extractBestTrailerKey(item.videos?.results);
      const genreNames = (item.genre_ids || item.genres?.map(g => g.id) || []).map(id => this.getGenreName(id));

      return {
        id: item.id,
        mediaType: normalized.media_type,
        title: normalized.displayTitle,
        overview: item.overview || 'No overview available.',
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        rating: item.vote_average || 0,
        voteCount: item.vote_count || 0,
        releaseDate: normalized.displayDate,
        releaseYear: normalized.displayYear,
        genreIds: item.genre_ids || (item.genres ? item.genres.map(g => g.id) : []),
        genres: genreNames,
        recommendation,
        trailerKey,
      };
    });

    // Sort descending by calculated recommendation score
    return scoredList.sort((a, b) => b.recommendation.score - a.recommendation.score);
  }

  /**
   * "What Should I Watch Tonight?" decision selector
   */
  pickTonight(
    items: (Movie | TVShow)[],
    mood: MoodType,
    maxMinutes?: number,
    mediaTypeFilter: 'all' | 'movie' | 'tv' | 'anime' = 'all'
  ): ScoredMediaItem | null {
    const moodConfig = MOODS.find(m => m.id === mood) || MOODS[0];
    
    // Filter by type
    let candidates = items.filter(item => {
      const normalized = normalizeMedia(item);
      const isAnime = (normalized.media_type as string) === 'anime' || Boolean((item as any).isAnime) || ('romajiTitle' in item);
      if (mediaTypeFilter === 'anime') {
        return isAnime;
      }
      if (mediaTypeFilter === 'movie') {
        return normalized.media_type === 'movie' && !isAnime;
      }
      if (mediaTypeFilter === 'tv') {
        return normalized.media_type === 'tv' && !isAnime;
      }
      return true;
    });

    // Filter by runtime if specified
    if (maxMinutes && maxMinutes > 0) {
      candidates = candidates.filter(item => {
        const movie = item as Movie;
        if (movie.runtime && movie.runtime > maxMinutes) return false;
        return true;
      });
    }

    // Prioritize mood genres
    const scored = candidates.map(item => {
      const genreIds = item.genre_ids || item.genres?.map(g => typeof g === 'number' ? g : (g as any).id) || [];
      const moodMatches = moodConfig.genreIds.filter(gId => genreIds.includes(gId)).length;
      
      // Match string genres for Anime
      const stringGenres: string[] = Array.isArray((item as any).genres)
        ? (item as any).genres.filter((g: any) => typeof g === 'string')
        : [];
      const stringMoodMatches = stringGenres.filter(gName => {
        const lower = gName.toLowerCase();
        if (mood === 'mind-bending') return lower.includes('sci-fi') || lower.includes('mystery') || lower.includes('psychological');
        if (mood === 'adrenaline') return lower.includes('action') || lower.includes('adventure') || lower.includes('shounen');
        if (mood === 'feel-good') return lower.includes('comedy') || lower.includes('slice of life') || lower.includes('fantasy');
        if (mood === 'dark-gritty') return lower.includes('horror') || lower.includes('thriller') || lower.includes('dark');
        if (mood === 'binge-worthy') return lower.includes('drama') || lower.includes('supernatural');
        if (mood === 'edge-of-seat') return lower.includes('suspense') || lower.includes('mystery');
        if (mood === 'heartfelt') return lower.includes('romance') || lower.includes('drama');
        return false;
      }).length;

      const totalMatches = moodMatches + stringMoodMatches;
      const score = (totalMatches * 30) + ((item.vote_average || 0) * 8);
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    if (scored.length === 0 && items.length > 0) {
      const defaultItem = items[0];
      const normalized = normalizeMedia(defaultItem);
      return {
        id: defaultItem.id,
        mediaType: normalized.media_type,
        title: normalized.displayTitle,
        overview: defaultItem.overview,
        posterPath: defaultItem.poster_path,
        backdropPath: defaultItem.backdrop_path,
        rating: defaultItem.vote_average,
        voteCount: defaultItem.vote_count,
        releaseDate: normalized.displayDate,
        releaseYear: normalized.displayYear,
        genreIds: defaultItem.genre_ids || [],
        recommendation: {
          score: 90,
          reason: `Handpicked for your ${moodConfig.label} mood`,
          breakdown: { genreMatch: 30, ratingWeight: 30, actorDirectorMatch: 15, similarityBonus: 15 }
        },
        trailerKey: extractBestTrailerKey(defaultItem.videos?.results)
      };
    }

    if (scored.length > 0) {
      const top = scored[0].item;
      const normalized = normalizeMedia(top);
      return {
        id: top.id,
        mediaType: normalized.media_type,
        title: normalized.displayTitle,
        overview: top.overview,
        posterPath: top.poster_path,
        backdropPath: top.backdrop_path,
        rating: top.vote_average,
        voteCount: top.vote_count,
        releaseDate: normalized.displayDate,
        releaseYear: normalized.displayYear,
        genreIds: top.genre_ids || [],
        recommendation: {
          score: 95,
          reason: `Top recommendation for your ${moodConfig.label} evening mood`,
          breakdown: { genreMatch: 35, ratingWeight: 30, actorDirectorMatch: 15, similarityBonus: 15 }
        },
        trailerKey: extractBestTrailerKey(top.videos?.results)
      };
    }

    return null;
  }
}

export const recommendation = new RecommendationEngine();
