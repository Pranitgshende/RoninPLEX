# Codebase Structure

**Analysis Date:** 2026-08-30

## Directory Layout

```
RoninPLEX/
├── .planning/                  # Project planning, roadmap, and codebase intelligence
│   └── codebase/               # 7 structured codebase map documents
├── backend/                    # Node.js sidecar service bridging anime-sdk scrapers
│   ├── dist/                   # Bundled sidecar assets
│   ├── package.json            # Sidecar dependencies
│   └── server.js               # Sidecar HTTP server on port 4173
├── docs/                       # Project documentation and screenshots
│   └── screenshots/            # UI reference captures
├── memory-bank/                # Active context and decision logs
│   └── memory-bank/            # Project memory documents
├── scripts/                    # Build, testing, and icon generation scripts
│   ├── generate-icons.js       # Desktop app icon builder
│   └── test-providers.mjs      # Streaming provider verification script
├── src/                        # Frontend React 19 application
│   ├── components/             # Reusable UI component library
│   │   ├── common/             # Badges, navbar, footer, cards, toasts, media rows
│   │   ├── decision/           # TonightPicker recommendation interface
│   │   ├── hero/               # HeroBanner carousel
│   │   ├── modals/             # ApiKeyModal, OnboardingModal, PreferencesModal
│   │   ├── player/             # VideoPlayer, TrailerPlayer, diagnostics
│   │   │   └── anime/          # Dedicated AnimeVideoPlayer and playback controllers
│   │   └── ronin/              # RoninAvatar with 9 reactive animated states
│   ├── context/                # Global React contexts (ApiKeyContext, UserContext)
│   ├── hooks/                  # Custom React hooks (useDebounce, useTrailer, useMediaQuery)
│   ├── pages/                  # Top-level page routes (Home, Movies, TvShows, Anime, Watch, etc.)
│   ├── services/               # Core business services, API clients, and repositories
│   │   ├── ai/                 # AIService conversational engine
│   │   ├── anime/              # Isolated Anime domain (Repository, Cache, Adapter, Service)
│   │   ├── streaming/          # Multi-provider streaming engine and configs
│   │   ├── mockData.ts         # Offline catalog fallback
│   │   ├── recommendation.ts   # Client-side heuristic recommendation algorithms
│   │   ├── storage.ts          # Type-safe localStorage manager
│   │   └── tmdb.ts             # Cached The Movie Database API client
│   ├── shims/                  # Browser shims for Node.js built-in modules
│   ├── types/                  # Shared TypeScript interfaces (tmdb, user, anime, recommendation)
│   ├── utils/                  # Utility helpers, formatting, and logging
│   ├── App.tsx                 # Root application shell and route configuration
│   ├── index.css               # Tailwind CSS imports and glassmorphism styling classes
│   └── main.tsx                # Application mounting entry point
├── src-tauri/                  # Tauri 2 native desktop application wrapper
│   ├── bin/                    # Compiled native sidecar binaries
│   ├── capabilities/           # Tauri 2 permission capability definitions
│   ├── icons/                  # Desktop application icon assets
│   ├── src/                    # Rust source code (main.rs, lib.rs)
│   ├── Cargo.toml              # Rust crate manifest and dependencies
│   ├── Cargo.lock              # Rust dependency lockfile
│   └── tauri.conf.json         # Tauri 2 application and window configuration
├── tests/                      # Automated test suites
│   └── v2-suite.test.mjs       # Architecture integrity and feature regression suite
├── index.html                  # HTML entry template
├── package.json                # Project dependencies, scripts, and metadata
├── package-lock.json           # npm lockfile
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS custom theme and color configuration
├── tsconfig.json               # TypeScript compiler options
└── vite.config.ts              # Vite bundler and dev server configuration
```

## Directory Purposes

**`src/components/`:**
- Purpose: Presentational and interactive UI building blocks
- Contains: Buttons, cards, modals, player controls, badges, avatar components
- Key files: `src/components/common/Navbar.tsx`, `src/components/player/VideoPlayer.tsx`, `src/components/player/anime/AnimeVideoPlayer.tsx`, `src/components/ronin/RoninAvatar.tsx`

