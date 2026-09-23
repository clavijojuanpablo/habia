# STATUS — where the project stands

**Last updated: 2026-09-23.** This is the session entry point: a `SessionStart` hook injects it
into every new Claude Code session. Keep it short and true. `ROADMAP.md` is the full backlog;
this file is only "today".

---

## Right now

**habia** is a feature-complete personal habit tracker: you can sign up, onboard, create habits
with any supported recurrence, check them in (online or offline), watch the Identity Tree grow,
read your stats, and get local reminders — in Spanish or English, light or dark, on iOS, Android
and web. It runs on the linked Supabase cloud project; nothing ships to a store yet.

The last block finished the "ready for real users" polish: check-ins on future days are locked,
the week view cannot browse before your join date, times are picked (never typed) and shown in
the user's locale, and privacy policy + terms exist in both languages.

**What is missing is not features — it is distribution and feedback:** no development build, no
testers, no error tracking, no analytics, no monetization.

## How to resume

1. Read this file (the hook already injected it).
2. `docs/ROADMAP.md` for the long view, `docs/PRD.md` for scope decisions.
3. `CLAUDE.md` for conventions, `docs/ARCHITECTURE.md` for the data model.
4. Start with the first item under **Next steps**.

---

## What works today

| Area | State | Lives in |
| --- | --- | --- |
| Auth (email + password, reset, PKCE deep links, account deletion) | ✅ | `src/features/auth/`, `supabase/functions/delete-account/` |
| Onboarding (5 steps, creates identity + first habit) | ✅ | `src/features/onboarding/` |
| Habits CRUD, RRULE builder, 2-minute version, stacking, context cues | ✅ | `src/features/habits/`, `src/lib/recurrence/` |
| Today + Week views, day bands, check-in rules | ✅ | `src/app/(tabs)/`, `src/features/schedule/`, `src/features/checkins/` |
| Identity Tree (Skia) + Garden tab | ✅ | `src/features/garden/` |
| Streaks ("never miss twice") + Progress tab | ✅ | `src/features/streak/`, `src/features/stats/` |
| Local reminders (native only) | ✅ | `src/features/reminders/` |
| Offline: persisted cache, queued check-ins replayed after restart | ✅ | `src/lib/query/`, `src/lib/network*.ts` |
| Design system, dark mode, language picker, Brote mascot, app icons | ✅ | `src/constants/theme.ts`, `src/features/appearance/`, `src/features/mascot/` |
| Legal texts (es/en) | ✅ | `src/features/legal/content.ts` |
| AI coach, couples, paywall | ⏳ not started | — |

## Technical state

- Expo SDK 57 (`expo ~57.0.24`, React Native 0.86.3), Expo Router, TypeScript strict.
- Supabase cloud project "Habits Project" (no local Docker). 6 migrations applied; RLS on every table.
- Skia 2.6.2 + Reanimated 4.5.1 for the tree; `react-native-svg` for charts and the mascot.
- TanStack Query 5 (persisted 7 days) + Zustand.
- Verification baseline: **86 tests / 12 suites green**, typecheck clean, lint clean.
  Typecheck ~8 s, tests ~7 s, lint ~25 s on this machine.
- CI (typecheck + lint + tests) runs on push and PRs to `main`. Repo: `clavijojuanpablo/habia`.

## Next steps

**Start here — Block 2, "beta testers".** The app cannot improve further without real usage data.

1. **EAS project + development build.** `npx eas-cli@latest build --profile development` for Android
   first (no Mac needed, faster loop). Needed to test notifications, haptics and offline on a real
   phone — Expo Go cannot do all of it.
2. **TestFlight + Play Internal Testing.** Get 5–10 testers using it daily.
3. **Sentry + PostHog.** Without them, a crash on a tester's phone is invisible. Instrument the
   north-star metric (users reporting real improvement) and D1/D7/D30 retention.
4. Then: Phase 4 monetization (RevenueCat + Stripe paywall), Phase 3B Pro value (guided programs +
   AI coach), Phase 5 couples. See `docs/ROADMAP.md`.

## Known debts

- `profiles.timezone` exists but the client still computes "today" from the device clock.
- Tapping a notification does not open the habit it refers to.
- Sign in with Apple / Google not implemented (required-ish for App Store review polish).
- "Skip a day" (rest day marked on purpose) is designed but not built.
- Garden aggregates are computed on the client over 120 days; move to a Postgres RPC when log
  volume grows. `garden_state` table is unused.
- Legal: `CONTACT_EMAIL = 'hola@habia.app'` is a placeholder, jurisdiction (Colombia) unconfirmed,
  no lawyer review, texts not published at public URLs.

## Only the user can do these

- Run the app on a real phone: notifications, haptics, offline flow, app icon and splash after restart.
- Check the password-reset email link end to end.
- Delete a test account from Profile and confirm the data is gone.
- Apple Developer (US$99/year) and Google Play (US$25 one-off) accounts before any store release.

---

**Maintenance:** update this file at the end of every working block (skill `/cerrar-sesion`).
A stale STATUS is worse than none: the next session trusts it.
