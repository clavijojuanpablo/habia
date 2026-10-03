# STATUS — where the project stands

**Last updated: 2026-10-01.** This is the session entry point: a `SessionStart` hook injects it
into every new Claude Code session. Keep it short and true. `ROADMAP.md` is the full backlog;
this file is only "today".

---

## Right now

**habia** is a feature-complete personal habit tracker (sign up, onboarding, habits with any
supported recurrence, online/offline check-ins, Identity Tree, stats, local reminders; es/en,
light/dark; iOS, Android, web) running on the linked Supabase cloud project, and it is **on
TestFlight** (Block 2 closed 2026-09-30):

- **Production build 1.0.0 (3)** submitted to App Store Connect (app id `6817880518`), installed
  by the owner through internal testing. Tested on the iPhone: password-reset Universal Link opens
  the app directly, cold start without the PC, reminder tap, offline check-in replay.
- **Universal Links:** auth emails link to `https://habia.app/auth-callback?token_hash=…&type=…`
  (templates in `supabase/templates/`); the app verifies with `verifyOtp`
  (`src/app/auth-callback.tsx`), so it works on any device, not only the one that asked.
  AASA in `web/public/.well-known/`; without the app, `web/src/pages/auth-callback.astro`
  explains and offers an "Open habia" button (`habia://`, since same-site taps never fire
  Universal Links).
- **EAS Update:** `expo-updates`, `runtimeVersion` policy `fingerprint` (an update never reaches
  an incompatible binary), channels `development` / `preview` / `production` per build profile.
  **Proven on 2026-09-30:** the first OTA update reached build 3 on the iPhone (downloads on one
  launch, applies on the next). Profile ends with `habia <release> · build <n> · <update id>` (or
  "de fábrica" for the JS embedded in the binary), the way to tell which JS a phone runs.
- **EAS env `production`:** the five `EXPO_PUBLIC_*` plus `SENTRY_AUTH_TOKEN` (secret). Production
  builds upload JS source maps and dSYMs to Sentry `clavolab/habia`.
- **Coach (rule-based, free, release 1.0.2):** a tip on Today per day band (up to 3 a day), voiced
  by Brote, dismissible, with a one-tap action and a "¿Por qué?" line (the data + the science).
  12 detectors read the user's own history (`src/features/coach/history.ts`: real check-in times,
  weekdays, pace, minimum versions) and propose scored candidates (`detectors.ts`); the brain
  (`compute-tip.ts`) penalizes insights shown in the last 3 days and alternates two phrasings.
  Pure and tested; rules mapped in `docs/SCIENCE.md`. Ships by OTA. Public TestFlight link
  submitted to Beta App Review (2026-09-30).
- Still here from before: Sentry + PostHog, habia.app (Astro on Vercel) with legal pages, branded
  auth emails via Resend.

For development, reinstall the iOS **development build** from EAS (TestFlight replaced it: same
bundle id) and run `npx expo start --tunnel`. It predates the associated domain, so auth links
open the web fallback there; its "Open habia" button still works.

## How to resume

1. Read this file (the hook already injected it).
2. `docs/ROADMAP.md` for the long view, `docs/PRD.md` for scope decisions.
3. `CLAUDE.md` for conventions, `docs/ARCHITECTURE.md` for the data model.
4. Start with the first item under **Next steps**.

---

## What works today

