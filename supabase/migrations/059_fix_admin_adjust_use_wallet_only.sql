-- 修复：admin_adjust_user_credits 完全使用钱包系统，移除对旧 users.credits 的更新
-- 迁移编号: 059
-- 问题：admin 调整积分时仍更新旧的 users.credits 字段
-- 解决：完全使用 credit_wallet 表，移除对 users.credits 的更新

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

-- Create new function that ONLY uses credit_wallet (no users.credits update)
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
  wallet_record RECORD;
  current_total INTEGER;
  new_total INTEGER;
  adjustment_row credit_adjustments;
  now_ts TIMESTAMPTZ := NOW();
BEGIN
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'Delta must not be zero';
  END IF;

  -- Get or create wallet (using credit_wallet table)
  SELECT * INTO wallet_record
  FROM credit_wallet
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Auto-create wallet if it doesn't exist (initialize to 0)
    INSERT INTO credit_wallet (user_id, permanent_credits, bonus_credits, created_at, updated_at)
    VALUES (p_user_id, 0, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING
    RETURNING * INTO wallet_record;
    
    -- If insert failed (concurrent conflict), query again
    IF NOT FOUND THEN
      SELECT * INTO wallet_record
      FROM credit_wallet
      WHERE user_id = p_user_id
      FOR UPDATE;
    END IF;
    
    -- If still not found, return error (shouldn't happen)
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Failed to create wallet';
    END IF;
  END IF;

  -- Expire bonus if needed
  IF wallet_record.bonus_expires_at IS NOT NULL AND wallet_record.bonus_expires_at <= now_ts THEN
    UPDATE credit_wallet
    SET bonus_credits = 0,
        bonus_expires_at = NULL,
        updated_at = now_ts
    WHERE user_id = p_user_id;
    wallet_record.bonus_credits := 0;
  END IF;

  -- Calculate current total (permanent + valid bonus)
  current_total := COALESCE(wallet_record.permanent_credits, 0) + 
                   CASE 
                     WHEN wallet_record.bonus_expires_at IS NOT NULL 
                          AND wallet_record.bonus_expires_at > now_ts 
                     THEN COALESCE(wallet_record.bonus_credits, 0)
                     ELSE 0
                   END;
  new_total := current_total + p_delta;

  IF new_total < 0 THEN
    RAISE EXCEPTION 'Insufficient credits for adjustment';
  END IF;

  -- Update wallet: add to permanent credits (admin adjustments are permanent)
  -- Note: We only adjust permanent_credits, not bonus_credits
  UPDATE credit_wallet
  SET permanent_credits = GREATEST(0, COALESCE(permanent_credits, 0) + p_delta),
      updated_at = now_ts
  WHERE user_id = p_user_id;

  -- Record in credit_ledger (for audit trail)
  INSERT INTO credit_ledger (
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

COMMENT ON FUNCTION admin_adjust_user_credits IS 'Admin credit adjustment function - uses credit_wallet only, no users.credits update';
