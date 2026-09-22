-- Initial schema: profiles, identities, habits, habit_logs, garden_state.
-- Every table has RLS enabled; rows are only visible to their owner.

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  locale text not null default 'es',
  -- Day-band boundaries (local hour, 0-23) used to paint morning/afternoon/night.
  morning_starts_at smallint not null default 5 check (morning_starts_at between 0 and 23),
  afternoon_starts_at smallint not null default 12 check (afternoon_starts_at between 0 and 23),
  night_starts_at smallint not null default 19 check (night_starts_at between 0 and 23),
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6), -- 1 = Monday
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ identities ("Soy una persona que...") = tree branches ============
create table public.identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  statement text not null,          -- e.g. "Soy una persona que cuida su cuerpo"
  area text,                        -- e.g. health | mind | relationships | work
  color text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index identities_user_id_idx on public.identities (user_id);

-- ============ habits ============
create type public.habit_cue_type as enum ('time', 'after_habit', 'context');

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  identity_id uuid references public.identities (id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  icon text not null default 'sparkles',
  color text,
  -- Recurrence as an RFC 5545 RRULE string (e.g. FREQ=WEEKLY;BYDAY=TU,TH).
  rrule text not null default 'FREQ=DAILY',
  starts_on date not null default current_date,
  -- Optional time window for the occurrence (local time).
  window_start time,
  window_end time,
  -- Atomic Habits: the 2-minute version, cues, and temptation bundling.
  two_minute_version text,
  cue_type public.habit_cue_type not null default 'time',
  anchor_habit_id uuid references public.habits (id) on delete set null,
  context_label text,               -- e.g. "Cuando llegue a casa"
  implementation_intention text,    -- "Haré X a las [hora] en [lugar]"
  temptation_bundle text,
  archived_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (anchor_habit_id is null or anchor_habit_id <> id)
);
create index habits_user_id_idx on public.habits (user_id) where archived_at is null;
create index habits_anchor_idx on public.habits (anchor_habit_id);

-- ============ habit_logs ============
create type public.habit_log_status as enum ('done', 'done_minimum', 'skipped', 'missed');

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  occurrence_at timestamptz not null, -- the scheduled occurrence this log answers
  status public.habit_log_status not null default 'done',
  note text,
  mood smallint check (mood between 1 and 5),
  logged_at timestamptz not null default now(),
  unique (habit_id, occurrence_at)
);
create index habit_logs_user_time_idx on public.habit_logs (user_id, occurrence_at desc);

-- ============ garden_state (gamification) ============
create table public.garden_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  votes int not null default 0,     -- each completion is a "vote" for your identity
  stage smallint not null default 0, -- 0 seed, 1 sprout, 2 sapling, 3 tree, 4 fruiting tree
  health smallint not null default 100 check (health between 0 and 100),
  updated_at timestamptz not null default now()
);

-- ============ updated_at trigger ============
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger habits_updated_at before update on public.habits
  for each row execute function public.set_updated_at();
create trigger garden_state_updated_at before update on public.garden_state
  for each row execute function public.set_updated_at();

-- ============ bootstrap rows on signup ============
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  insert into public.garden_state (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.identities enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.garden_state enable row level security;

create policy "profiles: owner read" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles: owner update" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "identities: owner all" on public.identities
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "habits: owner all" on public.habits
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "habit_logs: owner all" on public.habit_logs
  for all using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))
  );

-- garden_state is written by server-side logic (edge functions / RPC); clients only read.
create policy "garden_state: owner read" on public.garden_state
  for select using ((select auth.uid()) = user_id);