| Area | State | Lives in |
| --- | --- | --- |
| Auth (email + password, reset, Universal Link email links, account deletion, branded emails) | ✅ | `src/features/auth/`, `src/app/auth-callback.tsx`, `supabase/templates/`, `supabase/functions/delete-account/` |
| Onboarding (5 steps, creates identity + first habit) | ✅ | `src/features/onboarding/` |
| Habits CRUD, RRULE builder, 2-minute version, stacking, context cues | ✅ | `src/features/habits/`, `src/lib/recurrence/` |
| Today + Week views, day bands, check-in rules, actions sheet | ✅ | `src/app/(tabs)/`, `src/features/schedule/`, `src/features/checkins/` |
| Identity Tree (Skia) + Garden tab | ✅ | `src/features/garden/` |
| Streaks ("never miss twice") + Progress tab | ✅ | `src/features/streak/`, `src/features/stats/` |
| Local reminders (native only), tap focuses the habit | ✅ | `src/features/reminders/` |
| Offline: persisted cache, queued check-ins replayed after restart | ✅ | `src/lib/query/`, `src/lib/network*.ts` |
| Crash reporting (Sentry, source maps + dSYMs) + analytics (PostHog, opt-out) | ✅ | `src/lib/crash-reporting.ts`, `src/lib/analytics.ts` |
| Design system, dark mode, language picker, Brote mascot, app icons | ✅ | `src/constants/theme.ts`, `src/features/appearance/`, `src/features/mascot/` |
| Legal texts (es/en), also at habia.app/privacidad and /terminos | ✅ | `src/features/legal/content.ts`, `web/` |
| Marketing site habia.app + auth fallback page + AASA (Astro, Vercel, root dir `web`) | ✅ | `web/` |
| iOS distribution: TestFlight internal + EAS Update | ✅ | `app.json`, `eas.json` |
| Coach (rule-based): scored detectors, tip per day band, "¿Por qué?" | ✅ | `src/features/coach/` |
| AI weekly review (Claude, opt-in) | ✅ | `supabase/functions/weekly-review/`, `src/features/coach/` |
| Friends & circles (1.1.0): usernames, requests, shared streaks, circles ≤ 8, preset cheers, block/report, invite links | ✅ built, migration not applied | `src/features/social/`, `supabase/migrations/20261001180242_social.sql` |
| Character (plant avatar) | 🎨 art in progress (owner), guide ready | `docs/CHARACTER-ART.md`, `art/character/` |
| Chat with Brote, server pushes, leagues, paywall | ⏳ not started | — |

## Technical state

- Expo SDK 57 (`expo ~57.0.26`, React Native 0.86.3), Expo Router, TypeScript strict. All SDK
  patch versions current (`npx expo install --check`), `expo-doctor` 21/21.
- Supabase cloud project "Habits Project" (no local Docker). 8 migrations applied (+ `social`
  pending); RLS on every
  table. Auth `site_url`, redirect allow-list and email templates ship with
  `npx supabase config push`; SMTP and the email rate limit (30/h) live only in the dashboard.
- Skia 2.6.2 + Reanimated 4.5.1 for the tree; `react-native-svg` for charts and the mascot.
- TanStack Query 5 (persisted 7 days) + Zustand. Sentry `@sentry/react-native` 7, PostHog RN 4.
- `web/`: Astro 7 static site, excluded from the app's tsconfig, ESLint and Metro; pins its own
  tsconfig in `astro.config.mjs` (Vercel installs only `web/` dependencies). `vercel.json` serves
  the AASA as JSON. Apex `habia.app` is primary (`www` redirects to it).
- Verification baseline: **176 tests / 26 suites green**, typecheck clean, lint clean, `expo-doctor`
  21/21, site builds 8 pages. RLS of the social tables: `supabase/tests/social-rls.sql` (runs on the
  linked DB inside BEGIN … ROLLBACK, ~60 asserts). Typecheck ~8 s, tests ~8 s, lint ~25 s on this machine.
- CI (typecheck + lint + tests) runs on push and PRs to `main`. Repo: `clavijojuanpablo/habia`.
- Versioning: `APP_RELEASE` in `src/constants/release.ts` is the version people see (Profile:
  `habia 1.0.1 · build 3 · <update id>`). Bump the patch for every OTA update; a new store binary
  bumps the minor **and** sets the same number as `version` in app.json (which changes the
  fingerprint, so never in an OTA). Build numbers are auto-incremented by EAS (remote).
- Shipping: JS-only change → `eas update --channel production --environment production --platform ios --non-interactive --message "…"`
  (~1 min; drop `--platform ios` once Android testers exist; without `--non-interactive` it once
  sat for 20+ min on a silent prompt);
  native change (fingerprint moves) → `eas build --profile production --platform ios` →
  `eas submit --platform ios --latest`. EAS CLI is not installed globally: run every `eas …`
  here as `npx eas-cli@latest …` (bare `eas` fails in PowerShell). Estimate for the five post-TestFlight blocks
  (2026-09-30): ~145–245 h of code plus character art and admin; re-estimate after the AI coach.

## Next steps

**Start here — turn on the AI weekly review (owner, 3 steps), ship 1.0.6, open the beta.**

