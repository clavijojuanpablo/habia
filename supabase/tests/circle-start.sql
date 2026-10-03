-- start_circle_habit: owners only, and the creator is linked from the start. Rolled back:
--   npx supabase db query --linked -f supabase/tests/circle-start.sql
begin;
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000c1', 'c1@rls-test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c2', 'c2@rls-test.invalid', 'authenticated', 'authenticated');
insert into public.social_profiles (user_id, username, display_name) values
  ('00000000-0000-4000-8000-0000000000c1', 'user_c1', 'C1'),
  ('00000000-0000-4000-8000-0000000000c2', 'user_c2', 'C2');

do $$
declare
  owner uuid := '00000000-0000-4000-8000-0000000000c1';
  member uuid := '00000000-0000-4000-8000-0000000000c2';
  circle uuid;
  code text;
  shared uuid;
  n int;
  icon text;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', owner, 'role', 'authenticated')::text, true);
  select public.create_circle('Caminantes', '🚶') into circle;
  select invite_code into code from public.circles where id = circle;

  perform set_config('request.jwt.claims', json_build_object('sub', member, 'role', 'authenticated')::text, true);
  perform public.join_circle(code);
  begin
    perform public.start_circle_habit(circle, 'Caminar', 'FREQ=DAILY', null, false, current_date);
    assert false, 'only the owner starts the circle habit';
  exception when raise_exception then
    assert sqlerrm = 'not_owner', 'expected not_owner, got ' || sqlerrm;
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', owner, 'role', 'authenticated')::text, true);
  select public.start_circle_habit(circle, '  Caminar 20 min ', 'FREQ=WEEKLY;BYDAY=MO,WE', '  ', true, current_date)
    into shared;
  select count(*) into n from public.habits where user_id = owner and circle_habit_id = shared;
  assert n = 1, 'the creator is linked from the start';
  select ch.icon into icon from public.circle_habits ch where ch.id = shared;
  assert icon = '🚶', 'the habit takes the circle''s icon';
  select count(*) into n from public.circle_habits
  where id = shared and name = 'Caminar 20 min' and two_minute_version is null and photo_required;
  assert n = 1, 'name trimmed, empty minimum stored as null, photo flag kept';
  begin
    perform public.start_circle_habit(circle, 'Otro', 'FREQ=DAILY', null, false, current_date);
    assert false, 'one active habit per circle';
  exception when unique_violation then null;
  end;
end;
$$;

select 'CIRCLE START CHECKS PASSED' as result;
rollback;
