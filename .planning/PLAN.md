# Phase 13: Core Settings + Preferences Foundation - PLAN

## 1. Audit Findings (State Architecture)

### Preference State
- **Values & Defaults**: Housed in `src/types/user.ts` as `DEFAULT_USER_PREFERENCES`. It contains all required variables: `autoNextEpisode` (ON), `reduceMotion` (OFF/Follow System), etc.
- **Hydration & Persistence**: Managed centrally by `src/services/storage.ts` using `savePreferences()`, `getPreferences()`, `saveHomeLayout()`, `getHomeLayout()`, `clearPlaybackProgress()`, `clearWatched()`, `clearWatchlist()`, and `resetPreferences()`. 
- **Context**: `src/context/UserContext.tsx` wraps the storage and makes state globally available without redundant React re-renders, reading from stable storage keys on boot. 

### Storage
- **Keys**: `roninplex_preferences`, `roninplex_home_layout`, `roninplex_playback_progress`, `roninplex_watchlist`, `roninplex_watched`.
- **Serialization**: JSON parsing wrapped in robust try/catch blocks within `storage.ts`.
- **Defaults**: Merged safely via spreading defaults over stored preferences.

### UI
- **PreferencesModal**: Currently focuses strictly on content curation (genres, actors, adult toggle). Requires expansion for Playback, Appearance, and Data sections.
- **Settings Page**: Exists but the `PreferencesModal` serves as the primary immediate overlay. The plan focuses on updating `PreferencesModal` or unifying it with `Settings.tsx` depending on current UI paradigms.
- **Home Layout configuration**: Uses `homeLayout` from `UserContext`. 

### Existing Behavior
- `autoNextEpisode`: Stored but needs integration in `src/components/player/VideoPlayer.tsx`. 
- `Audio Language / Subtitle / Quality`: The backend player components (`PersistentPlayerHost.tsx`, `VideoPlayer.tsx`) currently do *not* have generic stable consumers for forcing audio/subtitle tracks dynamically across all embedded providers. These settings will be **OMITTED** per the contract to prevent fake settings.
- `reduceMotion`: Stored in context, needs to be wired to a global class.
- `Skip Intro`: The current `RoninIntro` component and `AppLifecycleContext` do not support dynamic intro skipping cleanly without risking route readiness. Will carefully audit `AppLifecycleContext` before implementing or explicitly omit if unsafe.
- `Home Visibility`: `homeLayout` arrays natively support filtering out disabled items.

## 2. Implementation Execution Plan

### Step 1: Wire Up Architecture Extensions (Non-UI)
1. **Reduce Motion**: Modify `src/App.tsx` (or `main.tsx`) to read `preferences.reduceMotion` from `UserContext` and toggle a global `.reduce-motion` class on `document.body`. Add CSS rules in the main stylesheet to kill animations when this class is active.
2. **Video Player**: Modify `src/components/player/VideoPlayer.tsx` to read `preferences.autoNextEpisode`. Add logic to progress to the next episode upon `onEnded` if enabled.

### Step 2: Settings UI - Layout & Modal (Purple Glass)
1. Revamp `src/components/modals/PreferencesModal.tsx` (or `src/pages/Settings.tsx`) into the defined 5 categories: **Playback**, **Appearance & Motion**, **Home & Discovery**, **Data**, **About**.
2. **Playback Section**: Add native toggle for `Autoplay Next Episode`. (Omit Subtitle/Audio/Quality). 
3. **Appearance & Motion Section**: Add native toggle for `Reduced Motion`. (Omit Skip Intro if it threatens Phase 5 readiness).
4. **Home & Discovery Section**: Add native toggles for `Show Continue Watching` and `Show Watchlist` (by modifying their `enabled` boolean in the `homeLayout` state array). Add basic up/down native buttons to reorder the sections.
5. **Data Section**: Implement the 4 Destructive Actions using the existing modal system for confirmation. Wire them to: `storage.clearPlaybackProgress()`, `storage.clearWatched()`, `storage.clearWatchlist()`, and `storage.resetPreferences()`. 

### Step 3: Verification & Auditing
1. **Playwright / UI Testing**: Test navigating the settings via keyboard.
2. **A11y**: Ensure all toggles have explicit `<label>` tags and native semantics.
3. **Performance**: Confirm `UserContext` updates don't spam the DOM.
4. **Data Loss Prevention**: Test destructive actions. Validate that clearing Continue Watching ONLY wipes progress and leaves Watchlist intact. 

## 3. Tool Chain & Constraints
- **Gemini 3.1 Pro** implements code.
- **Gemini 3.7 Flash** executes a read-only final audit.
- **Ponytail Rule**: 0 external dependencies. Native HTML form controls only. Native CSS animations (or lack thereof).
- **Git Strategy**: One logical commit (`feat(v2.1): establish core settings`), no pushing, local tag `v2.1.0-core-settings-foundation` upon full verification.
