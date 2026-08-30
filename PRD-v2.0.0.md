# RoninPLEX v2.0.0 — Product Requirements Document

## 1. Product Vision

RoninPLEX v2.0.0 is a major redesign of the application into a unified, cinematic entertainment platform for Movies, TV Shows, and Anime.

The application should feel like a premium modern streaming/discovery experience rather than a conventional media browser.

The core experience must include:

- Dedicated Movies experience
- Dedicated TV Shows experience
- Completely isolated Anime experience
- Unified Discover experience containing Movies, TV Shows, and Anime
- Reliable playback with separate movie/TV and anime player architectures
- `anime-sdk` integration for anime stream discovery/playback
- AniList-based anime metadata
- Full anime episode support, including long-running series with 1000+ episodes
- Latest anime episode and upcoming episode information
- Global 18+ content classification and filtering
- Modern purple-tinted transparent glassmorphism UI
- Consistent card design across Home, Movies, TV, Anime, and Discover
- Animated Ronin AI companion
- Ronin AI accessible directly through the RoninPLEX branding/icon
- Long-form conversational AI recommendations
- Context-aware recommendations grounded in real metadata
- Reliable filtering and deduplication
- Smooth animations and transitions
- Strong accessibility and reduced-motion support
- Production-ready testing and packaging

Version remains `2.0.0`.

---

# 2. Critical Architectural Rules

## 2.1 Anime Must Be Completely Isolated

Anime is a separate content domain.

Anime must NOT depend on TMDB for:

- Anime metadata
- Anime episode information
- Anime episode counts
- Anime genres
- Anime airing schedules
- Anime search
- Anime recommendations
- Anime IDs
- Anime stream resolution

TMDB may continue to power Movies and TV Shows.

Anime must have its own backend/domain environment and service architecture.

Recommended structure:

    src/services/anime/
        AnimeTypes.ts
        AnimeRepository.ts
        AnimeService.ts
        AnimeMapper.ts
        AnimeCache.ts
        AnimeSdkAdapter.ts
        AnimeStreamService.ts

Anime code must not import TMDB services or TMDB-specific domain models.

Anime data should use AniList as the primary metadata source.

The architecture should remain flexible enough to support additional metadata sources such as:

- AniList
- MyAnimeList
- AniDB

However, the first-class implementation must use AniList and `anime-sdk`.

---

# 3. Anime SDK Integration

The project must genuinely integrate:

`https://github.com/hexxt-git/anime-sdk`

Do not create a fake adapter that merely contains the package name.

The actual SDK functionality must be inspected and used.

Before implementation:

1. Inspect the repository.
2. Understand its API.
3. Identify supported providers.
4. Identify browser compatibility requirements.
5. Identify stream/episode resolution capabilities.
6. Determine whether it requires Node-only APIs.
7. Create appropriate browser/Tauri compatibility layers where necessary.
8. Verify the SDK actually resolves usable streams.

Use an adapter so the rest of RoninPLEX does not directly depend on SDK implementation details.

Example architecture:

    AnimeSdkAdapter
          ↓
    AnimeStreamService
          ↓
    AnimeService
          ↓
    Anime UI / Anime Player

The application must test actual stream resolution instead of assuming that a provider exists.

A source is only considered usable when:

1. Anime is resolved.
2. Episode is resolved.
3. Stream source is returned.
4. Source format is recognized.
5. Player can initialize it.
6. Media actually loads.
7. Playback time advances.

Failed providers must automatically fall through to the next available provider.

---

# 4. Anime Metadata Architecture

AniList should be the primary anime metadata source.

The anime repository should support:

- Trending anime
- Popular anime
- Top-rated anime
- Currently airing anime
- Seasonal anime
- New releases
- Search
- Genres
- Studios
- Characters where useful
- Rankings
- Scores
- Format
- Status
- Start date
- End date
- Episode count
- Episode duration
- Airing schedule
- Adult classification

Anime metadata should be normalized into RoninPLEX's own anime domain models.

Example:

    AnimeItem
    AnimeEpisode
    AnimeAiring
    AnimeStreamSource

Do not leak AniList-specific response structures throughout the application.

---

# 5. Anime Episode System

