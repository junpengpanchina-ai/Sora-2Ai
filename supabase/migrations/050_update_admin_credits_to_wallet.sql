-- Update admin_adjust_user_credits to use new wallet system
-- Migration: 050_update_admin_credits_to_wallet.sql

-- Drop old function
DROP FUNCTION IF EXISTS admin_adjust_user_credits(
  UUID,
  UUID,
  INTEGER,
  TEXT,
  TEXT,
  UUID,
  UUID
);

-- Create new function that updates wallets instead of users.credits
CREATE OR REPLACE FUNCTION admin_adjust_user_credits(
  p_admin_user_id UUID,
  p_user_id UUID,
  p_delta INTEGER,
  p_reason TEXT,
  p_adjustment_type TEXT,
  p_related_recharge_id UUID DEFAULT NULL,
  p_related_consumption_id UUID DEFAULT NULL
)
RETURNS credit_adjustments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  w RECORD;
  current_total BIGINT;
  new_total BIGINT;
  adjustment_row credit_adjustments;
  now_ts TIMESTAMPTZ := NOW();
BEGIN
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'Delta must not be zero';
  END IF;

  -- Get or create wallet
  SELECT * INTO w
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

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
  END IF;

  -- Calculate current total
  current_total := COALESCE(w.permanent_credits, 0) + COALESCE(w.bonus_credits, 0);
  new_total := current_total + p_delta;

  IF new_total < 0 THEN
    RAISE EXCEPTION 'Insufficient credits for adjustment';
  END IF;

  -- Update wallet: add to permanent credits (admin adjustments are permanent)
  UPDATE public.wallets
  SET permanent_credits = GREATEST(0, permanent_credits + p_delta),
      updated_at = now_ts
  WHERE user_id = p_user_id;

  -- Also update users.credits for backward compatibility (deprecated but kept for now)
  UPDATE users
  SET credits = GREATEST(0, COALESCE(credits, 0) + p_delta)
  WHERE id = p_user_id;

  -- Record in credit_ledger
  INSERT INTO public.credit_ledger (
    user_id,
    type,
    credits_delta,
    ref_type,
    ref_id,
    meta
  )
  VALUES (
    p_user_id,
    'adjust',
    p_delta,
    'admin',
    p_admin_user_id::TEXT,
    jsonb_build_object(
      'adjustment_type', p_adjustment_type,
      'reason', NULLIF(p_reason, ''),
      'related_recharge_id', p_related_recharge_id,
      'related_consumption_id', p_related_consumption_id
    )
  );

  -- Record in credit_adjustments (for admin audit trail)
  INSERT INTO credit_adjustments (
    user_id,
    admin_user_id,
    delta,
    adjustment_type,
    reason,
    related_recharge_id,
    related_consumption_id,
    before_credits,
    after_credits
  )
  VALUES (
    p_user_id,
    p_admin_user_id,
    p_delta,
    p_adjustment_type,
    NULLIF(p_reason, ''),
    p_related_recharge_id,
    p_related_consumption_id,
    current_total,
    new_total
  )
  RETURNING *
  INTO adjustment_row;

  RETURN adjustment_row;
END;
$$;

REVOKE ALL ON FUNCTION admin_adjust_user_credits(UUID, UUID, INTEGER, TEXT, TEXT, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_adjust_user_credits(UUID, UUID, INTEGER, TEXT, TEXT, UUID, UUID) TO authenticated;

