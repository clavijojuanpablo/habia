-- One shared habit per circle (1.3.2): a circle *is* its habit ("Familia · caminar"); another
-- habit means another circle. Also a year of history for "overall" consistency, and ending a
-- shared habit hands each member their habit back, unlinked (their seeds and logs are theirs).

-- ============ ending a shared habit unlinks it ============
create function private.unlink_archived_circle_habit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.archived_at is not null and old.archived_at is null then
    update public.habits set circle_habit_id = null where circle_habit_id = new.id;
  end if;
  return null;
end;
$$;
create trigger circle_habits_unlink_on_archive after update of archived_at on public.circle_habits
  for each row execute function private.unlink_archived_circle_habit();

-- Circles created before this rule may hold several: keep the oldest, end the others.
update public.circle_habits ch
set archived_at = now()
where ch.archived_at is null
  and exists (
    select 1 from public.circle_habits older
    where older.circle_id = ch.circle_id and older.archived_at is null
      and (older.created_at, older.id) < (ch.created_at, ch.id)
  );

create unique index circle_habits_one_per_circle on public.circle_habits (circle_id) where archived_at is null;

-- ============ a year of days for overall consistency ============
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

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
