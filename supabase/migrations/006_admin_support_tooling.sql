-- 006_admin_support_tooling.sql
-- 扩展售后表、充值表，新增积分调整记录表及存储过程

-- 1. 扩充 recharge_records 状态枚举并添加管理员备注
ALTER TABLE recharge_records DROP CONSTRAINT IF EXISTS recharge_records_status_check;
ALTER TABLE recharge_records
  ADD CONSTRAINT recharge_records_status_check
  CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded'));

ALTER TABLE recharge_records
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. 扩展售后问题表，支持管理员处理信息
ALTER TABLE after_sales_issues
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE after_sales_issues
  ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE after_sales_issues
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- 3. 创建积分调整记录表
CREATE TABLE IF NOT EXISTS credit_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  delta INTEGER NOT NULL CHECK (delta <> 0),
  adjustment_type TEXT NOT NULL CHECK (
    adjustment_type IN (
      'manual_increase',
      'manual_decrease',
      'recharge_correction',
      'recharge_refund',
      'consumption_refund',
      'other'
    )
  ),
  reason TEXT,
  related_recharge_id UUID REFERENCES recharge_records(id) ON DELETE SET NULL,
  related_consumption_id UUID REFERENCES consumption_records(id) ON DELETE SET NULL,
  before_credits INTEGER,
  after_credits INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_adjustments_user_id ON credit_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_adjustments_admin_user_id ON credit_adjustments(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_adjustments_created_at ON credit_adjustments(created_at DESC);

-- 4. 创建统一的积分调整存储过程
DROP FUNCTION IF EXISTS admin_adjust_user_credits(
  UUID,
  UUID,
  INTEGER,
  TEXT,
  TEXT,
  UUID,
  UUID
);

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
  current_credits INTEGER;
  new_credits INTEGER;
  adjustment_row credit_adjustments;
BEGIN
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'Delta must not be zero';
  END IF;

  SELECT credits
  INTO current_credits
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_credits IS NULL THEN
    current_credits := 0;
  END IF;

  new_credits := current_credits + p_delta;

  IF new_credits < 0 THEN
    RAISE EXCEPTION 'Insufficient credits for adjustment';
  END IF;

  UPDATE users
  SET credits = new_credits
  WHERE id = p_user_id;

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
    current_credits,
    new_credits
  )
  RETURNING *
  INTO adjustment_row;

  RETURN adjustment_row;
END;
$$;

REVOKE ALL ON FUNCTION admin_adjust_user_credits(UUID, UUID, INTEGER, TEXT, TEXT, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_adjust_user_credits(UUID, UUID, INTEGER, TEXT, TEXT, UUID, UUID) TO authenticated;


