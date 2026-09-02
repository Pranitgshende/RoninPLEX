import { invoke } from '@tauri-apps/api/core';

export interface TMDBResolverResult {
  key: string;
  isFallback: boolean;
}

export async function getTMDBUserCredential(): Promise<string | null> {
  try {
    const key = await invoke<string>('get_tmdb_credential');
    return key && key.trim().length > 0 ? key.trim() : null;
  } catch {
    return null;
  }
}

export async function storeTMDBUserCredential(key: string): Promise<void> {
  await invoke('store_tmdb_credential', { key });
}

export async function removeTMDBUserCredential(): Promise<void> {
  await invoke('remove_tmdb_credential');
}

export async function isTMDBUserCredentialConfigured(): Promise<boolean> {
  try {
    return await invoke<boolean>('is_tmdb_credential_configured');
  } catch {
    return false;
  }
}

export async function resolveTMDBCredential(): Promise<TMDBResolverResult | null> {
  const userKey = await getTMDBUserCredential();
  if (userKey) {
    return { key: userKey, isFallback: false };
  }
  
  const fallback = (import.meta.env.VITE_TMDB_API_KEY as string) || '';
  if (fallback && fallback !== 'your_tmdb_api_key_here' && fallback.trim().length > 0) {
    return { key: fallback.trim(), isFallback: true };
  }
  
  return null;
}