The application must correctly support long-running anime.

The episode system must NOT arbitrarily cap episodes at 100, 500, or another artificial limit.

For example, One Piece must be able to represent its complete available episode count.

The UI should support:

- Episode search
- Jump to episode
- Episode pagination/chunking
- 1–100
- 101–200
- 201–300
- etc.
- Final chunk containing remaining episodes

The system must distinguish between:

- Official metadata episode count
- Currently available playable episodes
- Episodes not yet released
- Missing/unavailable streams

Do not claim an episode is playable merely because metadata says it exists.

---

# 6. Anime Latest Episode & Airing System

The Anime page must contain a dedicated airing/release section.

It should display:

- Recently released episodes
- Anime title
- Episode number
- Release date
- Release time when available
- Current airing status
- Next episode number
- Next episode release date
- Countdown until next episode

Example:

    Latest Releases

    One Piece
    Episode 1175
    Released: Aug 29, 2026

    Next Episode
    Episode 1176
    In: 6d 14h

Countdowns should update without requiring a full page refresh.

---

# 7. Anime Page

The Anime section must be a first-class section in the top navigation.

It should NOT look like Movies or TV with a TMDB-style implementation.

The Anime page should contain:

1. Anime Spotlight
2. Trending Anime
3. New Releases
4. Currently Airing
5. Seasonal Anime
6. Popular Anime
7. Top Rated Anime
8. Latest Episodes
9. Upcoming Episodes
10. Genre exploration
11. 18+ Anime when enabled

The Anime card system should use the same visual card language as the Home page.

Do not create a separate inferior or outdated anime card style.

---

# 8. Anime Details

Anime detail pages must include:

- Cover/poster
- Banner where available
- English title
- Romaji title
- Japanese title where available
- Synopsis
- Score
- Format
- Status
- Release dates
- Studios
- Genres
- Episode count
- Current available episodes
- Airing information
- Adult classification
- Episode selector
- Search/jump-to-episode control

Episode lists must work for 1000+ episode anime.

---

# 9. Dedicated Anime Player

Anime must use a dedicated player architecture.

Do NOT force anime playback through the exact same player implementation used for Movies and TV.

Create:

    AnimeVideoPlayer.tsx

The anime player should support:

- HLS
- MP4
- WebVTT subtitles
- Multiple subtitle tracks
- Sub/Dub selection where the source provides it
- Episode switching
- Next episode
- Previous episode
- Intro skip
- Outro skip where metadata permits
- Auto-play next episode
- Playback progress
- Continue watching
- Fullscreen
- Playback speed
- Volume
- Seeking
- Provider failover

The generic Movie/TV player and Anime player may share lower-level utilities, but their domain logic must remain separate.

---

# 10. Movie and TV Player

Movies and TV Shows should retain their own unified movie/TV playback architecture.

The system must support:

- HLS
- MP4
- Embedded sources where supported
- Provider failover
- Playback watchdog
- Continue watching
- Next episode
- Previous episode
- Fullscreen
- Seeking
- Resume position

The player must verify actual playback rather than only successful URL resolution.

---

# 11. Stream Failover

All playback providers must use a controlled failover system.

Provider flow:

    Provider A
        ↓
    Resolve
        ↓
    Initialize
        ↓
    Media Load
        ↓
    Playback Starts
        ↓
    currentTime Advances

If any critical stage fails:

    Provider B
        ↓
    Provider C
        ↓
    Provider D

Prevent:

- Infinite retries
- Repeated failed providers
- UI freezing
- Silent black screens

The player should clearly tell the user when a provider fails and automatically attempt the next eligible provider.

---

# 12. Unified Discover

Discover must be a true unified media discovery page.

It must display:

- Movies
- TV Shows
- Anime

All three content types should coexist in the same Discover experience.

Every result must carry a clear media type.

Examples:

    MOVIE
    TV
    ANIME

Anime results must come from the anime domain.

Movie and TV results must come from the movie/TV domain.

Discover must not convert Anime into TMDB media objects.

---

# 13. Discover Deduplication

Discover must never show duplicate cards caused by:

- Duplicate API results
- Multiple pages
- ID collisions
- Cross-media ID collisions
- Provider merging
- Filter changes

