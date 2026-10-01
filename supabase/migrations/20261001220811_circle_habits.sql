-- Shared circle habits (1.3.0): a circle defines one habit ("Caminar 20 min"), each member joins
-- with a normal habit of their own linked to it, and the group's streak holds while at least half
-- of the members do it each day. Only the daily state of *that* habit is shared with the circle;
-- every other habit stays private.

-- ============ circle_habits ============
create table public.circle_habits (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  icon text not null default '🌱' check (char_length(icon) <= 8),
  -- Daily or fixed weekdays only: "every N days" depends on each member's start date and would
  -- put the group out of step.
  rrule text not null default 'FREQ=DAILY'
    check (rrule = 'FREQ=DAILY' or rrule ~ '^FREQ=WEEKLY;BYDAY=(MO|TU|WE|TH|FR|SA|SU)(,(MO|TU|WE|TH|FR|SA|SU))*$'),
  two_minute_version text check (char_length(two_minute_version) <= 120),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index circle_habits_circle_idx on public.circle_habits (circle_id) where archived_at is null;

alter table public.circle_habits enable row level security;

create policy "circle_habits: members read" on public.circle_habits
  for select using (private.is_circle_member(circle_id, (select auth.uid())));
create policy "circle_habits: owner insert" on public.circle_habits
  for insert with check (
    private.is_circle_owner(circle_id, (select auth.uid())) and created_by = (select auth.uid())
  );
create policy "circle_habits: owner update" on public.circle_habits
  for update using (private.is_circle_owner(circle_id, (select auth.uid())));
revoke update on public.circle_habits from authenticated, anon;
grant update (name, icon, two_minute_version, archived_at) on public.circle_habits to authenticated;

-- ============ members' habits linked to it ============
alter table public.habits
  add column circle_habit_id uuid references public.circle_habits (id) on delete set null;
create index habits_circle_habit_idx on public.habits (circle_habit_id) where circle_habit_id is not null;
-- Joining twice is impossible: one active linked habit per person and shared habit.
create unique index habits_one_link_idx on public.habits (user_id, circle_habit_id)
  where circle_habit_id is not null and archived_at is null;

-- Only a member of the circle can link a habit to its shared habit.
create function private.check_circle_habit_link() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.circle_habit_id is not null
     and new.circle_habit_id is distinct from (case when tg_op = 'UPDATE' then old.circle_habit_id end)
     and not exists (
       select 1 from public.circle_habits ch
       where ch.id = new.circle_habit_id and private.is_circle_member(ch.circle_id, new.user_id)
     ) then
    raise exception 'not_a_member' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger habits_circle_habit_link before insert or update of circle_habit_id on public.habits
  for each row execute function private.check_circle_habit_link();

-- Leaving a circle keeps your habit but unlinks it: the circle no longer sees it.
create function private.unlink_circle_habits() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.habits h set circle_habit_id = null
  where h.user_id = old.user_id
    and h.circle_habit_id in (select id from public.circle_habits where circle_id = old.circle_id);
  return null;
end;
$$;
create trigger circle_members_unlink_habits after delete on public.circle_members
  for each row execute function private.unlink_circle_habits();

-- ============ group progress (members only) ============
-- Who takes part and since when (their linked habit's start date).
create function public.circle_habit_members(p_circle_habit uuid)
returns table (user_id uuid, joined_on date)
language sql stable security definer set search_path = '' as $$
  select h.user_id, min(h.starts_on)
  from public.habits h
  join public.circle_habits ch on ch.id = h.circle_habit_id
  where h.circle_habit_id = p_circle_habit
    and h.archived_at is null
    and private.is_circle_member(ch.circle_id, (select auth.uid()))
    and private.is_circle_member(ch.circle_id, h.user_id)
  group by h.user_id;
$$;

-- Each participant's local days on that habit only: done or rested on purpose. At most 60 days.
create function public.circle_habit_days(p_circle_habit uuid, p_since date)
returns table (user_id uuid, day date, done boolean, skipped boolean)
language sql stable security definer set search_path = '' as $$
  with linked as (
    select h.id as habit_id, h.user_id,
           coalesce((select z.name from pg_catalog.pg_timezone_names z where z.name = p.timezone), 'UTC') as tz
    from public.habits h
    join public.circle_habits ch on ch.id = h.circle_habit_id
    join public.profiles p on p.id = h.user_id
    where h.circle_habit_id = p_circle_habit
      and h.archived_at is null
      and private.is_circle_member(ch.circle_id, (select auth.uid()))
      and private.is_circle_member(ch.circle_id, h.user_id)
  ),
  -- current_date is UTC: one spare day so the local window of 60 days is always covered.
  since as (select greatest(p_since, current_date - 61) as d),
  local_logs as (
    select l.user_id, (l.occurrence_at at time zone k.tz)::date as day, l.status
    from public.habit_logs l
    join linked k on k.habit_id = l.habit_id
    where l.occurrence_at >= ((select d from since) - 1)::timestamptz
  )
  select ll.user_id, ll.day,
         bool_or(ll.status in ('done', 'done_minimum')),
         bool_or(ll.status = 'skipped')
  from local_logs ll
  where ll.day >= (select d from since)
  group by ll.user_id, ll.day
  order by ll.user_id, ll.day;
$$;

revoke execute on function public.circle_habit_members(uuid) from public, anon;
grant execute on function public.circle_habit_members(uuid) to authenticated;
revoke execute on function public.circle_habit_days(uuid, date) from public, anon;
grant execute on function public.circle_habit_days(uuid, date) to authenticated;
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
