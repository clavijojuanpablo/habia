-- Friends & circles (Phase 5): public social profiles, friendships, circles, cheers,
-- blocks and reports.
--
-- Privacy by default: nobody but the owner ever reads habits or habit_logs. Friends and
-- circle mates see a social profile (username, name, color, a stats snapshot) and, through
-- social_days(), which days someone planted — never what they planted.
-- Writes that need cross-row rules (requests, joining a circle, blocking) go through
-- SECURITY DEFINER functions that always act as auth.uid(), never as an id from the client.

-- ============ social_profiles ============
create table public.social_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,20}$')
    check (username not in ('admin', 'habia', 'brote', 'support', 'soporte', 'help', 'ayuda',
                            'root', 'staff', 'official', 'oficial', 'moderator', 'moderador')),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 30),
  color text not null default '#3DBE7A' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  -- Snapshot published by the owner's app: { streak, record, consistency, seeds, stage }.
  -- The same numbers the owner sees in Progress; small by construction.
  stats jsonb not null default '{}'::jsonb check (pg_column_size(stats) < 1024),
  stats_updated_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============ friendships ============
-- One row per pair, stored in a canonical order (user_a < user_b) so a pair can never
-- exist twice, whoever asked first.
create table public.friendships (
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  requested_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (user_a, user_b),
  check (user_a < user_b),
  check (requested_by in (user_a, user_b))
);
create index friendships_user_b_idx on public.friendships (user_b);

-- ============ blocks & reports (App Store guideline 1.2) ============
create table public.blocks (
  blocker uuid not null references auth.users (id) on delete cascade,
  blocked uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
create index blocks_blocked_idx on public.blocks (blocked);

-- Reviewed by hand in the dashboard.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reported uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('offensive_name', 'harassment', 'spam', 'other')),
  details text check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  unique (reporter, reported, reason),
  check (reporter <> reported)
);

-- ============ circles ============
create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 30),
  emoji text not null default '🌱' check (char_length(emoji) <= 8),
  -- Who created it; ownership itself lives in circle_members.role so it can pass on.
  created_by uuid references auth.users (id) on delete set null,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);

create table public.circle_members (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
create index circle_members_user_idx on public.circle_members (user_id);

-- ============ cheers ============
-- Preset reactions only: no free text, so there is nothing to moderate.
create table public.cheers (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null default auth.uid() references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('clap', 'water', 'fire', 'you_can', 'plant_with_me')),
  -- The sender's local date (set by trigger): at most one cheer of each kind per pair per day.
  day date not null default current_date,
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (from_user, to_user, day, kind),
  check (from_user <> to_user)
);
create index cheers_to_user_idx on public.cheers (to_user, created_at desc);

