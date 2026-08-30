/**
 * RoninPLEX v2.0.0 � Anime Repository
 * Interacts with AniList GraphQL and Jikan APIs with offline fallback.
 * Completely independent of TMDB.
 */

import { ContentLanguage, AnimeItem, AnimeEpisode, LatestAiringEpisode, UpcomingAiringEpisode } from './AnimeTypes';
import { AnimeMapper } from './AnimeMapper';
import { AnimeCache } from './AnimeCache';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';
const REQUEST_TIMEOUT_MS = 8000;

export const OFFLINE_FALLBACK_ANIME: AnimeItem[] = [
  {
    id: '1429',
    anilistId: 16498,
    malId: 16498,
    title: 'Attack on Titan',
    englishTitle: 'Attack on Titan',
    romajiTitle: 'Shingeki no Kyojin',
    nativeTitle: '?????',
    synopsis: 'Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans, forcing humans to hide within concentric walls. Young Eren Jaeger vows to wipe out all Titans after his hometown is decimated.',
    poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
    year: 2013,
    score: 9.0,
    popularity: 540000,
    genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
    studios: ['Wit Studio', 'MAPPA'],
    status: 'FINISHED',
    episodeCount: 87,
    episodeDuration: 24,
    isAdult: false,
    format: 'TV',
    episodes: Array.from({ length: 25 }, (_, i) => ({
      id: `1429:ep-${i + 1}`,
      animeId: '1429',
      number: i + 1,
      title: i === 0 ? 'To You, in 2000 Years: The Fall of Shiganshina, Part 1' : `Episode ${i + 1}`,
      availableLanguages: [ContentLanguage.SUB, ContentLanguage.DUB],
    })),
  },
  {
    id: '85937',
    anilistId: 101922,
    malId: 38000,
    title: 'Demon Slayer: Kimetsu no Yaiba',
    englishTitle: 'Demon Slayer: Kimetsu no Yaiba',
    romajiTitle: 'Kimetsu no Yaiba',
    nativeTitle: '????',
    synopsis: 'Tanjiro Kamado, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon. To make matters worse, his younger sister Nezuko has been transformed into a demon herself.',
    poster: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    year: 2019,
    score: 8.8,
    popularity: 490000,
    genres: ['Action', 'Fantasy', 'Historical', 'Shonen'],
    studios: ['ufotable'],
    status: 'RELEASING',
    episodeCount: 55,
    episodeDuration: 24,
    isAdult: false,
    format: 'TV',
    episodes: Array.from({ length: 26 }, (_, i) => ({
      id: `85937:ep-${i + 1}`,
      animeId: '85937',
      number: i + 1,
      title: i === 0 ? 'Cruelty' : `Episode ${i + 1}`,
      availableLanguages: [ContentLanguage.SUB, ContentLanguage.DUB],
    })),
  },
  {
    id: '95479',
    anilistId: 113415,
    malId: 40748,
    title: 'Jujutsu Kaisen',
    englishTitle: 'Jujutsu Kaisen',
    romajiTitle: 'Jujutsu Kaisen',
    nativeTitle: '????',
    synopsis: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself.",
    poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    year: 2020,
    score: 8.7,
    popularity: 480000,
    genres: ['Action', 'Supernatural', 'Fantasy'],
    studios: ['MAPPA'],
    status: 'FINISHED',
    episodeCount: 24,
    episodeDuration: 24,
    isAdult: false,
    format: 'TV',
    episodes: Array.from({ length: 24 }, (_, i) => ({
      id: `95479:ep-${i + 1}`,
      animeId: '95479',
      number: i + 1,
      title: i === 0 ? 'Ryomen Sukuna' : `Episode ${i + 1}`,
      availableLanguages: [ContentLanguage.SUB, ContentLanguage.DUB],
    })),
  },
  {
    id: '209867',
    anilistId: 151807,
    malId: 52299,
    title: 'Solo Leveling',
    englishTitle: 'Solo Leveling',
    romajiTitle: 'Ore dake Level Up na Ken',
    nativeTitle: '???????????',
    synopsis: 'In a world where hunters must battle deadly monsters to protect humanity, Sung Jinwoo, notoriously known as the weakest hunter of all mankind, finds himself in a struggle for survival.',
    poster: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
    year: 2024,
    score: 8.6,
    popularity: 380000,
    genres: ['Action', 'Adventure', 'Fantasy'],
    studios: ['A-1 Pictures'],
    status: 'FINISHED',
    episodeCount: 12,
    episodeDuration: 24,
    isAdult: false,
    format: 'TV',
    episodes: Array.from({ length: 12 }, (_, i) => ({
      id: `209867:ep-${i + 1}`,
      animeId: '209867',
      number: i + 1,
      title: i === 0 ? "I'm Used to It" : `Episode ${i + 1}`,
      availableLanguages: [ContentLanguage.SUB, ContentLanguage.DUB],
    })),
  },
  {
    id: '105248',
    anilistId: 120377,
    malId: 42364,
    title: 'Cyberpunk: Edgerunners',
    englishTitle: 'Cyberpunk: Edgerunners',
    romajiTitle: 'Cyberpunk: Edgerunners',
    nativeTitle: '??????? ????????',
    synopsis: 'A street kid trying to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he chooses to stay alive by becoming an edgerunner: a mercenary outlaw also known as a cyberpunk.',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    year: 2022,
    score: 8.6,
    popularity: 360000,
    genres: ['Action', 'Sci-Fi', 'Psychological'],
    studios: ['Studio Trigger'],
    status: 'FINISHED',
    episodeCount: 10,
    episodeDuration: 24,
    isAdult: true, // Mature Cyberpunk theme
    ageRating: '18+ Mature',
    format: 'ONA',
    episodes: Array.from({ length: 10 }, (_, i) => ({
      id: `105248:ep-${i + 1}`,
      animeId: '105248',
      number: i + 1,
      title: i === 0 ? 'Let You Down' : `Episode ${i + 1}`,
      availableLanguages: [ContentLanguage.SUB, ContentLanguage.DUB],
    })),
  },
  {
    id: '1535',
    anilistId: 1535,
    malId: 1535,
    title: 'Death Note',
    englishTitle: 'Death Note',
    romajiTitle: 'Death Note',
    nativeTitle: '?????',
    synopsis: 'An intelligent high school student goes on a secret crusade to eliminate criminals from the world after discovering a notebook capable of killing anyone whose name is written into it.',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    year: 2006,
    score: 8.9,
    popularity: 620000,
    genres: ['Mystery', 'Psychological', 'Supernatural', 'Thriller'],
    studios: ['Madhouse'],
    status: 'FINISHED',
    episodeCount: 37,
    episodeDuration: 23,
    isAdult: false,
    format: 'TV',
    episodes: Array.from({ length: 37 }, (_, i) => ({
      id: `1535:ep-${i + 1}`,
      animeId: '1535',
      number: i + 1,
      title: i === 0 ? 'Rebirth' : `Episode ${i + 1}`,
      availableLanguages: [ContentLanguage.SUB, ContentLanguage.DUB],
    })),
  },
];

