// Keeps public.entitlements in step with RevenueCat. Runs on Supabase Edge Functions (Deno).
//
// RevenueCat calls it on every subscription event (purchase, renewal, cancellation, expiration,
// refund, transfer…) with the Authorization header set in its dashboard. Events can arrive late,
// twice or out of order, so the body only says WHO changed: the function then asks RevenueCat's
// API for that account's current "pro" entitlement and copies it. RevenueCat stays the source of
// truth; the table is a mirror the server can read.
//
// Secrets: REVENUECAT_WEBHOOK_AUTH (the header value) and REVENUECAT_SECRET_KEY (a V1 secret key).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ENTITLEMENT = 'pro';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RevenueCatEvent = {
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transferred_from?: string[];
  transferred_to?: string[];
};
type Subscriber = {
  entitlements: Record<string, { expires_date: string | null; product_identifier: string }>;
  subscriptions: Record<
    string,
    {
      store?: string;
      unsubscribe_detected_at?: string | null;
      refunded_at?: string | null;
      grace_period_expires_date?: string | null;
    }
  >;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  const auth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  if (!auth || !(await sameSecret(req.headers.get('Authorization') ?? '', auth))) {
    return json({ error: 'unauthorized' }, 401);
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const { event } = (await req.json().catch(() => ({}))) as { event?: RevenueCatEvent };
  if (!event) return json({ error: 'bad_request' }, 400);

  // Every account the event touches; anonymous RevenueCat ids ($RCAnonymousID:…) are not ours.
  const ids = new Set(
    [
      event.app_user_id,
      event.original_app_user_id,
      ...(event.aliases ?? []),
      ...(event.transferred_from ?? []),
      ...(event.transferred_to ?? []),
    ].filter((id): id is string => !!id && UUID.test(id)),
  );

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  for (const id of ids) {
    const { subscriber, status } = await fetchSubscriber(id);
    // RevenueCat retries later. 401/403 here = REVENUECAT_SECRET_KEY is wrong or not a V1 key.
    if (!subscriber) return json({ error: 'revenuecat_unavailable', status }, 502);
    const pro = subscriber.entitlements[ENTITLEMENT];
    const subscription = pro ? subscriber.subscriptions[pro.product_identifier] : undefined;
    const refunded = !!subscription?.refunded_at;
    const { error } = await admin.from('entitlements').upsert({
      user_id: id,
      // No expiry = lifetime. An entitlement that lapsed keeps its date (in the past = not Pro).
      pro_until: !pro || refunded ? null : proUntil(pro.expires_date, subscription?.grace_period_expires_date),
      product_id: pro?.product_identifier ?? null,
      store: subscription?.store ?? null,
      will_renew: !!pro && !refunded && !subscription?.unsubscribe_detected_at,
      updated_at: new Date().toISOString(),
    });
    // 23503: the account was deleted meanwhile; nothing to keep for it.
    if (error && error.code !== '23503') return json({ error: error.message }, 500);
  }
  return json({ updated: ids.size });
});

/** No expiry = lifetime; a billing grace period (Apple retrying the card) keeps Pro until it ends. */
function proUntil(expires: string | null, grace: string | null | undefined) {
  if (expires === null) return 'infinity';
  return grace && Date.parse(grace) > Date.parse(expires) ? grace : expires;
}

/** Compares digests, so the time taken says nothing about how much of the secret matched. */
async function sameSecret(given: string, expected: string) {
  const digest = async (value: string) =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  const [a, b] = await Promise.all([digest(given), digest(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function fetchSubscriber(id: string): Promise<{ subscriber: Subscriber | null; status: number }> {
  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('REVENUECAT_SECRET_KEY')}` },
  });
  if (!response.ok) return { subscriber: null, status: response.status };
  const body = (await response.json()) as { subscriber?: Subscriber };
  return { subscriber: body.subscriber ?? null, status: response.status };
}
