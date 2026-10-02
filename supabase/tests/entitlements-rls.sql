-- Privacy checks for public.entitlements. Runs against the linked project inside a transaction
-- that is always rolled back:
--   npx supabase db query --linked -f supabase/tests/entitlements-rls.sql
-- Success prints 'ALL ENTITLEMENT CHECKS PASSED'; a broken rule fails its ASSERT by name.
begin;
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000e1', 'e1@rls-test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000e2', 'e2@rls-test.invalid', 'authenticated', 'authenticated');
insert into public.entitlements (user_id, pro_until, product_id, store, will_renew) values
  ('00000000-0000-4000-8000-0000000000e1', now() + interval '1 year', 'habia_pro_annual', 'app_store', true),
  ('00000000-0000-4000-8000-0000000000e2', null, null, null, false);

do $$
declare
  n int;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-0000000000e2', 'role', 'authenticated')::text, true);
  select count(*) into n from public.entitlements;
  assert n = 1, 'each person reads only their own entitlement';
  begin
    update public.entitlements set pro_until = 'infinity' where user_id = '00000000-0000-4000-8000-0000000000e2';
    assert false, 'nobody makes themselves Pro';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.entitlements (user_id, pro_until) values ('00000000-0000-4000-8000-0000000000e2', 'infinity')
      on conflict do nothing;
    assert false, 'nobody inserts an entitlement';
  exception when insufficient_privilege then null;
  end;
  perform set_config('role', 'none', true);
end;
$$;

-- Deleting the account takes its entitlement with it.
delete from auth.users where id = '00000000-0000-4000-8000-0000000000e1';
do $$
begin
  assert not exists (select 1 from public.entitlements where user_id = '00000000-0000-4000-8000-0000000000e1'),
    'account deletion removes the entitlement';
end;
$$;

select 'ALL ENTITLEMENT CHECKS PASSED' as result;
rollback;
