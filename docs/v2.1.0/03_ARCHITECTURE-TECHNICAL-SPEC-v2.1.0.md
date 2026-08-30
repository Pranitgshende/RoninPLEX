# RoninPLEX v2.1.0 — Architecture & Technical Specification

## 1. Architectural Baseline
Extend the existing RoninPLEX React/Tauri/provider/streaming architecture. Avoid wholesale rewrites.

## 2. Playback Capability Model
Providers should expose capabilities conceptually such as:
- supportsSeasons
- supportsEpisodes
- supportsSubtitles
- supportsDubbing
- supportsQuality
- supportsSeek
- supportsPiP
- supportsFullscreen
- supportsTrailer

Capabilities may be true, false, or unknown. UI controls must not be based on scattered provider-name checks.

## 3. Playback Boundary
Normalize playback intent:
- media identity
- season/episode
- provider
- language
- subtitle preference
- quality preference
- resume position
- playback mode

Provider adapters translate this into provider-specific behavior.

## 4. Persistent Desktop PiP Architecture
The preferred implementation is a dedicated Tauri/native top-level window managed by the existing application process.

The PiP window should:
- be independently movable/resizable;
- be always-on-top;
- host or control the active playback session;
- survive main-window hide/minimize/close-as-UI behavior;
- communicate playback state with the main window through a controlled application-side bridge/state channel;
- support return-to-main-player and close-PiP actions.

The application lifecycle must distinguish:
1. main UI window closed/hidden while PiP is active;
2. PiP closed;
3. entire application/process terminated.

Case 1 must preserve PiP. Case 3 is outside the requirement.

Avoid spawning duplicate player sessions when switching between main player and PiP. Playback ownership/state must have a single authoritative session.

## 5. Anime Playback
Preserve the existing anime player path unless a specific defect requires change. Provider capabilities determine language, subtitle, quality, seek, and other controls.

## 6. Season/Episode
Use the conceptual model:
`Series -> Season -> Episode -> PlaybackSource`

## 7. Detail Pages
Trailer priority:
1. official/trusted trailer;
2. best matching available trailer;
3. normal static hero fallback.

## 8. UI System
Create reusable tokens/components for:
- purple glass surfaces
- borders/highlights
- blur/backdrop
- hover/focus/selected/disabled states
- card elevation
- typography
- spacing
- overlays

## 9. Settings
Use the existing storage abstraction. New settings require safe defaults and backward-compatible reads.

## 10. Observability
Playback diagnostics should include media type, provider, mode, capability state, failure category, and recoverability without secrets.
