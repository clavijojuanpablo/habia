-- Progress that must not fade with the app's 120-day log window.

-- ============ all-time completions per habit ============
-- Fruit (~66 repetitions, Lally et al.) counts every completion ever made, not only the
-- last 120 days: otherwise a 3×/week habit (~51 in 120 days) could never bear fruit and
-- an old fruit would drop off as the window slides.
-- security_invoker: the view runs with the caller's rights, so habit_logs' RLS applies.
create view public.habit_completion_counts
with (security_invoker = true) as
select habit_id, count(*)::int as completions
from public.habit_logs
where status in ('done', 'done_minimum')
group by habit_id;

grant select on public.habit_completion_counts to authenticated;

-- ============ best streak ============
-- The record survives the window too: the app raises it when the current streak beats it.
alter table public.profiles
  add column best_streak integer not null default 0 check (best_streak >= 0);
