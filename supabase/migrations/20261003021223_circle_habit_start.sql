-- A circle IS its habit (decided 2026-10-02): one icon (the circle's), and whoever starts the habit
-- is in it from the first moment. One call, one transaction: the shared habit and the creator's own
-- linked habit are created together, so a circle never ends up with a habit its creator must still
-- "join".
create function public.start_circle_habit(
  p_circle uuid,
  p_name text,
  p_rrule text,
  p_two_minute text,
  p_photo boolean,
  p_today date
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  circle_emoji text;
  shared uuid;
begin
  if me is null or not private.is_circle_owner(p_circle, me) then
    raise exception 'not_owner' using errcode = 'P0001';
  end if;
  select emoji into circle_emoji from public.circles where id = p_circle;
  -- The table's checks (name length, DAILY/WEEKLY rrule, one active habit per circle) still apply.
  insert into public.circle_habits (circle_id, name, icon, rrule, two_minute_version, photo_required, created_by)
  values (p_circle, btrim(p_name), coalesce(circle_emoji, '🌱'), p_rrule, nullif(btrim(p_two_minute), ''), p_photo, me)
  returning id into shared;
  -- The creator's own copy, as joining would make it (their local date, sent by the app).
  insert into public.habits (user_id, name, icon, rrule, two_minute_version, circle_habit_id, starts_on)
  values (me, btrim(p_name), coalesce(circle_emoji, '🌱'), p_rrule, nullif(btrim(p_two_minute), ''), shared,
          coalesce(p_today, current_date));
  return shared;
end;
$$;

revoke execute on function public.start_circle_habit(uuid, text, text, text, boolean, date) from public, anon;
grant execute on function public.start_circle_habit(uuid, text, text, text, boolean, date) to authenticated;
