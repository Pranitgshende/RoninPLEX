# RoninPLEX v2.0.0
# Product Requirements Document + Ralph Loop Specification

Repository:
https://github.com/Pranitgshende/RoninPLEX

Target Version:
2.0.0

---

# 1. PRODUCT VISION

RoninPLEX is a Windows desktop entertainment platform for discovering
and watching Movies, TV Shows, and Anime.

Version 2.0.0 is a major product evolution.

The goal is to transform RoninPLEX into a polished, cinematic,
stable, intelligent entertainment application with:

- Dedicated Movies experience
- Dedicated TV Shows experience
- Dedicated Anime experience
- Unified built-in video playback
- Multi-provider playback failover
- Complete VLC removal
- Glassmorphism UI
- High-quality animations
- Improved fullscreen behavior
- 18+ content controls
- Ronin AI companion
- AI-powered Decision Helper
- Animated Ronin character
- Ronin-style movie/TV/anime descriptions
- Better navigation
- Better performance
- Better accessibility
- Production-grade reliability

RoninPLEX v2.0.0 must feel like one coherent entertainment platform,
not a collection of disconnected pages.

---

# 2. ABSOLUTE PRIORITY

Stability is more important than adding features.

Do not introduce a new feature if it causes an existing core feature
to regress.

Core functionality has priority in this order:

1. Application launches
2. Navigation works
3. Metadata/search works
4. Playback works
5. Fullscreen works
6. Progress tracking works
7. Anime works
8. UI/animations
9. Ronin AI
10. Additional enhancements

Never sacrifice playback or application stability for visual effects.

---

# 3. CURRENT PROBLEMS

The current RoninPLEX application has experienced:

- Movies/TV/Discover navigation incorrectly rendering the Discover page
- TV Shows not having a sufficiently dedicated experience
- Fullscreen inconsistencies
- Provider playback failures
- Black-screen playback regressions
- Poor playback recovery
- VLC incompatibility with web embed streams
- Unnecessary VLC complexity
- Limited anime support
- Limited AI functionality
- Limited application-wide animation
- Inconsistent UI design
- Lack of clear 18+ controls
- Lack of a recognizable application personality

---

# 4. VERSION 2.0.0 GOALS

RoninPLEX v2.0.0 must provide:

- Correct navigation
- Dedicated Movies page
- Dedicated TV Shows page
- Dedicated Anime page
- Reliable built-in playback
- Provider failover
- HLS playback
- MP4 playback
- Fullscreen
- Continue Watching
- 18+ filtering and labeling
- Glass-style UI
- Consistent animation system
- Ronin animated character
- Ronin AI
- Conversational Decision Helper
- Ronin-generated spoiler-free descriptions
- Production-ready Windows installer
- No VLC

---

# 5. NAVIGATION

Primary navigation:

- Home
- Movies
- TV Shows
- Anime
- Discover
- Decision Helper

Secondary navigation:

- Watchlist
- Settings

Required routes:

/
 /movies
 /tv
 /anime
 /discover
 /decision
 /movie/:id
 /tv/:id
 /anime/:id
 /watch/movie/:id
 /watch/tv/:id/:season/:episode
 /watch/anime/:id/:episode
 /watchlist
 /settings

Navigation requirements:

- Movies must always open Movies.
- TV Shows must always open TV Shows.
- Anime must always open Anime.
- Discover must always open Discover.
- Decision Helper must always open Decision Helper.
- Direct navigation must work.
- Page refresh must preserve the current page.
- Active navigation state must match the current route.
- No section may accidentally render another section.

Use Chrome DevTools/CDP and Playwright to verify runtime navigation.

---

# 6. MOVIES

Movies must become a first-class experience.

Movies page should include:

- Trending Movies
- Popular Movies
- Top Rated Movies
- Genre sections
- Search
- Recommendations
- Continue Watching

Movie cards should display:

- Poster
- Title
- Release year
- Rating
- Runtime where available
- Maturity information
- 18+ indicator when applicable

Movie detail pages should provide:

- Hero artwork
- Title
- Description
- Metadata
- Genres
- Cast
- Rating
- Maturity information
- Watch button
- Watchlist action
- Recommendations

---

# 7. TV SHOWS

TV Shows must have a dedicated experience.

TV page should include:

- Trending TV
- Popular TV
- Top Rated TV
- Genres
- Search
- Continue Watching

TV navigation:

TV Show
→ Details
→ Season
→ Episode
→ Playback

Episode interface should provide:

