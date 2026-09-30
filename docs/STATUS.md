# STATUS — where the project stands

**Last updated: 2026-09-29.** This is the session entry point: a `SessionStart` hook injects it
into every new Claude Code session. Keep it short and true. `ROADMAP.md` is the full backlog;
this file is only "today".

---

## Right now

**habia** is a feature-complete personal habit tracker (sign up, onboarding, habits with any
supported recurrence, online/offline check-ins, Identity Tree, stats, local reminders; es/en,
light/dark; iOS, Android, web) running on the linked Supabase cloud project. Nothing ships to a
store yet, but the groundwork for testers is done:

- **iOS development build on the owner's iPhone** (Apple Developer approved 2026-09-29; EAS holds
  the distribution certificate, provisioning profile and APNs key). Every pending phone test
  passed: reminder tap (background and killed) focuses the habit on Hoy, rest day, offline replay,
  haptics, icon/splash, password-reset deep link.
- **Hoy:** tapping a habit opens an actions sheet (done · 2-minute version · rest day · edit),
  taught once by a Brote tip. The time picker allows any minute and follows the device's 12/24 h.
- **Observability:** Sentry (crashes only, off in `__DEV__`) and PostHog (closed event list in
  `src/lib/analytics.ts`, internal user id, opt-out in Profile). PostHog events verified live.
- **Domain `habia.app`** (Hostinger DNS): site on Vercel (`web/`, Astro) with home + legal pages
  es/en that import `src/features/legal/content.ts`; auth emails branded es/en, sent from
  `hola@habia.app` through Resend SMTP (the Hostinger mailbox keeps its own MX records).

Use the dev build, not Expo Go: `npx expo start --tunnel` (the owner's phone is on Wi-Fi, the PC
on Ethernet). Rebuild (`eas build --profile development --platform ios`) only after native changes.

## How to resume

1. Read this file (the hook already injected it).
2. `docs/ROADMAP.md` for the long view, `docs/PRD.md` for scope decisions.
3. `CLAUDE.md` for conventions, `docs/ARCHITECTURE.md` for the data model.
4. Start with the first item under **Next steps**.

---

## What works today

| Area | State | Lives in |
| --- | --- | --- |
| Auth (email + password, reset, PKCE deep links, account deletion, branded emails) | ✅ | `src/features/auth/`, `supabase/templates/`, `supabase/functions/delete-account/` |
| Onboarding (5 steps, creates identity + first habit) | ✅ | `src/features/onboarding/` |
| Habits CRUD, RRULE builder, 2-minute version, stacking, context cues | ✅ | `src/features/habits/`, `src/lib/recurrence/` |
| Today + Week views, day bands, check-in rules, actions sheet | ✅ | `src/app/(tabs)/`, `src/features/schedule/`, `src/features/checkins/` |
| Identity Tree (Skia) + Garden tab | ✅ | `src/features/garden/` |
| Streaks ("never miss twice") + Progress tab | ✅ | `src/features/streak/`, `src/features/stats/` |
| Local reminders (native only), tap focuses the habit | ✅ | `src/features/reminders/` |
| Offline: persisted cache, queued check-ins replayed after restart | ✅ | `src/lib/query/`, `src/lib/network*.ts` |
| Crash reporting (Sentry) + analytics (PostHog, opt-out) | ✅ | `src/lib/crash-reporting.ts`, `src/lib/analytics.ts` |
| Design system, dark mode, language picker, Brote mascot, app icons | ✅ | `src/constants/theme.ts`, `src/features/appearance/`, `src/features/mascot/` |
| Legal texts (es/en), also at habia.app/privacidad and /terminos | ✅ | `src/features/legal/content.ts`, `web/` |
| Marketing site habia.app (Astro, Vercel, root dir `web`) | ✅ | `web/` |
| AI coach, couples, paywall | ⏳ not started | — |

## Technical state

