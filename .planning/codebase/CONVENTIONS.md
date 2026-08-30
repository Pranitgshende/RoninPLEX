# Coding Conventions

**Analysis Date:** 2026-08-30

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `src/components/common/AdultBadge.tsx`, `src/pages/AnimeDetails.tsx`)
- Services & Utilities: camelCase or PascalCase (e.g., `src/services/tmdb.ts`, `src/services/anime/AnimeRepository.ts`)
- Types & Interfaces: PascalCase (e.g., `src/types/tmdb.ts`, `src/services/anime/AnimeTypes.ts`)
- Custom Hooks: camelCase with `use` prefix (e.g., `src/hooks/useDebounce.ts`)

**Functions:**
- camelCase (e.g., `formatDuration`, `fetchFromTMDB`, `generateRoninDescription`)
- Event handlers: `handle` prefix (e.g., `handleEpisodeSelect`, `handleSearch`)

**Variables:**
- camelCase for local variables and state (e.g., `selectedGenre`, `isWatchPage`)
- UPPER_SNAKE_CASE for constants (e.g., `BASE_URL`, `CACHE_TTL_MS`, `CHUNK_SIZE`)

**Types:**
- PascalCase (e.g., `Movie`, `TVShow`, `AnimeItem`, `RoninAvatarState`)
- Interface names do NOT use `I` prefix (e.g., `AnimeItem`, not `IAnimeItem`)

## Code Style

**Formatting:**
- 2 spaces indentation
- Semicolons: Always used
- Quotes: Single quotes for JavaScript/TypeScript strings; double quotes in JSX attributes

**Linting:**
- `oxlint` used for fast static code analysis
- TypeScript strict mode enforced (`"strict": true` in `tsconfig.json`)

## Import Organization

**Order:**
1. React core imports (`import React, { useState, useEffect } from 'react'`)
2. Third-party library packages (`react-router-dom`, `lucide-react`, `clsx`)
3. Internal components (`../components/common/Navbar`)
4. Services and repositories (`../services/anime/AnimeService`)
5. Contexts and hooks (`../context/UserContext`, `../hooks/useDebounce`)
6. Types, utilities, and constants (`../types/tmdb`, `../utils/helpers`)

**Path Aliases:**
- Standard relative imports and `@/*` alias mapping to `src/*` configured in `tsconfig.json`

## Error Handling

**Patterns:**
- **Graceful Fallbacks:** Services must not throw unhandled runtime errors that crash the UI. When external APIs fail, return empty arrays, null, or fallback mock records (`src/services/mockData.ts`).
- **Try/Catch with User Feedback:** Asynchronous operations wrap network calls in `try/catch` blocks, set local loading states to false, and trigger toast alerts or friendly error messages.
- **Provider Fallbacks:** Video stream resolution catches provider failures and advances to the next provider in `StreamingManager.ts`.

## Logging

**Framework:**
- Frontend: `src/utils/logger.ts` provides `logger.info()`, `logger.warn()`, and `logger.error()`
- Desktop Runtime: Native logging via Tauri IPC command `log_runtime_event` writing to `%LOCALAPPDATA%/RoninPLEX/playback_runtime.log`

**Patterns:**
- Prefix log messages with clear functional tags: `[TMDB]`, `[AnimeService]`, `[StreamingManager]`, `[Security]`

## Comments

**When to Comment:**
- Document complex domain logic, architectural boundaries (e.g. Anime isolation constraints), and provider fallback workflows.
- Keep comments up to date; avoid restating self-evident code.

**JSDoc/TSDoc:**
- Used on public service methods and interface declarations to explain return types and parameter contracts.

## Function Design

**Size:**
- Single responsibility: Functions should ideally remain under 50 lines. Large UI pages break complex sub-sections into dedicated child components.

**Parameters:**
- Functions with more than 3 parameters use typed option objects.

**Return Values:**
- Explicit return types on public service methods (`Promise<AnimeItem[]>`, `string`, `boolean`).

## Module Design

**Exports:**
- Named exports preferred for components and utility functions (`export const Navbar: React.FC = ...`).
- Default exports used for top-level pages and `App.tsx` where router lazy-loading may be applied.

**Barrel Files:**
- Avoid large circular barrel files; import directly from module files for clean tree-shaking.

---

*Convention analysis: 2026-08-30*
