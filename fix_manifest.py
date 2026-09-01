p = 'docs/v2.1.0/CHANGE-MANIFEST.md'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# Remove the broken append
c = c.split('\n### Phase 3 - Playback Reliability')[0]

c += '''
### Phase 6: Unified Motion Rollout (2026-09-02)
* **ScrambleText primitive:** GSAP ticker-driven component created for high-performance typographic reveals, applied to HeroBanner.
* **useMotionPresence hook:** Established to manage React unmount lifecycles alongside GSAP exit animations.
* **Modal Architecture Update:** Replaced CSS-based Tailwind transitions in ApiKeyModal, PreferencesModal, and OnboardingModal with useMotionPresence.
* **Intro Branding Update:** Updated RoninIntro to utilize the official user-supplied logo.png asset, removing CSS typography fallbacks.
* **Architecture Documentation:** Updated motion-system.md and MOTION-IMPLEMENTATION.md to reflect Phase 6 standards.
* **Tests:** Added phase6-motion.test.mjs.
'''

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)