- Expo SDK 57 (`expo ~57.0.24`, React Native 0.86.3), Expo Router, TypeScript strict.
- Supabase cloud project "Habits Project" (no local Docker). 6 migrations applied; RLS on every
  table. Auth email templates ship with `npx supabase config push`; SMTP and the email rate limit
  (30/h) live only in the dashboard.
- Skia 2.6.2 + Reanimated 4.5.1 for the tree; `react-native-svg` for charts and the mascot.
- TanStack Query 5 (persisted 7 days) + Zustand. Sentry `@sentry/react-native` 7, PostHog RN 4.
- `web/`: Astro 7 static site, excluded from the app's tsconfig, ESLint and Metro; pins its own
  tsconfig in `astro.config.mjs` (Vercel installs only `web/` dependencies).
- Verification baseline: **89 tests / 12 suites green**, typecheck clean, lint clean, site builds
  6 pages. Typecheck ~8 s, tests ~7 s, lint ~25 s on this machine.
- CI (typecheck + lint + tests) runs on push and PRs to `main`. Repo: `clavijojuanpablo/habia`.
- Project hooks run from `${CLAUDE_PROJECT_DIR}` (they used to break in subfolders).

## Next steps

**Start here — TestFlight (Block 2).** One production build that carries everything native:

1. **Universal Links**, in the same build: `web/public/.well-known/apple-app-site-association`
   (needs the Apple **Team ID** from developer.apple.com → Membership), `associatedDomains:
   ["applinks:habia.app"]` in `app.json`, email links to `https://habia.app/auth-callback` with a
   web fallback page ("open this on your phone"). Fixes the Chrome detour on iPhone and the blank
   page when the email is opened on a computer.
2. **Production env in EAS:** every `EXPO_PUBLIC_*` (Supabase, Sentry DSN, PostHog) via
   `eas env:create`, plus `SENTRY_AUTH_TOKEN` as a secret (the owner has it; never paste it in
   chat). Add Sentry `organization`/`project` slugs to the plugin in `app.json` (ask the owner).
   `SENTRY_DISABLE_AUTO_UPLOAD` stays only in the development/preview profiles.
3. **`expo-updates`** (runtime versions) so JS fixes reach testers without a store build.
4. `eas build --profile production --platform ios` → `eas submit` → TestFlight internal, then
   external testers (App Store Connect needs the privacy URL: `https://habia.app/privacidad`).
5. Then, in this order (ROADMAP → "Order after Block 2"): **AI coach** → **your character**
   (design open; the owner will design layered SVG assets outside — spec in GAMIFICATION.md) →
   **friends & circles** with shared streaks → opt-in **leagues** → **monetization** (Pro + cosmetics),
   all before the public launch. Plus the north-star self-report (PostHog survey).

## Known debts

- **Skia risk:** Shopify announced (2026-09-10) it is leaving React Native; it sponsors
  `@shopify/react-native-skia` only through end of 2026, then its creator forks it. Re-check the
  fork's health at the next Expo SDK upgrade; plan B is redrawing the tree with
  `react-native-svg` + Reanimated (`src/features/garden/`).
- Vercel redirects `habia.app` → `www.habia.app`, but the site's canonical URLs are the apex.
  Flip it in Vercel (apex primary, `www` → apex) — the owner may have done it already.
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
  (`git rm --cached` them); the owner's git email has a typo (`gmal.com`).

## Only the user can do these

- Apple Team ID (for Universal Links) and Sentry org/project slugs (for source maps).
- Register EAS env vars and the Sentry token as secrets.
- Invite TestFlight testers; answer App Store Connect questionnaires (privacy "nutrition labels").
- Apple Developer renews yearly (US$99, next 2027-09-28). Google Play (US$25 one-off) can wait
  until there are Android testers.

---

**Maintenance:** update this file at the end of every working block (skill `/cerrar-sesion`).
A stale STATUS is worse than none: the next session trusts it.
