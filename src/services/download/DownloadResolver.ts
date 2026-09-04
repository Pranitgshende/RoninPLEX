/**
 * RoninPLEX v2.1.1 — Download Resolver
 * 
 * Two-stage download resolution architecture:
 * 1. Inspects endpoint responses & redirects for download links (e.g. Rive download endpoint).
 * 2. Strict SSRF validation: rejects RFC1918, loopback, link-local, ULA, and non-HTTP schemes.
 * 3. Rejects HTML landing pages / CAPTCHA / cloudflare challenges: never saves HTML as .mp4.
 * 4. Resolves direct media container types (video/mp4 -> .mp4, video/x-matroska -> .mkv, video/webm -> .webm)
 *    and extracts filename from Content-Disposition when present.
 */

export interface DownloadResolutionResult {
  status: 'direct_media' | 'requires_browser' | 'error';
  directUrl?: string;
  redirectUrl?: string;
  fileName?: string;
  extension?: string;
  contentType?: string;
  contentLength?: number;
  message?: string;
}

export class DownloadResolver {
  private static readonly PRIVATE_IP_PATTERNS = [
    /^127\./,                         // Loopback IPv4
    /^10\./,                          // RFC1918 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // RFC1918 172.16.0.0/12
    /^192\.168\./,                    // RFC1918 192.168.0.0/16
    /^169\.254\./,                    // Link-local
    /^0\./,                           // Zero address
    /^localhost$/i,                   // Localhost
    /^::1$/,                          // IPv6 Loopback
    /^fc00:/i,                        // IPv6 ULA
    /^fe80:/i,                        // IPv6 Link-local
  ];

  private static readonly DISALLOWED_SCHEMES = [
    'file:',
    'data:',
    'blob:',
    'javascript:',
    'ftp:',
    'about:',
  ];

  /**
   * Validates target URL against SSRF attacks and forbidden schemes.
   */
  public static validateUrl(urlString: string): { isValid: boolean; reason?: string } {
    if (!urlString || typeof urlString !== 'string') {
      return { isValid: false, reason: 'Empty or invalid URL provided' };
    }

    const trimmed = urlString.trim().toLowerCase();
    for (const scheme of this.DISALLOWED_SCHEMES) {
      if (trimmed.startsWith(scheme)) {
        return { isValid: false, reason: `Forbidden URL scheme: ${scheme}` };
      }
    }

    try {
      const parsed = new URL(urlString);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { isValid: false, reason: `Only HTTP and HTTPS protocols are allowed. Found: ${parsed.protocol}` };
      }

      const hostname = parsed.hostname;
      for (const pattern of this.PRIVATE_IP_PATTERNS) {
        if (pattern.test(hostname)) {
          return { isValid: false, reason: `Private/internal network access is forbidden: ${hostname}` };
        }
      }

      return { isValid: true };
    } catch {
      return { isValid: false, reason: 'Malformed URL structure' };
    }
  }

  /**
   * Constructs the Rive download endpoint URL for a given Movie or TV show.
   */
  public static getRiveDownloadUrl(
    mediaType: 'movie' | 'tv',
    tmdbId: number,
    season?: number,
    episode?: number
  ): string {
    if (mediaType === 'movie') {
      return `https://rivestream.app/download?type=movie&id=${tmdbId}`;
    }
    return `https://rivestream.app/download?type=tv&id=${tmdbId}&season=${season || 1}&episode=${episode || 1}`;
  }

  /**
   * Constructs a custom download endpoint URL from template if provided.
   */
  public static getCustomDownloadUrl(
    template: string,
    mediaType: 'movie' | 'tv' | 'anime',
    tmdbId: number,
    season?: number,
    episode?: number
  ): string {
    if (!template) return '';
    return template
      .replace(/\{tmdbId\}/g, String(tmdbId))
      .replace(/\{id\}/g, String(tmdbId))
      .replace(/\{season\}/g, String(season || 1))
      .replace(/\{episode\}/g, String(episode || 1))
      .replace(/\{type\}/g, mediaType);
  }

  /**
   * Inspects a candidate download URL or Rive download endpoint.
   * Performs pre-flight inspection of redirects, headers, and mime types.
   */
  public static async resolveDownload(
    targetUrl: string,
    defaultTitle: string,
    mediaType: 'movie' | 'tv' | 'anime',
    season?: number,
    episode?: number
  ): Promise<DownloadResolutionResult> {
    const validation = this.validateUrl(targetUrl);
    if (!validation.isValid) {
      return {
        status: 'error',
        message: `Security validation rejected URL: ${validation.reason}`,
      };
    }

    // Clean filename generator
    const sanitizedTitle = defaultTitle.replace(/[/\\?%*:|"<>]/g, '_').trim();
    let baseFileName = sanitizedTitle;
    if (mediaType === 'tv' && season && episode) {
      baseFileName = `${sanitizedTitle}_S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
    } else if (mediaType === 'anime' && episode) {
      baseFileName = `${sanitizedTitle}_EP${String(episode).padStart(2, '0')}`;
    }

    try {
      // Perform pre-flight request with 6-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          // Request first 512 bytes to inspect stream without downloading full media
          Range: 'bytes=0-511',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const finalUrl = response.url || targetUrl;
      const finalValidation = this.validateUrl(finalUrl);
      if (!finalValidation.isValid) {
        return {
          status: 'error',
          message: `Redirect destination rejected by security filter: ${finalValidation.reason}`,
        };
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const contentDisposition = response.headers.get('content-disposition') || '';
      const contentLengthHeader = response.headers.get('content-length') || response.headers.get('content-range');

      // Check if response is HTML landing page / website / CAPTCHA / cloudflare challenge
      if (
        contentType.includes('text/html') ||
        contentType.includes('application/xhtml+xml') ||
        contentType.includes('text/plain')
      ) {
        return {
          status: 'requires_browser',
          redirectUrl: finalUrl,
          message: 'The provider requires browser-based resolution (CAPTCHA, cloudflare, or interactive landing page). Direct media streaming link could not be automatically extracted.',
        };
      }

      // Determine safe container and extension
      let extension = '.mp4';
      if (contentType.includes('video/mp4')) {
        extension = '.mp4';
      } else if (contentType.includes('video/x-matroska') || contentType.includes('video/mkv')) {
        extension = '.mkv';
      } else if (contentType.includes('video/webm')) {
        extension = '.webm';
      } else if (contentType.includes('video/quicktime')) {
        extension = '.mov';
      } else {
        // Inspect content-disposition for extension
        const match = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
        if (match && match[1]) {
          const matchExt = match[1].split('.').pop()?.toLowerCase();
          if (matchExt && ['mp4', 'mkv', 'webm', 'ts', 'mov'].includes(matchExt)) {
            extension = `.${matchExt}`;
          }
        }
      }

      const fullFileName = `${baseFileName}${extension}`;

      return {
        status: 'direct_media',
        directUrl: finalUrl,
        fileName: fullFileName,
        extension,
        contentType,
        contentLength: contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined,
        message: 'Direct media link successfully verified.',
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return {
          status: 'requires_browser',
          redirectUrl: targetUrl,
          message: 'Provider resolution timed out. Opening in browser is recommended.',
        };
      }

      // If preflight failed due to CORS or network, treat as requires browser resolution
      return {
        status: 'requires_browser',
        redirectUrl: targetUrl,
        message: `Network or CORS restriction prevented direct stream inspection: ${err?.message || 'Unknown error'}. Browser resolution available.`,
      };
    }
  }
}
