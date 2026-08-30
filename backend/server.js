import { startServer, HttpClient, GogoanimeProvider, AllmangaProvider, AnilistMeta } from 'anime-sdk';
const http = new HttpClient();
const providers = [new GogoanimeProvider(http), new AllmangaProvider(http)];
const metaProviders = [new AnilistMeta(http)];
startServer({ providers, metaProviders, proxy: true, port: 4173 });
