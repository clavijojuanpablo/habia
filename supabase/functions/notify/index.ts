// Social push notifications. Runs on Supabase Edge Functions (Deno).
//
// The app calls it right after a social moment (a cheer, a friend request, an accepted request,
// a check-in on a shared circle habit). It never trusts the body: it reads the event back from
// the database with the caller's id, so nobody can make it notify anyone about anything.
// Every push respects the recipient's switch (profiles.social_push), blocks, and push_log
// (one nudge of a kind per person, thing and day).
//
// Body: { type: 'cheer', cheerId } | { type: 'friend_request', userId } |
//       { type: 'friend_accepted', userId } | { type: 'circle_checkin', circleHabitId }
//       (friend types also take { username } instead of userId)
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

type Body =
  | { type: 'cheer'; cheerId: string }
  | { type: 'friend_request' | 'friend_accepted'; userId?: string; username?: string }
  | { type: 'circle_checkin'; circleHabitId: string };

type Lang = 'es' | 'en';
type Push = { recipient: string; kind: string; ref: string; day: string; title: string; body: string; data: Record<string, string> };

const CHEERS: Record<string, Record<Lang, string>> = {
  clap: { es: 'te aplaude: ¡bien hecho! 👏', en: 'applauds you: well done! 👏' },
  water: { es: 'regó tu árbol 💧', en: 'watered your tree 💧' },
  fire: { es: 'dice: ¡sigue así! 🔥', en: 'says: keep it up! 🔥' },
  you_can: { es: 'cree en ti: hoy puedes 🤝', en: 'believes in you: you’ve got this 🤝' },
  plant_with_me: { es: 'te invita a sembrar juntos hoy 🌱', en: 'invites you to plant together today 🌱' },
};

const text = {
  friendRequest: { es: (n: string) => `${n} quiere ser tu amigo en habia`, en: (n: string) => `${n} wants to be your friend on habia` },
  friendAccepted: { es: (n: string) => `${n} aceptó tu solicitud 🎉`, en: (n: string) => `${n} accepted your request 🎉` },
  circleTitle: { es: (c: string) => `${c} 🔥`, en: (c: string) => `${c} 🔥` },
  circleBody: {
    es: (n: string, h: string) => `${n} ya hizo «${h}» hoy. ¿Te sumas? 💧`,
    en: (n: string, h: string) => `${n} already did “${h}” today. Join in? 💧`,
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401);
  const me = userData.user.id;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return json({ error: 'bad_request' }, 400);

  const { data: sender } = await admin.from('social_profiles').select('display_name').eq('user_id', me).maybeSingle();
  if (!sender) return json({ error: 'no_username' }, 400);
  const name = sender.display_name;
  const pushes: Push[] = [];

  if (body.type === 'cheer') {
    const { data: cheer } = await admin
      .from('cheers')
      .select('id, to_user, kind, day')
      .eq('id', body.cheerId)
      .eq('from_user', me)
      .maybeSingle();
    if (!cheer) return json({ sent: 0 });
    const lang = await langOf(admin, cheer.to_user);
    pushes.push({
      recipient: cheer.to_user,
      kind: 'cheer',
      ref: cheer.id,
      day: cheer.day,
      title: name,
      body: CHEERS[cheer.kind]?.[lang] ?? '💚',
      data: { type: 'cheer', from: me },
    });
  } else if (body.type === 'friend_request' || body.type === 'friend_accepted') {
    const other = body.userId ?? (await idOf(admin, body.username));
    if (!other) return json({ sent: 0 });
    const [a, b] = me < other ? [me, other] : [other, me];
    const { data: pair } = await admin
      .from('friendships')
      .select('status, requested_by')
      .eq('user_a', a)
      .eq('user_b', b)
      .maybeSingle();
    const valid =
      body.type === 'friend_request'
        ? pair?.status === 'pending' && pair.requested_by === me
        : pair?.status === 'accepted' && pair.requested_by === other;
    if (!valid) return json({ sent: 0 });
    const lang = await langOf(admin, other);
    pushes.push({
      recipient: other,
      kind: body.type,
      ref: me,
      day: new Date().toISOString().slice(0, 10),
      title: 'habia',
      body: (body.type === 'friend_request' ? text.friendRequest : text.friendAccepted)[lang](name),
      data: body.type === 'friend_request' ? { type: 'friend_request' } : { type: 'friend', id: me },
    });
  } else if (body.type === 'circle_checkin') {
    const { data: habit } = await admin
      .from('circle_habits')
      .select('id, name, circle_id, circles(name)')
      .eq('id', body.circleHabitId)
      .is('archived_at', null)
      .maybeSingle();
    if (!habit) return json({ sent: 0 });
    const { data: pending } = await admin.rpc('circle_habit_pending_today', { p_circle_habit: habit.id });
    const rows = (pending ?? []) as { user_id: string; local_day: string }[];
    // The caller must be in it and done today (not in the pending list).
    const { data: mine } = await admin
      .from('habits')
      .select('id')
      .eq('user_id', me)
      .eq('circle_habit_id', habit.id)
      .is('archived_at', null)
      .maybeSingle();
    if (!mine || rows.some((r) => r.user_id === me)) return json({ sent: 0 });
    const circleName = (habit.circles as unknown as { name: string } | null)?.name ?? 'habia';
    for (const row of rows) {
      if (await blocked(admin, me, row.user_id)) continue;
      const lang = await langOf(admin, row.user_id);
      pushes.push({
        recipient: row.user_id,
        kind: 'circle_checkin',
        ref: habit.id,
        day: row.local_day,
        title: text.circleTitle[lang](circleName),
        body: text.circleBody[lang](name, habit.name),
        data: { type: 'circle', id: habit.circle_id },
      });
    }
  } else {
    return json({ error: 'bad_request' }, 400);
  }

  return json({ sent: await deliver(admin, pushes) });
});

