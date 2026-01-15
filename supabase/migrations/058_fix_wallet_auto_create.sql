-- 修复：deduct_credits_from_wallet 自动创建钱包（如果不存在）
-- 迁移编号: 058
-- 问题：老用户没有钱包记录，导致 "Wallet not found" 错误
-- 解决：在扣除积分时，如果钱包不存在，自动创建（初始化为 0）

CREATE OR REPLACE FUNCTION deduct_credits_from_wallet(
  user_uuid UUID,
  credits_needed INTEGER,
  model_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  wallet_record RECORD;
  bonus_used INTEGER := 0;
  permanent_used INTEGER := 0;
  remaining INTEGER;
BEGIN
  -- 获取钱包记录，如果不存在则自动创建
  SELECT * INTO wallet_record
  FROM credit_wallet
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    -- 自动创建钱包（初始化为 0）
    INSERT INTO credit_wallet (user_id, permanent_credits, bonus_credits, created_at, updated_at)
    VALUES (user_uuid, 0, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING
    RETURNING * INTO wallet_record;
    
    -- 如果插入失败（并发冲突），再次查询
    IF NOT FOUND THEN
      SELECT * INTO wallet_record
      FROM credit_wallet
      WHERE user_id = user_uuid;
    END IF;
    
    -- 如果仍然不存在，返回错误（理论上不应该发生）
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Failed to create wallet');
    END IF;
  END IF;
  
  remaining := credits_needed;
  
  -- 优先使用 Bonus（如果可用且未过期）
  IF model_type != 'veo-pro' 
     AND wallet_record.bonus_credits > 0 
     AND wallet_record.bonus_expires_at IS NOT NULL 
     AND wallet_record.bonus_expires_at > NOW() THEN
    IF wallet_record.bonus_credits >= remaining THEN
      bonus_used := remaining;
      remaining := 0;
    ELSE
      bonus_used := wallet_record.bonus_credits;
      remaining := remaining - bonus_used;
    END IF;
  END IF;
  
  -- 使用永久积分
  IF remaining > 0 THEN
    IF wallet_record.permanent_credits >= remaining THEN
      permanent_used := remaining;
      remaining := 0;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
    END IF;
  END IF;
  
  -- 更新钱包
  UPDATE credit_wallet
  SET 
    bonus_credits = bonus_credits - bonus_used,
    permanent_credits = permanent_credits - permanent_used,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- 记录账本
  IF bonus_used > 0 THEN
    INSERT INTO credit_ledger (user_id, type, model, credits_delta, ref_type)
    VALUES (user_uuid, 'spend', model_type, -bonus_used, 'bonus_credits');
  END IF;
  
  IF permanent_used > 0 THEN
    INSERT INTO credit_ledger (user_id, type, model, credits_delta, ref_type)
    VALUES (user_uuid, 'spend', model_type, -permanent_used, 'permanent_credits');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'bonus_used', bonus_used,
    'permanent_used', permanent_used,
    'remaining_credits', get_total_available_credits(user_uuid)
  );
END;
$$ LANGUAGE plpgsql;
