# Roadmap

Status: ✅ done · 🚧 in progress · ⏳ pending

## Phase 0: Setup ✅
- Expo SDK 57 + Expo Router + TS scaffold, git
- CLAUDE.md + docs
- Supabase init + initial schema migration, pushed to the cloud project (profiles, identities, habits, habit_logs, garden_state, RLS)

## Phase 1: Personal MVP ✅
- ✅ Supabase client + email/password auth (Apple / Google later)
- ✅ i18n (es/en), band colors, day-band utilities
- ✅ Recurrence engine (`src/lib/recurrence`) + unit tests
- ✅ Habit CRUD with emoji picker and a friendly frequency builder
- ✅ Hoy view (grouped by day band) + check-in animation/haptics, 2-min version on long press
- ✅ Semana view (Mon–Sun × hours, day bands, now-line)
- ✅ Local reminders (expo-notifications): per-habit offset, next 3 days, auto-cancel when done. Not available on web
- ✅ Edit day bands from Perfil

## Phase 2: Gamification & stats ✅
- ✅ Skia Identity Tree (procedural, growth + sway animations) with dynamic sky (sun/moon arc, stars, clouds = pending habits)
- ✅ Streaks with "never miss twice", 30-day consistency, automaticity progress toward ~66, weekly flowers, fruits
- ✅ Garden tab (Jardín) with per-habit growth cards
- ✅ Progress tab: stat tiles, month heatmap, weekly consistency columns, per-band rates with insight, 1% curve (one axis, index vs ideal)
- ⏳ Move garden aggregates to a Postgres RPC when log volume grows (today computed on the client over 120 days; `garden_state` table unused)

## Design pass ✅
- ✅ Pastel design system (light default + dark + system), Nunito, cards with soft shadows, chunky buttons
- ✅ Duolingo-style top bar and roomy emoji tab bar
- ✅ App-wide day streak ("never miss twice", rest days) + streak screen with week, challenge, record, milestones
- ✅ Today redesign: hero card with progress ring, card rows, friendly empty state
- ✅ Week view: band cards, only the user's hours

## Phase 3: Advanced science 🚧
- ✅ Habit stacking: "after [habit]" cue, stacked habits shown right after their anchor (display slot borrowed, log identity kept), "next in your chain" prompt, roots in the tree
- ✅ Context cues ("when I get home"), temptation bundling field
- ✅ Identities: CRUD in Perfil, assign habits, identities are tree branches with per-habit leaf colors
- ✅ DB trigger: anchors/identities must belong to the same user; no stack cycles
- ✅ 2-minute rule and implementation intentions (since Phase 1)
- ⏳ AI coach Edge Function (Claude)

## Phase 4: Monetization & stores ⏳
- RevenueCat + Stripe, paywall, entitlements
- EAS Build/Submit → TestFlight + Play Internal Testing; Sentry + PostHog

## Phase 5: Pro Parejas ⏳
- couples schema + RLS, Realtime feed, cheers/nudges, intertwined trees

## Phase 6: Launch ⏳
- Branding (Claude Design), landing page + waitlist, ASO, content & referrals