async function idOf(admin: SupabaseClient, username: string | undefined) {
  if (!username) return null;
  const { data } = await admin.from('social_profiles').select('user_id').eq('username', username).maybeSingle();
  return data?.user_id ?? null;
}

async function langOf(admin: SupabaseClient, userId: string): Promise<Lang> {
  const { data } = await admin.from('profiles').select('locale').eq('id', userId).maybeSingle();
  return data?.locale === 'en' ? 'en' : 'es';
}

async function blocked(admin: SupabaseClient, a: string, b: string) {
  const { count } = await admin
    .from('blocks')
    .select('blocker', { count: 'exact', head: true })
    .or(`and(blocker.eq.${a},blocked.eq.${b}),and(blocker.eq.${b},blocked.eq.${a})`);
  return (count ?? 0) > 0;
}

/** Sends what is allowed (switch on, not sent today), then forgets tokens Expo says are dead. */
async function deliver(admin: SupabaseClient, pushes: Push[]) {
  const messages: { to: string; title: string; body: string; data: Record<string, string>; sound: string }[] = [];
  for (const push of pushes) {
    const { data: profile } = await admin.from('profiles').select('social_push').eq('id', push.recipient).maybeSingle();
    if (!profile?.social_push) continue;
    // Claim the slot first: the primary key makes a second claim fail, so a retry never repeats a push.
    const { error: claimed } = await admin
      .from('push_log')
      .insert({ recipient: push.recipient, kind: push.kind, ref: push.ref, day: push.day });
    if (claimed) continue;
    const { data: tokens } = await admin.from('push_tokens').select('token').eq('user_id', push.recipient);
    for (const { token } of tokens ?? []) {
      messages.push({ to: token, title: push.title, body: push.body, data: push.data, sound: 'default' });
    }
  }
  if (messages.length === 0) return 0;

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  const result = (await response.json().catch(() => null)) as {
    data?: { status: string; details?: { error?: string } }[];
  } | null;
  const dead = (result?.data ?? [])
    .map((ticket, i) => (ticket.details?.error === 'DeviceNotRegistered' ? messages[i].to : null))
    .filter((token): token is string => !!token);
  if (dead.length > 0) await admin.from('push_tokens').delete().in('token', dead);
  return messages.length;
}
