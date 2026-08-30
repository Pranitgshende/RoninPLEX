# RoninPLEX v2.0.0 — RALPH Autonomous Implementation Loop

## PURPOSE

This file defines the autonomous implementation and verification loop for RoninPLEX v2.0.0.

The agent MUST use this loop together with:

- `PRD-v2.0.0.md`
- Repository source code
- Existing tests
- Runtime/browser verification
- Chrome DevTools
- Playwright
- Serena
- Context7
- Memory Bank
- StitchMCP
- Sequential Thinking
- Agentic Awesome Skills
- The locally cloned `anime-sdk` repository

The goal is not merely to make architectural changes or make tests pass.

The final application MUST visibly and functionally behave according to the PRD.

A passing static test is NOT considered proof that a feature works.

---

# 1. CORE RALPH LOOP

For every implementation slice, follow:

RESEARCH
→ PLAN
→ IMPLEMENT
→ TEST
→ RUN
→ INSPECT
→ FIX
→ VERIFY
→ CLEANUP
→ NEXT SLICE

Do not skip the runtime verification phase.

Do not declare a slice complete because TypeScript, Rust, or unit tests pass.

A slice is complete only when:

1. Source implementation exists.
2. Automated tests pass.
3. Application builds.
4. Application actually runs.
5. Feature is manually/runtime verified.
6. UI behavior is visually inspected where applicable.
7. No regression was introduced.
8. Temporary processes/tasks created for the slice have been cleaned up.
9. Evidence of verification is recorded.

---

# 2. AUTONOMOUS EXECUTION RULE

The agent should work autonomously through the PRD without repeatedly asking for permission for routine implementation decisions.

The agent MAY make normal engineering decisions regarding:

- Component structure
- Service structure
- File organization
- CSS implementation
- Animation implementation
- API adapters
- Caching
- Error handling
- Testing
- Refactoring
- Runtime debugging

The agent MUST NOT silently change core product requirements.

If a requirement conflicts with the existing architecture, investigate the repository first and choose the smallest robust implementation that satisfies the PRD.

---

# 3. IMPORTANT — ONE ACTIVE IMPLEMENTATION TASK AT A TIME

Do NOT run multiple independent implementation agents/tasks concurrently.

The previous implementation created multiple simultaneous processes/tasks.

For this iteration:

## Maximum concurrency

**ONE active implementation task at a time.**

The agent must:

1. Start one slice/task.
2. Finish implementation.
3. Run verification.
4. Clean up temporary processes.
5. Confirm the task is complete.
6. Only then start the next task.

Do not start six parallel tasks for six different features.

Do not create background implementation agents that remain alive after their work is finished.

---

# 4. PROCESS AND TASK CLEANUP

Every task MUST clean up after itself.

After completing a task:

- Stop temporary dev servers if no longer needed.
- Stop temporary Node processes.
- Stop Playwright sessions that are no longer required.
- Stop Chrome/Chromium instances launched specifically for the task.
- Stop temporary watchers.
- Stop test processes that remain alive.
- Stop duplicate Vite/Tauri processes.
- Stop abandoned shell commands.
- Stop failed/hung child processes.
- Close temporary debugging sessions where possible.

Do NOT kill processes belonging to unrelated user applications.

Before starting a new major slice, inspect whether previous RoninPLEX-related processes are still running.

If a previous task has completed but its process is still alive and no longer required, terminate it.

## Process safety

Never blindly terminate every `node.exe`, `chrome.exe`, or similar process.

Identify processes associated with:

- RoninPLEX
- Vite
- Tauri
- Playwright
- Chrome DevTools sessions created by this workflow
- test/watch processes created by the agent

Only terminate those that are safe to clean up.

---

# 5. NO FALSE COMPLETION

The agent MUST NOT report:

"Implemented and verified"

based only on:

- File existence
- Unit tests
- Static string checks
- TypeScript compilation
- A screenshot that does not demonstrate the required behavior
- A mock/fallback implementation
- A fabricated API response
- A hardcoded anime episode count
- A fake stream URL
- A simulated AI response

Runtime behavior must be tested against the actual application.

If something does not work, continue the RALPH loop.

---

# 6. PRIORITY ORDER

