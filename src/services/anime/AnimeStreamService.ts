import { AnimeStreamSource, ContentLanguage } from './AnimeTypes';
import { logPlayback } from '../../utils/logger';
import { vidLinkProProvider } from '../streaming/providers/VidLinkProProvider';

const API_BASE = 'http://127.0.0.1:4173';
const PROVIDERS = ['animeparadise', 'gogoanime', 'allmanga'];

export class AnimeStreamService {
  /**
   * Main entry point to resolve an anime episode stream
   */
  private static async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  private static async fetchJsonWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<any> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) {
        clearTimeout(id);
        return null;
      }
      const data = await res.json();
      clearTimeout(id);
      return data;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  static async resolveEpisodeStream(
    animeTitle: string,
    episodeNumber: number,
    preferredLanguage: ContentLanguage = ContentLanguage.SUB,
    animeId?: string,
    retryCount: number = 0,
    malId?: number,
    preferredProviderId?: string
  ): Promise<AnimeStreamSource | null> {
    try {
      logPlayback(`[AnimeStreamService] Resolving stream for "${animeTitle}" (ID: ${animeId}, MAL: ${malId}) Episode ${episodeNumber}`);

      // 1. PRIMARY: VidLink Anime resolution when MAL ID is available and provider not locked to anime-sdk
      const shouldTryVidLink = preferredProviderId === 'vidlink' || (!preferredProviderId && retryCount === 0);
      if (shouldTryVidLink) {
        if (malId && typeof malId === 'number' && malId > 0) {
          try {
            logPlayback(`[AnimeStreamService] Attempting VidLink Anime resolution (MAL ID: ${malId}, Ep: ${episodeNumber})`);
            const vidLinkEp = await vidLinkProProvider.getAnimeEpisode(
              malId,
              episodeNumber,
              preferredLanguage === ContentLanguage.DUB ? 'dub' : 'sub'
            );
            if (vidLinkEp && vidLinkEp.available && vidLinkEp.stream?.url) {
              logPlayback(`[AnimeStreamService] VidLink Anime resolution successful: ${vidLinkEp.stream.url}`);
              return {
                sourceUrl: vidLinkEp.stream.url,
                isHLS: false,
                isEmbed: true,
                quality: 'Auto HD',
                providerId: 'vidlink',
                language: preferredLanguage,
                subtitles: [],
                subtitlesAvailable: preferredLanguage === ContentLanguage.SUB,
                subtitleInspectionStatus: 'managed_by_embed',
                subtitleNote: preferredLanguage === ContentLanguage.SUB
                  ? 'Subtitles are rendered internally by the VidLink player. Direct track inspection is restricted by Same-Origin Policy (SOP).'
                  : 'Dubbed audio selected; subtitles disabled.',
                videoAvailable: true,
                audioAvailable: true,
                qualities: [{ url: vidLinkEp.stream.url, quality: 'Auto HD', isHLS: false }],
              };
            }
          } catch (vidLinkErr: any) {
            logPlayback(`[AnimeStreamService] VidLink Anime resolution failed: ${vidLinkErr?.message}`);
          }
        } else {
          logPlayback(`[AnimeStreamService] No valid MAL ID available for "${animeTitle}". Cannot resolve via VidLink.`);
          if (preferredProviderId === 'vidlink') {
            logPlayback(`[AnimeStreamService] VidLink explicitly requested without MAL ID. Truthful failure.`);
            return null;
          }
        }
      }

      // 2. FALLBACK: Anime SDK local sidecar
      const shiftedProviders = [...PROVIDERS];
      if (shiftedProviders.length > 0) {
        const shiftBy = retryCount % shiftedProviders.length;
        for (let i = 0; i < shiftBy; i++) {
          shiftedProviders.push(shiftedProviders.shift()!);
        }
      }

      for (const provider of shiftedProviders) {
        logPlayback(`[AnimeStreamService] Trying fallback sidecar provider: ${provider}`);
        try {
          let sourcesData: any = null;
          
          if (animeId && !animeId.startsWith('latest')) {
             try {
               logPlayback(`[AnimeStreamService] Attempting Anilist URN meta lookup for anilist:${animeId}`);
               sourcesData = await this.fetchJsonWithTimeout(`${API_BASE}/meta/stream?provider=anilist&id=anilist:${animeId}&episode=${episodeNumber}&contentProvider=${provider}&language=${preferredLanguage}`, {}, 15000);
             } catch (metaErr: any) {
               logPlayback(`[AnimeStreamService] Meta lookup error/timeout: ${metaErr.message}`);
               sourcesData = null; // Proceed to fallback
             }
          }
          
          if (!sourcesData || !sourcesData.streams || sourcesData.streams.length === 0) {
            logPlayback(`[AnimeStreamService] Meta stream failed. Falling back to manual search.`);
            const searchData = await this.fetchJsonWithTimeout(`${API_BASE}/search?q=${encodeURIComponent(animeTitle)}&provider=${provider}`);
            if (!searchData || searchData.length === 0) continue;
            
            const mediaId = searchData[0].id;
            logPlayback(`[AnimeStreamService] Found media ID: ${mediaId}`);
            
            const episodes = await this.fetchJsonWithTimeout(`${API_BASE}/content?mediaId=${encodeURIComponent(mediaId)}&provider=${provider}`);
            if (!episodes || !Array.isArray(episodes)) continue;
            
            const episode = episodes.find((e: any) => parseInt(e.number) === episodeNumber);
            if (!episode) continue;
            
            logPlayback(`[AnimeStreamService] Found episode ID: ${episode.id}`);
            
            sourcesData = await this.fetchJsonWithTimeout(`${API_BASE}/stream?unitId=${encodeURIComponent(episode.id)}&provider=${provider}&language=${preferredLanguage}`);
          }
          
          if (!sourcesData || !sourcesData.streams || sourcesData.streams.length === 0) continue;
          
          // Validate candidates in deterministic order
          const streams = sourcesData.streams as any[];
          const candidates = [];
          const s1080 = streams.find(s => s.quality === '1080p');
          if (s1080) candidates.push(s1080);
          const sAuto = streams.find(s => s.quality === 'auto');
          if (sAuto) candidates.push(sAuto);
          
          for (const s of streams) {
            if (s.quality !== '1080p' && s.quality !== 'auto') {
              candidates.push(s);
            }
          }
          
          let validSource = null;
          for (const source of candidates) {
            logPlayback(`[AnimeStreamService] Validating source URL (${source.quality})`);
            const sourceUrl = source.url || source.sourceUrl;
            if (!sourceUrl) continue;
            
            const valid = await this.validateStream(sourceUrl);
            if (valid) {
              validSource = source;
              validSource.sourceUrl = sourceUrl;
              break;
            } else {
              logPlayback(`[AnimeStreamService] Source invalid (${source.quality}), trying next quality...`);
            }
          }

          if (!validSource) {
            logPlayback(`[AnimeStreamService] All sources invalid for ${provider}, failing over.`);
            continue;
          }

          logPlayback(`[AnimeStreamService] Successfully resolved playable stream via ${provider}.`);
          
          const qualities = sourcesData.streams.map((s: any) => {
            const url = s.url || s.sourceUrl;
            return {
              url: url,
              quality: s.quality || 'auto',
              isHLS: s.isHLS || (url && url.includes('.m3u8')) || (url && url.includes('/proxy?'))
            };
          });
          
          const subs = Array.isArray(sourcesData.subtitles) ? sourcesData.subtitles : [];
          return {
            sourceUrl: validSource.sourceUrl,
            isHLS: validSource.isHLS || validSource.sourceUrl.includes('.m3u8') || validSource.sourceUrl.includes('/proxy?'),
            isEmbed: false,
            language: preferredLanguage,
            quality: validSource.quality || 'auto',
            providerId: 'anime-sdk',
            qualities: qualities,
            subtitles: subs,
            subtitlesAvailable: subs.length > 0,
            videoAvailable: true,
            audioAvailable: true,
          };
        } catch (e: any) {
          logPlayback(`[AnimeStreamService] Error on ${provider}: ${e.message}`);
          continue;
        }
      }
      
      if (preferredLanguage === ContentLanguage.DUB) {
        logPlayback(`[AnimeStreamService] DUB failed across all providers, falling back to SUB.`);
        return AnimeStreamService.resolveEpisodeStream(animeTitle, episodeNumber, ContentLanguage.SUB, animeId, 0, malId, preferredProviderId);
      }
      throw new Error("All providers failed to resolve a playable stream.");
      
    } catch (e: any) {
      logPlayback(`[AnimeStreamService] Resolution failed: ${e.message}`);
      return null;
    }
  }

  private static async validateStream(url: string): Promise<boolean> {
    try {
      const isHLS = url.includes('.m3u8') || url.includes('/proxy?');
      // HLS CDNs often reject Range requests (416/405), so use a simple HEAD/GET for HLS
      const options: RequestInit = isHLS
        ? { method: 'HEAD' }
        : { method: 'GET', headers: { 'Range': 'bytes=0-1000' } };
      const headRes = await this.fetchWithTimeout(url, options, 5000);
      if (!headRes.ok) {
        // For HLS, retry with GET if HEAD fails (some CDNs don't support HEAD)
        if (isHLS) {
          const getRes = await this.fetchWithTimeout(url, { method: 'GET' }, 5000);
          if (!getRes.ok) return false;
          const ct = getRes.headers.get('content-type') || '';
          return !ct.includes('text/html');
        }
        return false;
      }
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

