// Chat with Brote. Runs on Supabase Edge Functions (Deno).
//
// - Opt-in: refuses unless profiles.ai_coach_enabled (it sends habit names, logs and the user's
//   messages to Anthropic, which the privacy policy discloses).
// - The context is computed HERE from the database (habits, the last 60 days, patterns between
//   habits via _shared/patterns.ts); the app only sends the question. Claude explains numbers
//   the code computed; it never sees anything the app could have made up.
// - A daily cap per person (CHAT_DAILY_LIMIT, default 20), counted in coach_chat_usage (which
//   people cannot touch, so deleting the chat never resets it), keeps costs bounded; with
//   CHAT_REQUIRES_PRO=true it is for Pro subscribers only.
// - Writes go through the service role: people read and delete their chat, never write it.
//
// Body: { message: string }  →  { reply: string, remaining: number }
import Anthropic from 'npm:@anthropic-ai/sdk@0.129.0';
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { findPatterns, habitDays, type PatternLog } from '../_shared/patterns.ts';
import { addDays, formatLocalDate, startOfDay } from '../_shared/recurrence.ts';
import { toZonedFloating } from '../_shared/zoned.ts';
import { SYSTEM_PROMPT, userMessage } from './prompt.ts';

// Daily-message model (CLAUDE.md): fast and cheap; overridable with the CHAT_MODEL secret.
const MODEL = Deno.env.get('CHAT_MODEL') ?? 'claude-haiku-4-5-20251001';
// A mistyped secret must never remove the cap: anything that is not a positive number means 20.
const configuredLimit = Number(Deno.env.get('CHAT_DAILY_LIMIT'));
const DAILY_LIMIT = Number.isFinite(configuredLimit) && configuredLimit > 0 ? Math.floor(configuredLimit) : 20;
const MAX_QUESTION = 500;
const HISTORY = 12;
const WINDOW_DAYS = 60;
const LOG_PAGE = 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'not_configured' }, 503);

  const body = (await req.json().catch(() => ({}))) as { message?: unknown };
  const question = typeof body.message === 'string' ? body.message.trim() : '';
  if (!question || question.length > MAX_QUESTION) return json({ error: 'bad_message' }, 400);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  // Reads with the caller's token: RLS keeps every query to their own rows.
  const db = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await db.auth.getUser();
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401);
  const userId = userData.user.id;

  const { data: profile } = await db
    .from('profiles')
    .select('timezone, locale, display_name, ai_coach_enabled')
    .eq('id', userId)
    .single();
  if (!profile) return json({ error: 'no_profile' }, 404);
  if (!profile.ai_coach_enabled) return json({ error: 'not_enabled' }, 403);

  if (Deno.env.get('CHAT_REQUIRES_PRO') === 'true') {
    const { data: entitlement } = await db.from('entitlements').select('pro_until').maybeSingle();
    const until = entitlement?.pro_until;
    if (!(until === 'infinity' || (until && Date.parse(until) > Date.now()))) return json({ error: 'pro_required' }, 402);
  }

  // Writes and the cap go through the service role (people can neither write the chat nor reset
  // their usage). The slot is taken BEFORE Claude, atomically, and given back if anything fails.
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: remaining, error: slotError } = await admin.rpc('take_chat_slot', { p_user: userId, p_limit: DAILY_LIMIT });
  if (slotError) return json({ error: 'read_failed' }, 500);
  if (remaining < 0) return json({ error: 'daily_limit', remaining: 0 }, 429);
  const fail = async (body: Record<string, unknown>, status: number) => {
    await admin.rpc('give_back_chat_slot', { p_user: userId });
    return json(body, status);
  };

  // ---- context: the user's habits and patterns, in their own time zone ----
  const today = startOfDay(toZonedFloating(new Date(), profile.timezone));
  const from = addDays(today, -WINDOW_DAYS);
  const readLogs = async () => {
    const rows: { habit_id: string; occurrence_at: string; status: PatternLog['status'] }[] = [];
    for (let page = 0; ; page += LOG_PAGE) {
      const { data, error } = await db
        .from('habit_logs')
        .select('habit_id, occurrence_at, status')
        .gte('occurrence_at', addDays(from, -1).toISOString())
        // A unique tiebreaker: many logs share a time, and pages must not skip or repeat rows.
        .order('occurrence_at')
        .order('id')
        .range(page, page + LOG_PAGE - 1);
      if (error) return null;
      rows.push(...data);
      if (data.length < LOG_PAGE) return rows;
    }
  };
  const [habitsRes, identitiesRes, logRows, historyRes] = await Promise.all([
    db
      .from('habits')
      .select('id, name, rrule, starts_on, window_start, window_end, two_minute_version, identity_id')
      .is('archived_at', null),
    db.from('identities').select('id, statement'),
    readLogs(),
    db.from('coach_chat').select('role, content').order('created_at', { ascending: false }).limit(HISTORY),
  ]);
  if (habitsRes.error || identitiesRes.error || !logRows || historyRes.error) return fail({ error: 'read_failed' }, 500);

  const logs: PatternLog[] = logRows.map((log) => ({
    habit_id: log.habit_id,
    occurrence_at: toZonedFloating(new Date(log.occurrence_at), profile.timezone),
    status: log.status,
  }));
  // Settled days only: today counts once it is done (a pending habit is not a miss yet).
  const days = habitDays(habitsRes.data, logs, from, addDays(today, 1));
  const todayKey = formatLocalDate(today);
  for (const map of days.values()) if (map.get(todayKey) === 'missed') map.delete(todayKey);

  const identityById = new Map(identitiesRes.data.map((i) => [i.id, i.statement]));
  const nameById = new Map(habitsRes.data.map((h) => [h.id, h.name]));
  const recent = (map: Map<string, string>) =>
    Array.from({ length: 14 }, (_, i) => {
      const status = map.get(formatLocalDate(addDays(today, i - 13)));
      return status === 'done' ? 'd' : status === 'missed' ? 'm' : status === 'rest' ? 'r' : '.';
    }).join('');
  const context = {
    today: todayKey,
    habits: habitsRes.data.map((h) => {
      const map = days.get(h.id)!;
      const last30 = [...map.entries()].filter(([day, s]) => day > formatLocalDate(addDays(today, -30)) && s !== 'rest');
      const done = last30.filter(([, s]) => s === 'done').length;
      return {
        name: h.name,
        identity: h.identity_id ? (identityById.get(h.identity_id) ?? null) : null,
        minimum: h.two_minute_version,
        last30Percent: last30.length ? Math.round((done / last30.length) * 100) : null,
        last14: recent(map),
      };
    }),
    patterns: findPatterns(days).map((p) => ({ ...p, from: nameById.get(p.from), to: nameById.get(p.to) })),
  };

  // ---- Claude ----
  const language = profile.locale === 'en' ? 'en' : 'es';
  const history = [...historyRes.data].reverse().map((m) => ({
    role: m.role === 'brote' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }));
  const anthropic = new Anthropic({ apiKey });
  let reply: string;
  try {
    const response = await anthropic.beta.messages.create({
      // If a safety classifier declines by mistake, the API retries on its recommended fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      model: MODEL,
      max_tokens: 600,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        ...history,
        { role: 'user', content: userMessage(JSON.stringify(context), question, language, profile.display_name) },
      ],
    });
    reply = response.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('\n')
      .trim();
    if (!reply) return fail({ error: 'generation_failed', reason: response.stop_reason }, 502);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return fail({ error: 'rate_limited' }, 429);
    if (error instanceof Anthropic.APIError) return fail({ error: 'generation_failed', status: error.status }, 502);
    return fail({ error: 'generation_failed' }, 502);
  }

  const asked = new Date();
  const { error: insertError } = await admin.from('coach_chat').insert([
    { user_id: userId, role: 'user', content: question, created_at: asked.toISOString() },
    { user_id: userId, role: 'brote', content: reply.slice(0, 4000), created_at: new Date(asked.getTime() + 1).toISOString() },
  ]);
  // The answer exists and the slot was used: a failed write only loses the stored copy.
  if (insertError) return json({ reply, remaining });

  return json({ reply, remaining });
});
