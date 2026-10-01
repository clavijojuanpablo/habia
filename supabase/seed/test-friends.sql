-- TEST DATA: makes the owner friends with the fake people from test-circle.sql (run that first),
-- so shared streaks, a pending request and friend cards can be tried with nobody else around.
--   npx supabase db query --linked -f supabase/seed/test-friends.sql
-- test-cleanup.sql removes it too: friendships cascade with the fake users.
do $$
declare
  owner_username constant text := 'clavijojuanpablo';
  owner uuid;
  friend record;
begin
  select user_id into owner from public.social_profiles where username = owner_username;
  if owner is null then raise exception 'owner % not found', owner_username; end if;
  if not exists (select 1 from auth.users where email like '%@habia.test') then
    raise exception 'no test people yet: run test-circle.sql first';
  end if;

  -- Ana, Luis, Sofía and Marta are friends; Carlos is asking to be one (a request to answer).
  for friend in
    select sp.user_id, sp.username from public.social_profiles sp
    where sp.username in ('test_ana', 'test_luis', 'test_sofia', 'test_marta', 'test_carlos')
  loop
    insert into public.friendships (user_a, user_b, requested_by, status, accepted_at)
    values (
      least(owner, friend.user_id), greatest(owner, friend.user_id),
      friend.user_id,
      case when friend.username = 'test_carlos' then 'pending' else 'accepted' end,
      case when friend.username = 'test_carlos' then null else now() end
    )
    on conflict (user_a, user_b) do nothing;
  end loop;

  -- The numbers a friend card shows (normally published by each person's own app).
  update public.social_profiles sp
  set stats = s.stats, stats_updated_at = now()
  from (values
    ('test_ana',    '{"streak": 24, "record": 31, "consistency": 93, "seeds": 412, "stage": 4}'::jsonb),
    ('test_luis',   '{"streak": 12, "record": 20, "consistency": 86, "seeds": 240, "stage": 3}'::jsonb),
    ('test_sofia',  '{"streak": 3,  "record": 9,  "consistency": 61, "seeds": 96,  "stage": 2}'::jsonb),
    ('test_carlos', '{"streak": 1,  "record": 6,  "consistency": 44, "seeds": 51,  "stage": 2}'::jsonb),
    ('test_marta',  '{"streak": 9,  "record": 9,  "consistency": 72, "seeds": 88,  "stage": 2}'::jsonb),
    ('test_pedro',  '{"streak": 0,  "record": 14, "consistency": 30, "seeds": 60,  "stage": 2}'::jsonb)
  ) as s(username, stats)
  where sp.username = s.username;
end;
$$;

select f.status, count(*) from public.friendships f
join public.social_profiles sp on sp.user_id in (f.user_a, f.user_b) and sp.username like 'test\_%'
group by f.status;