When deciding what to fix first, use this order:

1. Anime playback
2. Anime SDK integration
3. Anime data isolation
4. Anime episode/source correctness
5. Unified Discover
6. Discover filtering
7. Glass UI
8. Anime card consistency
9. Ronin AI navigation/branding
10. Ronin AI intelligence and conversation behavior
11. 18+ labeling
12. Animation polish
13. Performance
14. Final regression testing
15. Packaging

Do not spend time polishing minor animations while anime playback is broken.

---

# 7. ANIME SDK — MANDATORY

The locally cloned `anime-sdk` repository MUST be inspected and genuinely integrated.

Repository:

`https://github.com/hexxt-git/anime-sdk`

If the repository is already cloned locally, use the local copy as the implementation reference.

Do NOT create a fake adapter merely to satisfy tests.

Do NOT create an `AnimeSdkAdapter.ts` that exists but is never used.

The real application anime stream pipeline must flow through the anime SDK where appropriate.

Expected conceptual flow:

Anime UI
→ AnimeService
→ AnimeRepository / Anime SDK adapter
→ anime-sdk providers
→ stream/source resolution
→ AnimeVideoPlayer
→ playback

The implementation may adapt the exact structure based on the actual SDK API.

The agent MUST inspect:

- SDK exports
- Provider architecture
- Search methods
- Anime information methods
- Episode methods
- Stream/source methods
- Subtitle handling
- Provider fallback
- Error behavior
- Browser compatibility
- Node-only APIs
- CORS/network assumptions

Use Context7 when useful for library/API documentation.

Use Serena to understand existing project architecture before integrating.

---

# 8. ANIME MUST REMAIN A COMPLETELY SEPARATE DOMAIN

Anime must NOT depend on TMDB for anime metadata.

Do NOT use TMDB as the anime catalog source.

Anime must have its own backend/domain environment.

Preferred conceptual architecture:

ANIME WORLD

Anime UI
↓
AnimeService
↓
AnimeRepository
↓
AniList / MAL / AniDB metadata
↓
anime-sdk / anime providers
↓
AnimeVideoPlayer

MOVIE / TV WORLD

Movie/TV UI
↓
TMDB services
↓
Movie/TV playback providers
↓
Movie/TV player

The anime domain must not leak TMDB IDs into anime domain models.

Anime metadata should preferably come from:

- AniList
- MyAnimeList
- AniDB
- Other legitimate anime metadata sources

The agent should select the strongest source combination after inspecting the repository and APIs.

---

# 9. ANIME METADATA REQUIREMENTS

Anime must have its own rich metadata system.

Anime pages should support:

- Trending anime
- Popular anime
- Top rated anime
- Currently airing
- New releases
- Seasonal anime
- Upcoming anime
- Genres
- Search
- Studios
- Score
- Status
- Format
- Synopsis
- English title
- Romaji title
- Native/Japanese title where available
- Cover/poster
- Banner
- Adult classification
- Airing information

Do not use TMDB animation results as a substitute.

---

# 10. ANIME AIRING / LATEST EPISODE SECTION

The Anime page must include a dedicated latest-airing area.

For each relevant anime, display:

- Anime title
- Latest released episode
- Episode number
- Release date
- Release time where available
- Current airing status
- Next episode number
- Next episode release date/time
- Countdown until next episode where available

Example:

ONE PIECE

Latest:
Episode 1175
Released:
August 23, 2026

Next:
Episode 1176
In:
5d 14h

Countdowns must be calculated from actual airing metadata.

Do not hardcode countdown values.

If an anime has no upcoming episode, display an appropriate status instead of a fake countdown.

---

# 11. ANIME EPISODE COUNT

Do NOT impose an arbitrary 100/500 episode limit.

Long-running anime must support their complete episode catalogue where the source provides it.

Examples include:

- One Piece
- Naruto
- Detective Conan
- Bleach
- Other long-running series

Use pagination/chunking/virtualization as necessary.

The UI may display:

- 1–100
- 101–200
- 201–300
- etc.

But the complete available episode range must remain accessible.

Do not fabricate episode counts.

Episode numbers must come from the anime source/provider.

---

