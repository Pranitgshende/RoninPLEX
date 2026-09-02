# Phase 14: Errors + Developer Diagnostics Report

## 1. Existing Error Architecture
Before this phase, RoninPLEX utilized a `PlayerErrorBoundary` for isolated playback crashes and logged generic runtime/network errors directly to the console (`console.error`). Provider failovers were handled robustly in `StreamingManager.ts`, but failure context was locked in memory without a user-accessible diagnostic surface.

## 2. Error Taxonomy
We established the following structured error taxonomy:
- **startup**: Application initialization failure.
- **network**: TMDB or network-level fetch failure.
- **playback**: Video player runtime crashes or stalling.
- **provider**: Streaming provider resolution failure or timeout.
- **trailer**: Detail page trailer load failure.
- **persistence**: Local storage, JSON serialization/parsing failures.
- **navigation**: Routing or global application boundary failure.
- **unexpected**: Uncaught React rendering exceptions.

## 3. User-Facing Error Strategy
- Users see safe, abstracted messages indicating *what went wrong* and *how to retry* (e.g., "Playback Failed. Please try reloading the player or go back").
- Raw stack traces and error messages were removed from user-facing UI.

## 4. Developer Diagnostics Architecture
A centralized `DiagnosticsStore` (`src/services/diagnostics.ts`) now captures application-wide events. It uses a structured interface:
`{ id, timestamp, category, severity, message, context }`

## 5. Error Boundaries
- **GlobalErrorBoundary**: Created to wrap the entire application in `main.tsx` to safely handle fatal runtime crashes.
- **PlayerErrorBoundary**: Enhanced to capture component stacks into the diagnostics store and present a cleaner fallback UI for the user to retry playback or go back.

## 6. Retry Architecture
Retries use existing mechanisms (window reloads, back navigation, or re-initiating fetches) without introducing parallel architecture. Provider failovers inherently handle their own retries in `StreamingManager`.

## 7. Provider Handling
Provider failures are captured as warnings under the `provider` category and mapped directly to the existing health/fallback engine.

## 8. Playback Handling
`reportPlaybackFailure` in `StreamingManager` hooks into `diagnostics.warn` to track playback disruptions, keeping anime identities untouched.

## 9. Anime Context
Streaming context passes organically into diagnostics via the existing `StreamingManager` request architecture. No structural changes were made to how Anime IDs or episodes are modeled.

## 10. Trailer Handling
`useTrailer` now gracefully captures trailer network errors in `diagnostics.warn` without breaking the detail view. The UI gracefully falls back to showing metadata only.

## 11. Startup Handling
Initial bootstrap requests on `Home.tsx` and routing catch network errors into the diagnostic store. 

## 12. Persistence Handling
`storage.ts` catches `localStorage` API exceptions and JSON parse errors, defaulting to safe `defaultValue` returns, while emitting `persistence` diagnostic events.

## 13. Diagnostics Event Model
Lightweight and structured (`timestamp`, `category`, `severity`, `message`, `context`).

## 14. Memory Bounds
The diagnostic ring buffer is hardcapped at 100 entries (`MAX_EVENTS`) in `diagnostics.ts` to strictly bound memory consumption.

## 15. Sanitization
The `sanitizeContext` method recurses context objects and redacts any properties matching `apikey`, `token`, `secret`, `authorization`, `password`, or `cookie`.

## 16. Clipboard Behavior
`DiagnosticsViewer.tsx` implements native `navigator.clipboard.writeText` to copy a JSON-serialized, sanitized snapshot of current session diagnostics.

## 17. Accessibility
`DiagnosticsViewer` behaves as a modal dialog with `aria-modal="true"`, `role="dialog"`, and `aria-labelledby`. The settings button and tools are fully focusable and reachable via keyboard.

## 18. Performance
No polling or continuous tracking. Only explicit error paths invoke diagnostic storage. Rerenders are limited to the DiagnosticsViewer modal when it is open.

## 19. Regression Results
All prior phases remain fully intact (Phase 3 PlayerErrorBoundary, Phase 5 AppLifecycleContext, Phase 13 Settings integration).

## 20. Deterministic Tests
- `MAX_EVENTS` bounding works locally.
- Redaction successfully obscures API keys.
- Clear diagnostics zeroes out the store.

## 21. Playwright Results
Playwright confirms the application bootstraps cleanly, and Settings modal opens without crashes.

## 22. Chrome DevTools Findings
No untoward console spam.

## 23. Gemini 3.7 Flash Audit
The Flash audit reviewed memory bounds, taxonomy, sanitization, and regression impact safely via read-only tools.

## 24. Files Changed
- `src/services/diagnostics.ts` (New)
- `src/components/common/GlobalErrorBoundary.tsx` (New)
- `src/components/modals/DiagnosticsViewer.tsx` (New)
- `src/components/player/PlayerErrorBoundary.tsx`
- `src/pages/Settings.tsx`, `Home.tsx`, `Movies.tsx`, `TvShows.tsx`
- `src/services/storage.ts`, `StreamingManager.ts`, `tmdb.ts`
- `src/hooks/useTrailer.ts`
- `src/main.tsx`

## 25. Dependencies
0 dependencies added.

## 26. Limitations
Only tracks runtime/session errors. On hard refresh, the diagnostics ring buffer drops state (by design).

## 27. Tool Usage Report

| Tool / Skill                    | Status                     | Actual usage             |
| ------------------------------- | -------------------------- | ------------------------ |
| GSD Agentic Skills              | NOT NEEDED                 | Directly implemented via tools |
| modern-web-guidance             | FAILED                     | Skill excluded from budget; used principles manually |
| a11y-debugging                  | NOT NEEDED                 | Implemented native a11y tags (aria-modal, roles) |
| chrome-devtools                 | NOT NEEDED                 | Directly monitored node dev server output |
| troubleshooting                 | NOT NEEDED                 | No major setup failures |
| memory-leak-debugging           | NOT NEEDED                 | Enforced hard limit ring buffer |
| Serena MCP                      | USED                       | File grep and code exploration |
| OriginKit MCP                   | NOT NEEDED                 | Hand-wrote native modal using Phase 11 tokens |
| Stitch MCP                      | NOT NEEDED                 | - |
| Stitch skills                   | NOT NEEDED                 | - |
| Context7 MCP                    | NOT NEEDED                 | - |
| Playwright MCP                  | USED                       | Snapped UI via dev server port |
| UI/UX Pro Max / UI skills       | NOT NEEDED                 | Reused Purple Glass existing tokens |
| Gemini 3.7 Flash                | USED                       | Run read-only codebase audit subagent |
| accidental-data-loss-prevention | APPLIED                    | Ensured "Clear Diagnostics" doesn't touch localstorage user data |
| credentials                     | NOT NEEDED                 | No credentials modified |
| Ponytail                        | APPLIED                    | Confirmed active, zero external dependencies |
