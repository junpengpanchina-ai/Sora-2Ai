-- Migration: 051_add_risk_control_fields.sql
-- Add risk control fields to purchases table for anti-abuse tracking

-- Add risk control fields to purchases table
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS payment_last4 TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS ip_prefix TEXT;

-- Create index for risk queries
CREATE INDEX IF NOT EXISTS idx_purchases_device_id ON public.purchases(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_payment_fingerprint ON public.purchases(payment_fingerprint) WHERE payment_fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_ip_prefix ON public.purchases(ip_prefix) WHERE ip_prefix IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_item_id_device ON public.purchases(item_id, device_id) WHERE item_id = 'starter' AND device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_item_id_ip ON public.purchases(item_id, ip_prefix) WHERE item_id = 'starter' AND ip_prefix IS NOT NULL;

-- Function: Check if user can purchase Starter (anti-abuse)
CREATE OR REPLACE FUNCTION public.can_purchase_starter(
  p_user_id UUID,
  p_device_id TEXT,
  p_ip_prefix TEXT,
  p_payment_fingerprint TEXT
) RETURNS TABLE (
  can_purchase BOOLEAN,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  device_count INT := 0;
  ip_count INT := 0;
  fingerprint_count INT := 0;
  user_has_starter BOOLEAN := false;
BEGIN
  -- Check if user already purchased Starter
  SELECT EXISTS(
    SELECT 1 FROM public.purchases
    WHERE user_id = p_user_id
      AND item_id = 'starter'
      AND status = 'paid'
  ) INTO user_has_starter;

  IF user_has_starter THEN
    RETURN QUERY SELECT FALSE, 'user_already_purchased_starter';
    RETURN;
  END IF;

  -- Check device count (same device, different users)
  IF p_device_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT user_id) INTO device_count
    FROM public.purchases
    WHERE device_id = p_device_id
      AND item_id = 'starter'
      AND status = 'paid'
      AND created_at > NOW() - INTERVAL '7 days';
  END IF;

  IF device_count >= 1 THEN
    RETURN QUERY SELECT FALSE, 'device_already_used_for_starter';
    RETURN;
  END IF;

  -- Check IP count (same IP /24, different users)
  IF p_ip_prefix IS NOT NULL THEN
    SELECT COUNT(DISTINCT user_id) INTO ip_count
    FROM public.purchases
    WHERE ip_prefix = p_ip_prefix
      AND item_id = 'starter'
      AND status = 'paid'
      AND created_at > NOW() - INTERVAL '1 day';
  END IF;

  IF ip_count >= 3 THEN
    RETURN QUERY SELECT FALSE, 'ip_prefix_limit_reached';
    RETURN;
  END IF;

  -- Check payment fingerprint (same card, different users)
  IF p_payment_fingerprint IS NOT NULL THEN
    SELECT COUNT(DISTINCT user_id) INTO fingerprint_count
    FROM public.purchases
    WHERE payment_fingerprint = p_payment_fingerprint
      AND item_id = 'starter'
      AND status = 'paid';
  END IF;

  IF fingerprint_count >= 1 THEN
    RETURN QUERY SELECT FALSE, 'payment_fingerprint_already_used';
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

-- Function: Get risk profile for user
CREATE OR REPLACE FUNCTION public.get_risk_profile(
  p_user_id UUID,
  p_device_id TEXT,
  p_ip_prefix TEXT
) RETURNS TABLE (
  starter_attempts INT,
  device_count_7d INT,
  ip_count_7d INT,
  velocity_renders_24h INT,
  payment_fingerprints INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Starter attempts
    (SELECT COUNT(*)::INT
     FROM public.purchases
     WHERE user_id = p_user_id
       AND item_id = 'starter'
       AND status = 'paid') AS starter_attempts,
    
    -- Device count (same device, different users)
    (SELECT COUNT(DISTINCT user_id)::INT
     FROM public.purchases
     WHERE device_id = p_device_id
       AND item_id = 'starter'
       AND status = 'paid'
       AND created_at > NOW() - INTERVAL '7 days') AS device_count_7d,
    
    -- IP count (same IP /24, different users)
    (SELECT COUNT(DISTINCT user_id)::INT
     FROM public.purchases
     WHERE ip_prefix = p_ip_prefix
       AND item_id = 'starter'
       AND status = 'paid'
       AND created_at > NOW() - INTERVAL '7 days') AS ip_count_7d,
    
    -- Velocity (renders in last 24h) - approximate from usage_daily
    (SELECT COALESCE(SUM(sora_count + veo_fast_count + veo_pro_count), 0)::INT
     FROM public.usage_daily
     WHERE user_id = p_user_id
       AND day = (NOW() AT TIME ZONE 'utc')::DATE) AS velocity_renders_24h,
    
    -- Payment fingerprints (different cards used)
    (SELECT COUNT(DISTINCT payment_fingerprint)::INT
     FROM public.purchases
     WHERE user_id = p_user_id
       AND payment_fingerprint IS NOT NULL) AS payment_fingerprints;
END;
$$;