-- ============ relationship helpers ============
-- SECURITY DEFINER so policies can ask about other rows (and circle_members about itself)
-- without recursing through RLS. They live in `private`, a schema the API does not expose:
-- in `public` anyone could call them as /rpc/* with two strangers' ids and read who is friends
-- with or blocked whom. Policies run with the caller's rights, hence usage + execute below.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks
    where (blocker = a and blocked = b) or (blocker = b and blocked = a)
  );
$$;

create function private.is_circle_member(p_circle uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.circle_members where circle_id = p_circle and user_id = p_user);
$$;

create function private.is_circle_owner(p_circle uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.circle_members where circle_id = p_circle and user_id = p_user and role = 'owner'
  );
$$;

-- Friends (accepted) or circle mates, and no block either way.
create function private.are_connected(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select a <> b
    and not private.is_blocked(a, b)
    and (
      exists (
        select 1 from public.friendships
        where user_a = least(a, b) and user_b = greatest(a, b) and status = 'accepted'
      )
      or exists (
        select 1 from public.circle_members m1
        join public.circle_members m2 on m2.circle_id = m1.circle_id
        where m1.user_id = a and m2.user_id = b
      )
    );
$$;

-- Who may read a social profile: its owner, connected people, and the recipient of a
-- pending request from it (to decide whether to accept). The requester learns nothing new.
create function private.can_see_profile(viewer uuid, target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select viewer = target
    or private.are_connected(viewer, target)
    or (
      not private.is_blocked(viewer, target)
      and exists (
        select 1 from public.friendships
        where user_a = least(viewer, target) and user_b = greatest(viewer, target)
          and status = 'pending' and requested_by = target
      )
    );
$$;

-- ============ triggers ============
create function public.set_cheer_day() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.day := public.local_today((select timezone from public.profiles where id = new.from_user));
  return new;
end;
$$;
create trigger cheers_set_day before insert on public.cheers
  for each row execute function public.set_cheer_day();

-- Small circles: support, not an audience.
create function public.enforce_circle_size() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.circles where id = new.circle_id for update;
  if (select count(*) from public.circle_members where circle_id = new.circle_id) >= 8 then
    raise exception 'circle_full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger circle_members_size before insert on public.circle_members
  for each row execute function public.enforce_circle_size();

-- When someone leaves (or deletes their account): an empty circle disappears, and a circle
-- without owner passes to its oldest member. When the owner removes someone, the invite code
-- changes, so the removed person cannot walk back in with the code they had.
create function public.after_circle_member_leaves() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.circle_members where circle_id = old.circle_id) then
    delete from public.circles where id = old.circle_id;
  elsif not exists (select 1 from public.circle_members where circle_id = old.circle_id and role = 'owner') then
    update public.circle_members set role = 'owner'
    where (circle_id, user_id) = (
      select circle_id, user_id from public.circle_members
      where circle_id = old.circle_id order by joined_at limit 1
    );
  end if;
  if old.user_id is distinct from auth.uid() then
    update public.circles set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
    where id = old.circle_id;
  end if;
  return null;
end;
$$;
create trigger circle_members_after_delete after delete on public.circle_members
  for each row execute function public.after_circle_member_leaves();

-- ============ RLS ============
alter table public.social_profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.cheers enable row level security;

create policy "social_profiles: visible to connected" on public.social_profiles
  for select using (private.can_see_profile((select auth.uid()), user_id));
create policy "social_profiles: owner insert" on public.social_profiles
  for insert with check ((select auth.uid()) = user_id);
create policy "social_profiles: owner update" on public.social_profiles
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "social_profiles: owner delete" on public.social_profiles
  for delete using ((select auth.uid()) = user_id);

-- Created and accepted only through the functions below; either side may delete
-- (decline, cancel, unfriend).
create policy "friendships: members read" on public.friendships
  for select using ((select auth.uid()) in (user_a, user_b));
create policy "friendships: members delete" on public.friendships
  for delete using ((select auth.uid()) in (user_a, user_b));

-- Created through block_user(); the blocker can list and lift their own blocks.
create policy "blocks: owner read" on public.blocks
  for select using ((select auth.uid()) = blocker);
create policy "blocks: owner delete" on public.blocks
  for delete using ((select auth.uid()) = blocker);

create policy "reports: owner insert" on public.reports
  for insert with check ((select auth.uid()) = reporter);
create policy "reports: owner read" on public.reports
  for select using ((select auth.uid()) = reporter);

create policy "circles: members read" on public.circles
  for select using (private.is_circle_member(id, (select auth.uid())));
create policy "circles: owner update" on public.circles
  for update using (private.is_circle_owner(id, (select auth.uid())));
revoke update on public.circles from authenticated, anon;
grant update (name, emoji) on public.circles to authenticated;

create policy "circle_members: members read" on public.circle_members
  for select using (private.is_circle_member(circle_id, (select auth.uid())));
-- Leave yourself, or remove someone from a circle you own.
create policy "circle_members: leave or remove" on public.circle_members
  for delete using (
    (select auth.uid()) = user_id or private.is_circle_owner(circle_id, (select auth.uid()))
  );

create policy "cheers: send to connected" on public.cheers
  for insert with check (
    (select auth.uid()) = from_user and private.are_connected(from_user, to_user)
  );
create policy "cheers: sender and recipient read" on public.cheers
  for select using (
    (select auth.uid()) = from_user
    or ((select auth.uid()) = to_user and not private.is_blocked(from_user, to_user))
  );
-- The recipient may only stamp `seen_at`.
create policy "cheers: recipient mark seen" on public.cheers
  for update using ((select auth.uid()) = to_user) with check ((select auth.uid()) = to_user);
revoke update on public.cheers from authenticated, anon;
grant update (seen_at) on public.cheers to authenticated;

-- ============ functions called by the app ============

-- Exact username lookup to send a request. No search and no listing: nobody can crawl users.
create function public.find_profile(p_username text)
returns table (user_id uuid, username text, display_name text, color text)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.username, p.display_name, p.color
  from public.social_profiles p
  where p.username = lower(btrim(p_username))
    and (select auth.uid()) is not null
    and not private.is_blocked((select auth.uid()), p.user_id);
$$;

-- Every relationship of the caller, with the other person's public name, in one call.
create function public.list_friendships()
returns table (
  user_id uuid, username text, display_name text, color text,
  status text, incoming boolean, created_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select o.user_id, o.username, o.display_name, o.color,
         f.status, f.requested_by <> (select auth.uid()), f.created_at
  from public.friendships f
  join public.social_profiles o
    on o.user_id = case when f.user_a = (select auth.uid()) then f.user_b else f.user_a end
  where (select auth.uid()) in (f.user_a, f.user_b)
    and not private.is_blocked(f.user_a, f.user_b)
  order by f.created_at desc;
$$;

-- Returns 'requested', 'accepted' (they had already asked you), 'pending' (already asked)
-- or 'friends'. Unknown and blocked usernames both raise 'not_found', so a block is never revealed.
create function public.send_friend_request(p_username text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  them uuid;
  existing public.friendships;
begin
  if me is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.social_profiles where user_id = me) then
    raise exception 'no_username' using errcode = 'P0001';
  end if;

  select p.user_id into them from public.social_profiles p where p.username = lower(btrim(p_username));
  if them is null or them = me or private.is_blocked(me, them) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  select * into existing from public.friendships where user_a = least(me, them) and user_b = greatest(me, them);
  if found then
    if existing.status = 'accepted' then return 'friends'; end if;
    if existing.requested_by = me then return 'pending'; end if;
    update public.friendships set status = 'accepted', accepted_at = now()
    where user_a = existing.user_a and user_b = existing.user_b;
    return 'accepted';
  end if;

  if (select count(*) from public.friendships where requested_by = me and status = 'pending') >= 30 then
    raise exception 'too_many_requests' using errcode = 'P0001';
  end if;

  insert into public.friendships (user_a, user_b, requested_by) values (least(me, them), greatest(me, them), me);
  return 'requested';
end;
$$;

create function public.accept_friend_request(p_user uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
begin
  update public.friendships set status = 'accepted', accepted_at = now()
  where user_a = least(me, p_user) and user_b = greatest(me, p_user)
    and status = 'pending' and requested_by = p_user;
  return found;
end;
$$;

-- Blocking also ends the friendship; circles stay, but each becomes invisible to the other.
create function public.block_user(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
begin
  if me is null or p_user = me then raise exception 'invalid_target' using errcode = 'P0001'; end if;
  insert into public.blocks (blocker, blocked) values (me, p_user) on conflict do nothing;
  delete from public.friendships where user_a = least(me, p_user) and user_b = greatest(me, p_user);
end;
$$;

create function public.create_circle(p_name text, p_emoji text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  new_id uuid;
begin
  if me is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if (select count(*) from public.circle_members where user_id = me) >= 10 then
    raise exception 'too_many_circles' using errcode = 'P0001';
  end if;
  insert into public.circles (name, emoji, created_by) values (btrim(p_name), coalesce(nullif(p_emoji, ''), '🌱'), me)
  returning id into new_id;
  insert into public.circle_members (circle_id, user_id, role) values (new_id, me, 'owner');
  return new_id;
end;
$$;

-- Joining by code is idempotent: a second tap returns the same circle.
create function public.join_circle(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  target uuid;
begin
  if me is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.social_profiles where user_id = me) then
    raise exception 'no_username' using errcode = 'P0001';
  end if;
  select id into target from public.circles where invite_code = upper(btrim(p_code));
  if target is null then raise exception 'not_found' using errcode = 'P0001'; end if;
  if private.is_circle_member(target, me) then return target; end if;
  if (select count(*) from public.circle_members where user_id = me) >= 10 then
    raise exception 'too_many_circles' using errcode = 'P0001';
  end if;
  insert into public.circle_members (circle_id, user_id) values (target, me);
  return target;
end;
$$;

-- A leaked link stops working once the owner asks for a new one.
create function public.regenerate_circle_code(p_circle uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  code text;
begin
  if not private.is_circle_owner(p_circle, auth.uid()) then
    raise exception 'not_owner' using errcode = 'P0001';
  end if;
  update public.circles set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  where id = p_circle returning invite_code into code;
  return code;
end;
$$;

-- Which days each visible person planted (any habit done) or rested on purpose, by their own
-- local date. Only the caller and connected people; at most the last 60 days.
create function public.social_days(p_users uuid[], p_since date)
returns table (user_id uuid, day date, active boolean, skipped boolean)
language sql stable security definer set search_path = '' as $$
  with visible as (
    select p.id, coalesce(
      (select z.name from pg_catalog.pg_timezone_names z where z.name = p.timezone), 'UTC'
    ) as tz
    from public.profiles p
    where p.id = any (p_users)
      and (p.id = (select auth.uid()) or private.are_connected((select auth.uid()), p.id))
  ),
  since as (select greatest(p_since, current_date - 60) as d),
  local_logs as (
    select l.user_id, (l.occurrence_at at time zone v.tz)::date as day, l.status
    from public.habit_logs l
    join visible v on v.id = l.user_id
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

-- Callable by signed-in users only (functions are executable by everyone by default).
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'find_profile(text)', 'list_friendships()',
    'send_friend_request(text)', 'accept_friend_request(uuid)', 'block_user(uuid)',
    'create_circle(text, text)', 'join_circle(text)', 'regenerate_circle_code(uuid)',
    'social_days(uuid[], date)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated', fn);
  end loop;
end;
$$;
