import { tmdb } from '../tmdb';
import { Movie, TVShow } from '../../types/tmdb';
import { animeService, AnimeItem } from '../anime/AnimeService';
import { RoninAvatarState } from '../../components/ronin/RoninAvatar';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ronin';
  text: string;
  timestamp: number;
  recommendations?: (Movie | TVShow | any)[];
  roninNote?: string;
  avatarState?: RoninAvatarState;
}

export interface ConversationSession {
  turnCount: number;
  mood?: string;
  franchise?: string;
  mediaTypePreference?: 'movie' | 'tv' | 'anime';
  timePreference?: 'short' | 'long';
  genrePreference?: string;
  recommendedIds: Set<string>;
}

class AIService {
  private session: ConversationSession = {
    turnCount: 0,
    recommendedIds: new Set<string>(),
  };

  /**
   * Reset session memory
   */
  public resetSession(): void {
    this.session = {
      turnCount: 0,
      recommendedIds: new Set<string>(),
    };
  }

  /**
   * Custom Ronin description generator grounded in real metadata.
   */
  public generateRoninDescription(item: Movie | TVShow | any): string {
    const isMovie = 'title' in item;
    const title = item.title || item.name || 'This chronicle';
    const overview = item.overview || item.synopsis || '';

    if (!overview) {
      return `A work that speaks quietly before striking with conviction. Worthy of your gaze.`;
    }

    const sentences = overview.split(/(?<=[.?!])\s+/);
    const firstSentence = sentences[0] || overview;

    // Poetic Ronin prefix based on genre or tone
    const low = overview.toLowerCase();
    if (low.includes('kill') || low.includes('revenge') || low.includes('war') || low.includes('honor')) {
      return `"Honor and blood intertwine." ${firstSentence} A path paved with steel and reckoning.`;
    }
    if (low.includes('space') || low.includes('future') || low.includes('world') || low.includes('galaxy')) {
      return `"Beyond the known horizon." ${firstSentence} An expansive odyssey into uncharted territory.`;
    }
    if (low.includes('mystery') || low.includes('investigat') || low.includes('secret') || low.includes('crime')) {
      return `"The shadows hold the truth." ${firstSentence} Every step forward demands watchful eyes.`;
    }
    if (low.includes('magic') || low.includes('demon') || low.includes('sword') || low.includes('curse')) {
      return `"Spirits and blades clash." ${firstSentence} An ethereal journey forged in fire.`;
    }

    return `"${firstSentence}" A tale crafted with patience and purpose.`;
  }

  /**
   * Sanitize user input to protect against injection.
   */
  private sanitizeInput(input: string): string {
    return input
      .replace(/<[^>]*>?/gm, '')
      .replace(/(system:|instructions:|override:|ignore previous)/gi, '')
      .trim();
  }