# 12. ANIME PLAYBACK — CRITICAL GATE

Anime playback is considered the highest-priority functional requirement.

Selecting an anime episode MUST actually attempt playback.

Expected flow:

AnimeDetails
→ episode selection
→ anime playback route
→ AnimeVideoPlayer
→ anime-sdk/provider source resolution
→ HLS/MP4/embed source
→ playback

The player must NOT simply open and remain blank.

Test:

1. Open Anime.
2. Open a known anime.
3. Select an episode.
4. Wait for source resolution.
5. Verify a source was returned.
6. Verify player initialization.
7. Verify media load.
8. Verify playback begins.
9. Verify `currentTime` advances.
10. Verify audio/video output where possible.
11. Verify subtitles if available.
12. Verify provider fallback when the first source fails.

If the first provider fails:

Provider A
→ failure
→ Provider B
→ failure
→ Provider C
→ success

Do not endlessly retry one provider.

---

# 13. DEDICATED ANIME PLAYER

Anime must NOT use the exact same player implementation as movies/TV.

Create and maintain:

`AnimeVideoPlayer.tsx`

It may share low-level utilities with the main player, but anime playback logic must remain independently controllable.

Anime player should support where available:

- HLS
- MP4
- subtitles
- WebVTT
- multiple subtitle tracks
- sub/dub selection
- episode navigation
- next episode
- previous episode
- intro skip
- outro skip
- autoplay
- provider fallback
- loading state
- source error state
- retry
- quality selection where supported

Do not break movie/TV playback while fixing anime playback.

---

# 14. UNIFIED DISCOVER

Discover must be a truly unified media discovery system.

It should contain:

- Movies
- TV Shows
- Anime

Anime must be a first-class media type.

Each result must retain its own media type.

Use a discriminated union or equivalent architecture.

Example conceptual structure:

movie
tv
anime

Never infer media type from numeric IDs.

Never assume an anime ID is a TMDB ID.

---

# 15. DISCOVER FILTER STABILITY

Filters MUST NOT scramble, duplicate, disappear, or cross-contaminate results.

Test combinations such as:

- All
- Movies
- TV
- Anime
- Trending
- Popular
- Top Rated
- Genres
- Adult
- Search
- Multiple filters together

Changing filters should produce deterministic results.

Do not mutate the original result arrays.

Use pure filtering/sorting transformations.

Filtering must preserve:

- media type
- IDs
- titles
- posters
- adult status
- metadata
- navigation routes

---

# 16. DEDUPLICATION

Discover must deduplicate using a type-aware key.

Conceptually:

`${mediaType}:${id}`

This prevents:

Movie 123

and

TV 123

from incorrectly being treated as the same item.

Anime IDs must remain isolated from TMDB IDs.

No duplicate visual cards should appear unless the source intentionally provides distinct versions.

---

# 17. MOVIE / TV / ANIME CARD SYSTEM

All content cards should use the same visual design language.

However, metadata should remain media-specific.

Cards must support:

- Poster
- Title
- Year
- Rating
- Media type
- Adult indicator
- Hover state
- Glass surface
- Shine/reflection
- Subtle motion

Anime cards MUST use the same glass card system as the Home movie/TV cards.

Do not create a visually separate outdated anime card design.

---

# 18. REAL GLASS UI — CRITICAL VISUAL REQUIREMENT

The glass effect must be visually obvious.

Do NOT implement a grey solid card and call it glass.

Cards should visibly have:

- Transparent/translucent background
- Purple-tinted glass
- Backdrop blur
- Background visibility through the card
- Subtle luminous border
- Soft internal highlight
- Gradient sheen
- Depth
- Subtle shadow
- Hover illumination

The card should feel like:

dark transparent glass
+
purple/violet tint
+
soft light reflection
+
backdrop blur

Not:

solid grey rectangle.

---

# 19. RECOMMENDED COLOR SYSTEM

Use a cinematic dark-purple palette.

Primary:

Deep Void:
`#080611`

Surface:
`rgba(22, 15, 40, 0.55)`

Glass Purple:
`rgba(108, 70, 180, 0.16)`

Bright Purple:
`#9B6DFF`

Violet:
`#7C4DFF`

