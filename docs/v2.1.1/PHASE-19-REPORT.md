# Phase 19 Report: Navigation Reliability

## Executive Summary
This phase addresses multiple bug reports regarding broken navigation across the RoninPLEX application. A comprehensive audit revealed a fundamental architectural flaw: UI "Back" buttons were implemented using absolute path redirection (`<Link to="/">`) rather than utilizing the native browser history stack. This artificially pushed entries onto the stack, corrupting navigation sequences, breaking native mouse/touchpad gestures, and trapping users in endless navigation loops.

## Root Cause Analysis
1. **Details Pages (`MovieDetails`, `TvDetails`, `AnimeDetails`)**:
   - The application was using hardcoded Links (e.g. `<Link to="/">`) for all "Back" and "Return to Home" buttons.
   - Consequence: Returning from Search to Details, then clicking "Back", would route the user to `/` instead of the previous Search view.
   - Secondary Consequence: The `window.history` stack grew linearly with every UI interaction. A touchpad back-swipe would execute `history.back()`, which would take the user to the *previous* hardcoded redirect rather than moving up the logical view tree.

2. **Player Navigation Traps (`PersistentPlayerHost`, `Watch.tsx`)**:
   - The video player instances were instructed to call `handleRestore` upon the user selecting "Return to Details".
   - `handleRestore` is designed exclusively for transitioning from Picture-in-Picture (PiP) back to Full-screen. It achieved this by executing `navigate('/watch/...')` to the active media ID.
   - Consequence: Clicking "Return to Details" while in Full-screen mode re-navigated to the identical Watch path, resulting in a no-op that trapped users within the player container.

## Implementation Details
1. **`useGoBack` Hook (`src/hooks/useGoBack.ts`)**:
   - Implemented a smart history resolution hook.
   - Fallback logic routes safely (e.g. to `/` or `/anime`) if `location.key === 'default'`, correctly addressing users entering directly via a deep link where no prior history stack exists.

2. **Details Pages Correction**:
   - Replaced `<Link to="/">` with `<button onClick={goBack}>` across all Detail pages.

3. **PersistentPlayerHost Context Switching**:
   - Created `handlePlayerBack` utilizing the new `useGoBack(fallback)` hook.
   - Repointed the player's internal UI `onBack` handler away from `handleRestore` toward `handlePlayerBack`.
   - Result: Escaping the player now seamlessly unmounts the `Watch` route, invokes PiP context transitions, and correctly restores the prior Detail page.

## Testing & Verification
- Validated via `tsc -b` and Vite production build.
- Simulated history depth checks for direct-entry deep-linking.
- Verified mouse/touchpad `popstate` intercepts function organically with React Router `navigate(-1)`.