export class AnimeRepository {
  /**
   * Executes a GraphQL query against AniList with timeout and caching.
   */
  private static async executeGraphQL<T>(query: string, variables: Record<string, any>): Promise<T | null> {
    const cacheKey = 'gql_' + JSON.stringify({ query, variables });
    const cached = AnimeCache.get<T>(cacheKey);
    if (cached) return cached;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`AniList GraphQL request failed with status: ${response.status}`);
        return null;
      }

      const json = await response.json();
      if (json.errors) {
        console.warn('AniList GraphQL returned errors:', json.errors);
        return null;
      }

      const data = json.data as T;
      AnimeCache.set(cacheKey, data, 15 * 60 * 1000); // 15 min TTL
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('AniList GraphQL fetch error:', err instanceof Error ? err.message : err);
      return null;
    }
  }

  /**
   * Fetch Trending Anime.
   */
  public static async fetchTrending(page: number = 1, perPage: number = 20, allowAdult: boolean = false): Promise<AnimeItem[]> {
    const query = `
      query ($page: Int, $perPage: Int, $isAdult: Boolean) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, isAdult: $isAdult, sort: [TRENDING_DESC, POPULARITY_DESC]) {
            id
            idMal
            title { romaji english native userPreferred }
            description
            coverImage { extraLarge large medium color }
            bannerImage
            genres
            tags { name isAdult }
            status
            episodes
            duration
            averageScore
            popularity
            isAdult
            season
            seasonYear
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    const data = await this.executeGraphQL<any>(query, {
      page,
      perPage,
      isAdult: allowAdult ? undefined : false,
    });

    if (data?.Page?.media && Array.isArray(data.Page.media) && data.Page.media.length > 0) {
      return data.Page.media.map((m: any) => AnimeMapper.fromAniListMedia(m));
    }

    // Return fallback dataset filtered by adult setting
    return OFFLINE_FALLBACK_ANIME.filter(a => allowAdult || !a.isAdult);
  }

  /**
   * Fetch Popular Anime.
   */
  public static async fetchPopular(page: number = 1, perPage: number = 20, allowAdult: boolean = false): Promise<AnimeItem[]> {
    const query = `
      query ($page: Int, $perPage: Int, $isAdult: Boolean) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, isAdult: $isAdult, sort: [POPULARITY_DESC]) {
            id
            idMal
            title { romaji english native userPreferred }
            description
            coverImage { extraLarge large medium color }
            bannerImage
            genres
            tags { name isAdult }
            status
            episodes
            duration
            averageScore
            popularity
            isAdult
            season
            seasonYear
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    const data = await this.executeGraphQL<any>(query, {
      page,
      perPage,
      isAdult: allowAdult ? undefined : false,
    });

    if (data?.Page?.media && Array.isArray(data.Page.media) && data.Page.media.length > 0) {
      return data.Page.media.map((m: any) => AnimeMapper.fromAniListMedia(m));
    }

    return OFFLINE_FALLBACK_ANIME.filter(a => allowAdult || !a.isAdult);
  }

  /**
   * Fetch Top Rated Anime.
   */
  public static async fetchTopRated(page: number = 1, perPage: number = 20, allowAdult: boolean = false): Promise<AnimeItem[]> {
    const query = `
      query ($page: Int, $perPage: Int, $isAdult: Boolean) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, isAdult: $isAdult, sort: [SCORE_DESC]) {
            id
            idMal
            title { romaji english native userPreferred }
            description
            coverImage { extraLarge large medium color }
            bannerImage
            genres
            tags { name isAdult }
            status
            episodes
            duration
            averageScore
            popularity
            isAdult
            season
            seasonYear
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    const data = await this.executeGraphQL<any>(query, {
      page,
      perPage,
      isAdult: allowAdult ? undefined : false,
    });

    if (data?.Page?.media && Array.isArray(data.Page.media) && data.Page.media.length > 0) {
      return data.Page.media.map((m: any) => AnimeMapper.fromAniListMedia(m));
    }

    return OFFLINE_FALLBACK_ANIME.filter(a => allowAdult || !a.isAdult);
  }

  /**
   * Fetch Currently Airing Anime.
   */
  public static async fetchCurrentlyAiring(page: number = 1, perPage: number = 20, allowAdult: boolean = false): Promise<AnimeItem[]> {
    const query = `
      query ($page: Int, $perPage: Int, $isAdult: Boolean) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, status: RELEASING, isAdult: $isAdult, sort: [POPULARITY_DESC]) {
            id
            idMal
            title { romaji english native userPreferred }
            description
            coverImage { extraLarge large medium color }
            bannerImage
            genres
            tags { name isAdult }
            status
            episodes
            duration
            averageScore
            popularity
            isAdult
            season
            seasonYear
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    const data = await this.executeGraphQL<any>(query, {
      page,
      perPage,
      isAdult: allowAdult ? undefined : false,
    });

    if (data?.Page?.media && Array.isArray(data.Page.media) && data.Page.media.length > 0) {
      return data.Page.media.map((m: any) => AnimeMapper.fromAniListMedia(m));
    }

    return OFFLINE_FALLBACK_ANIME.filter(a => a.status === 'RELEASING' && (allowAdult || !a.isAdult));
  }

  /**
   * Fetch Seasonal Anime.
   */
  public static async fetchSeasonal(season: string, year: number, page: number = 1, perPage: number = 20, allowAdult: boolean = false): Promise<AnimeItem[]> {
    const query = `
      query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int, $isAdult: Boolean) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, season: $season, seasonYear: $year, isAdult: $isAdult, sort: [POPULARITY_DESC]) {
            id
            idMal
            title { romaji english native userPreferred }
            description
            coverImage { extraLarge large medium color }
            bannerImage
            genres
            tags { name isAdult }
            status
            episodes
            duration
            averageScore
            popularity
            isAdult
            season
            seasonYear
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    const data = await this.executeGraphQL<any>(query, {
      season: season.toUpperCase(),
      year,
      page,
      perPage,
      isAdult: allowAdult ? undefined : false,
    });

    if (data?.Page?.media && Array.isArray(data.Page.media) && data.Page.media.length > 0) {
      return data.Page.media.map((m: any) => AnimeMapper.fromAniListMedia(m));
    }

    return OFFLINE_FALLBACK_ANIME.filter(a => allowAdult || !a.isAdult);
  }

  /**
   * Fetch Dedicated 18+ Adult Anime.
   */
  public static async fetchAdultAnime(page: number = 1, perPage: number = 20): Promise<AnimeItem[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, isAdult: true, sort: [POPULARITY_DESC]) {
            id
            idMal
            title { romaji english native userPreferred }
            description
            coverImage { extraLarge large medium color }
            bannerImage
            genres
            tags { name isAdult }
            status
            episodes
            duration
            averageScore
            popularity
            isAdult
            season
            seasonYear
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    const data = await this.executeGraphQL<any>(query, { page, perPage });

    if (data?.Page?.media && Array.isArray(data.Page.media) && data.Page.media.length > 0) {
      return data.Page.media.map((m: any) => AnimeMapper.fromAniListMedia(m));
    }

    return OFFLINE_FALLBACK_ANIME.filter(a => a.isAdult);
  }

  /**
   * Search Anime by query.
   */
  public static async searchAnime(searchQuery: string, page: number = 1, perPage: number = 20, allowAdult: boolean = false): Promise<AnimeItem[]> {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return this.fetchTrending(page, perPage, allowAdult);
    }

    const query = `
      query ($search: String, $page: Int, $perPage: Int, $isAdult: Boolean) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, search: $search, isAdult: $isAdult, sort: [SEARCH_MATCH]) {
            id
            idMal
            title { romaji english native userPreferred }
            description
            coverImage { extraLarge large medium color }
            bannerImage
            genres
            tags { name isAdult }
            status
            episodes
            duration
            averageScore
            popularity
            isAdult
            season
            seasonYear
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    const data = await this.executeGraphQL<any>(query, {
      search: searchQuery.trim(),
      page,
      perPage,
      isAdult: allowAdult ? undefined : false,
    });

    if (data?.Page?.media && Array.isArray(data.Page.media) && data.Page.media.length > 0) {
      return data.Page.media.map((m: any) => AnimeMapper.fromAniListMedia(m));
    }

    // Local search in fallback
    const q = searchQuery.toLowerCase();
    return OFFLINE_FALLBACK_ANIME.filter(a =>
      (a.title.toLowerCase().includes(q) ||
        a.englishTitle?.toLowerCase().includes(q) ||
        a.romajiTitle?.toLowerCase().includes(q)) &&
      (allowAdult || !a.isAdult)
    );
  }

  /**
   * Fetch full details for a specific Anime by ID.
   */
  public static async fetchAnimeDetails(id: string): Promise<AnimeItem | null> {
    const rawId = id.includes(':') ? id.split(':').pop()! : id;
    const numericId = parseInt(rawId, 10);

    if (Number.isFinite(numericId)) {
      const query = `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            idMal
            title { romaji english native userPreferred }
            description
            coverImage { extraLarge large medium color }
            bannerImage
            genres
            tags { name isAdult }
            status
            episodes
            duration
            averageScore
            popularity
            isAdult
            season
            seasonYear
            studios(isMain: true) { nodes { name } }
            trailer { id site }
            streamingEpisodes { title thumbnail url site }
            nextAiringEpisode { episode airingAt timeUntilAiring }
            relations {
              edges {
                relationType
                node {
                  id
                  title { romaji english userPreferred }
                  format
                  status
                  coverImage { large }
                }
              }
            }
          }
        }
      `;

      const data = await this.executeGraphQL<any>(query, { id: numericId });
      if (data?.Media) {
        return AnimeMapper.fromAniListMedia(data.Media);
      }
    }

    // Fallback match
    const fallback = OFFLINE_FALLBACK_ANIME.find(a => a.id === id || a.id === rawId);
    return fallback || null;
  }

  /**
   * Fetch Episode List for an Anime.
   */
  public static async fetchAnimeEpisodes(id: string): Promise<AnimeEpisode[]> {
    const details = await this.fetchAnimeDetails(id);
    if (details && details.episodes && details.episodes.length > 0) {
      return details.episodes;
    }

    const count = details?.episodeCount || 12;
    return Array.from({ length: count }, (_, i) => ({
      id: `${id}:ep-${i + 1}`,
      animeId: id,
      number: i + 1,
      title: `Episode ${i + 1}`,
      availableLanguages: [ContentLanguage.SUB, ContentLanguage.DUB],
    }));
  }

  /**
   * Fetches latest released anime episodes with airing times and next episode info.
   */
  public static async fetchLatestEpisodes(page: number = 1, perPage: number = 20): Promise<LatestAiringEpisode[]> {
    const cacheKey = `anime_latest_episodes_p${page}_${perPage}`;
    const cached = AnimeCache.get<LatestAiringEpisode[]>(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            airingSchedules(notYetAired: false, sort: TIME_DESC) {
              id
              episode
              airingAt
              media {
                id
                title { romaji english native userPreferred }
                coverImage { extraLarge large medium color }
                bannerImage
                status
                isAdult
                nextAiringEpisode {
                  episode
                  airingAt
                  timeUntilAiring
                }
              }
            }
          }
        }
      `;

      const data = await this.executeGraphQL<any>(query, { page, perPage });
      const schedules = data?.Page?.airingSchedules;
      if (Array.isArray(schedules) && schedules.length > 0) {
        const items = schedules.map((s: any) => AnimeMapper.fromAiringSchedule(s));
        AnimeCache.set(cacheKey, items, 15 * 60 * 1000); // 15 mins TTL
        return items;
      }
    } catch (err) {
      console.warn('AniList fetchLatestEpisodes failed:', err);
    }

    // Fallback: use OFFLINE_FALLBACK_ANIME converted to LatestAiringEpisode
    return OFFLINE_FALLBACK_ANIME.slice(0, 10).map((a, idx) => ({
      id: `latest-${a.id}`,
      animeId: a.id,
      animeTitle: a.title,
      romajiTitle: a.romajiTitle,
      episodeNumber: a.episodeCount ? Math.max(1, a.episodeCount - idx) : 24,
      airingAt: Math.floor(Date.now() / 1000) - idx * 86400,
      releaseDateText: 'Recently Released',
      status: a.status,
      poster: a.poster,
      banner: a.banner,
      isAdult: a.isAdult,
      nextEpisode: {
        episodeNumber: (a.episodeCount || 24) + 1,
        airingAt: Math.floor(Date.now() / 1000) + (7 - idx) * 86400,
        timeUntilAiring: (7 - idx) * 86400,
      },
    }));
  }

  /**
   * Fetches upcoming scheduled anime episodes with live countdown timer.
   */
  public static async fetchUpcomingEpisodes(page: number = 1, perPage: number = 20): Promise<UpcomingAiringEpisode[]> {
    const cacheKey = `anime_upcoming_episodes_p${page}_${perPage}`;
    const cached = AnimeCache.get<UpcomingAiringEpisode[]>(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            airingSchedules(notYetAired: true, sort: TIME) {
              id
              episode
              airingAt
              timeUntilAiring
              media {
                id
                title { romaji english native userPreferred }
                coverImage { extraLarge large medium color }
                bannerImage
              }
            }
          }
        }
      `;

      const data = await this.executeGraphQL<any>(query, { page, perPage });
      const schedules = data?.Page?.airingSchedules;
      if (Array.isArray(schedules) && schedules.length > 0) {
        const items = schedules.map((s: any) => ({
          id: String(s.id),
          animeId: String(s.media?.id),
          animeTitle: s.media?.title?.english || s.media?.title?.romaji || s.media?.title?.userPreferred || 'Unknown Anime',
          romajiTitle: s.media?.title?.romaji || undefined,
          episodeNumber: s.episode,
          airingAt: s.airingAt,
          timeUntilAiring: s.timeUntilAiring,
          poster: s.media?.coverImage?.extraLarge || s.media?.coverImage?.large || '',
          banner: s.media?.bannerImage || undefined,
        }));
        AnimeCache.set(cacheKey, items, 15 * 60 * 1000);
        return items;
      }
    } catch (err) {
      console.warn('AniList fetchUpcomingEpisodes failed:', err);
    }
    return [];
  }

}
