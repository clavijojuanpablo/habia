-- Marks when the user finished the welcome flow. NULL = show onboarding.
alter table public.profiles add column onboarded_at timestamptz;

-- Existing accounts (the founder's) skip it: they already have habits.
update public.profiles set onboarded_at = now()
where exists (select 1 from public.habits h where h.user_id = profiles.id);