Use a discriminated media model.

Recommended key:

    `${mediaType}:${id}`

Examples:

    movie:123
    tv:123
    anime:123

These are separate entities.

---

# 14. Discover Filters

Discover filters must never break or corrupt the result set.

Filters should support:

- All
- Movies
- TV Shows
- Anime
- Genre
- Year
- Rating
- Language where applicable
- Adult content

When filters change:

1. Existing results should be cleared or safely replaced.
2. The correct query should execute.
3. Results should be normalized.
4. Results should be deduplicated.
5. Results should be filtered.
6. Loading state should be displayed.
7. The final result set should contain only valid results for that filter.

No stale results from the previous filter should remain.

Changing:

    All → Anime → Movies → TV → All

must work repeatedly.

---

# 15. Universal Search

Universal search must search:

- Movies
- TV Shows
- Anime

Results must clearly identify their media type.

Anime searches must use AniList/anime services.

Movie/TV searches may use TMDB.

Search must not merge incompatible models.

---

# 16. 18+ Content System

18+ content must be classified consistently across:

- Movies
- TV Shows
- Anime
- Discover
- Search
- Recommendations
- Home
- Anime pages
- Detail pages
- Cards

The system must use an explicit textual `+18` label.

Do not rely only on red color.

The badge should include:

    +18

with an appropriate icon and accessible label.

Example:

    aria-label="18+ Adult Content"

---

# 17. 18+ Filtering

Settings should contain a preference controlling adult recommendations.

When disabled:

- Adult content must not appear in normal recommendations.
- Adult content must not appear in normal Discover results.
- Adult anime must not appear in normal anime shelves.
- Adult search results should be filtered according to the application's adult-content policy.

When enabled:

- A dedicated `+18` section should become visible.
- Adult content should be clearly marked.
- Adult anime should appear in its own mature anime shelf.
- Adult movies and TV should be clearly marked.

The dedicated mature section must contain enough valid results when data sources provide them.

Do not manufacture adult entries simply to fill the shelf.

---

# 18. 18+ UI Label

The mature section should be explicitly named:

    +18 Mature Recommendations

or an equivalent clear label.

Cards must display:

    +18

The same requirement applies to:

- Movies
- TV Shows
- Anime

---

# 19. Home Page

Home should be rebuilt as a premium cinematic dashboard.

Recommended order:

1. Hero
2. Continue Watching
3. Trending
4. Popular Movies
5. Popular TV
6. Anime Spotlight
7. Anime Latest Episodes
8. Recommended For You
9. Ronin Picks
10. +18 Mature Recommendations when enabled

The anime cards used here should be the same card system used in the Anime section.

---

# 20. Glassmorphism Design System

The current grey solid card appearance must be removed.

Movie, TV, Anime, Discover, and Home cards must use a true transparent glass finish.

Cards should visually resemble:

- Transparent dark glass
- Purple/indigo tint
- Subtle luminous border
- Backdrop blur
- Soft internal highlight
- Slight reflection/sheEN
- Layered transparency
- Cinematic depth

Avoid:

- Flat grey backgrounds
- Opaque solid cards
- Excessive neon
- Cheap gradients
- Excessive glow

The glass effect must remain visible against posters/background imagery.

---

# 21. Application Colour Scheme

Use a cohesive cinematic purple palette.

Primary visual direction:

- Deep near-black background
- Midnight purple
- Indigo
- Violet
- Soft lavender highlights
- Subtle crimson for mature/18+ states
- White/soft-gray typography

Suggested design tokens:

    Background:
    #08060F

    Surface:
    rgba(25, 18, 45, 0.55)

    Glass:
    rgba(70, 45, 110, 0.28)

    Border:
    rgba(170, 130, 255, 0.22)

    Primary:
    Violet / Indigo

    Accent:
    Lavender

    Mature:
    Crimson

Do not apply these values blindly if StitchMCP provides a better coherent design system.

Use StitchMCP to design/refine the actual visual system.

---

# 22. Card System

Create one shared cinematic card foundation.

The same visual language should be used for:

- Home
- Movies
- TV
- Anime
- Discover
- Search
- Recommendations

Cards should support:

- Poster
- Title
- Year
- Rating
- Media type
- +18 badge
- Hover state
- Glass surface
- Subtle lift
- Shine/reflection
- Smooth transition

Anime cards should NOT use a separate outdated visual style.

---

# 23. Glass Navigation

The top navigation should use the same glass design language.

It should include:

- RoninPLEX branding/icon
- Home
- Movies
- TV Shows
- Anime
- Discover
- Other required navigation

Do NOT keep a separate `Ronin AI` navigation button in the top-right.

---

# 24. RoninPLEX Branding Navigation

The top-left RoninPLEX branding has two distinct interaction areas.

The RoninPLEX icon itself:

    click → Home

The RoninPLEX wordmark/branding area:

    click → Ronin AI

These interactions must be intentionally separated so users can understand them.

Remove the previous dedicated `Ronin AI` button from the top-right.

---

# 25. Ronin AI

Ronin AI is the application's entertainment companion.

It should no longer be called:

    Decision Maker
    Decision Helper

The user-facing branding must be:

    Ronin AI

The old "Decision Maker" terminology should be removed from:

- UI
- headings
- buttons
- menus
- page titles
- tooltips
- accessibility labels
- documentation where it refers to the user-facing product

The internal route may remain `/decision` temporarily if required for compatibility, but the visible UI must say Ronin AI.

---

# 26. Ronin AI Access

Ronin AI should be accessible from the RoninPLEX branding in the top-left.

The interaction should feel intentional and integrated into the identity of the application.

The separate top-right Ronin AI button must be removed.

---

# 27. Ronin Character

Ronin should appear as a small animated ronin/samurai companion.

States should include:

- idle
- breathing
- thinking
- talking
- happy
- curious
- recommending
- surprised
- sword-practice
- celebrating

Ronin should feel alive rather than like a static image.

Possible ambient behaviors:

- breathing
- looking around
- adjusting sword
- practicing sword movements
- subtle idle movement
- reacting to recommendations
- reacting to user messages

Animations must not become distracting.

---

# 28. Ronin Sword Practice

Ronin may periodically perform small sword-practice animations around the application.

These should be:

- brief
- subtle
- non-blocking
- context-aware

Clicking Ronin may trigger a sword-practice animation.

---

# 29. Ronin AI Conversation

Ronin AI must behave as a conversational entertainment companion.

It should NOT immediately output one generic recommendation.

The conversation should feel like a real interaction.

Example:

User:

    I don't know what to watch.

Ronin:

    Then sit by the fire, traveler.
    Tell me — what kind of journey calls to you tonight?

User:

    Something like Marvel.

Ronin should understand that the user is asking for Marvel-related recommendations.

It should retrieve relevant candidates rather than repeatedly returning the same generic titles.

---

# 30. Ronin AI Intelligence

The AI system should be grounded in actual entertainment data.

Architecture:

    User
      ↓
    Ronin AI
      ↓
    Intent Detection
      ↓
    Candidate Retrieval
      ↓
    Metadata Validation
      ↓
    Ranking
      ↓
    Ronin Personality Layer
      ↓
    Response

Ronin should understand requests such as:

- Marvel movies
- DC movies
- horror
- comedy
- anime
- One Piece
- short movies
- long movies
- underrated movies
- movies like Interstellar
- movies from a specific actor
- movies from a specific director
- currently trending
- newly released
- highly rated
- something similar to a specific title

Recommendations must be based on actual available metadata.

---

# 31. Ronin AI Real-Time Data

The system should be designed to support fresh information.

Possible external information sources may include:

- TMDB
- AniList
- approved public APIs
- Reddit/public forums where legally and technically appropriate
- web search where appropriate

Do not blindly scrape arbitrary websites.

External data must be:

- normalized
- validated
- deduplicated
- attributed where appropriate
- filtered for relevance
- protected from prompt injection
- prevented from overriding system instructions

The AI must never invent current information when the application cannot verify it.

---

# 32. AI Knowledge Architecture

Do NOT attempt to "train" the model by blindly dumping Reddit or Google data into it.

