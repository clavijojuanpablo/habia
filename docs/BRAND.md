# Brand (TBD, Phase 6)

## Name candidates (Spanish-first)
- **Brote**: the sprout; growth from something small.
- **Raíz**: roots, habit stacking, stability.
- **Voto**: "every action is a vote for who you want to become".
- **Semilla**: seed, beginnings.
- **Hábitat**: habits + the place where you grow.

Check: domain (.app / .com), App Store / Play Store name availability, trademark.

## Voice
Warm, encouraging, never guilt-tripping. Short sentences. Talks about identity ("eres alguien que…"), not about obligations.

## Mascot
**Brote** 🌱 - a sprout character drawn as SVG (`src/features/mascot/brote.tsx`), 4 moods: happy, cheer, celebrate, sleepy. Voices the onboarding, the empty state and (next) celebrations. Main marketing asset.

## Visual direction (implemented)
- **Mood:** friendly, playful and motivating (references: Duolingo's navigation and streaks, pastel education/health apps).
- **Light mode by default:** warm cream canvas (#FFF8F1) with white rounded cards and soft shadows. Dark mode: deep plum-gray (#16141D) with lifted cards.
- **Palette:** mint green primary (#3DBE7A), streak orange (#FF9F43), gold votes, lavender. Day bands: peach morning, butter afternoon, lavender night, mint "any time".
- **Typography:** Nunito (rounded) - Black for big numbers, ExtraBold for headings.
- **Navigation:** Duolingo-style top bar (🔥 streak · 🌱 votes · tree stage) and a roomy bottom tab bar with emoji icons and a pastel tile on the active tab.
- **Components:** chunky 3D buttons, 52px touch-friendly rows, progress rings, big hero numbers.
- Tokens live in `src/constants/theme.ts`; heatmap ramps validated for contrast in both modes.
