-- 添加 Veo Pro 定价系统和 Starter Pack 限频机制
-- 迁移编号: 046

-- 1. 在 recharge_records 表中添加字段，标识是否是 Starter Pack
ALTER TABLE recharge_records 
ADD COLUMN IF NOT EXISTS is_starter_pack BOOLEAN DEFAULT false;

-- 2. 在 consumption_records 表中添加模型类型字段
ALTER TABLE consumption_records 
ADD COLUMN IF NOT EXISTS model_type TEXT CHECK (model_type IN ('sora-2', 'veo3.1-fast', 'veo3.1-pro'));

-- 3. 创建 Starter Pack 限频表（记录用户每日使用次数）
CREATE TABLE IF NOT EXISTS starter_pack_daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recharge_record_id UUID REFERENCES recharge_records(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  veo_pro_count INTEGER DEFAULT 0 CHECK (veo_pro_count >= 0),
  veo_fast_count INTEGER DEFAULT 0 CHECK (veo_fast_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recharge_record_id, date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_starter_pack_daily_limits_user_id ON starter_pack_daily_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_starter_pack_daily_limits_date ON starter_pack_daily_limits(date);
CREATE INDEX IF NOT EXISTS idx_starter_pack_daily_limits_recharge_record_id ON starter_pack_daily_limits(recharge_record_id);

-- 4. 创建 Veo Pro 使用记录表（用于埋点和分析）
CREATE TABLE IF NOT EXISTS veo_pro_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_task_id UUID REFERENCES video_tasks(id) ON DELETE SET NULL,
  model_type TEXT NOT NULL CHECK (model_type IN ('veo3.1-fast', 'veo3.1-pro')),
  prompt TEXT,
  aspect_ratio TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  is_from_starter_pack BOOLEAN DEFAULT false,
  consumption_record_id UUID REFERENCES consumption_records(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_veo_pro_usage_logs_user_id ON veo_pro_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_veo_pro_usage_logs_video_task_id ON veo_pro_usage_logs(video_task_id);
CREATE INDEX IF NOT EXISTS idx_veo_pro_usage_logs_model_type ON veo_pro_usage_logs(model_type);
CREATE INDEX IF NOT EXISTS idx_veo_pro_usage_logs_status ON veo_pro_usage_logs(status);
CREATE INDEX IF NOT EXISTS idx_veo_pro_usage_logs_created_at ON veo_pro_usage_logs(created_at DESC);

-- 5. 创建用户行为异常记录表（用于防薅机制）
CREATE TABLE IF NOT EXISTS user_behavior_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('high_frequency', 'repeated_prompt', 'ip_ua_anomaly', 'retry_abuse')),
  flag_data JSONB, -- 存储额外的标志数据
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE, -- 标志过期时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_behavior_flags_user_id ON user_behavior_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_flags_flag_type ON user_behavior_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_flags_is_active ON user_behavior_flags(is_active);
CREATE INDEX IF NOT EXISTS idx_user_behavior_flags_expires_at ON user_behavior_flags(expires_at);

-- 6. 创建更新时间触发器
DROP TRIGGER IF EXISTS update_starter_pack_daily_limits_updated_at ON starter_pack_daily_limits;
CREATE TRIGGER update_starter_pack_daily_limits_updated_at 
  BEFORE UPDATE ON starter_pack_daily_limits
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_behavior_flags_updated_at ON user_behavior_flags;
CREATE TRIGGER update_user_behavior_flags_updated_at 
  BEFORE UPDATE ON user_behavior_flags
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 创建函数：检查用户是否购买了 Starter Pack
CREATE OR REPLACE FUNCTION has_active_starter_pack(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM recharge_records 
    WHERE user_id = user_uuid 
      AND is_starter_pack = true 
      AND status = 'completed'
      AND completed_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- 8. 创建函数：获取用户最新的 Starter Pack 充值记录ID
CREATE OR REPLACE FUNCTION get_latest_starter_pack_recharge_id(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  recharge_id UUID;
BEGIN
  SELECT id INTO recharge_id
  FROM recharge_records 
  WHERE user_id = user_uuid 
    AND is_starter_pack = true 
    AND status = 'completed'
    AND completed_at IS NOT NULL
  ORDER BY completed_at DESC
  LIMIT 1;
  
  RETURN recharge_id;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建函数：检查用户今日是否超过限频
CREATE OR REPLACE FUNCTION check_daily_limit(
  user_uuid UUID,
  recharge_uuid UUID,
  model_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  -- 确定最大次数
  IF model_type = 'veo3.1-pro' THEN
    max_count := 2;
  ELSIF model_type = 'veo3.1-fast' THEN
    max_count := 3;
  ELSE
    RETURN true; -- 非 Veo 模型不限制
  END IF;
  
  -- 获取今日使用次数
  SELECT 
    CASE 
      WHEN model_type = 'veo3.1-pro' THEN veo_pro_count
      WHEN model_type = 'veo3.1-fast' THEN veo_fast_count
      ELSE 0
    END INTO current_count
  FROM starter_pack_daily_limits
  WHERE user_id = user_uuid 
    AND recharge_record_id = recharge_uuid
    AND date = CURRENT_DATE;
  
  -- 如果记录不存在，返回 true（允许使用）
  IF current_count IS NULL THEN
    RETURN true;
  END IF;
  
  -- 检查是否超过限制
  RETURN current_count < max_count;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建函数：增加每日使用次数
CREATE OR REPLACE FUNCTION increment_daily_limit(
  user_uuid UUID,
  recharge_uuid UUID,
  model_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO starter_pack_daily_limits (user_id, recharge_record_id, date, veo_pro_count, veo_fast_count)
  VALUES (
    user_uuid,
    recharge_uuid,
    CURRENT_DATE,
    CASE WHEN model_type = 'veo3.1-pro' THEN 1 ELSE 0 END,
    CASE WHEN model_type = 'veo3.1-fast' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, recharge_record_id, date)
  DO UPDATE SET
    veo_pro_count = CASE 
      WHEN model_type = 'veo3.1-pro' THEN starter_pack_daily_limits.veo_pro_count + 1
      ELSE starter_pack_daily_limits.veo_pro_count
    END,
    veo_fast_count = CASE 
      WHEN model_type = 'veo3.1-fast' THEN starter_pack_daily_limits.veo_fast_count + 1
      ELSE starter_pack_daily_limits.veo_fast_count
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

