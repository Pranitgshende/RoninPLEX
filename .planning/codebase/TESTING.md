# Testing Patterns

**Analysis Date:** 2026-08-30

## Test Framework

**Runner:**
- Node.js Native Test Runner (`node:test`)
- Zero external test runner dependencies; executes directly via Node.js v20+ / v24+

**Assertion Library:**
- Node.js Assert Module (`node:assert`) - Strict assertions (`assert.strictEqual`, `assert.ok`)

**Run Commands:**
```bash
npm test                             # Run all tests via package.json script
node --test tests/v2-suite.test.mjs  # Run the master architecture suite directly
```

## Test File Organization

**Location:**
- Test files reside in the root `tests/` directory: `tests/*.test.mjs`

**Naming:**
- Kebab-case with `.test.mjs` suffix (e.g., `tests/v2-suite.test.mjs`)

**Structure:**
```
tests/
└── v2-suite.test.mjs                # Master architecture and feature integrity suite
```

## Test Structure

**Suite Organization:**
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('RoninPLEX v2.0.0 Master Architecture Suite', () => {
  test('Slice A: Anime SDK Genuine Integration exists and exports normalized methods', () => {
    assert.ok(fs.existsSync('src/services/anime/AnimeSdkAdapter.ts'), 'AnimeSdkAdapter.ts must exist');
    const adapterCode = fs.readFileSync('src/services/anime/AnimeSdkAdapter.ts', 'utf8');
    assert.ok(adapterCode.includes("from 'anime-sdk'"), 'Must import from anime-sdk');
    assert.ok(adapterCode.includes('searchAnime'), 'Must export searchAnime');
  });
});
```

**Patterns:**
- **Static Architecture Verification:** Inspects source files to ensure architectural rules (e.g. Zero VLC references in Rust and React, Anime domain isolation without TMDB imports).
- **Behavioral Contract Checks:** Verifies that required exports, methods, and component props match specifications.

## Mocking

**Framework:**
- Zero external mocking library; built-in JavaScript object doubles and mock data files.

**Patterns:**
- Offline mock catalog provided in `src/services/mockData.ts` for TMDB endpoints (`MOCK_MOVIES`, `MOCK_TV_SHOWS`, `MOCK_GENRES`).

**What to Mock:**
- External third-party HTTP endpoints during offline testing.
- Window and DOM events when testing non-browser environments.

**What NOT to Mock:**
- Core application data transformation functions and state machines.

## Fixtures and Factories

**Test Data:**
- Predefined mock records in `src/services/mockData.ts`.

**Location:**
- `src/services/mockData.ts`

## Coverage

**Requirements:**
- Architectural integrity rules must achieve 100% pass rate in `tests/v2-suite.test.mjs`.
- All 13 core architecture slices verified on every build.

## Test Types

**Architecture & Contract Tests:**
- Validates structural rules across the codebase (VLC eradication, Anime domain isolation, dual player separation, 1100+ episode support, glass UI tokens, conversational AI integrity).

**Unit & Integration Tests:**
- Validates provider fallback cascade, AniList pagination, and compound key deduplication.

**E2E & Runtime Verification:**
- Manual and Playwright runtime browser inspections verifying responsive UI, HLS video playback, and glassmorphism rendering.

## Common Patterns

**Architecture Boundary Assertion:**
```javascript
test('Slice B: Anime Isolation — AnimeService has dedicated repository without TMDB leakage', () => {
  const serviceCode = fs.readFileSync('src/services/anime/AnimeService.ts', 'utf8');
  assert.strictEqual(serviceCode.includes("from '../tmdb'"), false, 'AnimeService must not import TMDB');
});
```

---

*Testing analysis: 2026-08-30*
