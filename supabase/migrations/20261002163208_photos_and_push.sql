-- Build 4: photos on shared circle habits, and push notifications for social moments.

-- ============ photos ============
-- The circle chooses whether its habit asks for a photo (camera only, decided in the app).
alter table public.circle_habits add column photo_required boolean not null default false;
revoke update on public.circle_habits from authenticated, anon;
grant update (name, icon, two_minute_version, archived_at, photo_required) on public.circle_habits to authenticated;

-- One photo per person, shared habit and local day; a new one replaces it. Photos live 7 days
-- (supabase/functions/photos-cleanup). The file is at <circle>/<circle habit>/<user>/<day>.jpg.
create table public.circle_habit_photos (
  id uuid primary key default gen_random_uuid(),
  circle_habit_id uuid not null references public.circle_habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  path text not null,
  created_at timestamptz not null default now(),
  -- Set by the circle's owner (hide_circle_photo): gone for everyone but its author.
  hidden_at timestamptz,
  unique (circle_habit_id, user_id, day)
);
create index circle_habit_photos_recent_idx on public.circle_habit_photos (circle_habit_id, day desc);
create index circle_habit_photos_age_idx on public.circle_habit_photos (created_at);

alter table public.circle_habit_photos enable row level security;

create function private.photo_circle(p_circle_habit uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select circle_id from public.circle_habits where id = p_circle_habit;
$$;

create policy "circle_habit_photos: members read" on public.circle_habit_photos
  for select using (
    private.is_circle_member(private.photo_circle(circle_habit_id), (select auth.uid()))
    and not private.is_blocked((select auth.uid()), user_id)
    and (hidden_at is null or user_id = (select auth.uid()))
  );
-- Writes go through save_circle_photo only: it builds the path itself, stamps the time and
-- refuses a day whose photo the owner hid. Authors may delete their own photo unless it was hidden
-- (deleting and re-posting would undo the owner's moderation).
create policy "circle_habit_photos: own delete" on public.circle_habit_photos
  for delete using (user_id = (select auth.uid()) and hidden_at is null);

-- A text that is a uuid, or null: policies cast folder names, and a malformed one must not fail
-- the whole query.
create function private.as_uuid(value text) returns uuid
language sql immutable as $$
  select case when value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then value::uuid end;
$$;

-- Whether the caller takes part in a shared habit (linked, active) of the given circle.
create function private.takes_part(p_circle uuid, p_circle_habit uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.habits h
    join public.circle_habits ch on ch.id = h.circle_habit_id
    where h.user_id = p_user and h.circle_habit_id = p_circle_habit and h.archived_at is null
      and ch.circle_id = p_circle and ch.archived_at is null
      and private.is_circle_member(p_circle, p_user)
  );
$$;

-- Whether a file belongs to a photo the owner hid. Definer rights: the hidden row itself is
-- invisible to the people this check protects.
create function private.photo_hidden(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.circle_habit_photos where path = p_path and hidden_at is not null);
$$;

-- Records (or replaces) the caller's photo of a day, after the file is uploaded. Returns the path.
create function public.save_circle_photo(p_circle_habit uuid, p_day date) returns text
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  circle uuid := private.photo_circle(p_circle_habit);
  photo_path text;
begin
  if me is null or circle is null or not private.takes_part(circle, p_circle_habit, me) then
    raise exception 'not_linked' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.circle_habit_photos
             where circle_habit_id = p_circle_habit and user_id = me and day = p_day and hidden_at is not null) then
    raise exception 'photo_hidden' using errcode = 'P0001';
  end if;
  photo_path := circle || '/' || p_circle_habit || '/' || me || '/' || p_day || '.jpg';
  insert into public.circle_habit_photos (circle_habit_id, user_id, day, path)
  values (p_circle_habit, me, p_day, photo_path)
  on conflict (circle_habit_id, user_id, day) do update set path = excluded.path, created_at = now();
  return photo_path;
end;
$$;

-- The circle's owner can hide any photo in it (moderation without touching anyone's files).
create function public.hide_circle_photo(p_photo uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.circle_habit_photos p set hidden_at = now()
  where p.id = p_photo and private.is_circle_owner(private.photo_circle(p.circle_habit_id), auth.uid());
  if not found then raise exception 'not_owner' using errcode = 'P0001'; end if;
end;
$$;

-- Photos can be reported too.
alter table public.reports add column photo_id uuid references public.circle_habit_photos (id) on delete set null;
alter table public.reports drop constraint reports_reason_check;
alter table public.reports add constraint reports_reason_check
  check (reason in ('offensive_name', 'harassment', 'spam', 'other', 'inappropriate_photo'));

-- ============ storage ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('circle-photos', 'circle-photos', false, 1048576, array['image/jpeg']);

-- Folders: [1] circle, [2] circle habit, [3] author. A hidden photo's file is unreadable to anyone
-- but its author, so a signed URL cannot be made for it either.
create policy "circle-photos: members read" on storage.objects
  for select to authenticated using (
    bucket_id = 'circle-photos'
    and private.is_circle_member(private.as_uuid((storage.foldername(name))[1]), (select auth.uid()))
    and not private.is_blocked((select auth.uid()), private.as_uuid((storage.foldername(name))[3]))
    and (
      (storage.foldername(name))[3] = (select auth.uid())::text
      or not private.photo_hidden(name)
    )
  );
-- Only into your own folder of a shared habit you take part in.
create policy "circle-photos: own upload" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'circle-photos'
    and (storage.foldername(name))[3] = (select auth.uid())::text
    and private.takes_part(
      private.as_uuid((storage.foldername(name))[1]),
      private.as_uuid((storage.foldername(name))[2]),
      (select auth.uid())
    )
  );
