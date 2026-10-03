-- Trust inside circles (decided 2026-10-02, from build 1.6.0 (5) testing):
--   * cheers: one per friend every 3 hours (any kind), instead of one of each kind per day;
--   * photos: no owner hiding. "¿Cuenta?": the people taking part vote privately that a photo
--     doesn't prove the habit; with a strict majority of the OTHER participants, that day stops
--     counting for the GROUP streak (the author's own check-in is untouched). A genuinely new photo
--     that day clears the votes;
--   * reports of a photo hide it for the reporter at once, and for everyone from 2 reporters on.

-- ============ cheers: one every 3 hours ============
alter table public.cheers drop constraint cheers_from_user_to_user_day_kind_key;

create function private.enforce_cheer_gap() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Someone inserting in another person's name is refused by RLS, which runs after this trigger:
  -- answer nothing here, or the error would reveal whether that person cheered recently.
  if new.from_user is distinct from auth.uid() then return new; end if;
  -- One sender → recipient pair at a time, so two quick taps cannot both pass the check.
  perform pg_advisory_xact_lock(hashtextextended(new.from_user::text || '>' || new.to_user::text, 0));
  new.created_at := now(); -- the gap is measured on the server's clock, never the app's
  if exists (
    select 1 from public.cheers
    where from_user = new.from_user and to_user = new.to_user and created_at > now() - interval '3 hours'
  ) then
    raise exception 'cheer_too_soon' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger cheers_enforce_gap before insert on public.cheers
  for each row execute function private.enforce_cheer_gap();

-- ============ reports: once per person and reason, or once per photo ============
-- The old rule (once per person and reason) refused a second photo of the same person.
alter table public.reports drop constraint reports_reporter_reported_reason_key;
create unique index reports_person_once on public.reports (reporter, reported, reason)
  where reason <> 'inappropriate_photo';
create unique index reports_photo_once on public.reports (reporter, photo_id)
  where photo_id is not null;

-- ============ photos: no owner hiding ============
drop function public.hide_circle_photo(uuid);
-- Everything hidden so far was hidden by an owner: it comes back.
update public.circle_habit_photos set hidden_at = null where hidden_at is not null;
comment on column public.circle_habit_photos.hidden_at is
  'Set when 2+ members report the photo: gone for everyone but its author until reviewed.';

-- Whether this person reported this photo (definer: reports are private to their author).
create function private.reported_by(p_photo uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.reports where photo_id = p_photo and reporter = p_user);
$$;

-- A photo can be reported only by a member of its circle, about its author. Definer: once the
-- reporter's first report hides it from them, they no longer see the row.
create function private.can_report_photo(p_photo uuid, p_reported uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.circle_habit_photos p
    where p.id = p_photo
      and p.user_id = p_reported
      and p.user_id <> p_user
      and private.is_circle_member(private.photo_circle(p.circle_habit_id), p_user)
  );
$$;
create policy "reports: photo of a circle mate" on public.reports
  as restrictive for insert
  with check (photo_id is null or private.can_report_photo(photo_id, reported, (select auth.uid())));

drop policy "circle_habit_photos: members read" on public.circle_habit_photos;
create policy "circle_habit_photos: members read" on public.circle_habit_photos
  for select using (
    private.is_circle_member(private.photo_circle(circle_habit_id), (select auth.uid()))
    and not private.is_blocked((select auth.uid()), user_id)
    and (hidden_at is null or user_id = (select auth.uid()))
    and not private.reported_by(id, (select auth.uid()))
  );

-- Two different people reporting the same photo hide it for everyone (pending review).
create function private.hide_reported_photo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.photo_id is null then return new; end if;
  -- Serialize reports of the same photo: two at once must still see each other.
  perform 1 from public.circle_habit_photos where id = new.photo_id for update;
  if (select count(distinct reporter) from public.reports where photo_id = new.photo_id) >= 2 then
    update public.circle_habit_photos set hidden_at = now() where id = new.photo_id and hidden_at is null;
  end if;
  return new;
end;
$$;
create trigger reports_hide_photo after insert on public.reports
  for each row execute function private.hide_reported_photo();

-- ============ "¿Cuenta?": private doubts ============
create table public.circle_photo_doubts (
  photo_id uuid not null references public.circle_habit_photos (id) on delete cascade,
  voter uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, voter)
);
-- The outcome outlives the photo (files go after 7 days; the group's past must not change then).
create table public.circle_doubted_days (
  circle_habit_id uuid not null references public.circle_habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (circle_habit_id, user_id, day)
);

alter table public.circle_photo_doubts enable row level security;
alter table public.circle_doubted_days enable row level security;

-- Votes on a photo are open while its day is today or yesterday for the voter: older days are
-- settled, both for voting and for taking a vote back.
create function private.doubt_open(p_photo uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.circle_habit_photos p
    where p.id = p_photo
      and p.day >= public.local_today((select timezone from public.profiles where id = p_user)) - 1
  );
$$;

-- Judges are the OTHER people taking part in that habit (the same people the majority counts).
create function private.can_doubt(p_photo uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.circle_habit_photos p
    where p.id = p_photo
      and p.user_id <> p_user
      and p.hidden_at is null
      and private.takes_part(private.photo_circle(p.circle_habit_id), p.circle_habit_id, p_user)
      and not private.is_blocked(p_user, p.user_id)
  ) and private.doubt_open(p_photo, p_user);
$$;

-- Votes are private: each person sees only their own.
create policy "circle_photo_doubts: own read" on public.circle_photo_doubts
  for select using (voter = (select auth.uid()));
create policy "circle_photo_doubts: own insert" on public.circle_photo_doubts
  for insert with check (voter = (select auth.uid()) and private.can_doubt(photo_id, (select auth.uid())));
create policy "circle_photo_doubts: own delete" on public.circle_photo_doubts
  for delete using (voter = (select auth.uid()) and private.doubt_open(photo_id, (select auth.uid())));
revoke update on public.circle_photo_doubts from authenticated, anon;

-- The outcome (never who voted) is visible to the circle; only triggers write it.
create policy "circle_doubted_days: members read" on public.circle_doubted_days
  for select using (private.is_circle_member(private.photo_circle(circle_habit_id), (select auth.uid())));
revoke insert, update, delete on public.circle_doubted_days from authenticated, anon;

-- After each vote (or undo): a strict majority of the other current participants marks the day.
-- Only votes of current participants count (someone who left or archived the habit no longer
-- judges), against that same group.
create function private.refresh_doubted_day() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  photo public.circle_habit_photos%rowtype;
  circle uuid;
  votes int;
  others int;
begin
  -- Locks the photo: concurrent votes (and save_circle_photo's reset) run one after another, each
  -- seeing the others' votes.
  select * into photo from public.circle_habit_photos where id = coalesce(new.photo_id, old.photo_id) for update;
  -- The photo itself is gone (its author deleted it, or the 7-day cleanup): the outcome stays.
  if not found then return null; end if;
  circle := private.photo_circle(photo.circle_habit_id);
  with judges as (
    select h.user_id from public.habits h
    where h.circle_habit_id = photo.circle_habit_id
      and h.archived_at is null
      and h.user_id <> photo.user_id
      and private.is_circle_member(circle, h.user_id)
  )
  select (select count(*) from judges),
         (select count(*) from public.circle_photo_doubts d join judges j on j.user_id = d.voter
          where d.photo_id = photo.id)
  into others, votes;
  if others > 0 and votes * 2 > others then
    insert into public.circle_doubted_days (circle_habit_id, user_id, day)
    values (photo.circle_habit_id, photo.user_id, photo.day)
    on conflict do nothing;
  else
    delete from public.circle_doubted_days
    where circle_habit_id = photo.circle_habit_id and user_id = photo.user_id and day = photo.day;
  end if;
  return null;
end;
$$;
create trigger circle_photo_doubts_refresh after insert or delete on public.circle_photo_doubts
  for each row execute function private.refresh_doubted_day();

-- Records the caller's photo of a day (today or yesterday in their time zone: an offline photo
-- may upload the next morning), after the file is uploaded. Only a genuinely new file (uploaded
-- after the previous record) starts over: its votes and the doubted mark go. Calling it again
-- without a new file changes nothing, so a doubt cannot be wiped by a bare call.
create or replace function public.save_circle_photo(p_circle_habit uuid, p_day date) returns text
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  circle uuid := private.photo_circle(p_circle_habit);
  today date;
  photo_path text;
  previous public.circle_habit_photos%rowtype;
begin
  if me is null or circle is null or not private.takes_part(circle, p_circle_habit, me) then
    raise exception 'not_linked' using errcode = 'P0001';
  end if;
  today := public.local_today((select timezone from public.profiles where id = me));
  if p_day not between today - 1 and today then
    raise exception 'day_closed' using errcode = 'P0001';
  end if;
  photo_path := circle || '/' || p_circle_habit || '/' || me || '/' || p_day || '.jpg';

  select * into previous from public.circle_habit_photos
  where circle_habit_id = p_circle_habit and user_id = me and day = p_day
  for update;
  if not found then
    insert into public.circle_habit_photos (circle_habit_id, user_id, day, path)
    values (p_circle_habit, me, p_day, photo_path);
    return photo_path;
  end if;
  if previous.hidden_at is not null then
    raise exception 'photo_hidden' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from storage.objects o
    where o.bucket_id = 'circle-photos' and o.name = photo_path
      and coalesce(o.updated_at, o.created_at) > previous.created_at
  ) then
    update public.circle_habit_photos set path = photo_path, created_at = now() where id = previous.id;
    delete from public.circle_photo_doubts where photo_id = previous.id;
    delete from public.circle_doubted_days
    where circle_habit_id = p_circle_habit and user_id = me and day = p_day;
  end if;
  return photo_path;
end;
$$;

-- The group's days: a doubted day is not "done" for the group (the person's own log stays).
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
         bool_or(ll.status in ('done', 'done_minimum'))
           and not exists (
             select 1 from public.circle_doubted_days dd
             where dd.circle_habit_id = p_circle_habit and dd.user_id = ll.user_id and dd.day = ll.day
           ),
         bool_or(ll.status = 'skipped')
  from local_logs ll
  where ll.day >= (select d from since)
  group by ll.user_id, ll.day
  order by ll.user_id, ll.day;
$$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
