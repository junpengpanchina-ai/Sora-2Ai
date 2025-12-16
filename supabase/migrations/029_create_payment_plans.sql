-- 创建支付计划配置表
-- 用于存储支付计划的名称、价格、描述、Stripe按钮ID等配置

CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 计划基本信息
  plan_name TEXT NOT NULL, -- 计划名称，如 'Basic Plan', 'Professional Plan'
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'professional', 'custom')), -- 计划类型
  display_order INTEGER DEFAULT 0, -- 显示顺序
  
  -- 价格信息
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0), -- 价格（美元）
  currency TEXT DEFAULT 'usd', -- 货币类型
  credits INTEGER NOT NULL CHECK (credits > 0), -- 获得的积分
  videos INTEGER NOT NULL CHECK (videos > 0), -- 视频数量
  
  -- 描述信息
  description TEXT, -- 计划描述
  badge_text TEXT, -- 徽章文本（如 'Recommended'），可选
  
  -- Stripe配置
  stripe_buy_button_id TEXT, -- Stripe Buy Button ID
  stripe_payment_link_id TEXT, -- Stripe Payment Link ID（可选，用于后端支付流程）
  
  -- 显示控制
  is_active BOOLEAN DEFAULT true, -- 是否启用
  is_recommended BOOLEAN DEFAULT false, -- 是否标记为推荐
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_plans_active ON payment_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_plans_display_order ON payment_plans(display_order);
CREATE INDEX IF NOT EXISTS idx_payment_plans_type ON payment_plans(plan_type);

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_payment_plans_updated_at ON payment_plans;
CREATE TRIGGER update_payment_plans_updated_at
  BEFORE UPDATE ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入默认配置
INSERT INTO payment_plans (
  id,
  plan_name,
  plan_type,
  display_order,
  amount,
  currency,
  credits,
  videos,
  description,
  badge_text,
  stripe_buy_button_id,
  stripe_payment_link_id,
  is_active,
  is_recommended
) VALUES 
-- Basic Plan
(
  '00000000-0000-0000-0000-000000000001',
  'Basic Plan',
  'basic',
  1,
  39.00,
  'usd',
  500,
  50,
  'Perfect for individual users and small projects',
  NULL,
  'buy_btn_1SSKRyDqGbi6No9vhYgi4niS',
  'dRmcN55nY4k33WXfPa0kE03',
  true,
  false
),
-- Professional Plan
(
  '00000000-0000-0000-0000-000000000002',
  'Professional Plan',
  'professional',
  2,
  299.00,
  'usd',
  2000,
  200,
  'Perfect for professional users and large projects',
  'Recommended',
  'buy_btn_1SSKYdDqGbi6No9vbFWdJAOt',
  '4gMcN5eYy5o70KLauQ0kE01',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 添加 RLS 策略
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取激活的计划（公共访问）
DROP POLICY IF EXISTS "Allow public read access to active payment plans" ON payment_plans;
CREATE POLICY "Allow public read access to active payment plans"
  ON payment_plans
  FOR SELECT
  USING (is_active = true);

-- 允许 service_role 完全访问（用于管理员 API）
DROP POLICY IF EXISTS "Allow service role full access to payment plans" ON payment_plans;
CREATE POLICY "Allow service role full access to payment plans"
  ON payment_plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

