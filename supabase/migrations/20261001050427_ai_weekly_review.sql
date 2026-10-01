-- AI weekly review (Phase 3): opt-in consent, the reviews themselves, and the
-- user's "today" on the server.

-- ============ consent ============
-- Off by default: the review sends habit names and logs to Anthropic (Claude), so the
-- user turns it on explicitly. The Edge Function refuses to run while it is false.
alter table public.profiles
  add column ai_coach_enabled boolean not null default false;

-- ============ coach_messages ============
-- Messages written by the coach on the server. Only the `weekly-review` Edge Function
-- inserts them (service role, bypasses RLS); users can read their own and mark them seen.
create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('weekly_review')),
  -- First day (local date, Monday) of the period the message is about.
  period_start date not null,
  content jsonb not null,
  model text not null,
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  -- One review per user and week: retries and double taps return the same row.
  unique (user_id, kind, period_start)
);
create index coach_messages_user_idx on public.coach_messages (user_id, created_at desc);

alter table public.coach_messages enable row level security;

create policy "coach_messages: owner read" on public.coach_messages
  for select using (auth.uid() = user_id);

-- Owners may only stamp `seen_at`: the content is the coach's, not editable from the app.
create policy "coach_messages: owner mark seen" on public.coach_messages
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke update on public.coach_messages from authenticated, anon;
grant update (seen_at) on public.coach_messages to authenticated;

-- ============ the user's "today" on the server ============
-- The app computes "today" with the device clock; the server needs the same answer
-- from profiles.timezone (kept in sync by the app). An unknown zone falls back to UTC.
create or replace function public.local_today(p_timezone text)
returns date
language plpgsql
stable
set search_path = ''
as $$
begin
  return (now() at time zone coalesce(nullif(p_timezone, ''), 'UTC'))::date;
exception when invalid_parameter_value then
  return (now() at time zone 'UTC')::date;
end;
$$;

comment on function public.local_today(text) is
  'Current local date in an IANA time zone (UTC when unknown). Used by server-side coach jobs.';
