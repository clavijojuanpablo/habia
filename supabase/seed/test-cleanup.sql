-- Removes all TEST data created by test-circle.sql. Deleting the fake users cascades to their
-- profiles, habits, logs, cheers, friendships and memberships; the test circle goes with it. A habit the owner
-- joined from the test circle stays in their list, unlinked (delete it from the app if unwanted).
--   npx supabase db query --linked -f supabase/seed/test-cleanup.sql
delete from public.circles
where id in (
  select m.circle_id from public.circle_members m
  join auth.users u on u.id = m.user_id
  where u.email like '%@habia.test'
);
delete from auth.users where email like '%@habia.test';

select
  (select count(*) from auth.users where email like '%@habia.test') as test_users_left,
  (select count(*) from public.social_profiles where username like 'test\_%') as test_profiles_left;
