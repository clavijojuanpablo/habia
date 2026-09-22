-- When the user's day ends (roughly bedtime). Hours between night_ends_at and
-- morning_starts_at are "sleep" and hidden from the week grid. 24 = midnight.
alter table public.profiles
  add column night_ends_at smallint not null default 24
    check (night_ends_at between 1 and 24);

alter table public.profiles
  add constraint profiles_night_ends_after_start check (night_starts_at < night_ends_at);