- Season selector
- Episode selector
- Episode title
- Episode description
- Episode progress
- Previous episode
- Next episode

Continue Watching should preserve episode and playback progress.

Existing TV next-episode functionality must be preserved and improved.

---

# 8. ANIME

Anime must become a completely separate first-class section.

Anime must have its own:

- Top navigation item
- Landing page
- Search
- Details page
- Episode page
- Recommendations
- Playback experience

Anime must NOT simply be mixed into Movies or TV pages.

---

# 9. ANIME SDK

Use this exact Anime SDK:

GitHub:
https://github.com/hexxt-git/anime-sdk

Documentation:
https://anime-sdk.hexxt.dev/

DO NOT substitute Jikan for Anime SDK as the primary anime source
without first investigating Anime SDK.

Before implementation:

1. Inspect the Anime SDK repository.
2. Inspect current documentation.
3. Use Context7 where available.
4. Inspect the SDK architecture.
5. Inspect available providers.
6. Inspect metadata capabilities.
7. Inspect mapping capabilities.
8. Inspect episode resolution.
9. Inspect stream/source resolution.
10. Inspect subtitle/track support.
11. Inspect caching.
12. Determine whether direct SDK integration or HTTP-server mode
   is better for Tauri.

Do not invent undocumented endpoints.

Do not assume an API exists because an old example references it.

---

# 10. ANIME END-TO-END REQUIREMENT

Anime is NOT complete when search works.

The complete pipeline must be verified:

Search
↓
Metadata
↓
Anime Details
↓
Episodes
↓
Episode Selection
↓
Source Resolution
↓
Media URL
↓
HLS/MP4
↓
RoninPLEX Player
↓
Actual Playback

The final media must actually play.

If Anime SDK cannot reliably provide the required source pipeline:

STOP.

Investigate alternatives before implementing a fake or incomplete
streaming architecture.

Jikan/MAL may be used as a supplementary metadata source only when
useful and justified.

---

# 11. ANIME SERVICE ARCHITECTURE

Anime must be isolated behind an abstraction.

Recommended architecture:

React
↓
AnimeService
↓
Anime SDK Adapter
↓
Anime SDK
↓
Providers
↓
Source
↓
RoninPLEX Player

The rest of RoninPLEX must not become tightly coupled to the SDK.

If Anime SDK HTTP-server mode is more appropriate:

React
↓
AnimeService
↓
Local Anime SDK Server
↓
Anime SDK
↓
Providers

Investigate both architectures before selecting one.

---

# 12. UNIFIED PLAYBACK

RoninPLEX must use the built-in player.

VLC must NOT be required.

Supported media should include:

- HLS
- MP4
- DASH where practical
- Embedded web streams where required

HLS should use:

- Native HLS when supported
- HLS.js when required

Playback state must distinguish:

1. Source resolved
2. Player initialized
3. Media loaded
4. Playback started
5. Playback progressing

A source URL existing does NOT mean playback succeeded.

---

# 13. PLAYBACK FAILOVER

When playback fails:

Provider A
↓
Failure
↓
Provider B
↓
Failure
↓
Provider C
↓
Success

The system must:

- Detect playback failure
- Detect stalled playback
- Detect unrecoverable loading
- Record failed providers
- Prevent infinite retry loops
- Attempt the next eligible provider
- Preserve useful playback state where possible
- Display a meaningful error after all providers fail

Provider failover must work for Movies and TV.

Anime source failover should be handled through the Anime source layer
where supported.

---

# 14. BLACK SCREEN PROTECTION

A black screen must never become an indefinite terminal state.

Implement runtime playback detection.

Potential failure conditions:

- iframe loads but playback never starts
- media element exists but currentTime never advances
- HLS initialization fails
- video error event
- source becomes unavailable
- player remains stalled beyond a reasonable timeout

When failure is detected:

1. Log the failure.
2. Display recovery UI.
3. Attempt the next provider where appropriate.
4. Prevent infinite loops.
5. Allow manual retry.

Do not hide the loading state simply because an iframe document
finished loading.

---

# 15. VLC — COMPLETE REMOVAL

VLC must be completely removed from RoninPLEX.

This is mandatory.

Remove:

- VLC executable detection
- VLC launching
- VLC settings
- VLC buttons
- VLC modals
- VLC process management
- VLC Tauri commands
- VLC IPC
- VLC diagnostics
- VLC preferences
- useVlc
- VLC tests
- VLC documentation

Search repository-wide for:

VLC
vlc
useVlc
open_stream_in_vlc
check_vlc_installed
get_vlc_info
find_vlc_path

Expected result:

No production VLC integration.

All playback must occur through RoninPLEX's built-in player.

---

# 16. FULLSCREEN

Fullscreen must work reliably.

Verify:

- Enter fullscreen
- Exit fullscreen
- ESC
- Window resize
- Window maximize
- Window restore
- Player controls
- Provider switching
- Episode switching
- HLS playback
- MP4 playback
- Embedded playback

Use Chrome DevTools/CDP and Playwright to reproduce and verify
fullscreen behavior.

Do not blindly combine browser fullscreen and native Tauri fullscreen
unless runtime testing proves it is necessary.

---

# 17. CONTINUE WATCHING

Continue Watching must support:

- Movies
- TV episodes
- Anime episodes

Persist:

- Media ID
- Media type
- Season
- Episode
- Playback position
- Duration where available
- Last watched timestamp

Progress should update efficiently without excessive storage writes.

---

# 18. 18+ CONTENT

Add a setting:

Show 18+ Recommendations

Default behavior should be conservative and appropriate.

When disabled:

- Hide dedicated 18+ recommendation shelf.
- Filter adult recommendations where practical.

When enabled:

- Show dedicated 18+ recommendation section.

All qualifying content should clearly display:

18+

The label must appear on:

- Movie cards
- TV cards
- Anime cards where applicable
- Detail pages where applicable

Do not rely solely on color.

Use text and/or iconography.

---

# 19. 18+ SAFETY UX

18+ controls must be clear and intentional.

Do not accidentally surface adult recommendations when disabled.

Do not bury the setting.

The setting must persist between sessions.

---

# 20. GLASS UI REDESIGN

The entire application should receive a cinematic glass-style redesign.

Design direction:

- Premium
- Cinematic
- Dark
- Modern
- Glassmorphism
- Minimal
- Accessible
- Responsive

Use StitchMCP for UI exploration and design generation.

Available StitchMCP tools should be actively used for relevant UI work.

Create a consistent design system.

Components should include:

- Glass navigation
- Glass cards
- Glass panels
- Glass buttons
- Glass inputs
- Glass modals
- Glass dropdowns
- Glass badges
- Glass player controls

Avoid excessive blur.

Maintain readability and contrast.

---

# 21. STITCHMCP

StitchMCP must be used for UI and design-related work.

Use it to explore:

- Layout concepts
- Navigation
- Home page
- Movies page
- TV page
- Anime page
- Decision Helper
- Ronin UI
- Player UI
- Glass components
- Responsive layouts
- Animation concepts

Do not blindly copy generated designs.

Adapt designs to the actual RoninPLEX architecture.

---

# 22. ANIMATION SYSTEM

Create a unified motion system.

Animations should include:

- Page transitions
- Navigation transitions
- Card hover
- Card entrance
- Modal entrance
- Modal exit
- Search transitions
- Carousel transitions
- Loading states
- Player control transitions
- Notification animations
- Ronin animations

Animations must be:

- Smooth
- Purposeful
- Performant
- Consistent

Respect:

prefers-reduced-motion

When reduced motion is enabled, replace complex animations with
instant or minimal transitions.

---

# 23. RONIN CHARACTER

Introduce the application's AI character:

# Ronin

Ronin is a small animated ronin/samurai character.

He should feel like the personality of the application.

Personality:

- Calm
- Intelligent
- Confident
- Mysterious
- Helpful
- Slightly playful

Avoid excessive roleplay.

Ronin should feel like a helpful guide, not a mascot constantly
interrupting the user.

---

# 24. RONIN ANIMATIONS

Ronin should have subtle idle animations:

- Breathing
- Looking around
- Adjusting sword
- Small posture changes
- Sword practice
- Short combat-inspired practice animations

Ronin can move around appropriate areas of the application.

Examples:

- Home
- Discover
- Decision Helper
- Recommendation areas

Animations should be event-driven where possible.

Do not run expensive animation loops unnecessarily.

Ronin must never obstruct important UI.

---

# 25. RONIN AVATAR

Create:

src/components/ronin/RoninAvatar.tsx

The component should support states such as:

- idle
- thinking
- talking
- excited
- recommending
- celebrating
- sword-practice

The visual style should match the glass cinematic UI.

---

# 26. RONIN AI

Create an AI abstraction:

src/services/ai/AIService.ts

Architecture:

UI
↓
AIService
↓
AI Provider

Do not place AI API calls directly inside React components.

The AI system should support:

- Conversation
- Recommendations
- Movie descriptions
- TV descriptions
- Anime descriptions
- Decision Helper

---

# 27. RONIN DECISION HELPER

Decision Helper becomes a conversational AI experience.

The user should be able to say:

"What should I watch?"

"I want something funny."

"I want something dark."

"I only have 90 minutes."

"Recommend an anime."

"Give me something like Interstellar."

"I want something I can finish tonight."

Ronin should ask useful follow-up questions when necessary.

Possible factors:

- Mood
- Genre
- Runtime
- Media type
- Language
- Release year
- Intensity
- Familiarity
- Actors
- Directors
- Anime preferences

The final recommendation must correspond to actual metadata
available in RoninPLEX.

---

# 28. RONIN DESCRIPTIONS

Ronin should describe titles in his own voice.

Descriptions must be:

- Short
- Spoiler-free
- Accurate
- Based on actual metadata

Ronin must not invent:

- Actors
- Characters
- Plot events
- Endings
- Directors
- Release information

AI personality must never override factual accuracy.

---

# 29. AI FALLBACK

AI failure must never crash RoninPLEX.

If external AI is unavailable:

Use a deterministic local recommendation/fallback engine where practical.

Possible fallback behavior:

- Metadata-based recommendations
- Genre matching
- Rating matching
- Runtime matching
- Keyword matching
- User preference matching

The rest of the application must continue working even when AI
services are unavailable.

Never expose AI API keys in frontend bundles.

---

# 30. HOME EXPERIENCE

Home should become the central entertainment hub.

Suggested order:

1. Hero
2. Continue Watching
3. Trending
4. Popular Movies
5. Popular TV
6. Anime Spotlight
7. Personalized Recommendations
8. Ronin Recommendations
9. 18+ Recommendations when enabled

Sections should be lazy-loaded where appropriate.

Ronin should appear naturally without overwhelming the interface.

---

# 31. DISCOVER

Discover should remain distinct from Movies and TV.

Discover may provide:

- Mixed recommendations
- Genre exploration
- Trending content
- Mood-based exploration
- Search
- Curated collections

Discover must not accidentally render Movies or TV pages.

---

# 32. PERFORMANCE

Use:

@react-best-practices
@performance-optimization

Audit:

- React rendering
- API waterfalls
- API caching
- Video timeupdate events
- HLS lifecycle
- Memory usage
- Animation performance
- Event listener cleanup
- Timer cleanup
- Observer cleanup

Avoid unnecessary network requests.

Avoid unnecessary state updates.

Throttle high-frequency playback events.

---

# 33. SECURITY

Use:

@security-and-hardening
@rust-pro
@typescript-pro

Audit:

- Tauri IPC
- External URLs
- Streaming URLs
- User input
- AI input
- API keys
- TMDB keys
- Navigation guards
- Embedded content
- Local services

Never execute untrusted input through a shell.

Never expose secrets in frontend source.

---

# 34. ACCESSIBILITY

Support:

- Keyboard navigation
- Focus states
- Accessible labels
- Screen-reader-friendly controls
- Adequate contrast
- Reduced motion
- Accessible dialogs
- Accessible player controls

---

# 35. TESTING

Use:

@testing-qa

Add tests for:

- Routing
- Movies
- TV
- Anime
- Playback
- Provider failover
- Fullscreen
- Continue Watching
- 18+ filtering
- AI fallback
- Decision Helper
- Ronin states

Use Playwright for browser/runtime E2E testing where appropriate.

Use Chrome DevTools/CDP for deep runtime inspection.

---

# 36. TOOLING REQUIREMENTS

The following tools are available and should be actively used where
appropriate.

## StitchMCP

Use for:

- UI design
- Layout exploration
- Glass UI
- Animation concepts
- Responsive design

## Chrome DevTools

Use for:

- Runtime debugging
- Console inspection
- Network inspection
- DOM inspection
- Media debugging
- Fullscreen debugging
- Playback debugging

## Context7

Use for:

- Current library documentation
- API verification
- Framework documentation
- Anime SDK documentation where available
- HLS.js documentation
- Tauri documentation
- React documentation
- Animation libraries

Do not rely on stale knowledge when current documentation is available.

## Memory Bank

Use Memory Bank to preserve:

- Architectural decisions
- Important discoveries
- Known regressions
- Testing findings
- Provider behavior
- Anime SDK findings
- AI architecture decisions
- UI decisions