Lavender:
`#C7B5FF`

Text:
`#F5F2FF`

Muted Text:
`#A9A1BD`

Accent Crimson:

`#E84A72`

Success:

`#6EE7B7`

Avoid excessive neon.

The application should feel cinematic, premium, dark, elegant, and atmospheric.

---

# 20. GLASS CARD IMPLEMENTATION

The implementation should use layered surfaces.

Conceptually:

background
→ translucent gradient
→ backdrop blur
→ subtle border
→ inner highlight
→ content
→ hover sheen

Use CSS pseudo-elements or equivalent techniques for the sheen.

Do not rely only on:

`background: rgba(...)`

A real glass treatment requires:

- transparency
- blur
- lighting
- border
- depth

---

# 21. STITCHMCP

Use StitchMCP for UI/design work.

Do not merely mention StitchMCP.

Actually use the available Stitch tools when performing UI redesign work.

Use it to establish:

- glass design language
- card system
- navigation
- page layouts
- anime layouts
- Ronin AI interface
- decision/chat interface
- animations
- responsive states

Existing design tokens may be retained only if they visibly satisfy the PRD.

If screenshots show grey/opaque cards, the design is NOT considered complete.

---

# 22. RONIN AI BRANDING

Ronin AI must be called:

**Ronin AI**

Do NOT use:

- Decision Maker
- Decision Helper as the visible product identity
- Decision Assistant

The route may remain `/decision` internally if required for compatibility, but the visible product identity must be Ronin AI.

Remove obsolete "Decision Maker" branding from:

- Navbar
- Buttons
- Headers
- Page titles
- Tooltips
- Empty states
- Metadata
- Settings
- Components

---

# 23. RONIN AI NAVIGATION

The Ronin AI experience must be accessible directly from the RoninPLEX application branding.

Required behavior:

- Clicking the RoninPLEX icon/logo in the top-left opens Ronin AI.
- Do NOT place a separate Ronin AI button in the top-right navigation.
- The top-right Ronin AI button must be removed.
- The RoninPLEX branding interaction must be deliberate and visually clear.

Important:

The RoninPLEX icon itself should be the navigation target.

Do not make unrelated parts of the navbar navigate to Ronin AI.

---

# 24. RONIN AI CONVERSATION

Ronin AI must feel like a conversational companion, not a static recommendation generator.

Example:

User:
"Give me Marvel movies."

Ronin should:

1. Understand Marvel as an intent.
2. Retrieve real candidate titles.
3. Consider available metadata.
4. Ask useful follow-up questions when appropriate.
5. Provide several distinct candidates.
6. Explain why each fits.
7. Avoid repeatedly returning the same titles.
8. Remember the conversation context.
9. Continue the conversation naturally.

The system should support intents such as:

- Marvel
- DC
- Anime
- Horror
- Comedy
- Action
- Thriller
- Sci-fi
- Romance
- Family
- Classic cinema
- Recently released
- Highly rated
- Underrated
- Actor-based requests
- Director-based requests
- Franchise requests
- Mood
- Runtime
- Language
- Genre combinations

---

# 25. RONIN AI DATA STRATEGY

Do NOT "train" a model by scraping random web content into the application.

Instead use a retrieval architecture.

Conceptually:

User query
→ intent detection
→ metadata search
→ candidate retrieval
→ ranking
→ conversational response

Potential information sources can include:

- TMDB metadata
- AniList
- MAL
- AniDB
- legitimate APIs
- approved web sources
- community signals where legally and technically appropriate

For community sentiment, Reddit or similar forums may be used as a supplementary retrieval source if access and terms permit.

Do not treat forum content as authoritative metadata.

Do not inject unverified forum claims as facts.

---

# 26. REAL-TIME / FRESH INFORMATION

When Ronin answers questions requiring current information, it should prefer fresh retrieval rather than stale hardcoded knowledge.

Examples:

- New releases
- Current streaming availability
- Current anime airing
- Recent movies
- Recent ratings
- Trending topics
- Recently announced titles

If the application is offline, gracefully fall back to cached/local information.

Ronin should clearly distinguish:

- known metadata
- retrieved current information
- recommendation/opinion

---

