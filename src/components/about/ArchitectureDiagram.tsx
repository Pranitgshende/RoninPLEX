import React, { useState } from 'react';
import {
  Layers,
  Server,
  MonitorPlay,
  Cpu,
  Download,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink
} from 'lucide-react';

interface ArchitectureNode {
  id: string;
  category: 'frontend' | 'playback' | 'providers' | 'backend' | 'telemetry';
  title: string;
  subtitle: string;
  status: 'active' | 'local' | 'parked';
  details: {
    role: string;
    protocol: string;
    endpointOrFile: string;
    capabilities: string[];
    notes: string;
  };
}

const NODES: ArchitectureNode[] = [
  {
    id: 'frontend',
    category: 'frontend',
    title: 'Frontend Application',
    subtitle: 'React 19 + Tailwind CSS + GSAP',
    status: 'active',
    details: {
      role: 'Cinematic user interface, discovery catalog, local watchlist, and media player presentation.',
      protocol: 'Native DOM + Custom Hardware Accelerated CSS Glass Surfaces',
      endpointOrFile: 'src/App.tsx, src/pages/*',
      capabilities: ['Responsive Shell', 'ScrambleText Animation', 'Tauri Desktop IPC', 'Offline-First Storage'],
      notes: 'Built with minimal runtime dependencies following the Ponytail Rule.'
    }
  },
  {
    id: 'streaming-manager',
    category: 'playback',
    title: 'Streaming Manager',
    subtitle: 'Cascading Fallback & Session Lifecycle',
    status: 'active',
    details: {
      role: 'Authoritative provider lifecycle management, automatic health-checked cascading fallback, and capability discovery.',
      protocol: 'Asynchronous TypeScript Provider Pipeline',
      endpointOrFile: 'src/services/streaming/StreamingManager.ts',
      capabilities: ['Dynamic Fallback Priority', 'Watchdog Verification', 'Provider Capabilities Matrix', 'Status Events'],
      notes: 'Ensures one single playback lifecycle across normal and PiP windows with no ghost playback.'
    }
  },
  {
    id: 'vidsrc-me',
    category: 'providers',
    title: 'VidSrc ME',
    subtitle: 'Primary Movie & TV Provider',
    status: 'active',
    details: {
      role: 'Default production streaming provider for movies and TV series.',
      protocol: 'Sandboxed Iframe Embed with SOP Protection',
      endpointOrFile: 'https://vidsrcme.ru/embed/movie/{tmdbId} | tv/{tmdbId}/{s}/{e}',
      capabilities: ['Movie Playback', 'TV Shows', 'Direct Embed', 'High Availability'],
      notes: 'Verified working default provider across all mainstream movie and TV content.'
    }
  },
  {
    id: 'rivestream',
    category: 'providers',
    title: 'RiveStream',
    subtitle: 'Multi-Source Playback Engine',
    status: 'active',
    details: {
      role: 'Fast multi-source provider offering selectable modes: Standard CDN, Aggregator fallback, and Torrent.',
      protocol: 'Rive Protocol v1 Embeds + /download Endpoint',
      endpointOrFile: 'https://rivestream.app/embed?type={movie|tv}&id={tmdbId}&mode={mode}',
      capabilities: ['Standard Mode', 'Aggregator Mode', 'Torrent Mode', 'Native Download Resolution'],
      notes: 'Supports interactive provider mode switching directly in the Player HUD.'
    }
  },
  {
    id: 'vidlink-pro',
    category: 'providers',
    title: 'VidLink Pro',
    subtitle: 'Movie/TV + Primary Anime Engine',
    status: 'active',
    details: {
      role: 'Dual-purpose streaming engine. Serves as primary anime provider using MAL ID with automatic fallback.',
      protocol: 'VidLink Pro Embed API with fallback=true parameter',
      endpointOrFile: 'https://vidlink.pro/anime/{malId}/{ep}/{lang}?fallback=true',
      capabilities: ['Anime Playback', 'MAL ID Integration', 'Sub & Dub Tracks', 'Embed Fallback'],
      notes: 'Provides seamless anime episode streaming without requiring local media compilation.'
    }
  },
  {
    id: 'anime-sdk',
    category: 'providers',
    title: 'Anime SDK Sidecar',
    subtitle: 'Local Node.js Stream Harvester',
    status: 'local',
    details: {
      role: 'Secondary anime fallback sidecar packaged as an external standalone process.',
      protocol: 'Local HTTP REST on loopback 127.0.0.1:4173',
      endpointOrFile: 'http://127.0.0.1:4173/anime/search & /anime/watch',
      capabilities: ['HLS Streams', 'Direct MP4', 'VTT Subtitles', 'Multi-server Scraping'],
      notes: 'Communicates strictly over loopback with zero external listening ports.'
    }
  },
  {
    id: 'parked-providers',
    category: 'providers',
    title: 'Parked Providers',
    subtitle: 'SuperEmbed & VidSrc Dev',
    status: 'parked',
    details: {
      role: 'Unverified or legacy providers kept parked and isolated from the active production fallback list.',
      protocol: 'Isolated from active cascading fallback',
      endpointOrFile: 'multiembed.mov, vidsrc.dev',
      capabilities: ['Unverified directStream', 'Legacy endpoints'],
      notes: 'Registered in code for capability inspection but quarantined until upstream verification passes.'
    }
  },
  {
    id: 'rust-backend',
    category: 'backend',
    title: 'Rust Desktop Engine',
    subtitle: 'Tauri v2 Native Runtime',
    status: 'active',
    details: {
      role: 'Native OS integration, multi-window system PiP, chunked download manager with resume, and security boundaries.',
      protocol: 'Tauri v2 IPC (invoke / emit)',
      endpointOrFile: 'src-tauri/src/lib.rs, src-tauri/src/download.rs',
      capabilities: ['Chunked Download Engine', 'HTTP Range Resumes', 'Multi-Window Secondary PiP', 'Safe URL Opener'],
      notes: 'Uses reqwest + tokio for asynchronous streaming and persistent JSON download records.'
    }
  },
  {
    id: 'diagnostics-hud',
    category: 'telemetry',
    title: 'Real Diagnostics HUD',
    subtitle: 'Truthful Runtime Telemetry',
    status: 'active',
    details: {
      role: 'In-player diagnostic modal (Press D) strictly obeying Same-Origin Policy (SOP).',
      protocol: 'DOM HTMLVideoElement Metrics + Truthful SOP Boundaries',
      endpointOrFile: 'src/components/player/DiagnosticsModal.tsx',
      capabilities: ['Native Video Telemetry', 'Iframe SOP Boundary Notice', 'Zero Fake Metrics', 'Session Watchdog'],
      notes: 'Truthfully declares cross-origin restrictions when iframe embeds conceal internal metrics.'
    }
  }
];

