# Architecture

```
Expo app (iOS / Android / Web)
 ├─ Expo Router tabs: Hoy · Semana · Jardín · Coach · Perfil
 ├─ TanStack Query ⇄ supabase-js (Auth + Postgres through RLS)
 ├─ Recurrence engine (rrule) → occurrences for today / this week
 ├─ Local notification scheduler (expo-notifications)
 └─ Skia (tree, sky, charts)

Supabase
 ├─ Postgres + RLS (owner-based; couple-based in Phase 5)
 ├─ Edge Functions: coach (Claude API), push-dispatcher, weekly-review (cron), revenuecat-webhook
 └─ Realtime: couple channel

RevenueCat ⇄ App Store / Play Store / Stripe → webhook → entitlements table
```

## Data model (see `supabase/migrations/`)
- `profiles`: timezone, locale, day-band hours (morning/afternoon/night), week start. Created on signup by trigger.
- `identities`: "Soy una persona que…" statements (tree branches).
- `habits`: name, icon, color, identity, `rrule`, time window, `two_minute_version`, `cue_type` (time | after_habit | context), `anchor_habit_id`, `context_label`, `implementation_intention`, `temptation_bundle`, `reminder_minutes_before` (NULL = no reminder).
- `habit_logs`: one row per answered occurrence (`done`, `done_minimum`, `skipped`, `missed`), unique on (habit_id, occurrence_at).
- `garden_state`: votes, stage, health. Client read-only; written server-side.

Planned:
- `push_tokens`, quiet hours
- `entitlements` (Phase 4)
- `couples`, `couple_members`, `shared_habits`, `cheers` (Phase 5)
- `coach_messages` (Phase 3)

## Key decisions
- **Occurrences are computed, not stored.** Habits store an RRULE; the client expands it for the visible range. Only answers (logs) are persisted.
- **Offline-first (basic):** persisted TanStack Query cache + optimistic mutations. Migrate to PowerSync if multi-device conflicts become a problem.
- **Reminders:** time-based reminders are scheduled locally (they work offline). `useReminderSync` replaces all pending notifications with the next 3 days of timed, not-yet-done occurrences (max 60, under the iOS limit of 64). Context, coach and partner notifications are sent as push from Edge Functions.
- **Payments:** in-app purchases are mandatory on iOS/Android; RevenueCat unifies them with Stripe on web.
