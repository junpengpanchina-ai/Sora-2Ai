-- 支持admin调整临时积分（bonus_credits）
-- 迁移编号: 062

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

DROP FUNCTION IF EXISTS admin_adjust_user_credits(
  UUID,
  UUID,
  INTEGER,
  TEXT,
  TEXT,
  UUID,
  UUID,
  TEXT,
  INTEGER
);

-- Create new function that supports both permanent and bonus credits adjustment
CREATE OR REPLACE FUNCTION admin_adjust_user_credits(
  p_admin_user_id UUID,
  p_user_id UUID,
  p_delta INTEGER,
  p_reason TEXT,
  p_adjustment_type TEXT,
  p_related_recharge_id UUID DEFAULT NULL,
  p_related_consumption_id UUID DEFAULT NULL,
  p_credit_type TEXT DEFAULT 'permanent', -- 'permanent' or 'bonus'
  p_bonus_expires_days INTEGER DEFAULT NULL -- Only used when p_credit_type = 'bonus' and p_delta > 0
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
  new_bonus_expires_at TIMESTAMPTZ;
BEGIN
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'Delta must not be zero';
  END IF;

  IF p_credit_type NOT IN ('permanent', 'bonus') THEN
    RAISE EXCEPTION 'Credit type must be "permanent" or "bonus"';
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

  -- Update wallet based on credit type
  IF p_credit_type = 'permanent' THEN
    -- Adjust permanent credits
    UPDATE credit_wallet
    SET permanent_credits = GREATEST(0, COALESCE(permanent_credits, 0) + p_delta),
        updated_at = now_ts
    WHERE user_id = p_user_id;
    
    new_total := current_total + p_delta;
  ELSE
    -- Adjust bonus credits
    IF p_delta > 0 THEN
      -- Adding bonus credits: set expiration if provided
      IF p_bonus_expires_days IS NOT NULL AND p_bonus_expires_days > 0 THEN
        new_bonus_expires_at := now_ts + (p_bonus_expires_days || ' days')::INTERVAL;
        -- If there's existing bonus with expiration, extend to the later date
        IF wallet_record.bonus_expires_at IS NOT NULL AND wallet_record.bonus_expires_at > now_ts THEN
          new_bonus_expires_at := GREATEST(new_bonus_expires_at, wallet_record.bonus_expires_at);
        END IF;
      ELSE
        -- Use existing expiration or set default 7 days
        IF wallet_record.bonus_expires_at IS NOT NULL AND wallet_record.bonus_expires_at > now_ts THEN
          new_bonus_expires_at := wallet_record.bonus_expires_at;
        ELSE
          new_bonus_expires_at := now_ts + INTERVAL '7 days';
        END IF;
      END IF;
      
      UPDATE credit_wallet
      SET bonus_credits = GREATEST(0, COALESCE(bonus_credits, 0) + p_delta),
          bonus_expires_at = new_bonus_expires_at,
          updated_at = now_ts
      WHERE user_id = p_user_id;
    ELSE
      -- Deducting bonus credits
      UPDATE credit_wallet
      SET bonus_credits = GREATEST(0, COALESCE(bonus_credits, 0) + p_delta),
          updated_at = now_ts
      WHERE user_id = p_user_id;
      
      -- Clear expiration if bonus credits become 0
      IF (COALESCE(wallet_record.bonus_credits, 0) + p_delta) <= 0 THEN
        UPDATE credit_wallet
        SET bonus_expires_at = NULL,
            updated_at = now_ts
        WHERE user_id = p_user_id;
      END IF;
    END IF;
    
    -- Recalculate total after bonus adjustment
    SELECT * INTO wallet_record
    FROM credit_wallet
    WHERE user_id = p_user_id;
    
    new_total := COALESCE(wallet_record.permanent_credits, 0) + 
                 CASE 
                   WHEN wallet_record.bonus_expires_at IS NOT NULL 
                        AND wallet_record.bonus_expires_at > now_ts 
                   THEN COALESCE(wallet_record.bonus_credits, 0)
                   ELSE 0
                 END;
  END IF;

  IF new_total < 0 THEN
    RAISE EXCEPTION 'Insufficient credits for adjustment';
  END IF;

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
      'credit_type', p_credit_type,
      'reason', NULLIF(p_reason, ''),
      'related_recharge_id', p_related_recharge_id,
      'related_consumption_id', p_related_consumption_id,
      'bonus_expires_days', p_bonus_expires_days
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

REVOKE ALL ON FUNCTION admin_adjust_user_credits(UUID, UUID, INTEGER, TEXT, TEXT, UUID, UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_adjust_user_credits(UUID, UUID, INTEGER, TEXT, TEXT, UUID, UUID, TEXT, INTEGER) TO authenticated;

COMMENT ON FUNCTION admin_adjust_user_credits IS 'Admin credit adjustment function - supports both permanent and bonus credits adjustment';
