-- Stability fixes (1.4.1), found by QA.

-- ============ the user's language from signup ============
-- profiles.locale defaulted to 'es' and nobody set it, so someone who signed up with an English
-- phone was switched to Spanish (and got Spanish AI reviews). The app sends `language` at signup.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'language' = 'en' then 'en' else 'es' end
  );
  insert into public.garden_state (user_id) values (new.id);
  return new;
end;
$$;

-- People already caught by it: signed up in English, still on the default.
update public.profiles p
set locale = 'en'
from auth.users u
where u.id = p.id and p.locale = 'es' and u.raw_user_meta_data ->> 'language' = 'en';

-- ============ blocking also hides you inside a shared circle ============
-- "Dejarán de verse" must hold in circles too: a blocked person's days on the shared habit (and
-- the person) disappear from each other's view.
create or replace function public.circle_habit_members(p_circle_habit uuid)
returns table (user_id uuid, joined_on date)
language sql stable security definer set search_path = '' as $$
  select h.user_id, min(h.starts_on)
  from public.habits h
  join public.circle_habits ch on ch.id = h.circle_habit_id
  where h.circle_habit_id = p_circle_habit
    and h.archived_at is null
    and private.is_circle_member(ch.circle_id, (select auth.uid()))
    and private.is_circle_member(ch.circle_id, h.user_id)
    and not private.is_blocked((select auth.uid()), h.user_id)
  group by h.user_id;
$$;

create or replace function public.circle_habit_days(p_circle_habit uuid, p_since date)
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
      and not private.is_blocked((select auth.uid()), h.user_id)
  ),
  -- current_date is UTC: one spare day so the local window is always covered.
  since as (select greatest(p_since, current_date - 366) as d),
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

-- ============ a shared habit keeps the circle's schedule ============
-- Each member picks their own time and reminder, but not the days: a copy on other days would
-- count as "active" when it is not and could break the group's streak.
create function private.keep_circle_habit_schedule() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  circle_rrule text;
begin
  if new.circle_habit_id is null then return new; end if;
  select rrule into circle_rrule from public.circle_habits where id = new.circle_habit_id;
  if circle_rrule is not null and new.rrule is distinct from circle_rrule then
    raise exception 'circle_habit_schedule' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
-- Copies whose days were changed under older versions: back to the circle's, or every later
-- edit of them (time, name, reminder) would hit the lock below.
update public.habits h
set rrule = ch.rrule
from public.circle_habits ch
where h.circle_habit_id = ch.id and h.rrule is distinct from ch.rrule;

create trigger habits_keep_circle_schedule before insert or update of rrule, circle_habit_id on public.habits
  for each row execute function private.keep_circle_habit_schedule();

-- ============ circles need a username, like joining ============
create or replace function public.create_circle(p_name text, p_emoji text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  new_id uuid;
begin
  if me is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.social_profiles where user_id = me) then
    raise exception 'no_username' using errcode = 'P0001';
  end if;
  if (select count(*) from public.circle_members where user_id = me) >= 10 then
    raise exception 'too_many_circles' using errcode = 'P0001';
  end if;
  insert into public.circles (name, emoji, created_by) values (btrim(p_name), coalesce(nullif(p_emoji, ''), '🌱'), me)
  returning id into new_id;
  insert into public.circle_members (circle_id, user_id, role) values (new_id, me, 'owner');
  return new_id;
end;
$$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
