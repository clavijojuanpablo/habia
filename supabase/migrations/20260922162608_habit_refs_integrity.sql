-- Foreign keys only guarantee that a referenced row exists, not that it belongs
-- to the same user. RLS does not check referenced rows either. This trigger makes
-- sure a habit can only point to the owner's own anchor habit and identity, and
-- that habit stacks never form a cycle (A after B after A).

create function public.validate_habit_refs() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  current_id uuid;
  depth int := 0;
begin
  if new.identity_id is not null and not exists (
    select 1 from public.identities i where i.id = new.identity_id and i.user_id = new.user_id
  ) then
    raise exception 'identity % does not belong to this user', new.identity_id using errcode = '42501';
  end if;

  if new.anchor_habit_id is not null then
    if not exists (
      select 1 from public.habits h where h.id = new.anchor_habit_id and h.user_id = new.user_id
    ) then
      raise exception 'anchor habit % does not belong to this user', new.anchor_habit_id using errcode = '42501';
    end if;

    -- Walk up the chain of anchors; reaching this habit again means a cycle.
    current_id := new.anchor_habit_id;
    while current_id is not null and depth < 50 loop
      if current_id = new.id then
        raise exception 'habit stack would create a cycle' using errcode = '23514';
      end if;
      select h.anchor_habit_id into current_id from public.habits h where h.id = current_id;
      depth := depth + 1;
    end loop;
  end if;

  return new;
end;
$$;

create trigger habits_validate_refs
  before insert or update of identity_id, anchor_habit_id, user_id on public.habits
  for each row execute function public.validate_habit_refs();

-- Keep the stacked habit's cue consistent when its anchor is deleted.
create function public.reset_cue_on_anchor_removed() returns trigger
language plpgsql as $$
begin
  if new.anchor_habit_id is null and new.cue_type = 'after_habit' then
    new.cue_type := 'time';
  end if;
  return new;
end;
$$;

create trigger habits_reset_cue
  before update of anchor_habit_id on public.habits
  for each row execute function public.reset_cue_on_anchor_removed();
