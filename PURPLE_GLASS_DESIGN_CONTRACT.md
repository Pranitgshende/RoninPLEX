# Purple Glass Design System - Visual Contract

## 1. Atmosphere & Brand
- **Palette**: Dark, cinematic. Backgrounds are `#090a0f` or dark gradients.
- **Purple Accent**: Subtle use of `brand-500` (`#6366f1`) and `brand-600` (`#4f46e5`) for active states, borders, and interactive hovers. We avoid pure magenta or overly bright neon purples in large surfaces.
- **Hierarchy via Glass**: Transparency and blur communicate elevation, not decoration.

## 2. Token Architecture (Tailwind)
- **glass-subtle**: `bg-[rgba(20,22,35,0.4)] backdrop-blur-md border border-white/5`
  - Usage: Secondary panels, filter containers, input backgrounds, chips.
- **glass-standard**: `bg-gradient-to-br from-[rgba(80,55,150,0.15)] to-[rgba(30,20,60,0.4)] backdrop-blur-xl border border-brand-300/20 shadow-lg`
  - Usage: Media cards, navigation, primary buttons, content panels.
- **glass-elevated**: `bg-gradient-to-br from-[rgba(90,60,170,0.25)] to-[rgba(40,25,80,0.6)] backdrop-blur-2xl border border-brand-300/30 shadow-2xl`
  - Usage: Modals, important overlays, focused panels.
- **glass-interactive**: `transition-all duration-300 hover:border-brand-400/50 hover:-translate-y-1 hover:shadow-brand-500/20`

## 3. Typography
- **Headings**: `font-display`, `text-white`, `font-bold`
- **Primary Text**: `text-slate-200`
- **Secondary Text**: `text-slate-400`
- **Accents**: `text-brand-400`

## 4. Components
- **Buttons**:
  - Primary: `bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 rounded-xl px-5 py-2.5`
  - Secondary/Glass: `glass-subtle glass-interactive rounded-xl px-5 py-2.5`
- **Modals**:
  - Container: `glass-elevated rounded-2xl`
  - Header: Transparent or `bg-white/5` border bottom.
- **Cards (MediaCard)**:
  - Wrapper: `glass-standard glass-interactive rounded-2xl`
  - Image: `rounded-xl` inside padding.

## 5. Motion
- **Transitions**: Native GSAP + Tailwind `transition-all duration-300` for hovers.
- **Focus States**: `focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-background`
- **Reduced Motion**: Disables transforms, removes transitions, uses solid fallbacks.

## 6. Performance Constraints
- Backdrop filter `blur(24px)` is expensive. We restrict it to distinct layers (modals, nav, cards) and avoid overlapping blurred surfaces. Background gradients behind cards simulate lighting without CSS filters.
