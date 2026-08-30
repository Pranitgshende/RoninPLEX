# RoninPLEX v2.1.0 — Requirements & Traceability

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| RPL-001 | P0 | App launches fullscreen-first | Startup enters intended fullscreen presentation without manual maximize |
| RPL-002 | P0 | Movie playback is reliable | Supported movie paths load/play without new regressions |
| RPL-003 | P0 | TV supports season/episode selection | User can select season and episode where supported |
| RPL-004 | P0 | Anime supports season/episode navigation where applicable | Anime flow exposes required season/episode context |
| RPL-005 | P0 | Anime provider selection works | Supported providers can be selected safely |
| RPL-006 | P0 | Anime sub/dub selection works where supported | Audio language selection is applied without breaking playback |
| RPL-007 | P0 | Anime captions/subtitles work where supported | Caption track can be enabled/changed or native provider controls remain available |
| RPL-008 | P0 | Anime quality selection works where supported | Actual provider qualities are exposed and applied |
| RPL-009 | P1 | Seek controls are consistent | Supported players expose defined seek controls; unsupported providers degrade safely |
| RPL-010 | P0 | Persistent desktop PiP exists | PiP opens as a separate top-level desktop window |
| RPL-011 | P0 | PiP survives main UI close/minimize | Main RoninPLEX UI can be minimized/closed as a UI window while PiP keeps playing |
| RPL-012 | P0 | PiP stays above other applications | PiP uses always-on-top behavior while active |
| RPL-013 | P1 | PiP is movable/resizable | User can move and resize PiP independently |
| RPL-014 | P1 | PiP restores the main player | Return-to-app restores the same playback state |
| RPL-015 | P1 | Detail pages are trailer-driven | Trailer is prioritized when available, with static fallback |
| RPL-016 | P1 | Purple glass cards are consistent | Home/Anime/discovery card surfaces use shared glass treatment |
| RPL-017 | P1 | Navigation branding/actions are consistent | Top-level navigation targets are correct and unambiguous |
| RPL-018 | P1 | Core settings/customization exist | Supported v2.1.0 preferences are configurable and persisted |
| RPL-019 | P1 | Settings persist safely | Relaunch restores supported preferences without corrupting data |
| RPL-020 | P0 | Provider failures are isolated | One provider failure does not crash unrelated playback paths |
| RPL-021 | P0 | Playback errors are observable | User receives useful failure feedback and logs contain actionable non-secret context |
| RPL-022 | P1 | Accessibility basics are verified | Keyboard/focus/contrast/semantic checks cover changed UI |
| RPL-023 | P0 | Release regression matrix passes | Critical startup/movie/TV/anime flows pass |
| RPL-024 | P0 | Build/package remains reproducible | Production build/package/installer completes and launches |

## Non-functional Requirements
- Provider-specific behavior remains isolated.
- Unsupported capabilities must be explicit.
- PiP must not require the main UI window to remain visible.
- PiP must not imply that playback survives true process termination.
- Settings changes must be backward-compatible.
- Logs must not expose secrets.
- Performance work requires before/after verification.
- Every P0 requirement needs a release verification case.
