import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export type PiPMessage =
  | { type: 'PIP_READY' }
  | { type: 'PIP_HEARTBEAT' }
  | { type: 'PIP_DESTROYED', payload?: PlaybackSnapshot }
  | { type: 'PLAYBACK_SNAPSHOT'; payload: PlaybackSnapshot }
  | { type: 'COMMAND_PLAY' }
  | { type: 'COMMAND_PAUSE' }
  | { type: 'COMMAND_SEEK'; payload: { time: number } }
  | { type: 'COMMAND_STOP' }
  | { type: 'COMMAND_RETRY' }
  | { type: 'COMMAND_CLOSE_PIP' }
  | { type: 'STATE_TIME'; payload: { time: number; duration: number } }
  | { type: 'STATE_PLAYING'; payload: { isPlaying: boolean } }
  | { type: 'STATE_ERROR'; payload: { error: string } };

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

class PiPService {
  private channel: BroadcastChannel | null = null;
  private messageHandlers: Set<(msg: PiPMessage) => void> = new Set();
  private storedSnapshot: PlaybackSnapshot | null = null;
  private snapshotProvider: (() => PlaybackSnapshot) | null = null;
  
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

  storeSnapshot(snapshot: PlaybackSnapshot) {
    this.storedSnapshot = snapshot;
  }

  provideSnapshot() {
    if (this.storedSnapshot) {
      this.broadcast({ type: 'PLAYBACK_SNAPSHOT', payload: this.storedSnapshot });
    }
  }

  subscribe(handler: (msg: PiPMessage) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  broadcast(msg: PiPMessage) {
    if (!this.channel) this.init();
    this.channel?.postMessage(msg);
  }

  async openPiPWindow() {
    try {
      const pipWindow = new WebviewWindow('pip-window', {
        url: '/#/pip',
        title: 'RoninPLEX PiP',
        width: 480,
        height: 270,
        alwaysOnTop: true,
        decorations: false,
        resizable: true,
        transparent: true,
        skipTaskbar: true
      });
      await pipWindow.once('tauri://created', () => {
        console.log('PiP Window created');
      });
      await pipWindow.once('tauri://error', (e) => {
        console.error('PiP Window creation error:', e);
      });
      return pipWindow;
    } catch (err) {
      console.error('Failed to open PiP window', err);
      throw err;
    }
  }
}

export const pipService = new PiPService();
pipService.init();
