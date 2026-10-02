// Deletes circle photos older than 7 days: the files in Storage and their rows. Runs on Supabase
// Edge Functions (Deno), called once a day by pg_cron (supabase/sql/schedule-photo-cleanup.sql).
//
// Not callable by users: it requires the CRON_SECRET header. Files are removed through the
// Storage API (deleting storage.objects rows in SQL would leave the files behind).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MAX_AGE_DAYS = 7;
const BATCH = 500;

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return new Response('unauthorized', { status: 401 });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  let removed = 0;
  // Every old file, including those whose row already went (a circle habit deleted in between).
  for (;;) {
    const { data: names, error } = await admin.rpc('expired_photo_files', { p_before: cutoff, p_limit: BATCH });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    const paths = (names ?? []) as string[];
    if (paths.length === 0) break;
    const { error: removeError } = await admin.storage.from('circle-photos').remove(paths);
    if (removeError) return new Response(JSON.stringify({ error: removeError.message }), { status: 500 });
    removed += paths.length;
    if (paths.length < BATCH) break;
  }
  const { error: rowsError, count } = await admin
    .from('circle_habit_photos')
    .delete({ count: 'exact' })
    .lt('created_at', cutoff);
  if (rowsError) return new Response(JSON.stringify({ error: rowsError.message }), { status: 500 });

  return new Response(JSON.stringify({ files: removed, rows: count ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
