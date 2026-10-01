// AI weekly review: Brote writes a short review of the user's last finished week.
// Runs on Supabase Edge Functions (Deno).
//
// - Opt-in: refuses unless profiles.ai_coach_enabled (the review sends habit names and
//   logs to Anthropic, which the privacy policy discloses).
// - The numbers are computed here, from the database, with the app's own recurrence
//   engine (_shared/, synced by scripts/sync-shared.js); Claude only writes the words.
//   The request body carries no data, so the endpoint cannot be used as a general LLM.
// - "Last week" is computed in the user's time zone (profiles.timezone), not the server's.
// - One review per user and week (unique row): a retry returns the stored one.
//
// Body: {} to get (or create) last week's review, or { "check": true } to ask whether the
// feature is available without generating anything.
import Anthropic from 'npm:@anthropic-ai/sdk@0.129.0';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@0.129.0/helpers/zod';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'npm:zod@4.6.5';

import { addDays, formatLocalDate, startOfDay } from '../_shared/recurrence.ts';
import { lastWeekStart, type SummaryLog, summarizeWeek } from '../_shared/weekly-summary.ts';
import { toZonedFloating } from '../_shared/zoned.ts';
import { SYSTEM_PROMPT, userMessage } from './prompt.ts';

// Model named for weekly reviews in CLAUDE.md; overridable without a redeploy of code.
const MODEL = Deno.env.get('COACH_MODEL') ?? 'claude-sonnet-5';
const LOG_PAGE = 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const Review = z.object({
  title: z.string(),
  win: z.string(),
  pattern: z.string(),
  suggestion: z.string(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  const body = (await req.json().catch(() => ({}))) as { check?: boolean };
  if (body.check) return json({ available: !!apiKey });
  if (!apiKey) return json({ error: 'not_configured' }, 503);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  // Reads go through the caller's own token, so RLS keeps them to their rows.
  const db = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await db.auth.getUser();
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401);
  const userId = userData.user.id;

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('timezone, locale, display_name, ai_coach_enabled')
    .eq('id', userId)
    .single();
  if (profileError || !profile) return json({ error: 'no_profile' }, 404);
  if (!profile.ai_coach_enabled) return json({ error: 'not_enabled' }, 403);

  // The user's "today", then the Monday of their last finished week (floating local dates).
  const today = startOfDay(toZonedFloating(new Date(), profile.timezone));
  const weekStart = lastWeekStart(today);
  const periodStart = formatLocalDate(weekStart);

  const { data: existing } = await db
    .from('coach_messages')
    .select('id, period_start, content, seen_at, created_at')
    .eq('kind', 'weekly_review')
    .eq('period_start', periodStart)
    .maybeSingle();
  if (existing) return json({ status: 'ready', review: existing });

  // PostgREST returns at most 1000 rows per request: page so frequent habits are never cut short.
  const readLogs = async () => {
    const rows: { habit_id: string; occurrence_at: string; status: SummaryLog['status'] }[] = [];
    for (let from = 0; ; from += LOG_PAGE) {
      const { data, error } = await db
        .from('habit_logs')
        .select('habit_id, occurrence_at, status')
        // Two weeks plus a day of margin on each side: the exact local boundaries are applied
        // after converting each log to the user's zone.
        .gte('occurrence_at', addDays(weekStart, -8).toISOString())
        .lt('occurrence_at', addDays(weekStart, 8).toISOString())
        .order('occurrence_at')
        .range(from, from + LOG_PAGE - 1);
      if (error) return { data: null, error };
      rows.push(...data);
      if (data.length < LOG_PAGE) return { data: rows, error: null };
    }
  };

  const [habitsRes, identitiesRes, logsRes] = await Promise.all([
    db
      .from('habits')
      .select('id, name, rrule, starts_on, window_start, window_end, two_minute_version, implementation_intention, identity_id')
      .is('archived_at', null),
    db.from('identities').select('id, statement'),
    readLogs(),
  ]);
  if (habitsRes.error || identitiesRes.error || logsRes.error) return json({ error: 'read_failed' }, 500);

  const identityById = new Map(identitiesRes.data.map((i) => [i.id, i.statement]));
  const habits = habitsRes.data.map((h) => ({
    ...h,
    identity: h.identity_id ? (identityById.get(h.identity_id) ?? null) : null,
  }));
  const logs: SummaryLog[] = logsRes.data!.map((log) => ({
    habit_id: log.habit_id,
    occurrence_at: toZonedFloating(new Date(log.occurrence_at), profile.timezone),
    status: log.status,
  }));

  const summary = summarizeWeek(habits, logs, weekStart);
  if (summary.total.due === 0) return json({ status: 'no_data' });

  const language = profile.locale === 'en' ? 'en' : 'es';
  const anthropic = new Anthropic({ apiKey });
  let review: z.infer<typeof Review>;
  try {
    const response = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage(JSON.stringify(summary), language, profile.display_name) }],
      output_config: { effort: 'medium', format: zodOutputFormat(Review) },
    });
    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return json({ error: 'generation_failed', reason: response.stop_reason }, 502);
    }
    review = response.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ error: 'rate_limited' }, 429);
    if (error instanceof Anthropic.APIError) return json({ error: 'generation_failed', status: error.status }, 502);
    return json({ error: 'generation_failed' }, 502);
  }

  // Writes need the service role: users can read their reviews but never insert them.
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: inserted, error: insertError } = await admin
    .from('coach_messages')
    .upsert(
      {
        user_id: userId,
        kind: 'weekly_review',
        period_start: periodStart,
        content: { ...review, summary },
        model: MODEL,
      },
      // A concurrent call already stored one: keep it, return it.
      { onConflict: 'user_id,kind,period_start', ignoreDuplicates: true },
    )
    .select('id, period_start, content, seen_at, created_at')
    .maybeSingle();
  if (insertError) return json({ error: 'write_failed' }, 500);
  if (inserted) return json({ status: 'ready', review: inserted });

  const { data: stored } = await db
    .from('coach_messages')
    .select('id, period_start, content, seen_at, created_at')
    .eq('kind', 'weekly_review')
    .eq('period_start', periodStart)
    .single();
  return json({ status: 'ready', review: stored });
});