0. **Turn on the AI weekly review** (built and deployed 2026-10-01, idle until a key exists):
   1. Create an API key at console.anthropic.com (set a monthly spend limit there).
   2. `npx supabase secrets set ANTHROPIC_API_KEY=<key>` (never in the repo or `EXPO_PUBLIC_*`).
      Optional: `COACH_MODEL` overrides the model (default `claude-sonnet-5-5`, ~$0.02 per review).
   3. Ship 1.0.6 by OTA. In the app: Profile → "Revisión semanal con IA" on (or accept Brote's
      offer on Today after a week of use). Opening Today in a new week writes last week's review.
   Check it: `curl -X POST <SUPABASE_URL>/functions/v1/weekly-review -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>" -d '{"check":true}'`
   must answer `{"available":true}`.

0. **1.6.1 — trust in circles, from testing build 1.6.0 (5) (2026-10-02), on `build-4`, by OTA.** Migration
   `20261003001405_circle_trust.sql` + redeploy `notify` BEFORE the OTA (the app reads the new tables). Cheers: one
   per friend every 3 h (server trigger `cheer_too_soon`). Photos: owner hiding removed (hidden photos came back);
   "¿Cuenta?" private votes (`circle_photo_doubts`) → majority marks `circle_doubted_days`, which
   `circle_habit_days` excludes from the group (author's own log untouched), push `photo_doubted`; a new photo that
   day resets it. Reports hide a photo for the reporter, and for all from 2 reporters (also fixed: a 2nd photo of
   the same person could not be reported). Fresher social data: pushes (received or tapped) invalidate `['social']`,
   photo URLs cached per file version so the photo list refetches normally, pull-to-refresh on Profile, cheers,
   friends and circle. Profile: two doors, 💌 Cheers and 👥 Friends, opening `/cheers` and `/friends` sheets with
   "hace 5 min" times (`src/lib/time/relative.ts`).
0. **Build 4 / 1.6.0 — on branch `build-4` (2026-10-03)**, NOT merged: `main` keeps fingerprint `f15932ef…` so
   OTAs still reach build 3. Native: expo-image-picker (camera only), expo-image-manipulator, react-native-purchases(+ui). `-ui` is unused until the paywall, but ships in build 4 on purpose: it is native, so adding it later would need another store build.
   Photos on circle habits (camera-first check-in, gallery, viewer with retake/delete/report/hide, on-device upload
   queue, deleted after 7 days), social pushes (Edge Function `notify`: cheers, requests, accepts, "ya regó en tu
   círculo", once per kind/person/day, `profiles.social_push` switch), habia Pro (below).
   **habia Pro (decided 2026-10-02):** US$4.99/month · US$34.99/year, 7-day free trial on the yearly plan only,
   entitlement `pro`, offering `default` (packages `$rc_annual`, `$rc_monthly`); Pro Parejas dropped (circles stay
   free). Paywall `src/app/paywall.tsx` (Settings → habia Pro; Apple 3.1.2 terms, restore, manage), `usePro()` =
   store on this phone OR `public.entitlements` (mirror written by Edge Function `revenuecat-webhook`, which re-reads
   RevenueCat's V1 API on every event). **Limits are OFF** (`PRO_LIMITS_ENABLED` in `src/features/paywall/limits.ts`)
   until the public launch; turning them on is that flag + an OTA. Only the 5-habit limit is wired; full-history
   stats and the AI review still need their gates (server-side for the AI, via `entitlements`). **Before turning
   the limits on:** enforce the habit limit in the database too (trigger reading `entitlements`), since onboarding,
   the web and direct inserts skip the screen (the paywall's "todo es gratis por ahora" note hides itself with the
   flag). Check on a device that switching accounts never shows the previous account's Pro.
   Owner steps, in order:
   1. ✅ `npx supabase db push` (`20261002163208_photos_and_push.sql`).
   2. ✅ `npx supabase functions deploy notify` and `npx supabase functions deploy photos-cleanup`.
   3. ✅ CRON_SECRET + vault secret + `supabase/sql/schedule-photo-cleanup.sql` (redeploy photos-cleanup after
      `verify_jwt = false` landed in `config.toml`).
   4. habia Pro: App Store Connect (Paid Apps Agreement, Small Business Program, subscription group + 2 products +
      trial), RevenueCat project (App Store app, products, entitlement `pro`, offering `default`, webhook), then
      `npx supabase db push` (`20261002192432_entitlements.sql`), secrets `REVENUECAT_WEBHOOK_AUTH` and
      `REVENUECAT_SECRET_KEY`, `npx supabase functions deploy revenuecat-webhook`, and the public key as
      `EXPO_PUBLIC_REVENUECAT_IOS_KEY` in EAS env `production` (plain text, not secret). Test with a Sandbox
      account on the TestFlight build.
      ⚠️ Both subscriptions carry a TEMPORARY review screenshot (any app screen): replace it with the real
      paywall (Ajustes → habia Pro, plans visible) before submitting the public version for review.
   5. `git checkout build-4`, then `npx eas-cli@latest build --profile production --platform ios`: answer yes when
      EAS offers to set up Push Notifications (it creates the APNs key). Then `npx eas-cli@latest submit --platform ios --latest`.
   6. Once build 4 is on the testers' phones: merge `build-4` into `main`; later OTAs target build 4's fingerprint.
0. **1.5.0 — stability pass after QA (2026-10-02)** (migration `20261002053613_stability_fixes.sql`:
   owner runs `npx supabase db push`). Archived habits keep their past in streak/stats (`useHabitHistory`,
   cut at the archive day); streak window 400 days; logs and circle days page past 1000 rows; blocking hides
   people inside circles; a circle habit's days are locked to the circle; signup language stored (and the
   one affected user fixed); data refetches on returning to the app (`focusManager` + `AppState`); analytics
   get route patterns, not codes; invite links survive signup/onboarding and a missing username is picked on
   the invite screen; cheers open the sender; a circle with a friend opens its invite. UI: detailed cards on
   Tus círculos, sticky habit preview, identity below time, full-width icon grid, branch habits editable from
   the identity. Plus ~15 smaller fixes (timers, FAB, rest-day copy, garden clouds, pending friends, per-account
   storage keys, AI toggle, weekly review across weeks).
0. **1.4.0 — one place per thing** (JS only): 🔥 opens your personal streak only; 🫂 opens **Tus círculos** (`src/app/circles.tsx`), the only place to see, create and join circles, each card with its group streak flame. **1:1 shared streaks are gone** (`computeSharedStreak`, the streak tabs and `SharedStreaksPanel` removed): a streak with a friend is a circle of two (the friend page offers "Crear un círculo con …"), so every streak with others is a shared habit and gets photos in build 4. Profile no longer lists circles; friends fold into "Tienes N amigos" (`FriendRow`), leaving room for achievements and the character.
0. **1.3.2 — one habit per circle** (migration `20261001232448_circle_one_habit.sql`, owner runs `npx supabase db push`; it ends extra shared habits, keeping the oldest). Another habit = another circle. The circle card has one ranking with Esta semana | 30 días | General (up to a year of days); tapping a face or a row opens that person's profile (add as friend). The owner can end the circle's habit (members keep theirs, unlinked); leaving asks whether to keep or archive your linked habit — never deleted. Top bar is now 🔥 streak · 🫂 circles (→ Profile) · 🌱 seeds (→ Garden). Test friends: `supabase/seed/test-friends.sql` (applied 2026-10-02: 4 friends + a pending request from test_carlos; removed by test-cleanup.sql).
0. **1.3.1 — circle polish:** shared habit card shows today first (big "3/8": red below the threshold, yellow once saved, green at 80 %+; everyone's face lit with ✓ once done) and each person's 30-day consistency as an animated ranking (`consistency-ranking.tsx`, also for the circle's week); the dot grids are gone. Streak tab circles show 🔥 N on the card (lit once today is saved). Shared habits on Today carry a lavender "🤝 circle" tag and edge. Only the circle owner can remove people (RLS + UI).
0. **1.3.0 — shared circle habits** (built 2026-10-02, JS + migration `20261001220811_circle_habits.sql`,
   fingerprint `f15932ef…`). Owner steps: `npx supabase db push`; optional test data
   `npx supabase db query --linked -f supabase/seed/test-circle.sql` (6 fake `@habia.test` people in a private
   "Test · Familia" circle you own; remove with `supabase/seed/test-cleanup.sql`); `git push`; OTA 1.3.0.
   The circle owner defines a habit (daily or fixed weekdays); joining adds a normal habit to your Today
   linked by `habits.circle_habit_id` (shows "🤝 <circle>"). The group day counts when at least half of the
   joined, non-resting members did it (everyone when ≤ 2), never-miss-twice streak, consistency this week vs
   last, "regaron por todos" names only who did it (`circle-habit-streak.ts`). Only that habit's daily state
   is shared (`circle_habit_members` / `circle_habit_days`). A server-stamped `logged_at` waits for photos (build 4). **Leagues dropped** (2026-10-02): strangers' rankings don't motivate; circles do.
   **Phase B = build 4:** optional photo per shared habit (camera only, deleted after 7 days, reportable),
   push for cheers / requests / "Ana already walked", RevenueCat.
1. **1.2.0 — identity as "becoming", Profile, streaks with friends, goals timeline** (built 2026-10-01,
   JS + one data migration, fingerprint `f15932ef…`). Owner steps: `npx supabase db push` (applies
   `20261001190801_identity_becoming.sql`: "Soy una persona que X" and bare endings become "una persona
   que X"; validated in BEGIN … ROLLBACK), `npx supabase functions deploy weekly-review` (prompt speaks
   of "becoming"), `git push`, OTA 1.2.0. What changed: identity form "Me estoy convirtiendo en…", habit
   form "Este hábito me ayuda a convertirme en…", Garden captions "Convirtiéndome en"; a new identity
   celebration on Today (card rising from the bottom in the branch color, seeds turning into leaves) when
   a check-in finishes all of an identity's ≥2 items today (`completed-identity.ts`; the day's confetti
   wins on the same tap); the Friends tab is **Profile** again with a real "⚙️ Ajustes" button; the streak
   screen has **Personal | Con amigos** tabs (best shared streak, friends, circles) and a horizontal goals
   timeline with 4 nearby milestones (`milestone-window.ts`).
1b. **Friends & circles → 1.1.0** (shipped 2026-10-01, migration applied). Owner steps, done:
   1. `npx supabase db push` (applies `20261001180242_social.sql`), then
      `npx supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts`
      (types were hand-written to match; the diff should be empty or cosmetic) and
      `npx supabase db query --linked -f supabase/tests/social-rls.sql` → `ALL SOCIAL RLS CHECKS PASSED`.
   2. Push to GitHub so Vercel deploys `web/` (AASA `/add/*` + `/join/*`, `/invite` fallback page).
      iOS refreshes the AASA through Apple's CDN (hours to days); until then links open the page,
      whose button opens the app.
   3. Ship 1.1.0 by OTA, then test with a second account (another email, on web or a tester's phone):
      username, request by @, accept, cheer, circle by code, block, report.
   Design: the Profile tab holds your card first, then friends and circles (⚙️ Ajustes = the old profile).
   Friends see only `social_profiles` (name, color, a stats snapshot your app publishes) and
   `social_days()` (which days you planted or rested, computed by the server from `habit_logs`);
   never habits. Shared streak (`src/features/social/shared-days.ts`): grows on days both planted,
   a lone day is a wait, two in a row reset it, rest days are neutral. Circles have no group streak
   (weekly grid + "days everyone planted"). Cheers are 5 presets, one of each per pair per day.
   Pushes for cheers/requests are the next step: check that build 3 can get an Expo push token
   (aps-environment + APNs key in EAS); if not, it needs build 4.
2. **Character art:** the owner draws the parts following `docs/CHARACTER-ART.md` (batch 1 = 13
   SVGs into `art/character/`); then compose them in code (react-native-svg + Reanimated, no Rive)
   and replace `SocialAvatar`.
3. **Ship 1.0.13 by OTA** — superseded by 1.1.0 (it includes it). For the record (check the fingerprint is `f15932ef…` first). Since 1.0.8: crash fix for
   reopening the app (1.0.10, JSON-safe cache), root error screen (1.0.9), Progress polish (2×2 tiles,
   Brote's review as a green-framed card, visual standout-habit cards), and the **Garden as the
   identity space** (1.0.13): "¿Quién te estás volviendo?", one card per branch (identity) with this
   week's seeds and its habits, "Semillas sin rama" to link a habit to an identity in one tap, and an
   empty state that explains identities. Per-habit numbers left the Garden (they live in Progress).
   Next for the Garden: the character (plant avatar) and 💧 drops; maybe a 🌱→🌸→🍎 harvest.
4. **External testers:** waiting for Beta App Review of the "Beta pública" group (demo account in
   App Store Connect; never delete it). When approved: enable the public link with a tester limit.
   The App Privacy questionnaire is only needed for the App Store, not TestFlight.
5. **After the weekly review proves useful:** capped chat with Brote (Pro), server pushes
   (push-dispatcher reusing `_shared/` and `local_today`), and moving reviews to the Batch API
   (50 % cheaper) once a cron writes them for everyone instead of on first open.
6. **Coach, shaped by tester data** (PostHog: `coach_tip_*` events per rule): habits that
   pull each other (co-occurrence, worded as observation), seeds per identity, 👍/👎 per tip,
   rule-based Monday mini-review.
7. Then, in this order (ROADMAP → "Order after Block 2"): **your character** (art in progress) →
   opt-in **leagues** → **monetization**, all before the public launch.
   Start the "can a Colombian individual use Stripe?" question early (calendar weeks, not code),
   and the legal review (jurisdiction, EU opt-in for analytics).

**AI weekly review (1.0.6):** opt-in (`profiles.ai_coach_enabled`, default off; Profile switch or a
one-time offer on Today). Edge Function `weekly-review` computes last finished week in the user's
zone with the app's own engine (`supabase/functions/_shared/`, synced by `node scripts/sync-shared.js`;
a test fails on drift), Claude only writes the words (title / win / pattern / suggestion, structured
output), stored in `coach_messages` (RLS: owner reads, marks seen; only the service role inserts).
Today's slot: catch-up > weekly review > north-star > cheers from friends > coach tip.

**North-star question:** "¿Sientes que habia te está ayudando a mejorar tu día a día?" (1–5 faces)
in the Today prompt slot, after 7 days from onboarding, then every 14 days ("Ahora no" = 3 days);
only when PostHog is configured and not opted out. Event `north_star_answered { score }` —
read it in PostHog as the product's success metric (trend per user and cohort). Its schedule is
stored per account but per device (`habia.northStar.<userId>`): a user on iPhone and web is asked on both.

## Known debts

- **Decided in 1.5.0:** two people who block each other inside a shared circle each compute the group's
  threshold without the other, so they may see slightly different group streaks (privacy wins). The locale
  backfill moved signups made in English to `en`; someone who later picked Spanish on purpose was
  indistinguishable from the old default. To try on the iPhone: an invite link opened while signed out,
  then sign in (it opens ~0.3 s after the tabs appear); "Crear un círculo con …" opens the share sheet
  ~0.5 s after the circle appears.

- **Social:** `social_days()` only knows logs, so a day with nothing scheduled looks like a miss in
  shared streaks and circle grids ("never miss twice" absorbs one). The stats snapshot is as fresh as
  the friend's last app open ("Actualizado hace N días"). Shared streaks read 60 days ("60+").
  Social writes are online-only on purpose (`networkMode: 'always'`): offline they fail with a
  message instead of queueing. No pushes yet; reports are reviewed by hand in the dashboard
  (`public.reports`). Circle invite codes are 8 hex chars (32 bits) with no join rate limit: fine
  for now, revisit with scale. Avatars are Brote on the person's color until the character exists.

- **Persisted query data must be JSON-safe** (`src/lib/query/client.ts` persists the cache as JSON):
  never return a Map, Set or Date from a `queryFn`. A Map came back as `{}` after a restart and crashed
  1.0.6–1.0.9 on reopening the app (`useCompletions`, fixed in 1.0.10). The root `ErrorBoundary` (1.0.9)
  showed the error on screen; keep it.
- **The native fingerprint includes `.gitignore`** (and `eas.json`, `app.json`, assets, native
  packages). Editing any of them moves the runtime version, and OTA updates stop reaching build 3:
  on 2026-10-01 a one-line `.gitignore` change sent the first 1.0.6 update to runtime `847d838…`,
  which no binary has. Before an OTA, `npx expo-updates fingerprint:generate --platform ios` must
  print `f15932ef…` (build 3).

- **Windows:** the streak reads its own 400 days of logs (fixed in 1.5.0; it froze at 121), the garden
  and stats 120. Past 400 days the record lives in `profiles.best_streak`. Every list query that can
  pass 1000 rows must page (PostgREST `max_rows` cuts silently): `useLogs` and `circle_habit_days` do.

- Three near-identical Chip components (habit form, identity form, onboarding): move one to
  `src/components/` when a fourth appears. White-on-pastel chip text can be low contrast.

- **Web previews must not use the real env**: export with `EXPO_NO_DOTENV=1` + fake Supabase vars, or a
  preview error reaches the owner's Sentry (it happened on 2026-10-01).
- Web previews: Metro caches inlined `EXPO_PUBLIC_*` values; after changing env vars, export with
  `--clear`. (The PostHog web crash is fixed: `customStorage` on web, `src/lib/analytics.ts`.)
- Coach: `coach_tip_shown` fires on every Today mount (read it as impressions, not once per tip).
  Time-aware tips (`usual_time`, `agenda`) are only evaluated when a band's tip is first pinned,
  so opening the app late in a band can miss them. Dismissing hides the tip for that band only (up
  to 3 tips a day): watch whether testers find it insistent. Just after midnight the band is still
  "night" but `today` has changed, so last night's unchecked habits already count as misses.
  Untested edge: a cold start with persisted logs could pin the day's tip before the refetch.

- **Skia risk:** Shopify announced (2026-09-10) it is leaving React Native; it sponsors
  `@shopify/react-native-skia` only through end of 2026, then its creator forks it. Re-check the
  fork's health at the next Expo SDK upgrade; plan B is redrawing the tree with
  `react-native-svg` + Reanimated (`src/features/garden/`).
- Sentry token rotated on 2026-09-30: both old tokens return `401 Invalid org token`; the new
  one lives only in EAS (secret, unreadable) and is first exercised by the next production build
  (source map upload). Owner believes the `test.js` bundle was deleted (Sentry → Projects →
  habia → Source Maps); not verified.
- **Secrets in EAS:** never type them into the masked prompt of `eas env:create`/`env:set` — on
  2026-09-30 it stored a wrong value and the build failed with a Sentry `400`. Use
  `--value (Get-Clipboard)` after checking the token with sentry-cli.
- The iOS development build lacks the associated domain; rebuild it (`--profile development`)
  when native work resumes, so auth links open it directly.
- Email language is stored at sign-up only (`src/features/auth/api.ts`); changing the app
  language later does not update `user_metadata.language`.
- The actions sheet's scrim slides up with the sheet (`animationType="slide"`); cosmetic.
- `guard-paths` hook covers Write/Edit only, not Bash, and its `.env` rule also blocks the
  committed template `.env.example`.
- The app's "today" still comes from the device clock; the server uses `profiles.timezone`
  (`_shared/zoned.ts`, SQL `public.local_today`). They agree while the app keeps the timezone
  in sync (`use-timezone-sync.ts`).
- AI weekly review: generated on the first Today visit of a new week (no cron yet), one per user and
  week; not yet tested end to end against Claude (no key during the build). Free for now (Pro later).
  If a review fails, the app retries on the next launch (a persistent refusal would retry every
  launch). `public.local_today` (SQL) has no caller yet: it is for the future push-dispatcher cron.
  If the device zone differs from `profiles.timezone` (travel), app and server may disagree on
  "last week" until the zone syncs.
- Sign in with Apple / Google not implemented. Not required today: App Store guideline 4.8 asks for
  Sign in with Apple only when the app offers a third-party login (Google, Facebook…), so adding
  Google means adding Apple too.
- Web billing: Stripe may not accept a Colombian individual — check before Phase 4 (ROADMAP).
- Garden aggregates are computed on the client over 120 days; move to a Postgres RPC when log
  volume grows. `garden_state` table is unused.
- Legal: jurisdiction (Colombia) unconfirmed, no lawyer review; analytics is opt-out (EU users
  would need opt-in).
- `assets/dns.png` and `.claude/screenshots/android.jfif` were committed by mistake
  (`git rm --cached` them); the owner's git email has a typo (`gmal.com`). Commit `255ded7`
  has a Spanish message (convention: English).

## Only the user can do these

- Register any EAS secret (via `--value (Get-Clipboard)`, never the masked prompt).
- Invite TestFlight testers; answer App Store Connect questionnaires (privacy "nutrition labels").
- Draw the character's SVG parts (`docs/CHARACTER-ART.md`, templates in `art/character/`).
- Apply the `social` migration (`npx supabase db push`) and review `public.reports` from time to time.
- Apple Developer renews yearly (US$99, next 2027-09-28). Google Play (US$25 one-off) can wait
  until there are Android testers.

---

**Maintenance:** update this file at the end of every working block (skill `/cerrar-sesion`).
A stale STATUS is worse than none: the next session trusts it.