Do not repeatedly rediscover already documented project knowledge.

## Playwright

Use for:

- Navigation testing
- UI interaction testing
- Playback UI testing
- Fullscreen workflows where supported
- Decision Helper testing
- Regression testing

## Sequential Thinking

Use for:

- Complex debugging
- Architecture decisions
- Playback failures
- Provider failover
- Anime source pipeline
- Fullscreen problems
- Difficult runtime issues

## Serena

Use for:

- Codebase exploration
- Symbol navigation
- Architecture understanding
- Safe refactoring
- Dependency relationships

## GSD

Use for:

- Task decomposition
- Vertical slices
- Checkpoints
- Acceptance criteria
- Implementation sequencing

---

# 37. AGENTIC AWESOME SKILLS

The development agent MUST actively invoke relevant skills.

Available relevant skills include:

@software-architecture
@planning-and-task-breakdown
@react-best-practices
@typescript-pro
@rust-pro
@security-and-hardening
@performance-optimization
@testing-qa
@code-review-and-quality
@pre-release-review
@documentation

Additional skills should be used when available and relevant,
especially for:

- UI
- Animation
- Character design
- AI
- Testing
- Performance

Do not merely mention a skill.

Actually invoke the skill.

---

# 38. RALPH LOOP

Ralph must continuously iterate until all requirements pass.

The core loop is:

INSPECT
↓
PLAN
↓
IMPLEMENT
↓
BUILD
↓
RUN
↓
TEST
↓
OBSERVE
↓
FIX
↓
RETEST
↓
REGRESSION CHECK
↓
CHECKPOINT
↓
NEXT TASK

---

# 39. RALPH TASK SELECTION

At the start of every iteration:

1. Read this PRD.
2. Read the current implementation plan.
3. Read Memory Bank/project state.
4. Inspect git status.
5. Identify unfinished requirements.
6. Select the highest-priority unfinished task.
7. Work on one logical vertical slice.

Do not attempt to implement the entire PRD in one iteration.

---

# 40. RALPH INSPECTION

Before changing code:

- Inspect relevant files.
- Understand dependencies.
- Search existing implementations.
- Check tests.
- Check git history when useful.
- Use Serena.
- Use Context7 when APIs are involved.
- Use Sequential Thinking for complex problems.

Do not guess.

---

# 41. RALPH IMPLEMENTATION

Implement the smallest complete vertical slice.

Avoid unrelated refactoring.

Do not rewrite working systems without evidence.

Preserve existing functionality unless the PRD explicitly requires
changing it.

---

# 42. RALPH VERIFICATION

After implementation:

Run the smallest relevant verification first.

Frontend:

npm.cmd run build

Tests:

npm.cmd test

Rust:

cargo check
cargo test

Then perform runtime verification when appropriate.

---

# 43. RALPH FAILURE RULE

If a test fails:

DO NOT move forward.

Instead:

1. Reproduce.
2. Inspect.
3. Trace.
4. Identify root cause.
5. Fix.
6. Build.
7. Retest.
8. Repeat.

Never suppress errors merely to make tests pass.

Never delete tests simply because they fail.

Never declare a feature complete because the code compiles.

---

# 44. RALPH REGRESSION RULE

Every completed feature must be checked against previously completed
core functionality.

Examples:

Playback change:

Check:
- Movies
- TV
- Anime
- Fullscreen
- Continue Watching

Routing change:

Check:
- Home
- Movies
- TV
- Anime
- Discover
- Decision Helper

UI change:

Check:
- Navigation
- Cards
- Player
- Accessibility

---

# 45. RALPH CHECKPOINT

After a meaningful verified slice:

- Update Memory Bank/project state.
- Record completed requirement.
- Record tests.
- Record remaining work.
- Create a Git checkpoint when appropriate.

Do not checkpoint known-broken code merely to claim progress.

---

# 46. PRODUCTION VERIFICATION

Before declaring v2.0.0 complete:

Run:

npm.cmd run build

Then:

cd src-tauri
cargo check
cargo test

Then:

npm.cmd run tauri:build -- --bundles nsis

Build and verify the Windows installer.

Install the production application.

Test the installed executable.

Use Chrome DevTools/CDP and Playwright where appropriate.

Development mode is NOT sufficient evidence of production readiness.

---

# 47. PRODUCTION TEST MATRIX

Verify:

## Navigation

- Home
- Movies
- TV
- Anime
- Discover
- Decision Helper
- Settings
- Watchlist

