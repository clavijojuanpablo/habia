# PRD

## Vision
A habit app that makes behavior change visible, forgiving and science-based, so users see real improvements in their lifestyle. Ambition: become the reference habit app for Spanish speakers, the way Duolingo is for language learning.

## Positioning
**"La app de hábitos basada en ciencia, donde tu árbol crece con cada voto por la persona que quieres ser."**

Differentiators (every feature should reinforce at least one):
1. **The living Identity Tree** - "every action is a vote" made visible. The brand's hero image.
2. **Real science, no gimmicks** - honest ~66 days, never miss twice, implementation intentions, habit stacking.
3. **Kind, never guilt-tripping** - the anti-Duolingo-guilt habit app. No shame copy, no manipulative notifications.
4. **Spanish first** - built for LatAm + Spain, English second.

Competitors: Habitica, Streaks, Fabulous, Finch, Structured, TickTick. Built-in Notes/Reminders/Calendar are *not* competed with (see Scope decisions).

## Target users
1. The founder (personal use, Phase 1).
2. Spanish-speaking adults (LatAm + Spain) who have tried habit apps and quit. English second.
3. Couples and friend groups who want to build habits together.

## Feature filter
Every feature must answer "yes" to at least one:
- Does it help the user **actually improve their life** (north star)?
- Does it make the user **come back** or **bring someone else**?

## Built (see ROADMAP.md for detail)
Habits with flexible frequency, Today/Week views with day bands, reminders, Identity Tree garden, Progress charts, habit stacking and context cues, identities, day streak with "never miss twice", pastel light/dark design.

## Planned features, by impact

### A. Product-defining
- **Mascot "Brote" 🌱** - a sprout character with personality living in the garden; reacts, celebrates, voices notifications with kind humor. Main marketing asset.
- **Guided programs ("Caminos")** - Duolingo-style paths: "Dormir mejor en 30 días", "Lector", "Mañanas con energía", "Menos pantalla". Start at the 2-minute version and level up; include micro-lessons. Pro content.
- **Micro-lessons** - 1-minute daily habit-science lessons.
- **Personalized onboarding** - 60-second quiz (identity, main obstacle) → recommended plan and first habit; asks for notifications at the right moment.
- **Celebrations** - confetti, sounds and mascot reactions on milestones.

### B. Growth
- **Share cards** - "Mi árbol a los 66 días", streak milestones, for IG/TikTok stories.
- **"Tu año en hábitos"** - Wrapped-style yearly recap.
- **Social** - friends, group challenges, weekly leagues ranked by consistency % (fair, not volume).
- **Couples (Pro Parejas)** - individual + shared weekly habits, cheers, nudges, joint streak, intertwined trees.
- **Referrals** - invite a friend, both get a Pro week.

### C. Less friction ("make it easy")
- Home/lock-screen **widgets**, **Apple Health / Health Connect** auto-completion, **Apple Watch**, **Siri shortcuts** (need native code / development build).
- **Earnable streak shield** - 7 consistent days earn one protected day.
- **Calendar (read-only)** - show device calendar events in Hoy/Semana as context.
- **One-off reminders** - simple to-dos ("comprar comida gata") in their own table, never counted in streaks, votes or the tree. Build only if TestFlight users ask.

### D. Depth (Pro)
- **AI coach** - hybrid: rule-based daily tips (free), Claude weekly review (Batch) and capped chat (Pro).
- **Mood + short journal** with correlations ("on days you meditate your mood is 30% better").
- **Monthly insights report.**

### E. Business (later)
- Family plan, gift subscriptions, B2B wellness programs.

## Scope decisions
- **Not a notes / lists / full calendar app.** Built-in apps do this free and well; it would dilute positioning and distort habit metrics. Integrate (read the calendar) instead of reinventing.
- One-off tasks stay separate from habits so streaks, votes and the tree keep measuring repetition.

## Monetization
| Plan | Price (reference) | Includes |
|---|---|---|
| Free | $0 | Up to 5 habits, basic tree, reminders, 7-day stats, rule-based tips |
| Pro | ~US$4.99/mo · ~US$34.99/yr | Unlimited habits, guided programs, AI coach, full stats, advanced stacking, garden themes |
| Pro Parejas | ~US$7.99/mo for 2 | Pro for both + couples features |
Regional pricing for LatAm. Later: family plan, gifts.

## Success metrics
- **North star:** weekly users who complete ≥1 habit on 4+ days of the week.
- Retention D1 / D7 / D30; % of habits that reach 66 days; weekly consistency trend per user.
- Self-reported lifestyle improvement (periodic in-app survey).
- Growth: share-card and referral conversion.
- Culture: experiment with PostHog feature flags / A/B tests (onboarding first).
