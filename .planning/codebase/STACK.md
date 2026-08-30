# Technology Stack

**Analysis Date:** 2026-08-30

## Languages

**Primary:**
- TypeScript 5.7.3 - Frontend client application, domain services, player controllers, custom React hooks (`src/`)
- JavaScript (Node.js ES Modules) - Sidecar server (`backend/server.js`), utility scripts (`scripts/`), test suites (`tests/`)

**Secondary:**
- Rust (2021 Edition) - Native Tauri 2 desktop shell, runtime security navigation guards, sidecar supervision, event logging (`src-tauri/src/`)
- CSS3 (Tailwind CSS 3.4.17) - Custom styling system, glassmorphism tokens, keyframe animations (`src/index.css`, `tailwind.config.js`)
- HTML5 - Application shell host document (`index.html`)

## Runtime

**Environment:**
- Node.js v24.18.0 (LTS v20+ supported)
- Tauri 2.0 / 2.11.1 native desktop runtime (Wry/WebView2 on Windows)
- Rust Cargo 1.85+ toolchain

**Package Manager:**
- npm (v10.x / v11.x)
- Lockfile: `package-lock.json` (present, lockfileVersion 3)
- Cargo Lockfile: `src-tauri/Cargo.lock` (present)

## Frameworks

**Core:**
- React 19.0.0 - Component-based user interface (`src/App.tsx`, `src/pages/`, `src/components/`)
- React DOM 19.0.0 - Web DOM rendering target (`src/main.tsx`)
- React Router DOM 7.3.0 - Client-side declarative routing with `HashRouter` (`src/App.tsx`)
- Tauri 2.11.1 - Cross-platform native desktop application framework (`src-tauri/`)

**Testing:**
- Node.js Native Test Runner (`node:test`) - Fast, zero-dependency test runner (`tests/v2-suite.test.mjs`)
- Node.js Assert Module (`node:assert`) - Strict structural and behavioral assertions

**Build/Dev:**
- Vite 6.2.1 - ESM development server and production bundler (`vite.config.ts`)
- @vitejs/plugin-react 4.3.4 - React Fast Refresh and JSX compiler
- Tailwind CSS 3.4.17 & PostCSS 8.5.3 - Atomic utility CSS compilation (`postcss.config.js`, `tailwind.config.js`)
- oxlint - High-performance static code analysis and linting

## Key Dependencies

**Critical:**
- `hls.js` (1.7.1) - Native HLS video streaming engine with adaptive bitrate (`src/components/player/VideoPlayer.tsx`)
- `anime-sdk` (1.1.0) - Anime metadata extraction, scraping, and stream consolidation (`src/services/anime/AnimeSdkAdapter.ts`, `backend/server.js`)
- `@tauri-apps/api` (2.11.1) - Webview IPC bridge to native Rust commands (`src-tauri/`)
- `tauri-plugin-shell` (2.3.5) - Process supervisor for `anime-server` sidecar binary (`src-tauri/src/lib.rs`)

**Infrastructure & UI:**
- `lucide-react` (1.16.0) - Vector icon library used across navigation, player, and cards (`src/components/`)
- `clsx` (2.1.1) & `tailwind-merge` (3.0.2) - Dynamic class name merging and conflict resolution (`src/utils/helpers.ts`)
- `@vercel/ncc` (0.45.0) & `pkg` (5.8.1) - Standalone binary compilation for Node.js sidecar service

## Configuration

**Environment:**
- Configured via `.env` files and Vite's `import.meta.env`
- Template reference: `.env.example`
- Required keys: `VITE_TMDB_API_KEY` (The Movie Database API v3 key)

**Build:**
- Frontend: `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`
- Desktop Shell: `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/build.rs`
- Node Single Executable Application: `sea-config.json`, `sea-prep.blob`

## Platform Requirements

**Development:**
- Windows 10/11 64-bit, macOS 12+, or modern Linux
- Node.js 20+ and npm 10+
- Rust toolchain (`rustup`, `cargo`)
- Visual Studio C++ Build Tools (Windows)

**Production:**
- Desktop: Windows 64-bit NSIS installer or portable executable via Tauri 2 bundle (`src-tauri/tauri.conf.json`)
- Web Preview: Modern evergreen browser (Chromium, Firefox, Safari) via Vite preview

---

*Stack analysis: 2026-08-30*
