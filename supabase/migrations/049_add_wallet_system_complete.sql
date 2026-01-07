-- Complete Wallet System Migration
-- Migration: 049_add_wallet_system_complete.sql
-- This replaces and extends the previous wallet system with complete functionality

-- 1. Wallet table (stores permanent + bonus credits)
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  permanent_credits BIGINT NOT NULL DEFAULT 0 CHECK (permanent_credits >= 0),
  bonus_credits BIGINT NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  bonus_expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_bonus_expires ON public.wallets(bonus_expires_at);

-- 2. User entitlements (plan access, features)
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'starter', 'creator', 'studio', 'pro')),
  starter_expires_at TIMESTAMPTZ,
  veo_pro_enabled BOOLEAN NOT NULL DEFAULT false,
  priority_queue BOOLEAN NOT NULL DEFAULT false,
  max_concurrency INT NOT NULL DEFAULT 1 CHECK (max_concurrency >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Daily usage caps (for Starter anti-abuse)
CREATE TABLE IF NOT EXISTS public.usage_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  sora_count INT NOT NULL DEFAULT 0 CHECK (sora_count >= 0),
  veo_fast_count INT NOT NULL DEFAULT 0 CHECK (veo_fast_count >= 0),
  veo_pro_count INT NOT NULL DEFAULT 0 CHECK (veo_pro_count >= 0),
  failed_count INT NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  last_device_id TEXT,
  last_ip_hash TEXT,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_usage_daily_day ON public.usage_daily(day DESC);

-- 4. Purchases (for "Starter once" enforcement + auditing)
CREATE TABLE IF NOT EXISTS public.purchases (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL CHECK (item_id IN ('starter', 'creator', 'studio', 'pro', 'veoProUpgrade')),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_payment_id TEXT NOT NULL,
  amount_usd NUMERIC(10,2) NOT NULL CHECK (amount_usd >= 0),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refunded', 'chargeback')),
  device_id TEXT,
  payment_fingerprint TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_payment_id) -- Idempotency: same payment can't be recorded twice
);