-- A hidden photo's file stays as reported: its author can neither replace nor delete it.
create policy "circle-photos: own replace" on storage.objects
  for update to authenticated using (
    bucket_id = 'circle-photos' and (storage.foldername(name))[3] = (select auth.uid())::text
    and not private.photo_hidden(name)
  );
create policy "circle-photos: own delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'circle-photos' and (storage.foldername(name))[3] = (select auth.uid())::text
    and not private.photo_hidden(name)
  );

-- ============ push ============
-- Off switch for social pushes (cheers, requests, circle nudges). Reminders stay local.
alter table public.profiles add column social_push boolean not null default true;

-- An Expo push token belongs to one device; when another account signs in on that phone the
-- token moves to it (register_push_token), so nobody gets someone else's notifications.
create table public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;
create policy "push_tokens: owner read" on public.push_tokens
  for select using (user_id = (select auth.uid()));
create policy "push_tokens: owner delete" on public.push_tokens
  for delete using (user_id = (select auth.uid()));

create function public.register_push_token(p_token text, p_platform text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  insert into public.push_tokens (token, user_id, platform) values (p_token, auth.uid(), p_platform)
  on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

-- What the notify function already sent, so nobody gets the same nudge twice a day.
-- Only the service role (Edge Functions) touches it: RLS on, no policies.
create table public.push_log (
  recipient uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  ref uuid not null,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (recipient, kind, ref, day)
);
alter table public.push_log enable row level security;

-- For the notify function (service role only): who in a shared habit has not done it yet today,
-- in each person's own day.
create function public.circle_habit_pending_today(p_circle_habit uuid)
returns table (user_id uuid, local_day date)
language sql stable security definer set search_path = '' as $$
  select h.user_id, d.today
  from public.habits h
  join public.circle_habits ch on ch.id = h.circle_habit_id
  join public.profiles p on p.id = h.user_id
  cross join lateral (select public.local_today(p.timezone) as today) d
  where h.circle_habit_id = p_circle_habit
    and h.archived_at is null
    and h.starts_on <= d.today
    -- Only when today is one of its days (the rrule is DAILY or WEEKLY;BYDAY=… by constraint).
    and (ch.rrule = 'FREQ=DAILY'
         or (array['SU','MO','TU','WE','TH','FR','SA'])[extract(dow from d.today)::int + 1]
            = any (string_to_array(split_part(ch.rrule, 'BYDAY=', 2), ',')))
    -- Nothing logged today: neither done nor a chosen rest.
    and not exists (
      select 1 from public.habit_logs l
      where l.habit_id = h.id
        and (l.occurrence_at at time zone coalesce(nullif(p.timezone, ''), 'UTC'))::date = d.today
    );
$$;

-- For photos-cleanup (service role only): files older than the cutoff, oldest first.
create function public.expired_photo_files(p_before timestamptz, p_limit int)
returns setof text
language sql stable security definer set search_path = '' as $$
  select o.name from storage.objects o
  where o.bucket_id = 'circle-photos' and o.created_at < p_before
  order by o.created_at
  limit p_limit;
$$;

revoke execute on function public.circle_habit_pending_today(uuid) from public, anon, authenticated;
revoke execute on function public.expired_photo_files(timestamptz, int) from public, anon, authenticated;
revoke execute on function public.save_circle_photo(uuid, date) from public, anon;
grant execute on function public.save_circle_photo(uuid, date) to authenticated;
revoke execute on function public.hide_circle_photo(uuid) from public, anon;
grant execute on function public.hide_circle_photo(uuid) to authenticated;
revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
