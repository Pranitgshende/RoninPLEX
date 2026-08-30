import { startServer, HttpClient, GogoanimeProvider, AllmangaProvider, AnimeParadiseProvider, AnilistMeta } from 'anime-sdk';
import http from 'http';

const originalWriteHead = http.ServerResponse.prototype.writeHead;
http.ServerResponse.prototype.writeHead = function(statusCode, headers) {
    if (headers) {
        const ctKey = Object.keys(headers).find(k => k.toLowerCase() === 'content-type');
        if (ctKey) {
            const ctVal = headers[ctKey];
            const ct = Array.isArray(ctVal) ? ctVal[0] : ctVal;
            if (typeof ct === 'string' && (ct.includes('image/jpeg') || ct.includes('image/png') || ct.includes('application/octet-stream'))) {
                 if (this.req && this.req.url && this.req.url.includes('/proxy')) {
                     const targetUrl = new URL(this.req.url, 'http://localhost').searchParams.get('url') || '';
                     if (targetUrl.includes('.ts') || targetUrl.includes('ts?')) {
                         headers[ctKey] = 'video/MP2T';
                     }
                 }
            }
        }
    }
    return originalWriteHead.call(this, statusCode, headers);
};

const httpClient = new HttpClient();
const providers = [new GogoanimeProvider(httpClient), new AllmangaProvider(httpClient), new AnimeParadiseProvider(httpClient)];
const metaProviders = [new AnilistMeta(httpClient)];
startServer({ providers, metaProviders, proxy: true, port: 4173 });
