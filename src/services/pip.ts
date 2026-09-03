import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';

export type PiPMessageType =
  | 'PIP_READY'
  | 'PIP_HEARTBEAT'
  | 'PIP_DESTROYED'
  | 'PLAYBACK_SNAPSHOT'
  | 'COMMAND_PLAY'
  | 'COMMAND_PAUSE'
  | 'COMMAND_SEEK'
  | 'COMMAND_STOP'
  | 'COMMAND_RETRY'
  | 'COMMAND_CLOSE_PIP'
  | 'COMMAND_EXIT_APP'
  | 'STATE_TIME'
  | 'STATE_PLAYING'
  | 'STATE_ERROR';

export interface PlaybackSnapshot {
  sessionId: string;
  sourceGeneration: number;
  mediaId: number;
  mediaType: string;
  seasonNumber?: number;
  episodeNumber?: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  language: string;
  streamResult?: any;
  animeStreamSource?: any;
}

export interface PiPMessage {
  sessionId?: string;
  sourceGeneration?: number;
  sequence?: number;
  type: PiPMessageType;
  payload?: any;
}

class PiPService {
  private channel: BroadcastChannel | null = null;
  private messageHandlers: Set<(msg: PiPMessage) => void> = new Set();
  private storedSnapshot: PlaybackSnapshot | null = null;
  private snapshotProvider: (() => PlaybackSnapshot) | null = null;
  private sequenceCounter = 0;
  private isOpening = false;

  init() {
    if (this.channel) return;
    this.channel = new BroadcastChannel('roninplex_pip_channel');
    this.channel.onmessage = (event) => {
      const msg = event.data as PiPMessage;
      this.messageHandlers.forEach(handler => handler(msg));
    };
  }

  registerSnapshotProvider(provider: () => PlaybackSnapshot) {
    this.snapshotProvider = provider;
    return () => {
      if (this.snapshotProvider === provider) this.snapshotProvider = null;
    };
  }

  pullSnapshot(): PlaybackSnapshot | null {
    if (this.snapshotProvider) {
      try {
        const snap = this.snapshotProvider();
        this.storedSnapshot = snap;
        return snap;
      } catch (e) {
        console.warn('[PiP] Error pulling snapshot from provider:', e);
      }
    }
    return this.storedSnapshot;
  }

  storeSnapshot(snapshot: PlaybackSnapshot) {
    this.storedSnapshot = snapshot;
  }

  getStoredSnapshot(): PlaybackSnapshot | null {
    return this.storedSnapshot;
  }

  provideSnapshot() {
    const snap = this.pullSnapshot() || this.storedSnapshot;
    if (snap) {
      this.broadcast({
        sessionId: snap.sessionId,
        sourceGeneration: snap.sourceGeneration,
        type: 'PLAYBACK_SNAPSHOT',
        payload: snap,
      });
    }
  }

  subscribe(handler: (msg: PiPMessage) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  broadcast(msg: PiPMessage) {
    if (!this.channel) this.init();
    this.sequenceCounter++;
    const enriched: PiPMessage = {
      sequence: this.sequenceCounter,
      ...msg,
    };
    this.channel?.postMessage(enriched);
  }

  async hasLivePiPWindow(): Promise<boolean> {
    try {
      const existing = await WebviewWindow.getByLabel('pip-window');
      return Boolean(existing);
    } catch {
      return false;
    }
  }

  async requestEnterPiP(snapshot: PlaybackSnapshot): Promise<boolean> {
    if (!snapshot || !snapshot.sessionId) {
      console.warn('[PiP] Cannot enter PiP without valid snapshot/sessionId');
      return false;
    }
    if (this.isOpening) return false;
    this.isOpening = true;

    try {
      this.storeSnapshot(snapshot);

      // Listen for PIP_READY handshake with 5000ms timeout
      const readyPromise = new Promise<boolean>((resolve) => {
        let timer: NodeJS.Timeout | null = null;
        const unsubscribe = this.subscribe((msg) => {
          if (msg.type === 'PIP_READY') {
            if (timer) clearTimeout(timer);
            unsubscribe();
            // Provide snapshot immediately
            this.broadcast({
              sessionId: snapshot.sessionId,
              sourceGeneration: snapshot.sourceGeneration,
              type: 'PLAYBACK_SNAPSHOT',
              payload: snapshot,
            });
            resolve(true);
          }
        });
        timer = setTimeout(() => {
          unsubscribe();
          resolve(false);
        }, 5000);
      });

      // 1. Check if window already exists
      let existing = await WebviewWindow.getByLabel('pip-window');
      if (existing) {
        try {
          await existing.show();
          await existing.setFocus();
          this.provideSnapshot();
        } catch {
          existing = null;
        }
      }

      // 2. Create fresh WebviewWindow if none
      if (!existing) {
        new WebviewWindow('pip-window', {
          url: '/#/pip',
          title: 'RoninPLEX PiP',
          width: 480,
          height: 270,
          minWidth: 320,
          minHeight: 180,
          alwaysOnTop: true,
          decorations: false,
          resizable: true,
          transparent: false,
          skipTaskbar: true,
        });
      }

      const isReady = await readyPromise;
      if (!isReady) {
        console.warn('[PiP] Handshake timed out or failed; closing partial window');
        await this.closePiPWindow();
        return false;
      }

      return true;
    } catch (err) {
      console.error('[PiP] Failed to enter PiP:', err);
      await this.closePiPWindow();
      return false;
    } finally {
      this.isOpening = false;
    }
  }

  async openPiPWindow(): Promise<WebviewWindow | null> {
    if (this.isOpening) return null;
    this.isOpening = true;

    try {
      // 1. Check if window already exists
      const existing = await WebviewWindow.getByLabel('pip-window');
      if (existing) {
        try {
          await existing.show();
          await existing.setFocus();
          this.provideSnapshot();
          return existing;
        } catch {
          // If window was closing/invalid, fall through to recreation
        }
      }

      // 2. Create fresh WebviewWindow
      const pipWindow = new WebviewWindow('pip-window', {
        url: '/#/pip',
        title: 'RoninPLEX PiP',
        width: 480,
        height: 270,
        minWidth: 320,
        minHeight: 180,
        alwaysOnTop: true,
        decorations: false,
        resizable: true,
        transparent: false,
        skipTaskbar: true,
      });

      return pipWindow;
    } catch (err) {
      console.error('[PiP] Failed to open PiP window:', err);
      throw err;
    } finally {
      this.isOpening = false;
    }
  }

  async closePiPWindow(): Promise<void> {
    try {
      const existing = await WebviewWindow.getByLabel('pip-window');
      if (existing) {
        await existing.close();
      }
    } catch (err) {
      console.warn('[PiP] Error closing PiP window:', err);
    }
  }

  async exitApplication(): Promise<void> {
    try {
      await invoke('exit_application');
    } catch (err) {
      console.warn('[PiP] Tauri exit_application error, fallback to window close:', err);
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
      } catch (e) {
        console.error('[PiP] Fatal exit failure:', e);
      }
    }
  }
}

export const pipService = new PiPService();
pipService.init();
