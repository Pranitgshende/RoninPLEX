# RoninPLEX v2.1.0 — Product Requirements Document

## 1. Purpose
RoninPLEX v2.1.0 is a reliability, playback, anime, discovery, UI, desktop-PiP, and core-customization release built on the existing RoninPLEX desktop application.

This document supersedes the older v2.0.0 product specification for v2.1.0 planning. The v2.0.0 PRD is historical input only.

## 2. Product Goal
Deliver a stable, fast, polished media experience in which:
- the application starts fullscreen-first;
- movie, TV, and anime playback is reliable and controllable;
- TV/anime season selection is available where applicable;
- anime supports provider selection, sub/dub language selection, subtitles/captions, and quality selection where supported;
- player controls fail gracefully when providers cannot expose a capability;
- persistent desktop PiP behaves like a YouTube-style floating player and survives closing/minimizing the main RoninPLEX UI window;
- detail pages prioritize trailers when available;
- the visual system consistently uses the purple glass aesthetic;
- core settings/customization are available without pulling deferred v2.1.1 profile/advanced-customization scope into this release.

## 3. In Scope
1. Playback reliability and performance
2. Fullscreen-first application/player behavior
3. TV and anime season/episode selection
4. Anime provider and language functionality
5. Anime subtitle/caption and quality controls
6. Robust seek/control integration where supported
7. Persistent, always-on-top, movable/resizable desktop PiP
8. Trailer-driven detail pages
9. Purple glass UI/card system and visual consistency
10. Navigation and UI corrections
11. Core settings/customization
12. Verification, regression protection, and release hardening

## 4. Explicitly Out of Scope
- Multiple user profiles
- Broad advanced customization beyond v2.1.0 core settings
- System-native Windows PiP as a separate requirement
- Major provider rewrites unrelated to reliability/functionality
- Unrelated cloud/backend infrastructure
- Large architectural rewrites without a demonstrated v2.1.0 requirement
- Keeping playback alive after the entire RoninPLEX process is truly terminated

## 5. Persistent Desktop PiP Definition
PiP is a separate top-level desktop playback window, not merely an element inside the main RoninPLEX window.

When PiP is active:
- the video remains playing while the main RoninPLEX UI is minimized or hidden;
- the PiP window remains above other desktop applications;
- the PiP window is independently movable and resizable;
- the user can close the PiP independently;
- the user can return to the main RoninPLEX player;
- playback position and relevant playback state are preserved;
- the main UI can be reopened without losing the playback session.

Closing the main RoninPLEX window should mean closing/hiding the main UI window, not terminating the entire RoninPLEX process while PiP is active. A complete process termination is outside the requirement because the player needs a surviving process/window.

## 6. Success Criteria
- stable fullscreen-first startup and playback;
- movie/TV/anime critical playback regressions resolved;
- TV/anime season and episode selection works where supported;
- anime language, captions, and quality controls work where source capabilities exist;
- PiP remains playable above other apps after the main UI window is minimized/closed as a UI surface;
- PiP can be moved/resized/closed/restored;
- trailer-first detail pages have graceful fallbacks;
- purple glass cards are consistent across Home, Anime, and discovery;
- core settings persist safely;
- release-critical verification passes with no known blocker.

## 7. Release Boundary
New ideas discovered during implementation must be recorded as candidates instead of silently expanding v2.1.0. Deferred work belongs to v2.1.1 unless explicitly promoted through a documented scope decision.
