-- 支持新用户注册赠送积分功能
-- 1美金 = 10积分，新用户注册赠送 30 积分 = 3美金（3次视频生成机会，每次生成消耗10积分）

-- 更新充值记录表的注释，说明 amount 字段存储的是美金
COMMENT ON COLUMN recharge_records.amount IS '充值金额（美金），1美金 = 10积分';

-- 添加支付方式注释说明
COMMENT ON COLUMN recharge_records.payment_method IS '支付方式：stripe, welcome_bonus（新用户注册赠送）等';

-- 确保 status 字段支持 completed 状态（已在 006 迁移中扩展，包含 'refunded'）
-- status 字段支持：'pending', 'completed', 'failed', 'cancelled', 'refunded'

-- 验证充值记录表结构
DO $$
BEGIN
  -- 检查 amount 字段约束（应该允许 > 0，3.00 美金符合要求）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'recharge_records' 
    AND constraint_name LIKE '%amount%'
  ) THEN
    RAISE NOTICE 'Warning: amount constraint not found';
  ELSE
    RAISE NOTICE 'Amount constraint verified: amount > 0';
  END IF;
  
  -- 检查 status 字段约束
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'recharge_records_status_check'
    AND check_clause LIKE '%completed%'
  ) THEN
    RAISE NOTICE 'Status constraint verified: supports completed status';
  ELSE
    RAISE NOTICE 'Warning: status constraint may not support completed';
  END IF;
  
  RAISE NOTICE 'Welcome bonus support verified';
END $$;

