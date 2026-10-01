# Architecture

```
Expo app (iOS / Android / Web)
 ├─ Expo Router tabs: Hoy · Semana · Jardín · Progreso · Perfil (the coach is a daily card on Hoy for now)
 ├─ TanStack Query ⇄ supabase-js (Auth + Postgres through RLS)
 ├─ Recurrence engine (rrule) → occurrences for today / this week
 ├─ Local notification scheduler (expo-notifications)
 ├─ Skia (tree, sky); charts are Views + react-native-svg
 ├─ Sentry: crashes and errors only, user = internal id (src/lib/crash-reporting.ts)
 └─ PostHog: closed event list, user = internal id, opt-out in Profile (src/lib/analytics.ts)

Supabase
 ├─ Postgres + RLS (owner-based; couple-based in Phase 5)
 ├─ Auth emails: templates in supabase/templates/ → Resend SMTP → from hola@habia.app
 ├─ Edge Functions: delete-account, weekly-review (Claude); planned: coach chat, push-dispatcher, revenuecat-webhook
 │    └─ _shared/: the app's pure modules (recurrence, zoned time, weekly summary), copied by scripts/sync-shared.js
 └─ Realtime: couple channel

habia.app (DNS at Hostinger)
 ├─ @ / www → Vercel: web/ (Astro static site; legal pages import src/features/legal/content.ts)
 ├─ send.* + resend._domainkey → Resend (sending)
 └─ MX / SPF / DKIM → Hostinger mailbox (hola@habia.app, receiving)

RevenueCat ⇄ App Store / Play Store / Stripe → webhook → entitlements table
```

## Data model (see `supabase/migrations/`)
- `profiles`: timezone, locale, day-band hours (morning/afternoon/night), week start. Created on signup by trigger.
- `identities`: "Soy una persona que…" statements (tree branches).
- `habits`: name, icon, color, identity, `rrule`, time window, `two_minute_version`, `cue_type` (time | after_habit | context), `anchor_habit_id`, `context_label`, `implementation_intention`, `temptation_bundle`, `reminder_minutes_before` (NULL = no reminder).
- `habit_logs`: one row per answered occurrence (`done`, `done_minimum`, `skipped`, `missed`), unique on (habit_id, occurrence_at).
- `garden_state`: votes, stage, health. Client read-only; written server-side.
- `habit_completion_counts` (view, `security_invoker`, so RLS applies): all-time completions per habit, for fruit. `profiles.best_streak`: the stored streak record.
- Social (`20261001180242_social.sql`): `social_profiles` (username, name, color, `stats` snapshot published by the owner's app), `friendships` (one row per pair, `user_a < user_b`, pending/accepted), `circles` + `circle_members` (≤ 8, ownership passes on), `cheers` (5 presets, one per kind per pair per day), `blocks`, `reports`. Friends and circle mates read only these plus `social_days(users, since)`, a SECURITY DEFINER function that returns which local days each visible person planted or rested — habits and logs stay owner-only. Requests, joining, blocking go through RPCs that act as `auth.uid()`; RLS helpers (`are_connected`, `can_see_profile`, `is_blocked`, `is_circle_member/owner`) are SECURITY DEFINER to avoid policy recursion and live in the `private` schema, which the API does not expose (in `public` they would be callable as `/rpc/*` and leak who is friends with or blocked whom). Removing a circle member rotates its invite code. Tested by `supabase/tests/social-rls.sql`.
- `coach_messages`: server-written coach messages (`weekly_review` today), one per user, kind and `period_start`; owners read and set `seen_at` only. `profiles.ai_coach_enabled` is the opt-in.

Planned:
- `push_tokens`, quiet hours
- `entitlements` (Phase 4)
- `couples`, `couple_members`, `shared_habits`, `cheers` (Phase 5)

## Key decisions
- **Check-in rules (`src/features/checkins/rules.ts`):** today and past days can be logged (catching up), tomorrow and beyond cannot; the week view stops at the week the user joined (`profiles.created_at`). Enforced in `useSchedule` so no screen can bypass it, and reflected in the UI (locked chips, disabled arrow).
- **Occurrences are computed, not stored.** Habits store an RRULE; the client expands it for the visible range. Only answers (logs) are persisted.
- **Offline-first (basic):** the TanStack Query cache is persisted to disk (`src/lib/storage.ts`, 7-day max age) and `onlineManager` is fed by `src/lib/network.ts` (expo-network on native, `navigator.onLine` on web). Check-ins are optimistic; offline they pause and resume automatically, surviving restarts because their `mutationFn` is registered by mutation key (`TOGGLE_LOG_KEY`). Migrate to PowerSync if multi-device conflicts become a problem.
- **Time zones on the server:** the recurrence engine works in local wall-clock time. On the server (UTC) every instant is converted to the user's `profiles.timezone` as a "floating" Date (`src/lib/time/zoned.ts`), so the same engine and the same week boundaries apply. SQL has `public.local_today(tz)` for jobs.
- **Reminders:** time-based reminders are scheduled locally (they work offline). `useReminderSync` replaces all pending notifications with the next 3 days of timed, not-yet-done occurrences (max 60, under the iOS limit of 64). Context, coach and partner notifications are sent as push from Edge Functions.
- **Payments:** in-app purchases are mandatory on iOS/Android; RevenueCat unifies them with Stripe on web.
