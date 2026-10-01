# Roadmap

> For where the project stands **today** — what works, what is next, known debts — read
> [`STATUS.md`](./STATUS.md) first. This file is the long backlog behind it.

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
- ✅ Hoy view (grouped by day band) + check-in animation/haptics; tapping a habit opens its actions sheet (done, 2-min version, rest day, edit), taught once by a Brote tip
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
- ✅ AI coach Edge Function `weekly-review` (Claude, opt-in, 2026-10-01) · ⏳ capped chat · ⏳ push-dispatcher

## Block 1: Ready for real users 🚧 (next)
- ✅ Merged into `main`, pushed to GitHub, CI (typecheck, lint, tests) on push and PRs
- 🚧 Auth: ✅ password reset, ✅ email links as the Universal Link `https://habia.app/auth-callback` (`token_hash` + `verifyOtp`, works on any device), ✅ in-app account deletion (Edge Function `delete-account`), ✅ redesigned sign-in · ⏳ Sign in with Apple/Google
- ✅ Offline: persisted query cache (7 days), online state from expo-network / browser events, check-ins queued and replayed after a restart, calm offline banner
- 🚧 Log past days: ✅ yesterday catch-up card in Hoy + any past day from Semana; future days locked (`canLog`) and the week view cannot go back before the join date · ✅ skip a day (rest day on purpose: long-press the check circle; not a miss for progress, tree or streak)
- 🚧 ✅ `profiles.timezone` synced from the device every session · ✅ notification tap focuses the habit on Hoy (tested on iPhone, background and killed) · ⏳ compute "today" from `profiles.timezone` (needed once the server sends pushes)
- ✅ Personalized onboarding: 5 steps (welcome → identity → first habit from 20 suggestions → obstacle → ready), creates identity + habit, asks for notifications only when the user chose "I forget"; gated by `profiles.onboarded_at`
- ✅ Mascot "Brote": SVG character with 4 moods in onboarding and the empty state; day-complete celebration (confetti + Brote + votes), fired only by the check-in that closes the day
- ✅ Redesigned habit form (live preview, sections as cards, collapsed extras, sticky save), sign-in, Garden (stage progress + Brote) and Progress (colorful stat tiles)
- ✅ Brand assets: name **habia**, app icon / Android adaptive + monochrome / splash (light + dark) / favicon, generated from the Brote SVG with `npm run icons`
- ✅ Privacy policy + terms (es/en) in `src/features/legal/content.ts`, readable from Profile and before sign-up, and published at habia.app/privacidad and /terminos (the site imports the same file). Contact `hola@habia.app` is real. TODO before launch: jurisdiction, lawyer review, analytics opt-in vs opt-out

## UX polish ✅
- ✅ Time picker (tap, never type), any minute, 12h/24h following the device setting
- ✅ Week grid hours formatted per locale; Brote peeking from the header corner
- ✅ Language picker in Profile (`profiles.locale`, applied live via i18next)

## Block 2: Beta testers 🚧
- ✅ EAS project (`eas.json`: development / preview / production) + Android development build (APK)
- ✅ Apple Developer account (approved 2026-09-29) + iOS development build installed on the iPhone (EAS credentials, APNs key)
- ✅ TestFlight (2026-09-30): production build 1.0.0 (3) with EAS env vars (`production`), Sentry source maps + dSYMs, Universal Links; submitted (ASC app 6817880518), installed through internal testing and tested on the iPhone
- ✅ EAS Update: `expo-updates`, `runtimeVersion` policy `fingerprint`, one channel per build profile · ✅ first OTA update to `production` (2026-09-30) · ⏳ external testers (public TestFlight link)
- ⏳ Play Internal Testing (no Android device yet; new personal accounts need a closed-testing period before production)
- ✅ Sentry (crashes, off in development) + PostHog (closed event list, internal user id, opt-out in Profile) · ✅ north-star self-report question (in-app 1–5 card every 14 days, event `north_star_answered`, 1.0.5)
- ✅ Branded auth emails (es/en) sent from hola@habia.app through Resend SMTP
- ✅ Universal Links (`https://habia.app/auth-callback`): opens the app directly (tested from TestFlight), bilingual web fallback page with an "Open habia" button (`habia://`) for desktop or no app
- Ask testers about one-off reminders / calendar

## Order after Block 2 (decided 2026-09-29)
Testers first (TestFlight with the core), then every Pro feature **before the public App Store launch**, shipped to testers as it lands (`expo-updates`). See GAMIFICATION.md for the design of 2–5.

1. **AI coach** — moved up: the most direct lever on the north star; testers generate history while it is built
2. **Your character** — a plant avatar (plant · pot · eyes · mouth · accessory) that is also the profile picture; parts free, earned with seeds or bought; assets designed outside, animated in Rive
3. **Friends & circles** — replaces couples-only; shared streaks, cheers, privacy by default, block/report
4. **Leagues** — opt-in weekly leagues scored by consistency %, when there are enough users
5. **Monetization** — Pro + cosmetics, before launch

## Phase 3B / Pro value ⏳ (next after TestFlight)
- AI coach (hybrid: ✅ rules free — card on Today (v1 2026-09-30; 1.0.2 scored detectors, tip per day band, "¿Por qué?") · ⏳ 1.0.6 co-occurrence, seeds per identity, 👍/👎, Monday mini-review · ✅ Claude weekly review (on first open of the week; Batch API once a cron writes them) · ⏳ capped Pro chat)
- Guided programs ("Caminos", 3 initial) + micro-lessons

## Character ⏳
- Concepts → layered SVG parts with anchor points (spec in GAMIFICATION.md) → Rive → `rive-react-native` (development build)
- Avatar builder screen; equipped combination on `profiles`; inventory + server-side seed ledger (migration); avatar as profile picture
- Replaces the static Brote in onboarding, Hoy, celebrations, Garden

## Phase 5: Social ⏳
- Friends & circles: schema + RLS for shared visibility, requests, Realtime feed, cheers/nudges, shared streaks ("never miss twice"), intertwined trees for circles of two
- Usernames, block/report/moderation (App Store 1.2), account deletion cascade
- Opt-in weekly leagues by consistency %
- Share cards, referrals, group challenges

## Phase 4: Monetization ⏳ (before public launch)
- RevenueCat (in-app) + Stripe (web), paywall, entitlements, Free vs Pro limits
- Cosmetics (skins, accessories, garden themes): cosmetic only, some earnable
  - ⚠️ Confirm Stripe accepts a Colombian individual before building web billing; fallbacks: a Merchant of Record (Paddle / Lemon Squeezy) or a US LLC
  - Apple: apply to the Small Business Program (15%). An individual seller shows a personal name and, as an EU DSA trader, a public address

## Phase 6: Launch ⏳
- 🚧 Landing: ✅ habia.app (Astro in `web/`, Vercel) with home + legal pages in es/en · ⏳ waitlist, real screenshots, ASO, content

## Post-launch ⏳
- Widgets, Apple Health / Health Connect, Apple Watch, Siri shortcuts (native, dev build)
- Earnable streak shield; read-only calendar; one-off reminders (if validated)
- Mood + journal correlations, monthly report, "Tu año en hábitos"
- Family plan, gifts, B2B
