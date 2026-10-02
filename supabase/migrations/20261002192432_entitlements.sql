-- Pro subscriptions. RevenueCat is the source of truth; its webhook (Edge Function
-- revenuecat-webhook) copies each account's "pro" entitlement here, so the server can tell who is
-- Pro (AI features, later) without trusting the app. Only the service role writes.

create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Pro until this instant; null = not Pro (never bought, or refunded / transferred away).
  pro_until timestamptz,
  product_id text,
  store text,
  will_renew boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

create policy "entitlements: own read" on public.entitlements
  for select using (user_id = (select auth.uid()));

revoke insert, update, delete on public.entitlements from authenticated, anon;
