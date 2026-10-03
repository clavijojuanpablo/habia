-- Chat with Brote (Pro, opt-in AI). The conversation is the person's own: they read it and can
-- delete it; only the Edge Function `coach-chat` writes (service role), after its checks
-- (consent, daily cap, Pro when required).
create table public.coach_chat (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'brote')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index coach_chat_user_idx on public.coach_chat (user_id, created_at desc);

alter table public.coach_chat enable row level security;

create policy "coach_chat: own read" on public.coach_chat
  for select using (user_id = (select auth.uid()));
create policy "coach_chat: own delete" on public.coach_chat
  for delete using (user_id = (select auth.uid()));
revoke insert, update on public.coach_chat from authenticated, anon;

-- The daily cap lives apart from the conversation: deleting the chat must not reset it. A slot is
-- taken atomically BEFORE calling Claude (parallel requests cannot all pass) and given back if
-- the call fails. Only the Edge Function (service role) calls these.
create table public.coach_chat_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  count int not null default 0 check (count >= 0),
  primary key (user_id, day)
);
alter table public.coach_chat_usage enable row level security;
create policy "coach_chat_usage: own read" on public.coach_chat_usage
  for select using (user_id = (select auth.uid()));
revoke insert, update, delete on public.coach_chat_usage from authenticated, anon;

-- Takes one of today's slots; returns how many are left after it, or -1 when none was free.
create function public.take_chat_slot(p_user uuid, p_limit int) returns int
language plpgsql security definer set search_path = '' as $$
declare
  used int;
begin
  insert into public.coach_chat_usage (user_id, day, count) values (p_user, current_date, 1)
  on conflict (user_id, day) do update set count = public.coach_chat_usage.count + 1
    where public.coach_chat_usage.count < p_limit
  returning count into used;
  if used is null then return -1; end if;
  return p_limit - used;
end;
$$;

create function public.give_back_chat_slot(p_user uuid) returns void
language sql security definer set search_path = '' as $$
  update public.coach_chat_usage set count = count - 1
  where user_id = p_user and day = current_date and count > 0;
$$;

revoke execute on function public.take_chat_slot(uuid, int) from public, anon, authenticated;
revoke execute on function public.give_back_chat_slot(uuid) from public, anon, authenticated;
