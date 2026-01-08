-- database/migrations/billing_wallet_schema.sql
-- 需要 pgcrypto
create extension if not exists pgcrypto;

-- 用户钱包：永久 + bonus + bonus过期时间
create table if not exists wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  permanent_credits bigint not null default 0,
  bonus_credits bigint not null default 0,
  bonus_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 账本（强烈建议有）：每次加减币都记一条
create table if not exists wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_permanent bigint not null default 0,
  delta_bonus bigint not null default 0,
  reason text not null,
  ref_type text,        -- 'stripe' | 'render' | 'admin' ...
  ref_id text,          -- payment_intent / checkout_session / job_id ...
  created_at timestamptz not null default now()
);

-- 购买记录：用于幂等与风控
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,                          -- starter/creator/studio/pro
  amount_usd numeric(10,2) not null,
  currency text not null default 'usd',

  stripe_event_id text unique,                    -- webhook event.id 幂等
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_payment_link_id text,
  stripe_payment_link_url text,

  status text not null default 'completed',       -- completed/refunded/chargeback/blocked
  device_id text,
  ip_prefix text,                                 -- /24
  card_fingerprint text,
  created_at timestamptz not null default now()
);

-- 每日用量（Starter限频必需）
create table if not exists usage_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  sora_count int not null default 0,
  veo_fast_count int not null default 0,
  veo_pro_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, day)
);

-- 设备表（可选，但建议有，便于查同设备多账号）
create table if not exists user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(user_id, device_id)
);

-- 风险事件（可选）
create table if not exists risk_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  device_id text,
  ip_prefix text,
  event text not null, -- 'starter_purchase_blocked' / 'burst_renders' ...
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 索引优化
create index if not exists idx_wallet_ledger_user_id on wallet_ledger(user_id, created_at desc);
create index if not exists idx_purchases_user_id on purchases(user_id, created_at desc);
create index if not exists idx_purchases_plan_id on purchases(plan_id, status);
create index if not exists idx_purchases_device_id on purchases(device_id) where device_id is not null;
create index if not exists idx_purchases_ip_prefix on purchases(ip_prefix) where ip_prefix is not null;
create index if not exists idx_purchases_card_fingerprint on purchases(card_fingerprint) where card_fingerprint is not null;
create index if not exists idx_usage_daily_user_day on usage_daily(user_id, day);
create index if not exists idx_user_devices_user_device on user_devices(user_id, device_id);
create index if not exists idx_risk_events_user_id on risk_events(user_id, created_at desc);

-- RLS：钱包属于自己
alter table wallets enable row level security;
drop policy if exists "wallets_select_own" on wallets;
create policy "wallets_select_own" on wallets for select
  using (auth.uid() = user_id);
drop policy if exists "wallets_update_own" on wallets;
create policy "wallets_update_own" on wallets for update
  using (auth.uid() = user_id);

alter table wallet_ledger enable row level security;
drop policy if exists "ledger_select_own" on wallet_ledger;
create policy "ledger_select_own" on wallet_ledger for select
  using (auth.uid() = user_id);

alter table usage_daily enable row level security;
drop policy if exists "usage_select_own" on usage_daily;
create policy "usage_select_own" on usage_daily for select
  using (auth.uid() = user_id);

-- purchases / risk_events 通常不给前端直接读（只给后台/管理员）
alter table purchases enable row level security;
alter table risk_events enable row level security;
alter table user_devices enable row level security;