## Movies

- Search
- Details
- Playback
- Continue Watching

## TV

- Search
- Details
- Seasons
- Episodes
- Playback
- Next Episode
- Continue Watching

## Anime

- Search
- Details
- Episodes
- Source resolution
- HLS/MP4 playback
- Episode switching

## Player

- Play
- Pause
- Seek
- Volume
- Fullscreen
- Subtitles where available
- Error recovery
- Provider failover

## 18+

- Setting OFF
- Setting ON
- Filtering
- Badges
- Persistence

## Ronin

- Avatar
- Idle animation
- Sword practice
- Thinking state
- Conversation
- Recommendations
- Descriptions

## Decision Helper

- User conversation
- Follow-up questions
- Recommendations
- Anime recommendations
- Movie recommendations
- TV recommendations
- AI failure fallback

---

# 48. VLC COMPLETION TEST

Repository-wide search must confirm:

0 production VLC references.

Search:

VLC
vlc
useVlc
open_stream_in_vlc
check_vlc_installed
get_vlc_info
find_vlc_path

Also verify:

- No VLC button
- No VLC setting
- No VLC Tauri command
- No VLC process
- No VLC preference
- No VLC documentation
- No VLC tests

---

# 49. ANIME COMPLETION TEST

Anime is complete only when:

Search
PASS

Metadata
PASS

Details
PASS

Episodes
PASS

Source resolution
PASS

Media URL
PASS

Player initialization
PASS

Actual playback
PASS

Episode switching
PASS

Failure handling
PASS

---

# 50. PLAYBACK COMPLETION TEST

Playback is complete only when:

Source resolves
PASS

Player initializes
PASS

Media loads
PASS

Playback begins
PASS

currentTime advances
PASS

Errors are handled
PASS

Provider failover works
PASS

No indefinite black screen
PASS

---

# 51. UI COMPLETION TEST

UI is complete only when:

- Design system is consistent
- Glass components are consistent
- Navigation works
- Cards work
- Responsive behavior works
- Accessibility works
- Animations work
- Reduced motion works
- Performance remains acceptable

Use StitchMCP and runtime browser inspection.

---

# 52. AI COMPLETION TEST

AI is complete only when:

- Conversation works
- Recommendations work
- Metadata grounding works
- Ronin personality works
- Descriptions work
- Anime recommendations work
- AI failure does not crash the application
- Secrets are protected

---

# 53. RELEASE DEFINITION OF DONE

RoninPLEX v2.0.0 may be declared complete only when:

- Movies navigation works
- TV navigation works
- Anime navigation works
- Discover navigation works
- Decision Helper works
- Movie playback works
- TV playback works
- Anime playback works
- Provider failover works
- Fullscreen works
- Continue Watching works
- 18+ controls work
- 18+ labels work
- Glass UI is implemented
- Animations work
- Reduced-motion support works
- Ronin exists
- Ronin animations work
- Ronin AI works
- Decision Helper works
- Ronin descriptions work
- VLC is completely removed
- Security review passes
- Performance review passes
- Tests pass
- Production build passes
- Rust tests pass
- Installer builds
- Installed application launches
- Installed application passes runtime verification
- No critical/high-severity unresolved defects remain

---

# 54. FINAL RELEASE REPORT

At completion provide:

1. Executive summary
2. Features implemented
3. Bugs fixed
4. VLC removal verification
5. Anime SDK verification
6. Anime source pipeline result
7. Playback verification
8. Provider failover verification
9. Fullscreen verification
10. 18+ verification
11. UI redesign summary
12. Animation summary
13. Ronin character summary
14. Ronin AI summary
15. Decision Helper summary
16. Security review
17. Performance review
18. Automated tests
19. Runtime tests
20. Production build result
21. Installer result
22. Installed application verification
23. Known limitations
24. Git status
25. Commit/checkpoint information

---

# 55. FINAL RALPH STOP CONDITION

Ralph MUST continue iterating until:

PRD REQUIREMENTS = 100% PASS

AND

AUTOMATED TESTS = PASS

AND

RUNTIME TESTS = PASS

AND

PRODUCTION BUILD = PASS

AND

INSTALLER = PASS

AND

INSTALLED APPLICATION = VERIFIED

AND

NO VLC INTEGRATION REMAINS

AND

NO CRITICAL/HIGH-SEVERITY DEFECTS REMAIN.

Only then may Ralph declare:

RONINPLEX v2.0.0 COMPLETE