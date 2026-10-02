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
-- Only your own photo, on a shared habit you take part in.
create policy "circle_habit_photos: own insert" on public.circle_habit_photos
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.habits h
      where h.user_id = (select auth.uid()) and h.circle_habit_id = circle_habit_photos.circle_habit_id
        and h.archived_at is null
    )
  );
create policy "circle_habit_photos: own replace" on public.circle_habit_photos
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke update on public.circle_habit_photos from authenticated, anon;
grant update (path, created_at) on public.circle_habit_photos to authenticated;
create policy "circle_habit_photos: own delete" on public.circle_habit_photos
  for delete using (user_id = (select auth.uid()));

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

-- Folders: [1] circle, [2] circle habit, [3] author.
create policy "circle-photos: members read" on storage.objects
  for select to authenticated using (
    bucket_id = 'circle-photos'
    and private.is_circle_member(((storage.foldername(name))[1])::uuid, (select auth.uid()))
    and not private.is_blocked((select auth.uid()), ((storage.foldername(name))[3])::uuid)
  );
create policy "circle-photos: own upload" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'circle-photos'
    and (storage.foldername(name))[3] = (select auth.uid())::text
    and private.is_circle_member(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );
create policy "circle-photos: own replace" on storage.objects
  for update to authenticated using (
    bucket_id = 'circle-photos' and (storage.foldername(name))[3] = (select auth.uid())::text
  );
create policy "circle-photos: own delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'circle-photos' and (storage.foldername(name))[3] = (select auth.uid())::text
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
  select h.user_id, public.local_today(p.timezone)
  from public.habits h
  join public.profiles p on p.id = h.user_id
  where h.circle_habit_id = p_circle_habit
    and h.archived_at is null
    and not exists (
      select 1 from public.habit_logs l
      where l.habit_id = h.id
        and l.status in ('done', 'done_minimum')
        and (l.occurrence_at at time zone coalesce(nullif(p.timezone, ''), 'UTC'))::date = public.local_today(p.timezone)
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
revoke execute on function public.hide_circle_photo(uuid) from public, anon;
grant execute on function public.hide_circle_photo(uuid) to authenticated;
revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
