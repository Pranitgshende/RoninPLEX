# RoninPLEX v2.1.0 — UX/UI Specification

## 1. Visual Direction

The v2.1.0 interface should establish a cohesive purple-glass media aesthetic.

### Core visual language

- translucent/shiny glass cards rather than opaque gray cards;
- restrained purple tint;
- readable contrast over artwork;
- consistent border/highlight treatment;
- clear hover, focus, selected, and disabled states;
- visual hierarchy that keeps artwork primary.

## 2. Home / Discovery Cards

Cards should:

- use the shared glass component;
- preserve artwork visibility;
- avoid excessive blur that harms readability;
- expose title and relevant metadata clearly;
- maintain consistent radius, spacing, and interaction behavior.

## 3. Anime Surface

Anime cards should use the same card system as the Home surface rather than a separate visual language.

Anime navigation should make season/episode context obvious.

## 4. Header / Navigation

Top-level branding and actions must have unambiguous targets.

The navigation should not contain redundant or misleading AI/player branding.

## 5. Player UX

Player opening behavior:

- default to fullscreen-first presentation;
- expose standard playback controls where supported;
- keep provider-specific controls from being hidden unnecessarily;
- provide clear language/subtitle/quality affordances for anime when available;
- preserve a predictable exit path.

## 6. PiP UX

PiP must:

- be visually distinct from the main player;
- remain draggable/resizable;
- provide close and restore actions;
- avoid covering critical controls by default;
- preserve playback state.

## 7. Detail Page

The hero should prioritize trailer media when available, but still provide:

- title
- artwork
- description
- metadata
- watch action
- season/episode access where applicable

No trailer must never produce an empty or broken hero.

## 8. Accessibility

Changed surfaces must be checked for:

- keyboard navigation
- visible focus
- semantic buttons/links
- accessible labels
- sufficient text/icon contrast
- sensible target sizes
- reduced-motion compatibility where applicable

The Chrome DevTools accessibility skill and MCP should be used for web-facing verification where applicable.

## 9. Responsive/Window Behavior

The desktop window and internal layout should remain usable across supported window sizes. Fullscreen-first does not mean layouts may assume a single fixed resolution.
