-- 钱包系统：永久积分 + Bonus 积分（带过期）
-- 迁移编号: 048

-- 1) 钱包：永久 + Bonus（带过期）
CREATE TABLE IF NOT EXISTS credit_wallet (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  permanent_credits INTEGER NOT NULL DEFAULT 0 CHECK (permanent_credits >= 0),
  bonus_credits INTEGER NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  bonus_expires_at TIMESTAMP WITH TIME ZONE,
  starter_purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_credit_wallet_bonus_expires ON credit_wallet(bonus_expires_at);
CREATE INDEX IF NOT EXISTS idx_credit_wallet_starter_purchased ON credit_wallet(starter_purchased_at);

-- 2) 账本：所有加减分都落账
CREATE TABLE IF NOT EXISTS credit_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'bonus_grant', 'spend', 'refund', 'adjust')),
  model TEXT CHECK (model IN ('sora-2', 'veo-flash', 'veo-pro')),
  credits_delta INTEGER NOT NULL, -- + or -
  ref_type TEXT, -- 'stripe_payment' | 'render_job' | 'admin' | 'welcome_bonus'
  ref_id TEXT,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_type ON credit_ledger(type);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_created_at ON credit_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_ref_type_ref_id ON credit_ledger(ref_type, ref_id);

-- 3) 生成任务：用于风控与成本核算
CREATE TABLE IF NOT EXISTS render_job (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  model TEXT NOT NULL CHECK (model IN ('sora-2', 'veo-flash', 'veo-pro')),
  credits_charged INTEGER NOT NULL,
  supplier_cost_rmb NUMERIC(12, 6) NOT NULL DEFAULT 0, -- 按拿货单价写入
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'success', 'failed')),
  source_page TEXT, -- /use-cases/... 用于归因
  prompt_hash TEXT,
  ip_hash TEXT,
  device_fingerprint_hash TEXT,
  user_agent_hash TEXT,
  video_task_id UUID REFERENCES video_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_render_job_user_id ON render_job(user_id);
CREATE INDEX IF NOT EXISTS idx_render_job_model ON render_job(model);
CREATE INDEX IF NOT EXISTS idx_render_job_status ON render_job(status);
CREATE INDEX IF NOT EXISTS idx_render_job_created_at ON render_job(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_render_job_ip_hash ON render_job(ip_hash);
CREATE INDEX IF NOT EXISTS idx_render_job_device_fingerprint ON render_job(device_fingerprint_hash);

-- 4) 风控画像：把"Starter 薅羊毛"挡在这里
CREATE TABLE IF NOT EXISTS risk_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0),
  chargeback_count INTEGER NOT NULL DEFAULT 0 CHECK (chargeback_count >= 0),
  starter_attempts INTEGER NOT NULL DEFAULT 0 CHECK (starter_attempts >= 0),
  device_count_7d INTEGER NOT NULL DEFAULT 0 CHECK (device_count_7d >= 0),
  ip_count_7d INTEGER NOT NULL DEFAULT 0 CHECK (ip_count_7d >= 0),
  velocity_renders_24h INTEGER NOT NULL DEFAULT 0 CHECK (velocity_renders_24h >= 0),
  blocked_until TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_risk_profile_risk_score ON risk_profile(risk_score);
CREATE INDEX IF NOT EXISTS idx_risk_profile_blocked_until ON risk_profile(blocked_until);
CREATE INDEX IF NOT EXISTS idx_risk_profile_starter_attempts ON risk_profile(starter_attempts);

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_credit_wallet_updated_at ON credit_wallet;
CREATE TRIGGER update_credit_wallet_updated_at 
  BEFORE UPDATE ON credit_wallet
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_risk_profile_updated_at ON risk_profile;
CREATE TRIGGER update_risk_profile_updated_at 
  BEFORE UPDATE ON risk_profile
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 函数：获取用户总可用积分（永久 + 未过期的 Bonus）
CREATE OR REPLACE FUNCTION get_total_available_credits(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT 
    permanent_credits + 
    CASE 
      WHEN bonus_expires_at IS NOT NULL AND bonus_expires_at > NOW() 
      THEN bonus_credits 
      ELSE 0 
    END
  INTO total
  FROM credit_wallet
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql;

-- 函数：检查是否可以购买 Starter（只能买 1 次）
CREATE OR REPLACE FUNCTION can_purchase_starter(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 检查是否已经购买过 Starter
  IF EXISTS (
    SELECT 1 
    FROM credit_wallet 
    WHERE user_id = user_uuid 
      AND starter_purchased_at IS NOT NULL
  ) THEN
    RETURN false;
  END IF;
  
  -- 检查风险画像
  IF EXISTS (
    SELECT 1 
    FROM risk_profile 
    WHERE user_id = user_uuid 
      AND (blocked_until IS NOT NULL AND blocked_until > NOW()
           OR starter_attempts >= 1)
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 函数：检查 Bonus 积分是否可用于指定模型
CREATE OR REPLACE FUNCTION can_use_bonus_for_model(
  user_uuid UUID,
  model_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Veo Pro 不能使用 Bonus 积分
  IF model_type = 'veo-pro' THEN
    RETURN false;
  END IF;
  
  -- 检查是否有未过期的 Bonus
  IF EXISTS (
    SELECT 1 
    FROM credit_wallet 
    WHERE user_id = user_uuid 
      AND bonus_credits > 0
      AND bonus_expires_at IS NOT NULL 
      AND bonus_expires_at > NOW()
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 函数：扣除积分（优先使用 Bonus，再使用永久）
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
  -- 获取钱包记录
  SELECT * INTO wallet_record
  FROM credit_wallet
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
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

-- 函数：添加积分到钱包
CREATE OR REPLACE FUNCTION add_credits_to_wallet(
  user_uuid UUID,
  permanent_amount INTEGER DEFAULT 0,
  bonus_amount INTEGER DEFAULT 0,
  bonus_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_starter BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
BEGIN
  -- 插入或更新钱包
  INSERT INTO credit_wallet (user_id, permanent_credits, bonus_credits, bonus_expires_at, starter_purchased_at)
  VALUES (
    user_uuid,
    permanent_amount,
    bonus_amount,
    bonus_expires_at,
    CASE WHEN is_starter THEN NOW() ELSE NULL END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    permanent_credits = credit_wallet.permanent_credits + permanent_amount,
    bonus_credits = credit_wallet.bonus_credits + bonus_amount,
    bonus_expires_at = COALESCE(
      CASE WHEN bonus_expires_at IS NOT NULL AND bonus_expires_at > credit_wallet.bonus_expires_at 
           THEN bonus_expires_at 
           ELSE credit_wallet.bonus_expires_at 
      END,
      bonus_expires_at
    ),
    starter_purchased_at = CASE 
      WHEN is_starter AND credit_wallet.starter_purchased_at IS NULL 
      THEN NOW() 
      ELSE credit_wallet.starter_purchased_at 
    END,
    updated_at = NOW();
  
  -- 记录账本
  IF permanent_amount > 0 THEN
    INSERT INTO credit_ledger (user_id, type, credits_delta, ref_type)
    VALUES (user_uuid, 'purchase', permanent_amount, 'stripe_payment');
  END IF;
  
  IF bonus_amount > 0 THEN
    INSERT INTO credit_ledger (user_id, type, credits_delta, ref_type, meta)
    VALUES (user_uuid, 'bonus_grant', bonus_amount, 'stripe_payment', 
            jsonb_build_object('expires_at', bonus_expires_at));
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

