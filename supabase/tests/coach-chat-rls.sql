-- coach_chat privacy: each person reads and deletes only their own conversation; nobody writes it
-- directly (only the coach-chat function). Rolled back:
--   npx supabase db query --linked -f supabase/tests/coach-chat-rls.sql
begin;
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000d1', 'd1@rls-test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000d2', 'd2@rls-test.invalid', 'authenticated', 'authenticated');
insert into public.coach_chat (user_id, role, content) values
  ('00000000-0000-4000-8000-0000000000d1', 'user', 'Hola Brote'),
  ('00000000-0000-4000-8000-0000000000d1', 'brote', 'Hola 🌱'),
  ('00000000-0000-4000-8000-0000000000d2', 'user', 'Secreto');

do $$
declare
  n int;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-0000000000d1', 'role', 'authenticated')::text, true);
  select count(*) into n from public.coach_chat;
  assert n = 2, 'each person reads only their own chat';
  begin
    insert into public.coach_chat (user_id, role, content) values ('00000000-0000-4000-8000-0000000000d1', 'brote', 'fake');
    assert false, 'nobody writes Brote''s words';
  exception when insufficient_privilege then null;
  end;
  delete from public.coach_chat where user_id = '00000000-0000-4000-8000-0000000000d2';
  get diagnostics n = row_count;
  assert n = 0, 'nobody deletes someone else''s chat';
  delete from public.coach_chat;
  get diagnostics n = row_count;
  assert n = 2, 'a person can delete their whole conversation';
  perform set_config('role', 'none', true);
  select count(*) into n from public.coach_chat where user_id = '00000000-0000-4000-8000-0000000000d2';
  assert n = 1, 'the other conversation is untouched';
  -- The daily cap: atomic, not resettable by deleting the chat, closed to people.
  assert public.take_chat_slot('00000000-0000-4000-8000-0000000000d1', 2) = 1, 'first slot leaves one';
  assert public.take_chat_slot('00000000-0000-4000-8000-0000000000d1', 2) = 0, 'second slot leaves none';
  assert public.take_chat_slot('00000000-0000-4000-8000-0000000000d1', 2) = -1, 'no third slot';
  perform public.give_back_chat_slot('00000000-0000-4000-8000-0000000000d1');
  assert public.take_chat_slot('00000000-0000-4000-8000-0000000000d1', 2) = 0, 'a failed call gives its slot back';
  perform set_config('role', 'authenticated', true);
  begin
    perform public.take_chat_slot('00000000-0000-4000-8000-0000000000d1', 1000);
    assert false, 'people cannot take slots themselves';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.coach_chat_usage;
    assert false, 'nobody resets their own usage';
  exception when insufficient_privilege then null;
  end;
  perform set_config('role', 'none', true);
end;
$$;

select 'COACH CHAT CHECKS PASSED' as result;
rollback;
