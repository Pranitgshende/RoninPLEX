import { invoke } from '@tauri-apps/api/core';

export async function logRuntime(tag: string, message: string): Promise<void> {
  const formatted = `[${tag}] ${message}`;
  console.log(formatted);
  try {
    if (typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
      await invoke('log_runtime_event', { tag, message });
    }
  } catch {
    // Ignore IPC failures in non-Tauri or early boot
  }
}

export function logPlayback(message: string): void {
  logRuntime('PLAYBACK', message);
}
