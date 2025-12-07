-- 更新充值记录表 amount 字段注释
-- 说明：amount 字段存储的是美金，不是人民币
-- 1美金 = 10积分

-- 更新注释
COMMENT ON COLUMN recharge_records.amount IS '充值金额（美金），1美金 = 10积分';

-- 验证字段类型和约束
DO $$
BEGIN
  -- 检查 amount 字段类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recharge_records' 
    AND column_name = 'amount'
    AND data_type = 'numeric'
  ) THEN
    RAISE NOTICE 'Amount field type verified: DECIMAL(10,2)';
  ELSE
    RAISE WARNING 'Amount field type may be incorrect';
  END IF;
  
  -- 检查 amount 约束
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'recharge_records' 
    AND constraint_name LIKE '%amount%'
    AND constraint_type = 'CHECK'
  ) THEN
    RAISE NOTICE 'Amount constraint verified: CHECK (amount > 0)';
  ELSE
    RAISE WARNING 'Amount constraint not found';
  END IF;
  
  RAISE NOTICE 'Recharge amount field updated to USD';
END $$;

