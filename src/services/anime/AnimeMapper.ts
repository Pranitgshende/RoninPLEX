/**
 * RoninPLEX v2.0.0 — Anime Mapper
 * Normalizes metadata from AniList GraphQL, Jikan, and Anime SDK into domain models.
 */

import { AnimeItem, AnimeEpisode, LatestAiringEpisode, UpcomingAiringEpisode, ContentLanguage } from './AnimeTypes';

export class AnimeMapper {
  /**
   * Normalizes an AniList GraphQL Media node into AnimeItem.
   */
  public static fromAniListMedia(m: any): AnimeItem {
    if (!m) {
      throw new Error('Cannot map null or undefined AniList media');
    }

    const englishTitle = m.title?.english || undefined;
    const romajiTitle = m.title?.romaji || undefined;
    const nativeTitle = m.title?.native || undefined;
    const primaryTitle = englishTitle || romajiTitle || m.title?.userPreferred || 'Unknown Anime';

    const poster =
      m.coverImage?.extraLarge ||
      m.coverImage?.large ||
      m.coverImage?.medium ||
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';

    const banner =
      m.bannerImage ||
      m.coverImage?.extraLarge ||
      undefined;

    const genres: string[] = Array.isArray(m.genres) ? m.genres : [];
    const studios: string[] = [];
    if (m.studios?.nodes && Array.isArray(m.studios.nodes)) {
      for (const s of m.studios.nodes) {
        if (s.name) studios.push(s.name);
      }
    }

    // Adult Classification: check isAdult flag, genres, or adult tags
    const isAdult =
      Boolean(m.isAdult) ||
      genres.some(g => g.toLowerCase() === 'hentai' || g.toLowerCase() === 'ecchi') ||
      (Array.isArray(m.tags) && m.tags.some((t: any) => t.isAdult || t.name?.toLowerCase().includes('18+')));

    let trailerUrl: string | undefined = undefined;
    if (m.trailer && m.trailer.site === 'youtube') {
      trailerUrl = `https://www.youtube.com/watch?v=${m.trailer.id}`;
    }

    const year = m.seasonYear || m.startDate?.year || undefined;
    const score = typeof m.averageScore === 'number' ? m.averageScore / 10 : undefined;

    // Episode Count: For continuous long-running anime like One Piece, m.episodes is null, but m.nextAiringEpisode gives the current episode!
    const calculatedEpisodeCount = m.episodes || (m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : undefined);
    const latestEpisode = m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : m.episodes || undefined;

    const relations = m.relations?.edges?.map((edge: any) => ({
      id: String(edge.node?.id),
      relationType: edge.relationType,
      title: edge.node?.title?.english || edge.node?.title?.romaji || edge.node?.title?.userPreferred || 'Unknown',
      format: edge.node?.format,
      status: edge.node?.status,
      poster: edge.node?.coverImage?.large
    })) || [];

    return {
      id: String(m.id),
      anilistId: m.id,
      malId: m.idMal || undefined,
      title: primaryTitle,
      englishTitle,
      romajiTitle,
      nativeTitle,
      synopsis: (m.description || 'No description available.').replace(/<[^>]*>?/gm, ''),
      genres,
      studios: studios.length > 0 ? studios : ['Animation Studio'],
      season: m.season || undefined,
      year,
      status: m.status || 'FINISHED',
      episodeCount: calculatedEpisodeCount,
      latestEpisode,
      nextAiringEpisode: m.nextAiringEpisode ? {
        episode: m.nextAiringEpisode.episode,
        airingAt: m.nextAiringEpisode.airingAt,
        timeUntilAiring: m.nextAiringEpisode.timeUntilAiring,
      } : undefined,
      episodeDuration: m.duration || 24,
      score: score ? Number(score.toFixed(1)) : 8.0,
      popularity: m.popularity || 0,
      poster,
      banner,
      trailer: trailerUrl,
      isAdult,
      ageRating: isAdult ? '18+ Mature' : (m.isAdult === false ? 'PG-13' : undefined),
      format: m.format || 'TV',
      episodes: this.mapStreamingEpisodes(m.streamingEpisodes, String(m.id), calculatedEpisodeCount),
      relations,
    };
  }

  /**
   * Generates or maps episode lists with NO artificial cap.
   * Supports 1100+ episodes for continuous series such as One Piece.
   */
  public static mapStreamingEpisodes(
    streamingEps: any[] | undefined,
    animeId: string,
    totalCount?: number
  ): AnimeEpisode[] {
    const episodes: AnimeEpisode[] = [];

    if (Array.isArray(streamingEps) && streamingEps.length > 0) {
      for (let i = 0; i < streamingEps.length; i++) {
        const ep = streamingEps[i];
        const numMatch = ep.title?.match(/^Episode\s+(\d+(?:\.\d+)?)/i);
        const epNumber = numMatch ? parseFloat(numMatch[1]) : i + 1;
        const cleanTitle = (ep.title || `Episode ${epNumber}`).replace(/^Episode\s+\d+(?:\.\d+)?\s*[-–:]?\s*/i, '').trim();

        episodes.push({
          id: `${animeId}:ep-${epNumber}`,
          animeId,
          number: epNumber,
          title: cleanTitle || `Episode ${epNumber}`,
          thumbnail: ep.thumbnail || undefined,
          availableLanguages: [ContentLanguage.SUB, ContentLanguage.DUB],
        });
      }
    }

    // Generate up to totalCount (e.g. 1175 for One Piece) without arbitrary limits!
    const count = totalCount && totalCount > 0 ? totalCount : (episodes.length > 0 ? episodes.length : 12);
    if (episodes.length < count) {
      const existingNumbers = new Set(episodes.map(e => e.number));
      for (let n = 1; n <= count; n++) {
        if (!existingNumbers.has(n)) {
          episodes.push({
            id: `${animeId}:ep-${n}`,
            animeId,
            number: n,
            title: `Episode ${n}`,
            availableLanguages: [ContentLanguage.SUB, ContentLanguage.DUB],
          });
        }
      }
    }

    episodes.sort((a, b) => a.number - b.number);
    return episodes;
  }

  /**
   * Maps raw AniList airing schedule node into LatestAiringEpisode domain model.
   */
  public static fromAiringSchedule(node: any): LatestAiringEpisode {
    const m = node.media || {};
    const englishTitle = m.title?.english || undefined;
    const romajiTitle = m.title?.romaji || undefined;
    const primaryTitle = englishTitle || romajiTitle || m.title?.userPreferred || 'Unknown Anime';

    const poster = m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || '';
    const banner = m.bannerImage || poster;

    const date = new Date(node.airingAt * 1000);
    const releaseDateText = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      id: String(node.id),
      animeId: String(m.id),
      animeTitle: primaryTitle,
      romajiTitle,
      episodeNumber: node.episode,
      airingAt: node.airingAt,
      releaseDateText,
      status: m.status || 'RELEASING',
      poster,
      banner,
      isAdult: Boolean(m.isAdult),
      nextEpisode: m.nextAiringEpisode ? {
        episodeNumber: m.nextAiringEpisode.episode,
        airingAt: m.nextAiringEpisode.airingAt,
        timeUntilAiring: m.nextAiringEpisode.timeUntilAiring,
      } : undefined,
    };
  }
}
