-- Schedules photos-cleanup once a day (03:30 UTC). Run ONCE, by hand, after deploying the function:
--   1. Pick a long random secret and store it in two places:
--        npx supabase secrets set CRON_SECRET=<secret>
--        and below in vault.create_secret (same value).
--   2. Replace <project-ref> with the project's ref (Dashboard → Project Settings → General).
--   3. npx supabase db query --linked -f supabase/sql/schedule-photo-cleanup.sql
-- pg_cron and pg_net come with Supabase at no extra cost; the job is one small HTTP call a day.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('<secret>', 'photos_cleanup_secret');

select cron.schedule(
  'photos-cleanup',
  '30 3 * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/photos-cleanup',
    headers := jsonb_build_object(
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'photos_cleanup_secret')
    )
  );
  $$
);