export const ArchitectureDiagram: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('streaming-manager');
  const selectedNode = NODES.find(n => n.id === selectedNodeId) || NODES[0];

  const getStatusBadge = (status: ArchitectureNode['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        );
      case 'local':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5" />
            Local Sidecar
          </span>
        );
      case 'parked':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            Parked
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Architectural Map */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface-100/40 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Architecture Topology</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Interactive Map • Click node to inspect</span>
        </div>

        {/* Tier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Tier 1: Frontend & Presentation */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-surface-200/50 border border-white/5 flex flex-col">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Presentation Layer</span>
              <MonitorPlay className="w-3.5 h-3.5 text-brand-400" />
            </div>

            <button
              onClick={() => setSelectedNodeId('frontend')}
              className={`w-full p-3 rounded-xl text-left transition-all border ${
                selectedNodeId === 'frontend'
                  ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-surface-100/60 hover:bg-surface-100 border-white/5 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white">Frontend Application</p>
                <span className="text-[10px] font-mono text-emerald-400">React 19</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Glassmorphic Shell & UI</p>
            </button>

            <button
              onClick={() => setSelectedNodeId('diagnostics-hud')}
              className={`w-full p-3 rounded-xl text-left transition-all border ${
                selectedNodeId === 'diagnostics-hud'
                  ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-surface-100/60 hover:bg-surface-100 border-white/5 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white">Diagnostics HUD</p>
                <Terminal className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Real Telemetry & SOP Bounds</p>
            </button>
          </div>

          {/* Tier 2: Playback & Streaming Core */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-surface-200/50 border border-white/5 flex flex-col">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Orchestration Core</span>
              <Server className="w-3.5 h-3.5 text-brand-400" />
            </div>

            <button
              onClick={() => setSelectedNodeId('streaming-manager')}
              className={`w-full p-3 rounded-xl text-left transition-all border ${
                selectedNodeId === 'streaming-manager'
                  ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-surface-100/60 hover:bg-surface-100 border-white/5 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white">Streaming Manager</p>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Authoritative Fallback Engine</p>
            </button>

            <button
              onClick={() => setSelectedNodeId('rust-backend')}
              className={`w-full p-3 rounded-xl text-left transition-all border ${
                selectedNodeId === 'rust-backend'
                  ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-surface-100/60 hover:bg-surface-100 border-white/5 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white">Rust Desktop Engine</p>
                <span className="text-[10px] font-mono text-indigo-400">Tauri v2</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Download Manager & PiP IPC</p>
            </button>
          </div>

          {/* Tier 3: Providers & Harvest Layer */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-surface-200/50 border border-white/5 flex flex-col">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Streaming Providers</span>
              <Cpu className="w-3.5 h-3.5 text-brand-400" />
            </div>

            <button
              onClick={() => setSelectedNodeId('vidsrc-me')}
              className={`w-full p-2.5 rounded-lg text-left transition-all border ${
                selectedNodeId === 'vidsrc-me'
                  ? 'bg-brand-500/20 border-brand-500 text-white'
                  : 'bg-surface-100/60 hover:bg-surface-100 border-white/5 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">VidSrc ME</span>
                <span className="text-[9px] font-bold text-emerald-400">Default (Movie/TV)</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedNodeId('rivestream')}
              className={`w-full p-2.5 rounded-lg text-left transition-all border ${
                selectedNodeId === 'rivestream'
                  ? 'bg-brand-500/20 border-brand-500 text-white'
                  : 'bg-surface-100/60 hover:bg-surface-100 border-white/5 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">RiveStream</span>
                <span className="text-[9px] font-bold text-brand-400">3 Modes + DL</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedNodeId('vidlink-pro')}
              className={`w-full p-2.5 rounded-lg text-left transition-all border ${
                selectedNodeId === 'vidlink-pro'
                  ? 'bg-brand-500/20 border-brand-500 text-white'
                  : 'bg-surface-100/60 hover:bg-surface-100 border-white/5 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">VidLink Pro</span>
                <span className="text-[9px] font-bold text-amber-400">Primary Anime</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedNodeId('anime-sdk')}
              className={`w-full p-2.5 rounded-lg text-left transition-all border ${
                selectedNodeId === 'anime-sdk'
                  ? 'bg-brand-500/20 border-brand-500 text-white'
                  : 'bg-surface-100/60 hover:bg-surface-100 border-white/5 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Anime SDK Sidecar</span>
                <span className="text-[9px] font-bold text-purple-400">Local Sidecar</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedNodeId('parked-providers')}
              className={`w-full p-2 rounded-lg text-left transition-all border ${
                selectedNodeId === 'parked-providers'
                  ? 'bg-brand-500/20 border-brand-500 text-white'
                  : 'bg-surface-100/30 hover:bg-surface-100/60 border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold">Parked Providers</span>
                <span className="text-[9px] text-amber-500/80">Quarantined</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Node Details Panel */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface-200/50 border border-white/10 space-y-4 animate-fade-in">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h4 className="text-base font-bold text-white">{selectedNode.title}</h4>
              {getStatusBadge(selectedNode.status)}
            </div>
            <p className="text-xs text-brand-300 font-medium mt-0.5">{selectedNode.subtitle}</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-surface-100 text-[11px] font-mono text-slate-300 border border-white/5">
            {selectedNode.details.endpointOrFile}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.details.role}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold mb-1">Protocol / Interface:</span>
            <span className="text-slate-200 font-mono text-[11px]">{selectedNode.details.protocol}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold mb-1">Notes & Governance:</span>
            <span className="text-slate-300 text-[11px] leading-normal">{selectedNode.details.notes}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <span className="text-slate-400 text-xs font-semibold block mb-2">Capabilities:</span>
          <div className="flex flex-wrap gap-2">
            {selectedNode.details.capabilities.map((cap, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md bg-surface-100 text-[11px] font-medium text-slate-200 border border-white/5 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-brand-400" />
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
