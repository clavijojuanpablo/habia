-- Per-habit reminder: minutes before each timed occurrence (0 = at the time).
-- NULL disables reminders for the habit.
alter table public.habits
  add column reminder_minutes_before smallint
    check (reminder_minutes_before between 0 and 240);

-- Day bands must be ordered so every hour maps to exactly one band.
alter table public.profiles
  add constraint profiles_day_bands_ordered
    check (morning_starts_at < afternoon_starts_at and afternoon_starts_at < night_starts_at);
