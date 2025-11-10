-- 确保可用的 UUID 生成函数
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 在 users 表中添加积分字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 CHECK (credits >= 0);

-- 创建充值记录表
CREATE TABLE IF NOT EXISTS recharge_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0), -- 充值金额（元）
  credits INTEGER NOT NULL CHECK (credits > 0), -- 获得的积分
  payment_method TEXT, -- 支付方式
  payment_id TEXT, -- 支付订单ID
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')), -- 充值状态
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE -- 完成时间
);

CREATE TABLE IF NOT EXISTS consumption_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_task_id UUID REFERENCES video_tasks(id) ON DELETE SET NULL, -- 关联的视频任务ID
  credits INTEGER NOT NULL CHECK (credits > 0), -- 消费的积分
  description TEXT, -- 消费描述
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')), -- 状态：已完成、已退款
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refunded_at TIMESTAMP WITH TIME ZONE -- 退款时间
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recharge_records_user_id ON recharge_records(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_records_status ON recharge_records(status);
CREATE INDEX IF NOT EXISTS idx_recharge_records_created_at ON recharge_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consumption_records_user_id ON consumption_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_records_video_task_id ON consumption_records(video_task_id);
CREATE INDEX IF NOT EXISTS idx_consumption_records_created_at ON consumption_records(created_at DESC);

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_recharge_records_updated_at ON recharge_records;
CREATE TRIGGER update_recharge_records_updated_at BEFORE UPDATE ON recharge_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

