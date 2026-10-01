-- TEST DATA for shared circle habits: six fake people in a private circle owned by `owner_username`.
-- Circles are private, so nobody else ever sees them. Remove everything with test-cleanup.sql.
--   npx supabase db query --linked -f supabase/seed/test-circle.sql
-- Fake accounts use @habia.test emails and have no password: nobody can sign in as them. Their
-- usernames (test_ana…) exist while the data does, so run test-cleanup.sql as soon as you are done.
-- Set owner_username below to the account that should own the test circle.
do $$
declare
  owner_username constant text := 'clavijojuanpablo';
  owner uuid;
  tz text;
  local_today date;
  circle uuid;
  shared uuid;
  person record;
  uid uuid;
  habit uuid;
  d int;
  p float;
  roll float;
begin
  select user_id into owner from public.social_profiles where username = owner_username;
  if owner is null then raise exception 'owner % not found', owner_username; end if;
  if exists (select 1 from auth.users where email like '%@habia.test') then
    raise exception 'test data already exists: run test-cleanup.sql first';
  end if;
  select coalesce(timezone, 'UTC') into tz from public.profiles where id = owner;
  local_today := (now() at time zone tz)::date;
  perform setseed(0.42);

  insert into public.circles (name, emoji, created_by) values ('Test · Familia', '🧪', owner) returning id into circle;
  insert into public.circle_members (circle_id, user_id, role) values (circle, owner, 'owner');
  insert into public.circle_habits (circle_id, name, icon, two_minute_version, created_by)
    values (circle, 'Caminar 20 min', '🚶', 'Salir a la puerta con zapatos', owner) returning id into shared;

  -- kind: steady (p every day) · comeback (low, then high) · quit (high, then nothing)
  for person in
    select * from (values
      ('ana',    'Ana',    '#7B6CF6', 'steady',   0.95),
      ('luis',   'Luis',   '#FF9F43', 'steady',   0.88),
      ('sofia',  'Sofía',  '#EF7BC0', 'steady',   0.60),
      ('carlos', 'Carlos', '#4CB4F0', 'steady',   0.45),
      ('marta',  'Marta',  '#2FBFB0', 'comeback', 0.90),
      ('pedro',  'Pedro',  '#F2667A', 'quit',     0.85)
    ) as v(slug, name, color, kind, rate)
  loop
    insert into auth.users (id, email, aud, role, raw_user_meta_data)
    values (gen_random_uuid(), 'test_' || person.slug || '@habia.test', 'authenticated', 'authenticated',
            jsonb_build_object('display_name', 'Test · ' || person.name))
    returning id into uid;
    update public.profiles set timezone = tz where id = uid;
    insert into public.social_profiles (user_id, username, display_name, color)
      values (uid, 'test_' || person.slug, 'Test · ' || person.name, person.color);
    insert into public.circle_members (circle_id, user_id) values (circle, uid);

    insert into public.habits (user_id, name, icon, rrule, two_minute_version, circle_habit_id, starts_on)
      values (uid, 'Caminar 20 min', '🚶', 'FREQ=DAILY', 'Salir a la puerta con zapatos', shared, local_today - 30)
      returning id into habit;
    for d in reverse 30..0 loop
      p := case person.kind
        when 'comeback' then case when d > 14 then 0.25 else person.rate end
        when 'quit' then case when d > 11 then person.rate else 0 end
        else person.rate end;
      -- Today only the steadiest have walked yet, so the card shows "N more to count".
      if d = 0 and person.rate < 0.88 then p := 0; end if;
      roll := random();
      if roll < p then
        insert into public.habit_logs (user_id, habit_id, occurrence_at, status)
          values (uid, habit, ((local_today - d)::timestamp at time zone tz), 'done');
      elsif roll > 0.97 and d > 0 then
        insert into public.habit_logs (user_id, habit_id, occurrence_at, status)
          values (uid, habit, ((local_today - d)::timestamp at time zone tz), 'skipped');
      end if;
    end loop;
end loop;
end;
$$;

select c.name as circle, count(m.*) as members
from public.circles c join public.circle_members m on m.circle_id = c.id
where c.name = 'Test · Familia' group by c.name;
