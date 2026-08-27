export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  apiKey?: string;
  apiToken?: string;
}

export class StreamingHttpClient {
  private defaultTimeout: number;

  constructor(defaultTimeout = 10000) {
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Sanitizes and verifies that an API URL is HTTPS unless running on localhost
   */
  public sanitizeUrl(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    // Allow http only on localhost/127.0.0.1 for local mock dev proxies
    if (trimmed.startsWith('http://localhost') || trimmed.startsWith('http://127.0.0.1')) {
      return trimmed;
    }
    if (trimmed.startsWith('http://')) {
      console.warn('Insecure HTTP endpoint upgraded or flagged:', trimmed);
      return trimmed.replace('http://', 'https://');
    }
    return trimmed;
  }

  /**
   * Executes a GET request with timeout, auth headers, and response parsing
   */
  async get<T>(endpointUrl: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || this.defaultTimeout);

    try {
      const urlObj = new URL(this.sanitizeUrl(endpointUrl));

      if (options.params) {
        Object.entries(options.params).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            urlObj.searchParams.append(key, String(val));
          }
        });
      }

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(options.headers || {}),
      };

      if (options.apiToken) {
        headers['Authorization'] = `Bearer ${options.apiToken}`;
      } else if (options.apiKey) {
        headers['X-API-Key'] = options.apiKey;
      }

      const response = await fetch(urlObj.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`Provider rate limit reached (HTTP 429). Please wait a moment.`);
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Provider authentication error (HTTP ${response.status}). Check your API credentials in Settings.`);
        }
        if (response.status === 404) {
          throw new Error(`Content not found on provider (HTTP 404).`);
        }
        throw new Error(`Provider returned HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`Streaming request timed out after ${(options.timeoutMs || this.defaultTimeout) / 1000}s`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Tests whether an endpoint is reachable
   */
  async testEndpoint(url: string, options: RequestOptions = {}): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const headers: Record<string, string> = { ...(options.headers || {}) };
      if (options.apiToken) {
        headers['Authorization'] = `Bearer ${options.apiToken}`;
      } else if (options.apiKey) {
        headers['X-API-Key'] = options.apiKey;
      }

      const response = await fetch(this.sanitizeUrl(url), {
        method: 'HEAD',
        headers,
        signal: controller.signal,
      }).catch(async () => {
        // Fallback to GET with limit
        return await fetch(this.sanitizeUrl(url), {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
      });

      clearTimeout(timeout);
      return response.ok || response.status === 200 || response.status === 204;
    } catch {
      return false;
    }
  }
}

export const streamingHttpClient = new StreamingHttpClient();
