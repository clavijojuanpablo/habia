-- Privacy checks for the social migrations (friends, circles, cheers, blocks, shared circle habits).
-- Runs against the linked project inside a transaction that is always rolled back:
--   npx supabase db query --linked -f supabase/tests/social-rls.sql
-- Success prints 'ALL SOCIAL RLS CHECKS PASSED'; a broken rule fails its ASSERT by name.
begin;
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-00000000000a', 'a@rls-test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-00000000000b', 'b@rls-test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-00000000000c', 'c@rls-test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-00000000000d', 'd@rls-test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-00000000000e', 'e@rls-test.invalid', 'authenticated', 'authenticated');

update public.profiles set timezone = 'America/Bogota' where id = '00000000-0000-4000-8000-00000000000b';

insert into public.social_profiles (user_id, username, display_name) values
  ('00000000-0000-4000-8000-00000000000a', 'user_a', 'A'),
  ('00000000-0000-4000-8000-00000000000b', 'user_b', 'B'),
  ('00000000-0000-4000-8000-00000000000c', 'user_c', 'C'),
  ('00000000-0000-4000-8000-00000000000d', 'user_d', 'D'),
  ('00000000-0000-4000-8000-00000000000e', 'user_e', 'E');

insert into public.friendships (user_a, user_b, requested_by, status) values
  ('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000b', '00000000-0000-4000-8000-00000000000a', 'accepted'),
  ('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000e', '00000000-0000-4000-8000-00000000000e', 'accepted');

insert into public.habits (id, user_id, name) values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-00000000000b', 'Secret habit');
insert into public.habit_logs (user_id, habit_id, occurrence_at, status) values
  ('00000000-0000-4000-8000-00000000000b', '00000000-0000-4000-8000-0000000000f1', now() - interval '1 day', 'done'),
  ('00000000-0000-4000-8000-00000000000b', '00000000-0000-4000-8000-0000000000f1', now() - interval '2 day', 'skipped');

do $$
declare
  a uuid := '00000000-0000-4000-8000-00000000000a';
  b uuid := '00000000-0000-4000-8000-00000000000b';
  c uuid := '00000000-0000-4000-8000-00000000000c';
  d uuid := '00000000-0000-4000-8000-00000000000d';
  e uuid := '00000000-0000-4000-8000-00000000000e';
  n int;
  r text;
  ok boolean;
  circle uuid;
  code text;
