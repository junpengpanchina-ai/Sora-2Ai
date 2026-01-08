-- Migration: 0001_billing.sql
-- Complete billing system: profiles, wallets, ledger, purchases, pending grants, starter anti-abuse

-- 1) Profiles (用于 webhook 通过 email 找 user_id)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz default now()
);

-- 2) Wallets
create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  permanent_credits bigint not null default 0,
  bonus_credits bigint not null default 0,
  bonus_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 3) Ledger (审计账本)
create table if not exists public.wallet_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_permanent bigint not null default 0,
  delta_bonus bigint not null default 0,
  reason text not null,
  ref_type text,
  ref_id text,
  created_at timestamptz not null default now()
);

-- 4) Purchases (幂等锚点：stripe_event_id UNIQUE)
create table if not exists public.purchases (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  plan_id text not null,
  payment_link_id text not null,

  stripe_event_id text not null unique,
  stripe_session_id text unique,
  stripe_payment_intent_id text unique,

  email text,
  amount_total bigint,
  currency text default 'usd',
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

-- 5) Pending grants（找不到 user 时先记下来）
create table if not exists public.pending_credit_grants (
  id bigserial primary key,
  stripe_event_id text not null unique,
  stripe_session_id text unique,
  payment_link_id text not null,
  plan_id text not null,
  email text,
  amount_total bigint,
  currency text default 'usd',
  created_at timestamptz not null default now()
);

-- 6) Starter anti-abuse
create table if not exists public.starter_purchase_guards (
  id bigserial primary key,
  user_id uuid,
  device_id text,
  ip text,
  email text,
  created_at timestamptz default now()
);
create index if not exists idx_spg_ip_time on public.starter_purchase_guards (ip, created_at desc);
create index if not exists idx_spg_device_time on public.starter_purchase_guards (device_id, created_at desc);

-- 7) ensure wallet row exists
create or replace function public.ensure_wallet(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.wallets(user_id) values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

-- 8) grant credits atomically + idempotently
create or replace function public.grant_credits_for_purchase(
  p_user_id uuid,
  p_plan_id text,
  p_payment_link_id text,
  p_stripe_event_id text,
  p_stripe_session_id text,
  p_stripe_payment_intent_id text,
  p_email text,
  p_amount_total bigint,
  p_currency text
)
returns void
language plpgsql
security definer
as $$
declare
  v_perm bigint := 0;
  v_bonus bigint := 0;
  v_bonus_days int := 0;
  v_expires_at timestamptz := null;
begin
  insert into public.purchases(
    user_id, plan_id, payment_link_id,
    stripe_event_id, stripe_session_id, stripe_payment_intent_id,
    email, amount_total, currency, status
  )
  values (
    p_user_id, p_plan_id, p_payment_link_id,
    p_stripe_event_id, p_stripe_session_id, p_stripe_payment_intent_id,
    p_email, p_amount_total, p_currency, 'paid'
  )
  on conflict (stripe_event_id) do nothing;

  if not found then
    return;
  end if;

  perform public.ensure_wallet(p_user_id);

  -- MUST match your planConfig()
  if p_plan_id = 'starter' then
    v_perm := 0; v_bonus := 200; v_bonus_days := 7;
  elsif p_plan_id = 'creator' then
    v_perm := 2000; v_bonus := 600; v_bonus_days := 14;
  elsif p_plan_id = 'studio' then
    v_perm := 6000; v_bonus := 1500; v_bonus_days := 30;
  elsif p_plan_id = 'pro' then
    v_perm := 20000; v_bonus := 4000; v_bonus_days := 60;
  else
    raise exception 'Unknown plan_id: %', p_plan_id;
  end if;

  if v_bonus_days > 0 then
    v_expires_at := now() + make_interval(days => v_bonus_days);
  end if;

  update public.wallets
  set
    permanent_credits = permanent_credits + v_perm,
    bonus_credits = bonus_credits + v_bonus,
    bonus_expires_at = case
      when bonus_expires_at is null then v_expires_at
      when v_expires_at is null then bonus_expires_at
      else greatest(bonus_expires_at, v_expires_at)
    end,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.wallet_ledger(user_id, delta_permanent, delta_bonus, reason, ref_type, ref_id)
  values (p_user_id, v_perm, v_bonus, 'purchase_grant', 'stripe_event', p_stripe_event_id);
end;
$$;

-- 9) deduct credits with rules
-- - bonus expires automatically
-- - sora/veo_fast: use bonus first then permanent
-- - veo_pro: permanent-only (protects cashflow)
create or replace function public.deduct_credits_from_wallet(
  p_user_id uuid,
  p_model_id text,
  p_cost bigint,
  p_ref_id text
)
returns table(permanent_spent bigint, bonus_spent bigint)
language plpgsql
security definer
as $$
declare
  w record;
  v_bonus_spent bigint := 0;
  v_perm_spent bigint := 0;
begin
  perform public.ensure_wallet(p_user_id);

  select * into w from public.wallets where user_id = p_user_id for update;

  -- expire bonus
  if w.bonus_expires_at is not null and w.bonus_expires_at < now() then
    if w.bonus_credits > 0 then
      insert into public.wallet_ledger(user_id, delta_permanent, delta_bonus, reason, ref_type, ref_id)
      values (p_user_id, 0, -w.bonus_credits, 'bonus_expired', 'system', p_ref_id);
    end if;

    update public.wallets
    set bonus_credits = 0, bonus_expires_at = null, updated_at = now()
    where user_id = p_user_id;

    w.bonus_credits := 0;
    w.bonus_expires_at := null;
  end if;

  if p_model_id = 'veo_pro' then
    if w.permanent_credits < p_cost then
      raise exception 'INSUFFICIENT_PERMANENT_CREDITS';
    end if;

    v_perm_spent := p_cost;

    update public.wallets
    set permanent_credits = permanent_credits - v_perm_spent,
        updated_at = now()
    where user_id = p_user_id;

    insert into public.wallet_ledger(user_id, delta_permanent, delta_bonus, reason, ref_type, ref_id)
    values (p_user_id, -v_perm_spent, 0, 'render_deduct', p_model_id, p_ref_id);

    return query select v_perm_spent, 0;
  end if;

  -- sora/veo_fast: bonus first
  v_bonus_spent := least(greatest(w.bonus_credits, 0), p_cost);
  v_perm_spent := p_cost - v_bonus_spent;

  if w.permanent_credits < v_perm_spent then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  update public.wallets
  set
    bonus_credits = bonus_credits - v_bonus_spent,
    permanent_credits = permanent_credits - v_perm_spent,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.wallet_ledger(user_id, delta_permanent, delta_bonus, reason, ref_type, ref_id)
  values (p_user_id, -v_perm_spent, -v_bonus_spent, 'render_deduct', p_model_id, p_ref_id);

  return query select v_perm_spent, v_bonus_spent;
end;
$$;