# 27. RONIN AI RESPONSE TIMING

Ronin must NOT answer instantly.

The interaction should feel intentional.

Required sequence:

User message
↓
Ronin reaction
↓
Thinking animation
↓
Short processing delay
↓
Typing animation
↓
Ronin talking animation
↓
Response
↓
Recommendation cards

The delay must not feel artificially slow.

Use dynamic timing based on response length.

Never block the UI.

---

# 28. RONIN CHARACTER

Ronin should have an animated samurai/ronin identity.

Supported states may include:

- idle
- breathing
- thinking
- talking
- curious
- happy
- recommending
- surprised
- sword-practice
- celebrating

Ronin can occasionally practice sword movements around the application.

Animations should remain subtle enough not to interfere with usability.

Use appropriate animation/UI skills and StitchMCP.

---

# 29. RONIN DESCRIPTION STYLE

Ronin should describe movies in his own personality.

Do not simply copy database synopses.

Example style:

Database:
"A detective investigates a series of mysterious murders."

Ronin-style:
"Traveler, this is a dark road. A detective follows a trail of blood through a city where every answer seems to hide another blade."

The description must remain grounded in actual metadata.

Do not invent actors, events, plot points, or release information.

---

# 30. 18+ CONTENT

The 18+ system must remain globally consistent.

When adult recommendations are disabled:

- Adult movie content hidden from recommendation shelves.
- Adult TV content hidden.
- Adult anime content hidden.
- Adult search results filtered where appropriate.
- No accidental adult cards.

When enabled:

- Adult content may appear.
- Dedicated mature shelf can appear.
- Every adult item MUST visibly display:

**+18**

Do not use only color to communicate adult status.

Use:

- text
- icon
- accessible label

The +18 indicator must be visible on the card and/or details page.

Anime adult classification must come from anime metadata such as `isAdult` or equivalent authoritative metadata.

---

# 31. SEARCH

Universal search should support:

- Movies
- TV Shows
- Anime

Anime search must use the anime domain.

Movie/TV search must use the movie/TV domain.

Do not merge IDs without media type.

Search result cards must retain correct navigation.

---

# 32. PERFORMANCE

Use caching appropriately.

Avoid:

- duplicate API calls
- unnecessary rerenders
- repeated stream resolution
- repeated anime metadata queries
- multiple identical network requests

Anime cache should support reasonable TTL.

Do not cache failed stream URLs indefinitely.

---

# 33. ERROR HANDLING

Every network/service layer must fail gracefully.

Anime failure should display:

- provider failure
- retry
- next provider
- useful error state

Do not display:

"Something went wrong"

without useful context.

Do not crash the entire application because one provider/API fails.

---

# 34. TESTING REQUIREMENTS

At minimum verify:

## Architecture

- Anime domain exists.
- Anime service has no TMDB imports.
- anime-sdk is genuinely used.
- Dedicated AnimeVideoPlayer exists.
- Movie/TV systems remain functional.

## Anime

- Search
- Trending
- Popular
- Seasonal
- Airing
- New releases
- Details
- Episodes
- 1000+ episodes
- Episode selection
- Stream resolution
- Playback
- Subtitle handling
- Provider fallback

## Discover

- All
- Movies
- TV
- Anime
- Adult
- Search
- Multiple filters
- Deduplication
- Correct navigation

## UI

- Glass cards
- Purple transparency
- Backdrop blur
- Hover sheen
- Anime cards match Home cards
- Responsive layout

## Ronin

- Branding
- Navigation
- Thinking animation
- Typing animation
- Talking state
- Multi-turn conversation
- Real recommendations
- Distinct recommendations
- Marvel queries
- Anime queries

## 18+

- OFF
- ON
- +18 badge
- Anime +18
- Movie +18
- TV +18

---

# 35. RUNTIME VERIFICATION

Use:

- Chrome DevTools
- Playwright
- Tauri runtime
- Browser console
- Network inspection

Runtime verification MUST test the actual installed/built application where possible.

Do not rely exclusively on source-level tests.

---

# 36. VISUAL VERIFICATION

Screenshots must be inspected.

For UI slices, verify visually:

