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

## Block 1: Ready for real users 🚧 (next)
- ✅ Merged into `main`, pushed to GitHub, CI (typecheck, lint, tests) on push and PRs
- 🚧 Auth: ✅ password reset, ✅ PKCE deep links for email links (`habia://auth-callback`), ✅ in-app account deletion (Edge Function `delete-account`), ✅ redesigned sign-in · ⏳ Sign in with Apple/Google
- ✅ Offline: persisted query cache (7 days), online state from expo-network / browser events, check-ins queued and replayed after a restart, calm offline banner
- 🚧 Log past days: ✅ yesterday catch-up card in Hoy + any past day from Semana · ⏳ skip a day
- ⏳ Use `profiles.timezone`; notification tap opens the habit
- ✅ Personalized onboarding: 5 steps (welcome → identity → first habit from 20 suggestions → obstacle → ready), creates identity + habit, asks for notifications only when the user chose "I forget"; gated by `profiles.onboarded_at`
- ✅ Mascot "Brote": SVG character with 4 moods in onboarding and the empty state; day-complete celebration (confetti + Brote + votes), fired only by the check-in that closes the day
- ⏳ Redesign habit form, sign-in, Garden and Progress with the new style
- 🚧 App name: ✅ **habia** (app.json, package.json, deep-link scheme `habia://`, Supabase redirect URLs) · ⏳ icon and splash; privacy policy + terms

## Block 2: Beta testers ⏳
- EAS project + development build, TestFlight + Play Internal Testing
- Sentry + PostHog (north star, D1/D7/D30 retention)
- Ask testers about one-off reminders / calendar

## Phase 4: Monetization ⏳
- RevenueCat (in-app) + Stripe (web), paywall, entitlements, Free vs Pro limits

## Phase 3B / Pro value ⏳
- Guided programs ("Caminos", 3 initial) + micro-lessons
- AI coach (hybrid: rules free, Claude weekly review via Batch, capped Pro chat)

## Phase 5: Social & couples ⏳
- Pro Parejas: couples schema + RLS, Realtime feed, cheers/nudges, intertwined trees
- Share cards, referrals, friends, group challenges, weekly leagues by consistency

## Phase 6: Launch ⏳
- Branding (Claude Design), landing page + waitlist, ASO, content

## Post-launch ⏳
- Widgets, Apple Health / Health Connect, Apple Watch, Siri shortcuts (native, dev build)
- Earnable streak shield; read-only calendar; one-off reminders (if validated)
- Mood + journal correlations, monthly report, "Tu año en hábitos"
- Family plan, gifts, B2B