**`src/pages/`:**
- Purpose: Top-level page routes rendered by React Router
- Contains: Page layouts and data orchestrators for each major section
- Key files: `src/pages/Home.tsx`, `src/pages/Movies.tsx`, `src/pages/TvShows.tsx`, `src/pages/Anime.tsx`, `src/pages/AnimeDetails.tsx`, `src/pages/Discover.tsx`, `src/pages/Watch.tsx`, `src/pages/Settings.tsx`

**`src/services/`:**
- Purpose: Encapsulate data fetching, business logic, persistence, and external adapters
- Contains: API services, repositories, cache layers, storage interfaces
- Key files: `src/services/tmdb.ts`, `src/services/anime/AnimeService.ts`, `src/services/anime/AnimeRepository.ts`, `src/services/streaming/StreamingManager.ts`, `src/services/ai/AIService.ts`, `src/services/storage.ts`

**`src/context/`:**
- Purpose: Application-wide shared state accessible across the component tree
- Contains: React context providers for user state and API key state
- Key files: `src/context/UserContext.tsx`, `src/context/ApiKeyContext.tsx`

**`src-tauri/`:**
- Purpose: Native desktop shell, window lifecycle, and OS integrations
- Contains: Rust code, permissions, window configuration, build scripts
- Key files: `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`

**`backend/`:**
- Purpose: Local microservice sidecar powering `anime-sdk` scrapers
- Contains: Node.js server script and lightweight package manifest
- Key files: `backend/server.js`

**`tests/`:**
- Purpose: Fast automated structural and behavioral regression tests
- Contains: Node native test runner suites
- Key files: `tests/v2-suite.test.mjs`

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Frontend React DOM mount point
- `src-tauri/src/main.rs`: Desktop native binary entry point
- `backend/server.js`: Sidecar server entry point

**Configuration:**
- `vite.config.ts`: Vite development server and bundling settings
- `tsconfig.json`: TypeScript path mappings and compiler options
- `tailwind.config.js`: Tailwind CSS custom colors, brand tokens, and breakpoints
- `src-tauri/tauri.conf.json`: Desktop window properties, security policy, and bundle settings

**Core Logic:**
- `src/services/anime/AnimeRepository.ts`: AniList GraphQL queries and normalization
- `src/services/streaming/StreamingManager.ts`: Multi-provider failover engine
- `src/services/ai/AIService.ts`: Conversational recommendation intelligence
- `src/services/storage.ts`: Persistent state management

**Testing:**
- `tests/v2-suite.test.mjs`: Architecture integrity and feature verification suite

## Naming Conventions

**Files:**
- React Components: PascalCase (`MovieCard.tsx`, `AdultBadge.tsx`, `AnimeVideoPlayer.tsx`)
- Services & Classes: PascalCase (`AnimeService.ts`, `StreamingManager.ts`) or camelCase instances (`tmdb.ts`, `storage.ts`)
- Hooks: camelCase starting with `use` (`useDebounce.ts`, `useTrailer.ts`)
- Test Files: Kebab-case ending with `.test.mjs` (`v2-suite.test.mjs`)

**Directories:**
- Frontend directories: lowercase / kebab-case (`components/common`, `services/anime`, `player/anime`)

## Where to Add New Code

**New Feature Page:**
- Create page component in `src/pages/[PageName].tsx`
- Register route in `src/App.tsx`
- Add navigation link in `src/components/common/Navbar.tsx`

**New UI Component:**
- Place reusable component in `src/components/common/` or feature-specific folder (e.g. `src/components/player/`)
- Export explicitly from file

**New Service or Integration:**
- Create service file in `src/services/[feature]/`
- Define TypeScript types in `src/types/[feature].ts`
- Provide unit or regression test in `tests/`

**New Test Case:**
- Append test block to `tests/v2-suite.test.mjs` or create `tests/[feature].test.mjs`

## Special Directories

**`.planning/codebase/`:**
- Purpose: Ground truth architectural analysis documents for GSD spec-driven development
- Generated: Yes
- Committed: Yes

**`src-tauri/target/`:**
- Purpose: Rust compiled artifacts and native build cache
- Generated: Yes
- Committed: No (in `.gitignore`)

**`dist/`:**
- Purpose: Compiled frontend production bundle output
- Generated: Yes
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-08-30*
