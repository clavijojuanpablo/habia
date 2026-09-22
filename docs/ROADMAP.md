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

## Phase 3: Advanced science ⏳
- Habit stacking + context cues, 2-minute rule, identities, implementation intentions
- AI coach Edge Function (Claude)

## Phase 4: Monetization & stores ⏳
- RevenueCat + Stripe, paywall, entitlements
- EAS Build/Submit → TestFlight + Play Internal Testing; Sentry + PostHog

## Phase 5: Pro Parejas ⏳
- couples schema + RLS, Realtime feed, cheers/nudges, intertwined trees

## Phase 6: Launch ⏳
- Branding (Claude Design), landing page + waitlist, ASO, content & referrals
