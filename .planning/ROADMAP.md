# Roadmap: RoninPLEX v2.0.0

## Phases

- [x] **Phase 1: Architecture & Isolation Foundations** - VLC eradication, Anime domain isolation, and desktop security guard
- [x] **Phase 2: Anime Catalog & Playback Engine** - AniList GraphQL integration, 1100+ episode support, dedicated anime player, and failover
- [x] **Phase 3: Unified Discovery, Search & Content Classification** - Compound key deduplication, universal multi-media search, and 18+ accessibility
- [x] **Phase 4: Ronin AI Conversational Intelligence & Glass UI** - 9-state reactive avatar, franchise inquiry, and glassmorphism styling
- [ ] **Phase 5: Runtime Verification & Release Packaging** - End-to-end verification, platform packaging, and desktop release readiness

## Phase Details

### Phase 1: Architecture & Isolation Foundations
**Goal**: Establish pristine architectural separation, eliminate legacy VLC code, and configure Tauri 2 security navigation guards.
**Depends on**: Nothing (first phase)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04
**Success Criteria** (what must be TRUE):
  1. Rust and frontend code contain zero references to VLC or libvlc bindings.
  2. `src/services/anime/` operates with zero imports from `../tmdb`.
  3. Tauri navigation guard blocks iframe navigation attempts to external URLs.
  4. Application boots cleanly offline using mock catalog data when no TMDB key is provided.
**Plans**: Complete
**UI hint**: no

### Phase 2: Anime Catalog & Playback Engine
**Goal**: Deliver a first-class anime experience with dedicated player architecture, high-episode pagination, and multi-provider failover.
**Depends on**: Phase 1
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04, ANIM-05, PLAY-01, PLAY-02, PLAY-03
**Success Criteria** (what must be TRUE):
  1. AniList catalog loads trending, popular, and seasonal anime without TMDB dependencies.
  2. Anime series with >1000 episodes (e.g. One Piece) render smoothly via chunked pagination.
  3. Anime playback mounts dedicated `AnimeVideoPlayer` with subtitle track and server controls.
  4. Broken streams automatically trigger provider failover without crashing the UI.
**Plans**: Complete
**UI hint**: yes

### Phase 3: Unified Discovery, Search & Content Classification
**Goal**: Provide unified multi-media discovery across Movies, TV, and Anime with compound key deduplication and adult content classification.
**Depends on**: Phase 2
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, ADLT-01, ADLT-02
**Success Criteria** (what must be TRUE):
  1. Discover page allows seamless filtering between Movies, TV Shows, Anime, and All Media.
  2. Rapid filter changes cancel obsolete in-flight requests without card duplication or stale data.
  3. Universal Search queries Movies, TV, and Anime in parallel with tabbed views.
  4. 18+ content is clearly badged with accessible `aria-label="18+ Adult Content"`.
**Plans**: Complete
**UI hint**: yes

### Phase 4: Ronin AI Conversational Intelligence & Glass UI
**Goal**: Integrate conversational recommendation companion with 9-state reactive mascot and glassmorphism design system.
**Depends on**: Phase 3
**Requirements**: AI-01, AI-02, AI-03, AI-04, UI-01, UI-02
**Success Criteria** (what must be TRUE):
  1. Ronin AI engages in multi-turn conversational inquiries for franchises (Marvel, Anime Dojo).
  2. Session memory tracks recommended titles so recommendations are never duplicated.
  3. `RoninAvatar` animates dynamically across 9 distinct moods (idle, thinking, talking, etc.).
  4. Interface features authentic glass design tokens with `backdrop-filter: blur()`.
**Plans**: Complete
**UI hint**: yes

### Phase 5: Runtime Verification & Release Packaging
**Goal**: Execute comprehensive runtime test matrices, verify desktop packaging, and validate release readiness.
**Depends on**: Phase 4
**Requirements**: ARCH-01 through UI-02
**Success Criteria** (what must be TRUE):
  1. Master architecture test suite (`tests/v2-suite.test.mjs`) passes 100% with 0 failures.
  2. TypeScript strict checks (`tsc --noEmit`) and frontend build (`vite build`) succeed cleanly.
  3. Desktop bundle (`tauri build`) generates functional Windows executable.
**Plans**: Active
**UI hint**: yes