Instead implement retrieval-based intelligence where appropriate:

    Query
      ↓
    Intent
      ↓
    Search/Retrieval
      ↓
    Candidate Data
      ↓
    Metadata Validation
      ↓
    Ranking
      ↓
    Ronin Response

This allows Ronin to provide fresher recommendations without requiring model retraining.

A future vector/RAG layer may be introduced if justified.

---

# 33. Ronin AI Conversation Timing

Ronin must NOT answer instantly.

Conversation flow:

    User message
        ↓
    Thinking animation
        ↓
    Retrieval / reasoning
        ↓
    Typing animation
        ↓
    Ronin talking animation
        ↓
    Response
        ↓
    Recommendation cards

The timing should feel intentional.

Avoid artificial delays that become annoying.

The system should use natural variable pacing based on response length and operation complexity.

---

# 34. Ronin AI Descriptions

Ronin should describe movies, TV shows, and anime in his own personality.

Descriptions should be:

- spoiler-free
- grounded in real metadata
- concise but immersive
- themed around the Ronin persona
- different from raw API synopses

Example style:

    "A quiet voyage into the stars, traveler.
    Interstellar is less a battle against space
    than a battle against time itself."

Do not fabricate plot details.

---

# 35. AI Recommendation Cards

Ronin AI responses may include cards containing:

- Poster
- Title
- Media type
- Rating
- Year
- +18 status
- Ronin description
- Watch button
- Details button

Recommendations must link to real RoninPLEX content.

---

# 36. Animations

Use a unified motion system.

Required animations:

- Page transitions
- Card hover
- Card lift
- Glass sheen
- Modal entrance
- Modal exit
- Button feedback
- Loading states
- Skeleton loading
- Ronin reactions
- AI typing
- AI thinking
- Player transitions
- Episode transitions

Animations should be smooth and cinematic.

---

# 37. Reduced Motion

Respect:

    prefers-reduced-motion: reduce

When enabled:

- Reduce or disable decorative animation.
- Avoid excessive movement.
- Preserve functionality.
- Keep transitions understandable.

---

# 38. StitchMCP

Use StitchMCP for:

- UI redesign
- Glassmorphism system
- Component visual design
- Layout refinement
- Card design
- Navigation
- Anime page design
- Ronin AI UI
- Player UI where applicable
- Responsive behavior
- Animation direction

Do not merely add CSS classes called `glass-card` and consider the UI complete.

The actual rendered interface must visibly have a transparent glass appearance.

---

# 39. Required Development Skills / Tools

When implementing the PRD, actively use the available skills/tools where relevant.

Required:

- StitchMCP
- Chrome DevTools
- Context7
- Memory Bank
- Playwright
- Sequential Thinking
- Serena
- GSD
- Agentic Awesome Skills
- Ralph Loop

Use the actual skills through their supported invocation mechanism.

Do not merely mention the tools.

---

# 40. Serena

Use Serena for repository-aware code navigation and refactoring.

Before modifying major systems:

- inspect existing architecture
- identify reusable components
- understand dependencies
- avoid unnecessary rewrites
- preserve working functionality

---

# 41. Context7

Use Context7 when library/framework/API documentation is needed.

Especially use it for:

- React
- Vite
- Tauri
- HLS.js
- AniList/API clients
- anime-sdk dependencies
- animation libraries
- relevant frontend libraries

Do not rely on outdated assumptions when current documentation is available.

---

# 42. Chrome DevTools

Use Chrome DevTools for runtime investigation.

Verify:

- console errors
- network requests
- API responses
- failed streams
- HLS loading
- player state
- layout problems
- glass rendering
- filter behavior
- navigation
- animation behavior

---

# 43. Playwright

Use Playwright for automated runtime testing.

Test:

- Home
- Movies
- TV
- Anime
- Anime Details
- Discover
- Search
- Ronin AI
- 18+ filtering
- Player behavior
- Filters
- Episode selection
- navigation
- responsive behavior

---

# 44. Memory Bank

Maintain project context using Memory Bank.

Document:

- architectural decisions
- anime isolation
- anime-sdk integration
- player architecture
- design system
- AI architecture
- known limitations
- verification results

Do not allow the implementation to drift from the PRD.

---

# 45. Sequential Thinking

Use structured reasoning for complex changes involving:

- anime architecture
- provider failover
- player separation
- AI retrieval
- unified Discover
- filter normalization
- episode scheduling

Break complex problems into verifiable steps before implementation.

---

# 46. Ralph Loop

Implementation must follow `RALPH-LOOP.md`.

Ralph Loop must be treated as an iterative development and verification process.

For every major slice:

    PLAN
      ↓
    IMPLEMENT
      ↓
    TEST
      ↓
    RUN
      ↓
    INSPECT
      ↓
    FIX
      ↓
    VERIFY
      ↓
    NEXT SLICE

Do not mark a requirement complete merely because the source code exists.

Runtime behavior must be verified.

If verification fails:

1. identify root cause
2. fix it
3. rerun tests
4. rerun runtime verification
5. continue only when the gate passes

---

# 47. Ralph Loop Completion Gates

A slice is complete only when:

- Implementation exists
- Unit/integration tests pass
- Runtime behavior is verified where applicable
- No critical console errors exist
- No regressions are introduced
- Screenshots/runtime evidence are captured where useful

---

# 48. Performance

The redesign must not make the application unnecessarily slow.

Optimize:

- image loading
- API requests
- caching
- React renders
- animations
- HLS lifecycle
- player cleanup
- event listeners
- Discover filtering
- anime episode rendering

Use virtualization or chunked rendering for very large episode lists if required.

---

# 49. Caching

Anime metadata should use caching.

Cache:

- trending
- popular
- seasonal
- airing
- search
- anime details
- episode metadata where appropriate

Use TTL-based caching.

Do not cache failed stream resolutions indefinitely.

---

# 50. Error Handling

Errors must be user-friendly.

Do not expose:

- raw stack traces
- internal API errors
- meaningless provider exceptions

Examples:

    "Ronin could not find a playable source. Trying another path..."

    "This episode is currently unavailable from our providers."

    "The anime metadata service is temporarily unavailable."

---

# 51. Security

Ensure:

- API keys are not exposed unnecessarily
- user input is sanitized
- external content cannot execute arbitrary scripts
- navigation restrictions remain enforced
- remote content is handled safely
- AI external data cannot override application instructions
- prompt injection from retrieved content is treated as untrusted data

---

# 52. Accessibility

Support:

- keyboard navigation
- visible focus
- accessible labels
- sufficient contrast
- semantic headings
- screen-reader labels
- `aria-label` for 18+ badges
- reduced motion
- accessible player controls

---

# 53. Required Verification

Before declaring v2.0.0 complete:

Run:

    npm test

    npm run build

    cargo check --manifest-path src-tauri/Cargo.toml

    cargo test --manifest-path src-tauri/Cargo.toml

Build the Windows NSIS installer.

Then install and launch the production binary.

---

# 54. Runtime Verification Matrix

Verify:

## Home

- Hero works
- Continue Watching works
- Movie cards have glass finish
- TV cards have glass finish
- Anime cards have matching glass finish
- +18 filtering works

## Movies

- Correct movie-only data
- No TV entries
- No duplicate entries
- Cards use glass design
- Playback works

## TV

- Correct TV-only data
- No movie entries
- No duplicate entries
- Season/episode navigation works
- Playback works

## Anime

- No TMDB anime dependency
- AniList metadata works
- anime-sdk is actually used
- Trending works
- Popular works
- New Releases works
- Seasonal works
- Airing works
- Latest episodes works
- Upcoming episodes works
- 18+ anime filtering works
- 1000+ episode anime works
- Anime cards match Home card system
- Anime player actually plays video

## Discover

- Movies appear
- TV appears
- Anime appears
- No duplicate cards
- All filter works
- Movie filter works
- TV filter works
- Anime filter works
- Genre filters work
- Adult filtering works
- Repeated filter changes do not corrupt results

## Ronin AI

- Branding says Ronin AI
- No Decision Maker UI remains
- Top-right Ronin AI button removed
- RoninPLEX icon → Home
- RoninPLEX wordmark → Ronin AI
- Conversation is multi-turn
- Thinking animation works
- Typing animation works
- Ronin animation reacts
- Marvel queries produce relevant results
- Anime queries produce relevant results
- Recommendations are grounded in real metadata
- Responses are not identical every time

