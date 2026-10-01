# STATUS — where the project stands

**Last updated: 2026-09-30.** This is the session entry point: a `SessionStart` hook injects it
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
  launch, applies on the next). Profile now ends with `habia 1.0.0 (3) · <update id>` (or
  "de fábrica" for the JS embedded in the binary), the way to tell which JS a phone runs.
- **EAS env `production`:** the five `EXPO_PUBLIC_*` plus `SENTRY_AUTH_TOKEN` (secret). Production
  builds upload JS source maps and dSYMs to Sentry `clavolab/habia`.
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
| AI coach, character, friends, leagues, paywall | ⏳ not started | — |

## Technical state

- Expo SDK 57 (`expo ~57.0.26`, React Native 0.86.3), Expo Router, TypeScript strict. All SDK
  patch versions current (`npx expo install --check`), `expo-doctor` 21/21.
- Supabase cloud project "Habits Project" (no local Docker). 6 migrations applied; RLS on every
  table. Auth `site_url`, redirect allow-list and email templates ship with
  `npx supabase config push`; SMTP and the email rate limit (30/h) live only in the dashboard.
- Skia 2.6.2 + Reanimated 4.5.1 for the tree; `react-native-svg` for charts and the mascot.
- TanStack Query 5 (persisted 7 days) + Zustand. Sentry `@sentry/react-native` 7, PostHog RN 4.
- `web/`: Astro 7 static site, excluded from the app's tsconfig, ESLint and Metro; pins its own
  tsconfig in `astro.config.mjs` (Vercel installs only `web/` dependencies). `vercel.json` serves
  the AASA as JSON. Apex `habia.app` is primary (`www` redirects to it).
- Verification baseline: **89 tests / 12 suites green**, typecheck clean, lint clean, site builds
  7 pages. Typecheck ~8 s, tests ~8 s, lint ~25 s on this machine.
- CI (typecheck + lint + tests) runs on push and PRs to `main`. Repo: `clavijojuanpablo/habia`.
- Shipping: JS-only change → `eas update --channel production --environment production --platform ios --non-interactive --message "…"`
  (~1 min; drop `--platform ios` once Android testers exist; without `--non-interactive` it once
  sat for 20+ min on a silent prompt);
  native change (fingerprint moves) → `eas build --profile production --platform ios` →
  `eas submit --platform ios --latest`. EAS CLI is not installed globally: run every `eas …`
  here as `npx eas-cli@latest …` (bare `eas` fails in PowerShell). Estimate for the five post-TestFlight blocks
  (2026-09-30): ~145–245 h of code plus character art and admin; re-estimate after the AI coach.

## Next steps

**Start here — finish Block 2, then the AI coach.**

1. **External testers:** public TestFlight link (Apple beta review), App Store Connect privacy
   questionnaire (privacy URL `https://habia.app/privacidad`).
2. Then, in this order (ROADMAP → "Order after Block 2"): **AI coach** → **your character** →
   **friends & circles** → opt-in **leagues** → **monetization**, all before the public launch.
   Plus the north-star self-report (PostHog survey). Start the "can a Colombian individual use
   Stripe?" question early: it takes calendar weeks, not code.

## Known debts

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
- `profiles.timezone` is synced but nothing reads it yet: "today" still comes from the device
  clock. Needed once the server sends pushes (push-dispatcher, coach).
- Sign in with Apple / Google not implemented (required-ish for App Store review polish).
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
- Design the character's layered SVG parts (spec in GAMIFICATION.md).
- Apple Developer renews yearly (US$99, next 2027-09-28). Google Play (US$25 one-off) can wait
  until there are Android testers.

---

**Maintenance:** update this file at the end of every working block (skill `/cerrar-sesion`).
A stale STATUS is worse than none: the next session trusts it.