- transparency
- purple glass
- blur
- borders
- shine
- card hierarchy
- spacing
- typography
- animations
- hover behavior
- anime card consistency
- Ronin AI presentation

If the screenshot still looks like the old UI, the slice is NOT complete.

---

# 37. REGRESSION PROTECTION

Before modifying shared components, identify all consumers.

After changes to:

- Card components
- Navbar
- Player
- Discover
- StreamingManager
- User preferences
- CSS tokens

run regression checks for the affected areas.

Do not fix anime by breaking movies.

Do not fix Discover by breaking search.

Do not redesign cards by breaking adult labels.

---

# 38. ITERATION RULE

If a verification step fails:

DO NOT move to the next slice.

Instead:

1. Identify root cause.
2. Fix implementation.
3. Rebuild.
4. Re-run tests.
5. Re-run runtime verification.
6. Inspect visually.
7. Repeat until passing.

This is the core RALPH loop.

---

# 39. COMPLETION CRITERIA

RoninPLEX v2.0.0 is NOT complete until all of the following are true:

[ ] Anime SDK genuinely integrated
[ ] Anime domain completely isolated from TMDB
[ ] Anime metadata comes from dedicated anime sources
[ ] Anime trending works
[ ] Anime popular works
[ ] Anime new releases works
[ ] Anime seasonal works
[ ] Anime airing works
[ ] Latest episode section works
[ ] Next episode countdown works
[ ] 1000+ episode anime work
[ ] Anime episode selection works
[ ] Anime stream resolution works
[ ] Anime playback works
[ ] Anime subtitles work where available
[ ] Anime provider fallback works
[ ] Dedicated AnimeVideoPlayer works
[ ] Unified Discover works
[ ] Discover Anime filter works
[ ] Discover combined filters work
[ ] Discover deduplication works
[ ] Anime cards use Home glass card design
[ ] Movie cards have transparent purple glass
[ ] TV cards use same glass system
[ ] Glass blur is visibly present
[ ] Glass sheen is visibly present
[ ] Purple cinematic palette is applied
[ ] Ronin AI branding is correct
[ ] Top-right Ronin AI button removed
[ ] RoninPLEX logo opens Ronin AI
[ ] Ronin AI conversation is multi-turn
[ ] Ronin AI thinking animation works
[ ] Ronin AI typing animation works
[ ] Ronin AI talking animation works
[ ] Ronin AI gives distinct Marvel recommendations
[ ] Ronin AI can retrieve real metadata
[ ] Ronin AI can use fresh information where supported
[ ] +18 label appears on adult content
[ ] Adult anime has +18 label
[ ] Adult filtering remains correct
[ ] No major regressions
[ ] Automated tests pass
[ ] Production build passes
[ ] Runtime verification passes
[ ] Visual verification passes
[ ] Temporary processes are cleaned up
[ ] No unnecessary concurrent tasks remain running

---

# 40. FINAL RELEASE GATE

Before declaring completion, execute:

1. Full test suite.
2. Frontend production build.
3. Rust check.
4. Rust tests.
5. Tauri production build.
6. Launch production application.
7. Playwright verification.
8. Chrome DevTools verification.
9. Anime playback test.
10. Discover filter matrix test.
11. 18+ test.
12. Ronin AI conversation test.
13. Visual screenshot review.
14. Process cleanup.
15. Final repository status check.

Only after all gates pass may the agent report:

# RONINPLEX v2.0.0 VERIFIED

The final report MUST include:

- What changed
- What was tested
- What passed
- What failed
- What was fixed during the loop
- Anime provider/source verification
- Anime playback verification
- Discover filter verification
- Glass UI verification
- Ronin AI verification
- 18+ verification
- Build result
- Installer result
- Runtime result
- Screenshot evidence
- Confirmation that temporary RoninPLEX-related processes/tasks were cleaned up

Never claim a feature is verified if it was only statically checked.

---

# 41. RALPH LOOP COMMANDMENT

When something fails:

DO NOT STOP.

READ
→ UNDERSTAND
→ FIX
→ TEST
→ RUN
→ INSPECT
→ FIX AGAIN
→ VERIFY
→ CLEAN UP
→ CONTINUE

The objective is a working RoninPLEX application, not a passing checklist.