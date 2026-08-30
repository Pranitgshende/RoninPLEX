// Architecture uses a Vite proxy instead of importing from 'anime-sdk' directly in browser to prevent Buffer polyfill crashes.
import { AnimeItem, AnimeEpisode, AnimeStreamSource, ContentLanguage } from './AnimeTypes';

const API_BASE = 'http://127.0.0.1:4173';

export class AnimeSdkAdapter {
  public async searchAnime(query: string): Promise<AnimeItem[]> {
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        romajiTitle: d.title,
        englishTitle: d.title,
        poster: d.image || d.cover || '',
        banner: d.image || d.cover,
        synopsis: d.description || '',
        format: 'TV',
        totalEpisodes: d.totalEpisodes || 0,
        status: d.status === 'Ongoing' ? 'RELEASING' : 'FINISHED',
        year: d.releaseDate ? parseInt(d.releaseDate) : new Date().getFullYear(),
        genres: d.genres || [],
        score: d.rating ? parseFloat(d.rating) * 10 : 80,
        isAdult: false,
        studios: [],
      }));
    } catch {
      return [];
    }
  }

  public async getAnimeDetails(id: string): Promise<AnimeItem | null> {
    try {
      // Anime SDK doesn't have a direct detail endpoint for Gogoanime by default in our proxy 
      // except maybe through search or episodes. Let's return a dummy or fetch from Anilist later.
      return {
        id,
        title: id.replace(/-/g, ' ').toUpperCase(),
        poster: '',
        synopsis: '',
        format: 'TV',
        totalEpisodes: 0,
        status: 'FINISHED',
        year: 2024,
        genres: [],
        score: 80,
        isAdult: false,
        studios: [],
      };
    } catch {
      return null;
    }
  }

  public async getEpisodes(id: string): Promise<AnimeEpisode[]> {
    try {
      const res = await fetch(`${API_BASE}/episodes?id=${encodeURIComponent(id)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((ep: any) => ({
        id: ep.id,
        number: parseInt(ep.number),
        title: ep.title || `Episode ${ep.number}`,
        availableLanguages: [ContentLanguage.SUB, ContentLanguage.DUB]
      }));
    } catch {
      return [];
    }
  }

  public async getStreamingSources(
    animeTitle: string,
    episodeNumber: number,
    language: ContentLanguage = ContentLanguage.SUB
  ): Promise<AnimeStreamSource | null> {
    // This is handled by AnimeStreamService directly now, but we implement for interface compliance
    return null;
  }
}

export const animeSdk = new AnimeSdkAdapter();