begin
  -- Helpers must not be reachable through the API (/rpc/* only serves the public schema).
  assert to_regprocedure('public.are_connected(uuid, uuid)') is null, 'helpers are not in public';
  assert to_regprocedure('public.is_blocked(uuid, uuid)') is null, 'is_blocked is not in public';
  assert to_regprocedure('private.are_connected(uuid, uuid)') is not null, 'helpers live in private';

  perform set_config('role', 'authenticated', true);

  -- ===== as A =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.social_profiles where user_id = b;
  assert n = 1, 'A sees friend B';
  select count(*) into n from public.social_profiles where user_id = c;
  assert n = 0, 'A cannot see stranger C';
  select count(*) into n from public.habits where user_id = b;
  assert n = 0, 'A never sees B habits';
  select count(*) into n from public.habit_logs where user_id = b;
  assert n = 0, 'A never sees B logs';
  select count(*) into n from public.social_days(array[b, c], current_date - 7) where user_id = b and active;
  assert n = 1, 'A sees one active day of B';
  select count(*) into n from public.social_days(array[b, c], current_date - 7) where user_id = b and skipped;
  assert n = 1, 'A sees one rest day of B';
  select count(*) into n from public.social_days(array[c], current_date - 7);
  assert n = 0, 'A sees no days of stranger C';
  select count(*) into n from public.find_profile('  USER_C ');
  assert n = 1, 'find_profile is exact and case-insensitive';
  select count(*) into n from public.list_friendships();
  assert n = 2, 'A lists B and E';

  select public.send_friend_request('user_c') into r;
  assert r = 'requested', 'A requests C: ' || r;
  select public.send_friend_request('user_c') into r;
  assert r = 'pending', 'second request is pending: ' || r;
  select public.send_friend_request('user_b') into r;
  assert r = 'friends', 'B already friend: ' || r;

  insert into public.cheers (to_user, kind) values (b, 'water');
  begin
    insert into public.cheers (to_user, kind) values (c, 'water');
    assert false, 'A cannot cheer stranger C';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.cheers (to_user, kind) values (b, 'clap');
    assert false, 'one cheer per friend every 3 hours, whatever the kind';
  exception when raise_exception then
    assert sqlerrm = 'cheer_too_soon', 'expected cheer_too_soon, got ' || sqlerrm;
  end;
  begin
    insert into public.cheers (to_user, kind, created_at) values (b, 'fire', now() - interval '4 hours');
    assert false, 'a cheer cannot be backdated past the gap';
  exception when raise_exception then null;
  end;
  begin
    insert into public.cheers (from_user, to_user, kind) values (b, a, 'fire');
    assert false, 'nobody cheers in someone else''s name';
  exception when insufficient_privilege then null; -- RLS, not cheer_too_soon: no leak
  end;
  begin
    insert into public.habits (user_id, name) values (b, 'Injected');
    assert false, 'A cannot write B habits';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.friendships (user_a, user_b, requested_by, status) values (a, d, a, 'accepted');
    assert false, 'friendships only through functions';
  exception when insufficient_privilege then null;
  end;

  select public.create_circle('Test', '🌱') into circle;
  select invite_code into code from public.circles where id = circle;
  assert code is not null, 'A reads own circle code';

  perform public.block_user(e);
  select count(*) into n from public.social_profiles where user_id = e;
  assert n = 0, 'A no longer sees blocked E';

  -- ===== as C (pending request from A) =====
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.social_profiles where user_id = a;
  assert n = 1, 'C sees requester A';
  select count(*) into n from public.social_days(array[a], current_date - 7);
  select count(*) into n from public.social_profiles where user_id = b;
  assert n = 0, 'C cannot see B';
  select count(*) into n from public.circles;
  assert n = 0, 'C sees no circles before joining';
  begin
    insert into public.cheers (to_user, kind) values (a, 'clap');
    assert false, 'C cannot cheer A while pending';
  exception when insufficient_privilege then null;
  end;
  select public.accept_friend_request(a) into ok;
  assert ok, 'C accepts A';

  -- ===== as D: joins the circle by code, sees members but not B =====
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  select public.join_circle(lower(code)) into circle;
  select public.join_circle(code) into circle;
  select count(*) into n from public.circle_members where circle_id = circle;
  assert n = 2, 'D sees 2 members';
  select count(*) into n from public.social_profiles where user_id = a;
  assert n = 1, 'D sees circle mate A';
  insert into public.cheers (to_user, kind) values (a, 'fire');
  begin
    update public.circles set name = 'Hacked' where id = circle;
    get diagnostics n = row_count;
    assert n = 0, 'member cannot rename';
  end;
  begin
    perform public.regenerate_circle_code(circle);
    assert false, 'member cannot regenerate code';
  exception when raise_exception then null;
  end;

  -- ===== A removes D; D's old code no longer works =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  delete from public.circle_members where circle_id = circle and user_id = d;
  select invite_code into r from public.circles where id = circle;
  assert r <> code, 'removing someone changes the code';
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  begin
    perform public.join_circle(code);
    assert false, 'removed member cannot rejoin with the old code';
  exception when raise_exception then null;
  end;
  perform public.join_circle(r);
  insert into public.reports (reported, reason) values (a, 'spam');
  begin
    insert into public.reports (reported, reason) values (a, 'spam');
    assert false, 'one report per reason';
  exception when unique_violation then null;
  end;

  -- ===== as E (blocked by A) =====
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  select count(*) into n from public.social_profiles where user_id = a;
  assert n = 0, 'E cannot see A';
  select count(*) into n from public.find_profile('user_a');
  assert n = 0, 'E cannot find A';
  begin
    perform public.send_friend_request('user_a');
    assert false, 'E cannot request A';
  exception when raise_exception then null;
  end;

  -- ===== as B: reads A's cheer, may only mark it seen =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.cheers where to_user = b;
  assert n = 1, 'B sees the cheer';
  update public.cheers set seen_at = now() where to_user = b;
  get diagnostics n = row_count;
  assert n = 1, 'B marks seen';
  begin
    update public.cheers set kind = 'clap' where to_user = b;
    assert false, 'B cannot edit the cheer';
  exception when insufficient_privilege then null;
  end;

  -- ===== owner A leaves: D becomes owner =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  delete from public.circle_members where user_id = a and circle_id = circle;
  perform set_config('role', 'none', true);
  select role into r from public.circle_members where circle_id = circle and user_id = d;
  assert r = 'owner', 'ownership passes to D';
  delete from public.circle_members where circle_id = circle;
  select count(*) into n from public.circles where id = circle;
  assert n = 0, 'empty circle disappears';
end;
$$;

-- ============ shared circle habits ============
do $$
declare
  a uuid := '00000000-0000-4000-8000-00000000000a';
  b uuid := '00000000-0000-4000-8000-00000000000b';
  c uuid := '00000000-0000-4000-8000-00000000000c';
  circle uuid;
  code text;
  shared uuid;
  hab_a uuid;
  hab_b uuid;
  n int;
begin
  perform set_config('role', 'authenticated', true);

  -- A owns a circle with B; A creates the shared habit and both join.
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select public.create_circle('Hábitos', '🚶') into circle;
  select invite_code into code from public.circles where id = circle;
  insert into public.circle_habits (circle_id, name, icon, created_by) values (circle, 'Caminar', '🚶', a)
    returning id into shared;
  begin
    insert into public.circle_habits (circle_id, name, rrule, created_by) values (circle, 'Bad', 'FREQ=DAILY;INTERVAL=2', a);
    assert false, 'every-N-days is not allowed for shared habits';
  exception when check_violation then null;
  end;
  insert into public.habits (user_id, name, circle_habit_id) values (a, 'Caminar', shared) returning id into hab_a;
  insert into public.habit_logs (user_id, habit_id, occurrence_at, status)
    values (a, hab_a, now() - interval '1 day', 'done');
  begin
    insert into public.habits (user_id, name, circle_habit_id) values (a, 'Caminar otra vez', shared);
    assert false, 'joining the same shared habit twice is impossible';
  exception when unique_violation then null;
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin
    insert into public.habits (user_id, name, circle_habit_id) values (b, 'Caminar', shared);
    assert false, 'a non-member cannot link a habit';
  exception when raise_exception then null;
  end;
  perform public.join_circle(code);
  insert into public.habits (user_id, name, circle_habit_id) values (b, 'Caminar', shared) returning id into hab_b;
  begin
    insert into public.circle_habits (circle_id, name, created_by) values (circle, 'Member made', b);
    assert false, 'only the owner creates shared habits';
  exception when insufficient_privilege then null;
  end;
  select count(*) into n from public.circle_habit_members(shared);
  assert n = 2, 'B sees both participants';
  select count(*) into n from public.circle_habit_days(shared, current_date - 7) where done;
  assert n = 1, 'B sees A''s done day on the shared habit';
  select count(*) into n from public.habits where id = hab_a;
  assert n = 0, 'B still cannot read A''s habit row';

  -- C is not in the circle: sees nothing.
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.circle_habit_members(shared);
  assert n = 0, 'a non-member sees no participants';
  select count(*) into n from public.circle_habit_days(shared, current_date - 7);
  assert n = 0, 'a non-member sees no days';
  select count(*) into n from public.circle_habits where id = shared;
  assert n = 0, 'a non-member cannot read the shared habit';

  -- B leaves: the habit stays, unlinked.
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  delete from public.circle_members where circle_id = circle and user_id = b;
  select count(*) into n from public.habits where id = hab_b and circle_habit_id is null;
  assert n = 1, 'leaving keeps the habit, unlinked';
end;
$$;

-- ============ one habit per circle, ending it, schedule lock, blocking inside a circle ============
do $$
declare
  a uuid := '00000000-0000-4000-8000-00000000000a';
  b uuid := '00000000-0000-4000-8000-00000000000b';
  c uuid := '00000000-0000-4000-8000-00000000000c';
  d uuid := '00000000-0000-4000-8000-00000000000d';
  circle uuid;
  code text;
  shared uuid;
  hab_b uuid;
  n int;
begin
  perform set_config('role', 'authenticated', true);

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select public.create_circle('Bloqueos', '🧪') into circle;
  select invite_code into code from public.circles where id = circle;
  insert into public.circle_habits (circle_id, name, created_by) values (circle, 'Leer', a) returning id into shared;
  begin
    insert into public.circle_habits (circle_id, name, created_by) values (circle, 'Otro', a);
    assert false, 'one active habit per circle';
  exception when unique_violation then null;
  end;
  insert into public.habits (user_id, name, circle_habit_id) values (a, 'Leer', shared);

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.join_circle(code);
  insert into public.habits (user_id, name, circle_habit_id) values (b, 'Leer', shared) returning id into hab_b;
  begin
    update public.habits set rrule = 'FREQ=WEEKLY;BYDAY=MO' where id = hab_b;
    assert false, 'a member cannot change the shared schedule';
  exception when raise_exception then null;
  end;
  update public.habits set window_start = '07:00' where id = hab_b;
  get diagnostics n = row_count;
  assert n = 1, 'a member can still pick their own time';
  update public.circle_habits set archived_at = now() where id = shared;
  get diagnostics n = row_count;
  assert n = 0, 'a member cannot end the shared habit';
  select count(*) into n from public.circle_habit_members(shared);
  assert n = 2, 'B sees both participants before any block';

  -- A blocks B: inside the circle they no longer see each other's days.
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.block_user(b);
  select count(*) into n from public.circle_habit_members(shared);
  assert n = 1, 'A no longer sees blocked B in the shared habit';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.circle_habit_members(shared) where user_id = a;
  assert n = 0, 'B no longer sees A who blocked them';

  -- The owner ends the habit: everyone keeps theirs, unlinked.
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  update public.circle_habits set archived_at = now() where id = shared;
  perform set_config('role', 'none', true);
  select count(*) into n from public.habits where circle_habit_id = shared;
  assert n = 0, 'ending the shared habit unlinks every copy';
  select count(*) into n from public.habits where id = hab_b and archived_at is null;
  assert n = 1, 'members keep their habit';

  -- Creating a circle needs a username.
  delete from public.social_profiles where user_id = d;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  begin
    perform public.create_circle('Sin usuario', '🌱');
    assert false, 'creating a circle needs a username';
  exception when raise_exception then
    assert sqlerrm = 'no_username', 'creating a circle fails for the missing username, got ' || sqlerrm;
  end;
end;
$$;

-- ============ photos and push tokens ============
do $$
declare
  a uuid := '00000000-0000-4000-8000-00000000000a';
  b uuid := '00000000-0000-4000-8000-0000000000f0'; -- a fresh person: earlier blocks blocked B
  c uuid := '00000000-0000-4000-8000-00000000000c';
  circle uuid;
  code text;
  shared uuid;
  photo uuid;
  n int;
  owner_of_token uuid;
  g uuid := '00000000-0000-4000-8000-0000000000f1';
  old_photo uuid;
  counted boolean;
begin
  perform set_config('role', 'none', true);
  insert into auth.users (id, email, aud, role) values (b, 'f@rls-test.invalid', 'authenticated', 'authenticated');
  insert into public.social_profiles (user_id, username, display_name) values (b, 'user_f', 'F');
  perform set_config('role', 'authenticated', true);

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select public.create_circle('Fotos', '📸') into circle;
  select invite_code into code from public.circles where id = circle;
  insert into public.circle_habits (circle_id, name, created_by, photo_required) values (circle, 'Caminar', a, true)
    returning id into shared;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.join_circle(code);
  begin
    perform public.save_circle_photo(shared, current_date);
    assert false, 'a photo needs a linked habit';
  exception when raise_exception then null;
  end;
  insert into public.habits (user_id, name, circle_habit_id) values (b, 'Caminar', shared);
  perform public.save_circle_photo(shared, current_date);
  -- Saving the same day again replaces it (the upsert a column grant would have refused).
  perform public.save_circle_photo(shared, current_date);
  select id into photo from public.circle_habit_photos where circle_habit_id = shared and user_id = b;
  select count(*) into n from public.circle_habit_photos where circle_habit_id = shared and user_id = b;
  assert n = 1, 'one photo per person and day';
  begin
    insert into public.circle_habit_photos (circle_habit_id, user_id, day, path) values (shared, a, current_date, 'x');
    assert false, 'nobody posts a photo as someone else';
  exception when insufficient_privilege then null;
  end;
  insert into storage.objects (bucket_id, name, owner)
    values ('circle-photos', circle || '/' || shared || '/' || b || '/' || current_date || '.jpg', b);
  begin
    insert into storage.objects (bucket_id, name, owner) values ('circle-photos', circle || '/' || shared || '/' || a || '/x.jpg', b);
    assert false, 'nobody uploads into someone else''s folder';
  exception when insufficient_privilege then null;
  end;

  -- C is outside the circle: no rows, no files.
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.circle_habit_photos where circle_habit_id = shared;
  assert n = 0, 'a non-member sees no photos';
  select count(*) into n from storage.objects where bucket_id = 'circle-photos' and name like circle || '/%';
  assert n = 0, 'a non-member reads no photo files';
  begin
    insert into public.circle_photo_doubts (photo_id) values (photo);
    assert false, 'a non-member cannot doubt a photo';
  exception when insufficient_privilege then null;
  end;

  -- A (owner) and a third member G take part too: B's photo has two other judges.
  perform set_config('role', 'none', true);
  insert into auth.users (id, email, aud, role) values (g, 'g@rls-test.invalid', 'authenticated', 'authenticated');
  insert into public.social_profiles (user_id, username, display_name) values (g, 'user_g', 'G');
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', g, 'role', 'authenticated')::text, true);
  perform public.join_circle(code);
  insert into public.habits (user_id, name, circle_habit_id) values (g, 'Caminar', shared);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  insert into public.habits (user_id, name, circle_habit_id) values (a, 'Caminar', shared);
  select count(*) into n from storage.objects where bucket_id = 'circle-photos' and name like circle || '/%';
  assert n = 1, 'a member reads the circle''s photo files';
  begin
    perform public.hide_circle_photo(photo);
    assert false, 'owners no longer hide photos';
  exception when undefined_function then null;
  end;

  -- B checked in today with that photo.
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  insert into public.habit_logs (user_id, habit_id, occurrence_at, status)
    select b, id, now(), 'done' from public.habits where user_id = b and circle_habit_id = shared;
  begin
    insert into public.circle_photo_doubts (photo_id) values (photo);
    assert false, 'nobody doubts their own photo';
  exception when insufficient_privilege then null;
  end;

  -- "¿Cuenta?": one doubt of two judges is not a majority.
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  insert into public.circle_photo_doubts (photo_id) values (photo);
  begin
    insert into public.circle_photo_doubts (photo_id, voter) values (photo, g);
    assert false, 'nobody votes for someone else';
  exception when insufficient_privilege then null;
  end;
  select count(*) into n from public.circle_doubted_days where circle_habit_id = shared and user_id = b;
  assert n = 0, 'one doubt of two judges is not a majority';
  perform set_config('request.jwt.claims', json_build_object('sub', g, 'role', 'authenticated')::text, true);
  select count(*) into n from public.circle_photo_doubts;
  assert n = 0, 'votes are private';
  insert into public.circle_photo_doubts (photo_id) values (photo);
  select count(*) into n from public.circle_doubted_days where circle_habit_id = shared and user_id = b;
  assert n = 1, 'a majority marks the day as doubted, visible to the circle';
  select done into counted from public.circle_habit_days(shared, current_date - 1) where user_id = b;
  assert not counted, 'a doubted day does not count for the group';
  -- Undo brings it back.
  delete from public.circle_photo_doubts where photo_id = photo;
  select done into counted from public.circle_habit_days(shared, current_date - 1) where user_id = b;
  assert counted, 'taking a doubt back makes the day count again';
  insert into public.circle_photo_doubts (photo_id) values (photo);

  -- B posts another photo that day: the votes and the mark go.
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.habit_logs where user_id = b; -- (B's own log is untouched)
  assert n = 1, 'the author''s own check-in stays';
  perform public.save_circle_photo(shared, current_date);
  select count(*) into n from public.circle_doubted_days where circle_habit_id = shared and user_id = b;
  assert n = 1, 'saving again without a new file does not wipe the doubt';
  begin
    perform public.save_circle_photo(shared, current_date - 5);
    assert false, 'a photo for a closed day is refused';
  exception when raise_exception then
    assert sqlerrm = 'day_closed', 'expected day_closed, got ' || sqlerrm;
  end;
  -- The app uploads a new file after the record. One transaction has one now(), so the record
  -- is moved back instead (storage stamps updated_at itself).
  perform set_config('role', 'none', true);
  update public.circle_habit_photos set created_at = now() - interval '1 minute' where id = photo;
  perform set_config('role', 'authenticated', true);
  perform public.save_circle_photo(shared, current_date);
  perform set_config('role', 'none', true);
  select count(*) into n from public.circle_photo_doubts where photo_id = photo;
  assert n = 0, 'a new photo clears its votes';
  select count(*) into n from public.circle_doubted_days where circle_habit_id = shared and user_id = b;
  assert n = 0, 'a new photo clears the doubted mark';
  -- An older photo of B, to report two photos of the same person.
  insert into public.circle_habit_photos (circle_habit_id, user_id, day, path)
    values (shared, b, current_date - 1, 'x') returning id into old_photo;
  perform set_config('role', 'authenticated', true);

  -- Reports: gone for the reporter at once; for everyone from two reporters on.
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  begin
    insert into public.reports (reported, reason, photo_id) values (b, 'inappropriate_photo', photo);
    assert false, 'only circle mates report a photo';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin
    insert into public.reports (reported, reason, photo_id) values (g, 'inappropriate_photo', photo);
    assert false, 'a photo report names its author';
  exception when insufficient_privilege then null;
  end;
  insert into public.reports (reported, reason, photo_id) values (b, 'inappropriate_photo', old_photo);
  insert into public.reports (reported, reason, photo_id) values (b, 'inappropriate_photo', photo);
  select count(*) into n from public.circle_habit_photos where id = photo;
  assert n = 0, 'a reported photo is gone for its reporter';
  perform set_config('request.jwt.claims', json_build_object('sub', g, 'role', 'authenticated')::text, true);
  select count(*) into n from public.circle_habit_photos where id = photo;
  assert n = 1, 'one report hides it only for the reporter';
  insert into public.reports (reported, reason, photo_id) values (b, 'inappropriate_photo', photo);
  perform set_config('role', 'none', true);
  select count(*) into n from public.circle_habit_photos where id = photo and hidden_at is not null;
  assert n = 1, 'two reporters hide a photo for everyone';
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into n from storage.objects where bucket_id = 'circle-photos' and name like circle || '/%';
  assert n = 0, 'a hidden photo''s file is unreadable for others';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.circle_habit_photos where id = photo;
  assert n = 1, 'its author still sees a hidden photo';
  delete from public.circle_habit_photos where id = photo;
  get diagnostics n = row_count;
  assert n = 0, 'a hidden photo cannot be deleted to re-post it';
  update storage.objects set metadata = '{}' where bucket_id = 'circle-photos' and name like circle || '/%';
  get diagnostics n = row_count;
  assert n = 0, 'a hidden photo''s file cannot be replaced';
  -- (Deleting goes through the Storage API only, so SQL cannot test it; its policy has the same check.)
  begin
    perform public.save_circle_photo(shared, current_date);
    assert false, 'a hidden day cannot be posted again';
  exception when raise_exception then
    assert sqlerrm = 'photo_hidden', 'expected photo_hidden, got ' || sqlerrm;
  end;

  -- Push tokens: one owner per device token, never readable by others.
  perform public.register_push_token('ExponentPushToken[test]', 'ios');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.push_tokens;
  assert n = 0, 'nobody reads another person''s tokens';
  perform public.register_push_token('ExponentPushToken[test]', 'ios');
  perform set_config('role', 'none', true);
  select user_id into owner_of_token from public.push_tokens where token = 'ExponentPushToken[test]';
  assert owner_of_token = a, 'a device token moves to the account signed in on it';
  select count(*) into n from public.push_tokens where token = 'ExponentPushToken[test]';
  assert n = 1, 'one row per device token';

  -- Circle nudges go only to whoever still has the habit due today.
  delete from public.habit_logs where user_id = b; -- (the photo block checked B in)
  update public.circle_habits set rrule = 'FREQ=DAILY', archived_at = null where id = shared;
  update public.habits set archived_at = null, starts_on = current_date - 1 where user_id = b and circle_habit_id = shared;
  select count(*) into n from public.circle_habit_pending_today(shared) where user_id = b;
  assert n = 1, 'a member with nothing logged today is pending';
  update public.circle_habits
    set rrule = 'FREQ=WEEKLY;BYDAY=' || (array['MO','TU','WE','TH','FR','SA','SU'])[extract(isodow from public.local_today('UTC') + 1)::int]
    where id = shared;
  update public.profiles set timezone = 'UTC' where id = b;
  select count(*) into n from public.circle_habit_pending_today(shared) where user_id = b;
  assert n = 0, 'nobody is nudged on a day the habit is not due';
  update public.circle_habits set rrule = 'FREQ=DAILY' where id = shared;
  insert into public.habit_logs (user_id, habit_id, occurrence_at, status)
    select b, id, now(), 'skipped' from public.habits where user_id = b and circle_habit_id = shared;
  select count(*) into n from public.circle_habit_pending_today(shared) where user_id = b;
  assert n = 0, 'a chosen rest is not nudged';
end;
$$;

select 'ALL SOCIAL RLS CHECKS PASSED' as result;
rollback;