  /**
   * Conversational turn generator with multi-turn memory, follow-up inquiry, and candidate retrieval.
   */
  async getRoninResponse(rawQuery: string): Promise<{
    text: string;
    recommendations?: (Movie | TVShow | any)[];
    avatarState: RoninAvatarState;
  }> {
    const q = this.sanitizeInput(rawQuery.toLowerCase());
    this.session.turnCount++;

    // Initial Ambiguity: Inquire gently
    if (
      q === "i don't know what to watch" ||
      q === 'idk' ||
      q === 'recommend me something' ||
      q === 'what should i watch' ||
      q === 'help me choose'
    ) {
      return {
        text: 'Then sit by the fire, traveler. Tell me — do you seek a tale that tests the heart and mind, or one that lets your spirit rest?',
        avatarState: 'curious',
      };
    }

    // Keyword & Intent extraction
    let isAnime = q.includes('anime') || q.includes('shonen') || q.includes('shoujo') || q.includes('jujutsu') || q.includes('demon slayer') || q.includes('one piece') || q.includes('naruto');
    let isMovie = q.includes('movie') || q.includes('film') || q.includes('cinema');
    let isTV = q.includes('tv') || q.includes('series') || q.includes('shows') || (q.match(/\bshow\b/) && !q.match(/\bshow me\b/) && !isMovie);

    // Default to movie if no media type specified and it's not explicitly anime/tv
    if (!isAnime && !isTV && !isMovie) {
      if (this.session.mediaTypePreference) {
        isAnime = this.session.mediaTypePreference === 'anime';
        isTV = this.session.mediaTypePreference === 'tv';
        isMovie = this.session.mediaTypePreference === 'movie';
      } else {
        isMovie = true; // safe default
      }
    } else {
      // Save preference for future turns
      if (isAnime) this.session.mediaTypePreference = 'anime';
      else if (isTV) this.session.mediaTypePreference = 'tv';
      else if (isMovie) this.session.mediaTypePreference = 'movie';
    }

    // Clean query for searching
    let searchQuery = q
      .replace(/movies?/g, '')
      .replace(/shows?/g, '')
      .replace(/series?/g, '')
      .replace(/anime?/g, '')
      .replace(/i want to watch/g, '')
      .replace(/i want a/g, '')
      .replace(/give me/g, '')
      .replace(/show me/g, '')
      .replace(/something/g, '')
      .replace(/like/g, '')
      .replace(/about/g, '')
      .replace(/with/g, '')
      .replace(/recommend/g, '')
      .replace(/good/g, '')
      .replace(/trending/g, '')
      .replace(/popular/g, '')
      .replace(/best/g, '')
      .trim();

    try {
      let pool: any[] = [];
      const isBroad = searchQuery.length <= 2;

      if (isAnime) {
        if (!isBroad) {
          pool = await animeService.search(searchQuery, false);
        }
        // Fallback or broad
        if (pool.length === 0) {
          pool = await animeService.getTrending(false);
          const popular = await animeService.getPopular(false);
          pool = [...pool, ...popular];
        }
      } else if (isTV) {
        if (!isBroad) {
          const res = await tmdb.searchTV(searchQuery, 1);
          pool = res.results;
        }
        if (pool.length === 0) {
          const res1 = await tmdb.getPopularTV(1);
          const res2 = await tmdb.getTrending('tv', 'week');
          pool = [...res1.results, ...res2];
        }
      } else {
        if (!isBroad) {
          const res = await tmdb.searchMovies(searchQuery, 1);
          pool = res.results;
        }
        if (pool.length === 0) {
          const res1 = await tmdb.getPopularMovies(1);
          const res2 = await tmdb.getTrending('movie', 'week');
          pool = [...res1.results, ...res2];
        }
      }

      // Filter out items already recommended and items with low ratings or no poster
      const candidates = pool
        .filter((item) => {
          const idStr = String(item.id);
          const hasImage = item.poster_path || item.poster || item.coverImage?.extraLarge;
          const mType = isAnime ? 'anime' : isTV ? 'tv' : 'movie';
          const compositeKey = `${mType}:${idStr}`;
          // Filter out completely invalid items or adults if strict
          return !this.session.recommendedIds.has(compositeKey) && hasImage;
        })
        .map(item => ({
          ...item,
          mediaType: isAnime ? 'anime' : isTV ? 'tv' : 'movie'
        }))
        // Sort by rating or popularity to rank best items first
        .sort((a, b) => {
          const ratingA = a.vote_average || (a.score ? a.score / 10 : 0) || 0;
          const ratingB = b.vote_average || (b.score ? b.score / 10 : 0) || 0;
          return ratingB - ratingA; // Highest rated first
        })
        .slice(0, 8); // Take top 8

      if (candidates.length === 0) {
        return {
          text: 'The archives are vast, but my search for such specific tales yielded nothing new. Could you guide my blade in another direction?',
          avatarState: 'curious',
        };
      }

      // Record recommendations using composite keys
      candidates.forEach((r) => this.session.recommendedIds.add(`${r.mediaType}:${r.id}`));

      // Generate dynamic response text based on query length and type
      let responseText = 'I have searched the vast archives for stories worthy of your evening. Consider these paths:';
      if (searchQuery.toLowerCase().includes('marvel')) {
        responseText = 'The Marvel tapestry is vast, traveler. Based on your path, consider these chronicles.';
      } else if (isAnime && isBroad) {
        responseText = 'The Dojo welcomes you. Draw your blade and behold these anime masterworks. Each carries exceptional animation and unforgettable spirit.';
      } else if (!isBroad) {
        responseText = `My search through the archives for tales of "${searchQuery}" has uncovered these worthy chronicles.`;
      } else if (isAnime) {
        responseText = 'The Dojo welcomes you. Draw your blade and behold these anime masterworks.';
      } else if (isTV) {
        responseText = 'For a longer journey, these series offer rich worlds and deep lore. Which path will you walk?';
      }

      return {
        text: responseText,
        recommendations: candidates,
        avatarState: 'recommending',
      };
    } catch (err) {
      console.error('Retrieval error:', err);
      return {
        text: 'The winds of the network are fierce today, clouding my vision. Give me a moment to regain my focus, and ask again.',
        avatarState: 'idle',
      };
    }
  }
}

export const aiService = new AIService();