## Player

- Movie playback
- TV playback
- Anime playback
- Provider failover
- Fullscreen
- Seeking
- Resume
- Next episode
- Error handling

---

# 55. Regression Protection

Do not break working functionality while implementing new features.

Especially protect:

- Movie playback
- TV playback
- Watchlist
- Continue Watching
- Settings
- Authentication/user preferences
- Existing TMDB functionality
- Existing streaming providers
- Existing navigation

---

# 56. Definition of Done

RoninPLEX v2.0.0 is complete only when all of the following are true:

1. Anime is completely isolated from TMDB.
2. AniList powers anime metadata.
3. `anime-sdk` is genuinely integrated.
4. Anime streams actually play.
5. Anime uses a dedicated player.
6. Movie/TV playback remains functional.
7. One Piece and other long-running anime support 1000+ episodes.
8. Latest and upcoming anime episodes are displayed.
9. Discover contains Movies, TV, and Anime.
10. Discover filters work repeatedly without breaking.
11. Duplicate entries are eliminated.
12. 18+ content has visible `+18` labels.
13. 18+ filtering works globally.
14. Anime uses the same modern glass card language as Home.
15. Movie/TV/Anime cards use transparent purple-tinted glass.
16. The application has a coherent cinematic purple colour scheme.
17. Ronin AI replaces Decision Maker terminology.
18. Ronin AI is accessible through the RoninPLEX branding.
19. Ronin has animated states and sword-practice behavior.
20. Ronin conversations feel multi-turn and intentional.
21. Ronin uses real metadata for recommendations.
22. Ronin can handle specific requests such as Marvel and anime.
23. AI responses have thinking/typing/talking animation.
24. StitchMCP is used for the UI redesign.
25. Chrome DevTools is used for runtime debugging.
26. Playwright verifies critical user flows.
27. Serena is used for repository-aware implementation.
28. Context7 is used for relevant current documentation.
29. Memory Bank is maintained.
30. Sequential Thinking is used for complex implementation decisions.
31. Ralph Loop is followed for iterative verification.
32. Production frontend builds successfully.
33. Rust backend checks and tests successfully.
34. Windows NSIS installer builds successfully.
35. Installed production binary is runtime-tested.
36. No critical console/runtime errors remain.

---

# 57. Implementation Priority

Implement in this order:

### Priority 1 — Anime Playback

Fix anime stream resolution first.

Verify `anime-sdk` actually resolves playable sources.

Do not proceed assuming playback works.

### Priority 2 — Anime Architecture

Complete isolated anime backend/domain architecture.

### Priority 3 — Episode & Airing Data

Fix 1000+ episode support and latest/upcoming episode data.

### Priority 4 — Dedicated Anime Player

Ensure anime playback is separate and reliable.

### Priority 5 — Unified Discover

Merge Movies, TV, and Anime safely with stable filtering.

### Priority 6 — 18+ System

Ensure all content types consistently classify and display `+18`.

### Priority 7 — Glass UI

Replace flat cards with genuine transparent purple glass.

### Priority 8 — Navigation

Implement the new RoninPLEX branding navigation behavior.

### Priority 9 — Ronin AI

Improve retrieval, conversational behavior, personality, timing, and animation.

### Priority 10 — Final QA

Run full Ralph Loop verification, Playwright tests, production build, installer build, installation, and runtime verification.

---

# 58. Final Instruction to the Implementation Agent

Do not treat the existence of files, functions, CSS classes, or tests as proof that a feature works.

The goal is working RoninPLEX v2.0.0.

When a feature is claimed complete, verify it through actual runtime behavior.

If Anime says it can play but the player produces no video, the requirement is NOT complete.

If glass classes exist but cards still look grey and opaque, the requirement is NOT complete.

If Discover has an Anime filter but Anime results are missing or filters break, the requirement is NOT complete.

If Ronin AI technically exists but gives the same generic answer to different questions, the requirement is NOT complete.

If 18+ content exists but lacks the visible `+18` label, the requirement is NOT complete.

Use the PRD and `RALPH-LOOP.md` as the source of truth.

Do not declare success until the application has been tested in the actual running production build.