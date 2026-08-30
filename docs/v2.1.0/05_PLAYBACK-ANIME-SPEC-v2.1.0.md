# RoninPLEX v2.1.0 — Playback, Anime & Persistent PiP Specification

## 1. Playback Matrix
| Media | Selection | Languages | Captions | Quality | Seek | PiP |
|---|---|---|---|---|---|---|
| Movie | Movie | Provider-dependent | Provider-dependent | Provider-dependent | Supported where possible | Persistent desktop PiP |
| TV | Season/Episode | Provider-dependent | Provider-dependent | Provider-dependent | Supported where possible | Persistent desktop PiP |
| Anime | Season/Episode where applicable | Sub/Dub where supported | Provider-dependent | Provider-dependent | Supported where possible | Persistent desktop PiP |

## 2. Persistent PiP Behavior
The PiP experience must behave like a desktop equivalent of YouTube PiP:
- separate top-level window;
- always-on-top;
- independently movable;
- independently resizable;
- playback continues while the main RoninPLEX UI is minimized or closed as a UI window;
- main application can be reopened and playback restored;
- PiP can be closed independently;
- PiP can return to the main player;
- playback position remains continuous.

### Lifecycle clarification
"Close RoninPLEX" in this UX means closing/hiding the main application window while keeping the process alive for active PiP. A true process termination stops playback and is explicitly outside the requirement.

## 3. PiP Controls
Where supported:
- play/pause
- progress/seek
- ±10 second seek
- volume/mute
- captions/subtitles
- audio/language
- quality
- return to RoninPLEX
- close PiP

Controls must be capability-gated.

## 4. Anime
Language, subtitle, quality, and provider selection are provider-capability dependent. Never fabricate unsupported choices.

## 5. Error Recovery
Distinguish provider unavailable, source unavailable, embed blocked, invalid media, network failure, unsupported capability, and player initialization failure.
