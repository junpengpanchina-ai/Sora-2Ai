-- Veo Pro 风控系统和 7 天 Starter Access
-- 迁移编号: 047

-- 表一：user_usage_stats（用户使用统计）
CREATE TABLE IF NOT EXISTS user_usage_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- 总使用次数
  sora_generations_total INTEGER DEFAULT 0 CHECK (sora_generations_total >= 0),
  veo_generations_total INTEGER DEFAULT 0 CHECK (veo_generations_total >= 0),
  
  -- 7 天使用次数（用于风控）
  sora_generations_7d INTEGER DEFAULT 0 CHECK (sora_generations_7d >= 0),
  veo_generations_7d INTEGER DEFAULT 0 CHECK (veo_generations_7d >= 0),
  
  -- 支付记录
  first_payment_at TIMESTAMP WITH TIME ZONE,
  last_payment_at TIMESTAMP WITH TIME ZONE,
  
  -- Starter Access 到期时间
  starter_access_expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_usage_stats_starter_access ON user_usage_stats(starter_access_expires_at);
CREATE INDEX IF NOT EXISTS idx_user_usage_stats_first_payment ON user_usage_stats(first_payment_at);

-- 表二：generation_logs（生成日志，用于风控分析）
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  model TEXT NOT NULL CHECK (model IN ('sora-2', 'veo3.1-fast', 'veo3.1-pro')),
  credits_used INTEGER NOT NULL CHECK (credits_used > 0),
  success BOOLEAN NOT NULL DEFAULT false,
  
  -- 风控字段
  ip_hash TEXT, -- IP 地址的哈希值（保护隐私）
  user_agent TEXT,
  
  video_task_id UUID REFERENCES video_tasks(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_model ON generation_logs(model);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_logs_ip_hash ON generation_logs(ip_hash);
CREATE INDEX IF NOT EXISTS idx_generation_logs_user_created ON generation_logs(user_id, created_at DESC);

-- 表三：risk_flags（风险标志）
CREATE TABLE IF NOT EXISTS risk_flags (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  multi_account_suspected BOOLEAN DEFAULT false,
  abnormal_usage BOOLEAN DEFAULT false,
  starter_abuse BOOLEAN DEFAULT false,
  
  note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_risk_flags_multi_account ON risk_flags(multi_account_suspected);
CREATE INDEX IF NOT EXISTS idx_risk_flags_abnormal_usage ON risk_flags(abnormal_usage);
CREATE INDEX IF NOT EXISTS idx_risk_flags_starter_abuse ON risk_flags(starter_abuse);

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_user_usage_stats_updated_at ON user_usage_stats;
CREATE TRIGGER update_user_usage_stats_updated_at 
  BEFORE UPDATE ON user_usage_stats
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_risk_flags_updated_at ON risk_flags;
CREATE TRIGGER update_risk_flags_updated_at 
  BEFORE UPDATE ON risk_flags
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 函数：检查用户是否有活跃的 Starter Access
CREATE OR REPLACE FUNCTION has_active_starter_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_usage_stats 
    WHERE user_id = user_uuid 
      AND starter_access_expires_at IS NOT NULL
      AND starter_access_expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- 函数：检查用户是否可以使用 Veo（Starter Access 期间禁止）
CREATE OR REPLACE FUNCTION can_use_veo(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 如果有活跃的 Starter Access，禁止 Veo
  IF has_active_starter_access(user_uuid) THEN
    RETURN false;
  END IF;
  
  -- 检查风险标志
  IF EXISTS (
    SELECT 1 
    FROM risk_flags 
    WHERE user_id = user_uuid 
      AND (starter_abuse = true OR abnormal_usage = true)
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 函数：检查用户是否超过 Starter Access 限制
CREATE OR REPLACE FUNCTION check_starter_access_limits(
  user_uuid UUID,
  model_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  has_access BOOLEAN;
  expires_at TIMESTAMP WITH TIME ZONE;
  sora_count_7d INTEGER;
  result JSONB;
BEGIN
  -- 检查是否有活跃的 Starter Access
  SELECT 
    starter_access_expires_at IS NOT NULL AND starter_access_expires_at > NOW(),
    starter_access_expires_at
  INTO has_access, expires_at
  FROM user_usage_stats
  WHERE user_id = user_uuid;
  
  -- 如果没有 Starter Access，允许使用
  IF NOT has_access THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'no_starter_access'
    );
  END IF;
  
  -- Starter Access 期间禁止 Veo
  IF model_type LIKE 'veo%' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'starter_access_veo_blocked',
      'message', 'Veo is not available during Starter Access. Please wait until access expires or upgrade to a full pack.'
    );
  END IF;
  
  -- 检查 Sora 使用限制（≤ 15 次 / 7 天）
  SELECT sora_generations_7d INTO sora_count_7d
  FROM user_usage_stats
  WHERE user_id = user_uuid;
  
  IF sora_count_7d >= 15 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'starter_access_limit_reached',
      'message', 'Starter Access limit reached (15 Sora generations per 7 days). Access expires at ' || expires_at || '.'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'within_limits',
    'remaining', 15 - COALESCE(sora_count_7d, 0),
    'expires_at', expires_at
  );
END;
$$ LANGUAGE plpgsql;

-- 函数：增加用户使用统计
CREATE OR REPLACE FUNCTION increment_user_usage(
  user_uuid UUID,
  model_type TEXT,
  credits_used INTEGER,
  success_flag BOOLEAN,
  ip_hash_value TEXT,
  user_agent_value TEXT,
  task_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- 记录生成日志
  INSERT INTO generation_logs (
    user_id,
    model,
    credits_used,
    success,
    ip_hash,
    user_agent,
    video_task_id
  ) VALUES (
    user_uuid,
    model_type,
    credits_used,
    success_flag,
    ip_hash_value,
    user_agent_value,
    task_id
  );
  
  -- 更新使用统计
  INSERT INTO user_usage_stats (user_id, sora_generations_total, veo_generations_total, sora_generations_7d, veo_generations_7d)
  VALUES (
    user_uuid,
    CASE WHEN model_type = 'sora-2' THEN 1 ELSE 0 END,
    CASE WHEN model_type LIKE 'veo%' THEN 1 ELSE 0 END,
    CASE WHEN model_type = 'sora-2' THEN 1 ELSE 0 END,
    CASE WHEN model_type LIKE 'veo%' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    sora_generations_total = user_usage_stats.sora_generations_total + 
      CASE WHEN model_type = 'sora-2' THEN 1 ELSE 0 END,
    veo_generations_total = user_usage_stats.veo_generations_total + 
      CASE WHEN model_type LIKE 'veo%' THEN 1 ELSE 0 END,
    sora_generations_7d = user_usage_stats.sora_generations_7d + 
      CASE WHEN model_type = 'sora-2' AND created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END,
    veo_generations_7d = user_usage_stats.veo_generations_7d + 
      CASE WHEN model_type LIKE 'veo%' AND created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END,
    updated_at = NOW();
  
  -- 清理过期的 7 天统计（每天重置一次）
  UPDATE user_usage_stats
  SET 
    sora_generations_7d = 0,
    veo_generations_7d = 0
  WHERE user_id = user_uuid
    AND updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 函数：设置 Starter Access（7 天）
CREATE OR REPLACE FUNCTION set_starter_access(
  user_uuid UUID,
  days INTEGER DEFAULT 7
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_usage_stats (user_id, starter_access_expires_at)
  VALUES (user_uuid, NOW() + (days || ' days')::INTERVAL)
  ON CONFLICT (user_id) DO UPDATE SET
    starter_access_expires_at = NOW() + (days || ' days')::INTERVAL,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 函数：检查同 IP 多账号（用于检测工作室）
CREATE OR REPLACE FUNCTION check_multi_account_risk(
  ip_hash_value TEXT,
  threshold INTEGER DEFAULT 3
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id) >= threshold
    FROM generation_logs
    WHERE ip_hash = ip_hash_value
      AND created_at > NOW() - INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql;

