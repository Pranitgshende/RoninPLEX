import { AnimeStreamSource, ContentLanguage } from './AnimeTypes';
import { logPlayback } from '../../utils/logger';

const API_BASE = 'http://127.0.0.1:4173';
const PROVIDERS = ['gogoanime', 'allmanga'];

export class AnimeStreamService {
  /**
   * Main entry point to resolve an anime episode stream
   */
  static async resolveEpisodeStream(
    animeTitle: string,
    episodeNumber: number,
    preferredLanguage: ContentLanguage = ContentLanguage.SUB,
    animeId?: string
  ): Promise<AnimeStreamSource | null> {
    try {
      logPlayback(`[AnimeStreamService] Resolving stream for "${animeTitle}" (ID: ${animeId}) Episode ${episodeNumber}`);

      for (const provider of PROVIDERS) {
        logPlayback(`[AnimeStreamService] Trying provider: ${provider}`);
        try {
          let sourcesData: any = null;
          
          if (animeId && !animeId.startsWith('latest')) {
             logPlayback(`[AnimeStreamService] Attempting Anilist URN meta lookup for anilist:${animeId}`);
             const metaRes = await fetch(`${API_BASE}/meta/stream?provider=anilist&id=anilist:${animeId}&episode=${episodeNumber}&contentProvider=${provider}&language=${preferredLanguage}`);
             if (metaRes.ok) {
                 sourcesData = await metaRes.json();
             }
          }
          
          if (!sourcesData || !sourcesData.streams || sourcesData.streams.length === 0) {
            logPlayback(`[AnimeStreamService] Meta stream failed. Falling back to manual search.`);
            // 1. Search for the anime
            const searchRes = await fetch(`${API_BASE}/search?q=${encodeURIComponent(animeTitle)}&provider=${provider}`);
            if (!searchRes.ok) continue;
            const searchData = await searchRes.json();
            
            if (!searchData || searchData.length === 0) continue;
            
            const mediaId = searchData[0].id;
            logPlayback(`[AnimeStreamService] Found media ID: ${mediaId}`);
            
            // 2. Get episodes
            const epRes = await fetch(`${API_BASE}/content?mediaId=${encodeURIComponent(mediaId)}&provider=${provider}`);
            if (!epRes.ok) continue;
            const episodes = await epRes.json();
            
            const episode = episodes.find((e: any) => parseInt(e.number) === episodeNumber);
            if (!episode) continue;
            
            logPlayback(`[AnimeStreamService] Found episode ID: ${episode.id}`);
            
            // 3. Get stream
            const srcRes = await fetch(`${API_BASE}/stream?unitId=${encodeURIComponent(episode.id)}&provider=${provider}&language=${preferredLanguage}`);
            if (!srcRes.ok) continue;
            sourcesData = await srcRes.json();
          }
          
          if (!sourcesData || !sourcesData.streams || sourcesData.streams.length === 0) continue;
          
          // Find 1080p or auto
          const source = sourcesData.streams.find((s: any) => s.quality === '1080p') || 
                         sourcesData.streams.find((s: any) => s.quality === 'auto') ||
                         sourcesData.streams[0];
                         
          logPlayback(`[AnimeStreamService] Validating source URL: ${source.sourceUrl}`);
          
          // 4. Validate the stream
          const valid = await this.validateStream(source.sourceUrl);
          if (!valid) {
            logPlayback(`[AnimeStreamService] Source invalid or HTML returned, failing over.`);
            continue;
          }

          logPlayback(`[AnimeStreamService] Successfully resolved playable stream via ${provider}.`);
          
          const qualities = sourcesData.streams.map((s: any) => ({
            url: s.sourceUrl,
            quality: s.quality || 'auto',
            isHLS: s.isHLS || s.sourceUrl.includes('.m3u8') || s.sourceUrl.includes('/proxy?')
          }));
          
          return {
            sourceUrl: source.sourceUrl,
            isHLS: source.isHLS || source.sourceUrl.includes('.m3u8') || source.sourceUrl.includes('/proxy?'),
            language: ContentLanguage.SUB,
            quality: source.quality || 'auto',
            providerId: provider,
            qualities: qualities,
            subtitles: sourcesData.subtitles || []
          };
        } catch (e: any) {
          logPlayback(`[AnimeStreamService] Error on ${provider}: ${e.message}`);
          continue;
        }
      }
      
      throw new Error("All providers failed to resolve a playable stream.");
      
    } catch (e: any) {
      logPlayback(`[AnimeStreamService] Resolution failed: ${e.message}`);
      // Native App Error State (no HTML embeds!)
      return null;
    }
  }

  private static async validateStream(url: string): Promise<boolean> {
    try {
      // Pre-flight check to see if the proxy returns a valid response rather than a 404 HTML
      const headRes = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-1000' } });
      if (!headRes.ok) return false;
      const contentType = headRes.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}