CREATE INDEX IF NOT EXISTS purchases_user_time_idx ON public.purchases(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS purchases_item_idx ON public.purchases(item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS purchases_provider_payment_idx ON public.purchases(provider, provider_payment_id);

-- 5. Risk devices (optional but recommended for anti-abuse)
CREATE TABLE IF NOT EXISTS public.risk_devices (
  device_id TEXT PRIMARY KEY,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT
);

-- Function: Deduct credits (bonus first, check expiration)
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_cost INT
) RETURNS TABLE (
  ok BOOLEAN,
  error TEXT,
  remaining_permanent BIGINT,
  remaining_bonus BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  w RECORD;
  now_ts TIMESTAMPTZ := NOW();
  cost_left INT := p_cost;
  take_bonus BIGINT := 0;
  take_perm BIGINT := 0;
BEGIN
  IF p_cost <= 0 THEN
    RETURN QUERY SELECT TRUE, NULL::TEXT, 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;

  -- Lock wallet row (prevent concurrent modifications)
  SELECT * INTO w
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Create wallet if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.wallets(user_id) VALUES (p_user_id);
    SELECT * INTO w
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;
  END IF;

  -- Expire bonus if needed
  IF w.bonus_expires_at IS NOT NULL AND w.bonus_expires_at <= now_ts THEN
    UPDATE public.wallets
      SET bonus_credits = 0,
          bonus_expires_at = NULL,
          updated_at = now_ts
    WHERE user_id = p_user_id;

    w.bonus_credits := 0;
    w.bonus_expires_at := NULL;
  END IF;

  -- Take from bonus first
  IF w.bonus_credits > 0 THEN
    take_bonus := LEAST(w.bonus_credits, cost_left);
    cost_left := cost_left - take_bonus::INT;
  END IF;

  -- Then permanent
  IF cost_left > 0 THEN
    IF w.permanent_credits < cost_left THEN
      RETURN QUERY
        SELECT FALSE, 'insufficient_credits', w.permanent_credits, w.bonus_credits;
      RETURN;
    END IF;
    take_perm := cost_left;
    cost_left := 0;
  END IF;

  -- Update wallet
  UPDATE public.wallets
    SET bonus_credits = bonus_credits - take_bonus,
        permanent_credits = permanent_credits - take_perm,
        updated_at = now_ts
  WHERE user_id = p_user_id;

  RETURN QUERY
    SELECT TRUE, NULL::TEXT,
           (w.permanent_credits - take_perm),
           (w.bonus_credits - take_bonus);
END;
$$;

-- Function: Check and increment daily usage (Starter caps)
CREATE OR REPLACE FUNCTION public.check_and_increment_daily_usage(
  p_user_id UUID,
  p_model TEXT,          -- 'sora'|'veo_fast'|'veo_pro'
  p_device_id TEXT,
  p_ip_hash TEXT
) RETURNS TABLE (
  ok BOOLEAN,
  error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  d DATE := (NOW() AT TIME ZONE 'utc')::DATE;
  u RECORD;
  ent RECORD;
  sora_cap INT := 6;
  fast_cap INT := 1;
  pro_cap INT := 0;
BEGIN
  -- Get or create entitlements
  SELECT * INTO ent
  FROM public.user_entitlements
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_entitlements(user_id) VALUES (p_user_id);
    SELECT * INTO ent
    FROM public.user_entitlements
    WHERE user_id = p_user_id;
  END IF;

  -- Only enforce caps for starter plan
  IF ent.plan_id <> 'starter' THEN
    RETURN QUERY SELECT TRUE, NULL::TEXT;
    RETURN;
  END IF;

  -- Upsert daily usage record
  INSERT INTO public.usage_daily(user_id, day, last_device_id, last_ip_hash)
  VALUES (p_user_id, d, p_device_id, p_ip_hash)
  ON CONFLICT (user_id, day)
  DO UPDATE SET last_device_id = EXCLUDED.last_device_id,
                last_ip_hash = EXCLUDED.last_ip_hash;

  -- Get current usage (locked)
  SELECT * INTO u
  FROM public.usage_daily
  WHERE user_id = p_user_id AND day = d
  FOR UPDATE;

  -- Check and increment based on model
  IF p_model = 'sora' THEN
    IF u.sora_count >= sora_cap THEN
      RETURN QUERY SELECT FALSE, 'starter_daily_cap_sora';
      RETURN;
    END IF;
    UPDATE public.usage_daily SET sora_count = sora_count + 1 WHERE user_id = p_user_id AND day = d;

  ELSIF p_model = 'veo_fast' THEN
    IF u.veo_fast_count >= fast_cap THEN
      RETURN QUERY SELECT FALSE, 'starter_daily_cap_veo_fast';
      RETURN;
    END IF;
    UPDATE public.usage_daily SET veo_fast_count = veo_fast_count + 1 WHERE user_id = p_user_id AND day = d;

  ELSIF p_model = 'veo_pro' THEN
    -- Starter locked from Veo Pro
    RETURN QUERY SELECT FALSE, 'starter_veo_pro_locked';
    RETURN;

  ELSE
    RETURN QUERY SELECT FALSE, 'unknown_model';
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

-- Function: Apply purchase (add credits + update entitlements)
CREATE OR REPLACE FUNCTION public.apply_purchase(
  p_user_id UUID,
  p_item_id TEXT,                 -- 'starter'|'creator'|'studio'|'pro'|'veoProUpgrade'
  p_permanent BIGINT,
  p_bonus BIGINT,
  p_bonus_expires_at TIMESTAMPTZ,
  p_plan_id TEXT,
  p_veo_pro_enabled BOOLEAN,
  p_priority BOOLEAN,
  p_max_concurrency INT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Wallet upsert (add credits)
  INSERT INTO public.wallets(user_id, permanent_credits, bonus_credits, bonus_expires_at)
  VALUES (p_user_id, p_permanent, p_bonus, p_bonus_expires_at)
  ON CONFLICT (user_id)
  DO UPDATE SET
    permanent_credits = public.wallets.permanent_credits + EXCLUDED.permanent_credits,
    bonus_credits = public.wallets.bonus_credits + EXCLUDED.bonus_credits,
    bonus_expires_at = GREATEST(
      COALESCE(public.wallets.bonus_expires_at, '1970-01-01'::TIMESTAMPTZ),
      COALESCE(EXCLUDED.bonus_expires_at, '1970-01-01'::TIMESTAMPTZ)
    ),
    updated_at = NOW();

  -- Entitlements upsert (paid packs overwrite to higher plan)
  INSERT INTO public.user_entitlements(user_id, plan_id, veo_pro_enabled, priority_queue, max_concurrency)
  VALUES (p_user_id, p_plan_id, p_veo_pro_enabled, p_priority, p_max_concurrency)
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    veo_pro_enabled = EXCLUDED.veo_pro_enabled,
    priority_queue = EXCLUDED.priority_queue,
    max_concurrency = EXCLUDED.max_concurrency,
    updated_at = NOW();
END;
$$;

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_entitlements_updated_at ON public.user_entitlements;
CREATE TRIGGER update_user_entitlements_updated_at
  BEFORE UPDATE ON public.user_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

