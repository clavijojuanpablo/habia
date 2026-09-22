@AGENTS.md

# Habits app (working name — brand TBD, see docs/BRAND.md)

A visual, gamified habit tracker grounded in *Atomic Habits* (James Clear) and habit-formation research. Built first for personal use, designed from day one to become a subscription SaaS on the App Store, Play Store and web.

**North star:** users see real, measurable improvements in their lifestyle. Every feature must trace back to a mechanism in `docs/SCIENCE.md`.

## Product principles
- Science over gimmicks: the 4 laws (obvious, attractive, easy, satisfying), implementation intentions, habit stacking, the 2-minute rule, "never miss twice", ~66 days to automaticity (never promise "21 days").
- Identity-based: each completion is a "vote" for who the user wants to become. This drives the Identity Tree (`docs/GAMIFICATION.md`).
- Forgiving, not punishing: a single miss never wipes progress. No shame copy, no dark patterns, no manipulative streak anxiety.
- Highly visual and alive: day bands (morning / afternoon / night), animated tree, satisfying check-ins (animation + haptics).

## Stack
- **App:** Expo SDK 57 (React Native 0.86) + Expo Router + TypeScript (strict) — one codebase for iOS, Android and web.
- **Backend:** Supabase (Postgres + RLS, Auth, Realtime, Edge Functions). Migrations in `supabase/migrations/`.
- **Graphics:** `@shopify/react-native-skia` + Reanimated 4 for the garden (on web, Skia loads `public/canvaskit.wasm` on demand via `WithSkiaWeb`). Charts are plain Views + `react-native-svg` (no Skia/wasm needed); heatmap colors come from the validated `HeatmapRamp` in `theme.ts`.
- **Data:** TanStack Query (persisted) for server state, Zustand for UI state.
- **Recurrence:** RFC 5545 RRULE strings (supported subset), expanded on the client by our own engine in `src/lib/recurrence/` (local-time arithmetic, DST-safe).
- **Notifications:** `expo-notifications` (local scheduled reminders; push via Expo Push from Edge Functions).
- **Payments (Phase 4):** RevenueCat (in-app) + Stripe (web).
- **AI coach (Phase 3):** Claude API called only from a Supabase Edge Function — Haiku 4.5 (`claude-haiku-4-5-20251001`) for daily messages, Sonnet 5 (`claude-sonnet-5`) for weekly reviews.
- **Observability:** Sentry + PostHog.

Install libraries with `npx expo install <pkg>` (see AGENTS.md). Libraries with native code that Expo Go does not bundle (e.g. MMKV, RevenueCat) require a development build; Skia, SVG, notifications and SQLite work in Expo Go.

## Commands
```bash
npx expo start               # dev server (w = web, scan QR for device)
npx expo lint                # lint
npx tsc --noEmit             # typecheck
npm test                     # unit tests (jest-expo)
npx supabase migration new <name>
npx supabase db push         # apply migrations to the linked cloud project
npx supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```

The project is linked to the Supabase cloud project "Habits Project" (no local Docker stack). Auth is email + password for now.

## Project structure
```
src/app/                 # Expo Router routes ONLY (screens + _layout.tsx)
src/features/<feature>/  # habits, schedule, garden, stats, coach, reminders, couples, paywall
                         #   each with components/, hooks/, api.ts, types.ts
src/components/          # shared UI primitives
src/lib/                 # supabase client, recurrence engine, i18n, time/day-band utils
src/constants/theme.ts   # design tokens (from Claude Design)
supabase/migrations/     # SQL migrations (source of truth for the schema)
supabase/functions/      # Edge Functions (coach, push-dispatcher, revenuecat-webhook)
docs/                    # product, science, architecture, gamification, brand, roadmap
```

## Conventions
- Code, identifiers, commits and comments in **English**. User-facing copy in **Spanish first, English second**, always via i18n keys — never hardcode UI strings.
- **Every table has RLS enabled** with owner-based policies. Never ship a table without policies.
- **Secrets never reach the client.** Only the Supabase publishable key (`sb_publishable_...`) lives in the app (`EXPO_PUBLIC_*`). Claude API keys, RevenueCat secrets and secret keys (`sb_secret_...`) live in Edge Function secrets.
- Store timestamps in UTC (`timestamptz`); compute day bands and "today" in the user's `profiles.timezone`.
- Schema changes go through a new migration; never edit an applied migration.
- Recurrence logic lives in `src/lib/recurrence/` and must have unit tests for edge cases (every other day, Tue/Thu, every 3 hours within a window, DST / timezone changes).
- **Design system:** always use tokens from `src/constants/theme.ts` (`useTheme()`, `useBandColors()`, `Radius`, `Shadow`, `FontFamily`) - never hardcode colors. Light mode is the default; dark mode must look right too (appearance is stored in `profiles.theme_preference`). Style: pastel, rounded (cards `Radius.lg`, white on cream with `Shadow.card`), Nunito via `ThemedText` types (set weight with the font family, never `fontWeight`), playful emoji icons, chunky 3D buttons.
- Keep components small and feature-scoped; shared code only moves to `src/components/` or `src/lib/` once two features need it.

## Docs
- `docs/PRD.md` — features and scope per phase
- `docs/SCIENCE.md` — research → feature mapping
- `docs/ARCHITECTURE.md` — system diagram and data model
- `docs/GAMIFICATION.md` — the Identity Tree
- `docs/BRAND.md` — name, voice, visual identity (TBD)
- `docs/ROADMAP.md` — phases and current status
