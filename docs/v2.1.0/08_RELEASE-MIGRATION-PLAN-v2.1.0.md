# RoninPLEX v2.1.0 — Release & Migration Plan

## 1. Release Sequence

### Phase A — Baseline

- freeze the v2.1.0 requirements;
- capture current version/build status;
- confirm current known regressions;
- ensure clean working tree or document intentional changes.

### Phase B — Architecture Foundations

- stabilize player/provider boundaries;
- introduce capability handling where needed;
- establish reusable UI/settings primitives.

### Phase C — Playback & Anime

- season/episode flows;
- anime provider selection;
- language/caption/quality controls;
- seek/PiP;
- reliability fixes.

### Phase D — Discovery & UI

- trailer-driven details;
- purple glass component system;
- navigation corrections;
- fullscreen-first behavior.

### Phase E — Verification & Release

- full regression matrix;
- accessibility/performance checks;
- package/installer verification;
- changelog/release notes;
- final version metadata.

## 2. Migration

Settings/state changes must be backward-compatible.

If a new setting is introduced:

- define a default;
- handle absent values;
- handle malformed values safely;
- avoid deleting unrelated preferences;
- test upgrade from the previous release.

## 3. Rollback

For high-risk changes, retain a clear rollback path through Git commits/branches and avoid bundling unrelated refactors into the same release-critical change.

## 4. Definition of Done

v2.1.0 is ready only when:

- all P0 requirements pass;
- all P1 requirements are complete or explicitly accepted for deferral;
- release build succeeds;
- installed-package smoke test succeeds;
- no known blocker exists;
- deferred v2.1.1 scope remains documented;
- release notes accurately describe shipped behavior.
