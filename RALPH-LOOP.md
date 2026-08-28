# RoninPLEX v2.0.0 — RALPH LOOP

## Purpose

This document defines the autonomous Ralph Loop for implementing, testing,
debugging, and validating RoninPLEX v2.0.0.

The objective is NOT to merely modify code or make builds pass.

The objective is to produce a genuinely working, production-ready
RoninPLEX v2.0.0 release.

The loop must continue until the acceptance criteria in this document
and PRD-v2.0.0.md are satisfied.

---

# 1. Mandatory Skills & Tools

Antigravity MUST actively use the following tools/skills where applicable.

## Agentic Awesome Skills

Use the `@` invocation syntax.

Required skills:

- @software-architecture
- @planning-and-task-breakdown
- @react-best-practices
- @typescript-pro
- @rust-pro
- @security-and-hardening
- @performance-optimization
- @testing-qa
- @code-review-and-quality
- @pre-release-review
- @documentation

Additional skills should be invoked when clearly applicable.

Do NOT merely mention these skills.

Actually invoke them during implementation.

---

# 2. Mandatory Development Tools

Use the available development tools actively:

- StitchMCP
- chrome-devtools
- Context7
- memory-bank
- Playwright
- sequential-thinking
- Serena
- GSD / planning workflow

## StitchMCP

Use StitchMCP for:

- UI redesign
- glassmorphism layouts
- navigation redesign
- cards
- hero sections
- Decision Helper UI
- Ronin AI interface
- anime interface
- responsive layouts
- animation concepts
- visual consistency

Do not redesign UI blindly.

Inspect the existing UI first, then use Stitch to establish the improved design direction.

---

## Chrome DevTools

Use Chrome DevTools/CDP for runtime investigation and verification.

Inspect:

- console errors
- uncaught exceptions
- network failures
- iframe loading
- HLS loading
- media element state
- route transitions
- fullscreen state
- WebView runtime behavior
- React rendering failures
- animation performance

Do not consider a feature verified merely because TypeScript compiles.

---

## Context7

Use Context7 whenever implementation depends on external libraries or APIs.

Prioritize Context7 for:

- React
- React Router
- Tauri 2
- HLS.js
- animation libraries
- testing libraries
- Anime SDK
- Jikan
- AI SDKs
- any newly introduced dependency

Use current documentation instead of relying on memory.

---

## Serena

Use Serena for repository understanding and code navigation.

Before modifying major systems:

1. Inspect the relevant architecture.
2. Find existing implementations.
3. Identify dependencies.
4. Reuse existing abstractions where appropriate.
5. Avoid duplicating functionality.

Prefer surgical modifications over unnecessary rewrites.

---

## Playwright

Use Playwright for end-to-end validation.

Test:

- navigation
- search
- movie playback
- TV playback
- anime browsing
- anime playback
- Decision Helper
- settings
- 18+ controls
- fullscreen
- continue watching
- provider failover
- responsive behavior

---

## Sequential Thinking

Use sequential thinking for complex debugging and architecture decisions.

Do not randomly patch symptoms.

For difficult failures:

1. Reproduce.
2. Gather evidence.
3. Identify possible causes.
4. Test hypotheses.
5. Implement the smallest correct fix.
6. Re-run the failing scenario.
7. Verify no regression.

---

# 3. Core Ralph Loop

Repeat the following loop continuously until the current task is completely
verified.

```text
┌─────────────────────────────┐
│        READ PRD / STATE     │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│      INSPECT REPOSITORY     │
│       Serena + GSD           │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│       PLAN NEXT SLICE       │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│        IMPLEMENT            │
│ Skills + Context7 + Serena  │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│          TEST               │
│ Unit + Integration + E2E    │
└──────────────┬──────────────┘
               ↓
        Tests failing?
          /       \
        YES       NO
         ↓         ↓
┌──────────────┐   │
│ DEBUG        │   │
│ DevTools     │   │
│ Playwright   │   │
│ Sequential   │   │
│ Thinking     │   │
└──────┬───────┘   │
       │            │
       └────────────┘
              ↓
┌─────────────────────────────┐
│     RUNTIME VERIFICATION    │
│ Chrome DevTools + Playwright│
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│      CODE REVIEW            │
│ Architecture + Security +   │
│ Performance + Quality       │
└──────────────┬──────────────┘
               ↓
       Acceptance criteria?
          /       \
        NO        YES
         ↓         ↓
      LOOP        DONE