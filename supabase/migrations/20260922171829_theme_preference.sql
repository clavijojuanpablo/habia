-- Appearance preference, synced across devices. Light is the default.
alter table public.profiles
  add column theme_preference text not null default 'light'
    check (theme_preference in ('light', 'dark', 'system'));
