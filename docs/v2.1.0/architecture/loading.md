# RoninPLEX v2.1.0 — Unified Loading Architecture

**Generated:** 2026-09-02
**Status:** IMPLEMENTED (Phase 5)

---

## 1. Core Principles

The loading architecture in RoninPLEX transitions from fragmented, route-level spinners to a unified lifecycle model where:
1. **Application Launch** does not immediately expose intermediate route loading states.
2. **Cinematic Intro** (RoninIntro) bridges the gap between boot and application readiness, visually concealing initial network latency.
3. **Route-Level Readiness** dictates application readiness instead of arbitrary timers.
4. **Cancellation and Stale Protection** are enforced via React lifecycle closures.

---

## 2. AppLifecycleContext

The primary mechanism governing global loading is AppLifecycleContext.

### State Machine
`	s
export type AppState = 'initializing' | 'ready';
`
* initializing: The React tree is rendering, routing has occurred, but the active route has not finished fulfilling its critical initial data dependencies.
* eady: The active route has signaled that data is hydrated and the UI can be safely revealed.

### Responsibilities
* **appState**: Tracks the internal data readiness of the app.
* **isIntroComplete**: Tracks the visual animation timeline of the RoninPLEX intro.
* **markAppReady()**: A callback utilized by route-level components to signal that data fetch is complete.

---

## 3. The useAppReadyWhen Hook

To prevent repetitive context wiring, routes declare their readiness declaratively using useAppReadyWhen(condition: boolean).

`	sx
import { useAppReadyWhen } from '../hooks/useAppReadyWhen';

export const Movies: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  useAppReadyWhen(!isLoading);
  
  useEffect(() => {
    // ... fetch data
    setIsLoading(false);
  }, []);
}
`

**Benefits:**
* **Zero Boilerplate:** Routes only need to pass a boolean flag representing their internal loading state.
* **Fallback Safety:** If a route does not require async data (e.g., Settings, NotFound), it immediately invokes useAppReadyWhen(true).

---

## 4. Intro Integration Lifecycle

1. **Boot:** App.tsx mounts <RoninIntro isAppReady={appState === 'ready'} />.
2. **Background Execution:** HashRouter immediately resolves the active route (e.g., <Home />).
3. **Data Fetching:** <Home /> initiates parallel network requests (Promise.all).
4. **Animation:** <RoninIntro /> runs its GSAP timeline concurrently (duration ~3s).
5. **Synchronization:** 
   * If <Home /> completes fetching **before** the intro ends: ppState becomes 'ready'. The intro plays to completion, evaluates isAppReady, and immediately fades out.
   * If <Home /> is **still fetching** when the intro ends: The intro timeline pauses in a polling loop (setTimeout), holding the branding on-screen until ppState becomes 'ready'.
6. **Reveal:** The intro fades out, exposing the fully rendered route with real content (no skeleton flashes).

---

## 5. Cancellation & Stale Data Protection

RoninPLEX routes utilize standard isMounted closures in their useEffect data fetching loops.

`	sx
useEffect(() => {
  let isMounted = true;
  
  fetchData().then(res => {
    if (!isMounted) return;
    setData(res);
  });
  
  return () => {
    isMounted = false;
  }
}, []);
`

This ensures that:
* If a user navigates away before a request completes, the request resolves harmlessly without polluting the new route's state.
* Subsequent fetches (e.g., navigating from Anime to Movies) do not trigger memory leaks or duplicate UI flashes.
* markAppReady() is safely tied to the component lifecycle, meaning unmounted components cannot force an invalid 'ready' state.
