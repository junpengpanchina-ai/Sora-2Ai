# 数据库迁移执行指南

## 📋 迁移文件清单

按顺序执行以下迁移文件：

1. ✅ `048_add_credit_wallet_system.sql` - 钱包系统（已存在）
2. ✅ `049_enhance_deduct_credits_atomic.sql` - 增强扣费函数（原子化+幂等性）
3. ✅ `050_add_payment_system.sql` - 支付系统（订单表）
4. ✅ `051_add_usage_daily.sql` - 每日使用统计（Starter防刷）
5. ✅ `052_add_render_events.sql` - 渲染事件日志（风控）
6. ✅ `053_add_fx_rates.sql` - 汇率表和成本核算

## 🚀 执行步骤

### 1. 在 Supabase Dashboard 中执行

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 按顺序执行以下迁移文件：

#### 步骤 1: 049_enhance_deduct_credits_atomic.sql
- 增强 `credit_ledger` 表（添加 `request_id` 字段）
- 重新定义 `deduct_credits_from_wallet` 函数（原子化 + 幂等性）

#### 步骤 2: 050_add_payment_system.sql
- 创建 `orders` 表（支付订单）
- 创建 `create_order` 函数（幂等性检查）
- 创建 `update_order_status` 函数

#### 步骤 3: 051_add_usage_daily.sql
- 创建 `usage_daily` 表（每日使用统计）
- 创建 `starter_grants` 表（Starter赠送记录）
- 创建 `increment_daily_usage` 函数
- 创建 `check_daily_limit` 函数（Starter防刷）
- 创建 `can_purchase_starter` 函数（防重复购买）

#### 步骤 4: 052_add_render_events.sql
- 创建 `render_events` 表（渲染日志）
- 创建 `log_render_start` 函数
- 创建 `update_render_event` 函数
- 创建 `detect_abnormal_usage` 函数（风控）

#### 步骤 5: 053_add_fx_rates.sql
- 创建 `fx_rates` 表（汇率）
- 创建 `render_costs` 表（渲染成本）
- 创建 `profit_margins` 视图（实时计算毛利）
- 创建 `update_fx_rate` 函数
- 创建 `update_render_cost` 函数
- 创建 `calculate_cashflow_break_even` 函数（现金流计算）

### 2. 验证迁移

执行以下 SQL 验证所有表已创建：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'orders',
    'usage_daily',
    'starter_grants',
    'render_events',
    'fx_rates',
    'render_costs'
  )
ORDER BY table_name;

-- 检查函数是否存在
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'create_order',
    'update_order_status',
    'increment_daily_usage',
    'check_daily_limit',
    'can_purchase_starter',
    'log_render_start',
    'update_render_event',
    'detect_abnormal_usage',
    'update_fx_rate',
    'update_render_cost',
    'calculate_cashflow_break_even'
  )
ORDER BY routine_name;

-- 检查视图是否存在
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'profit_margins';
```

### 3. 初始化数据

执行以下 SQL 初始化必要数据：

```sql
-- 初始化汇率（USD/CNY = 7.2）
INSERT INTO fx_rates (date, usd_cny)
VALUES (CURRENT_DATE, 7.2)
ON CONFLICT (date) DO NOTHING;

-- 初始化渲染成本（按最差成本）
INSERT INTO render_costs (model, cost_per_render_cny) VALUES
  ('sora', 0.099),
  ('veo_fast', 0.8),
  ('veo_pro', 4.0)
ON CONFLICT (model) DO UPDATE
SET cost_per_render_cny = excluded.cost_per_render_cny,
    updated_at = now();
```

### 4. 测试关键函数

```sql
-- 测试现金流计算
SELECT * FROM calculate_cashflow_break_even(69);

-- 查看利润边际
SELECT * FROM profit_margins;

-- 测试每日限制检查（Starter用户）
SELECT * FROM check_daily_limit(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'sora',
  'starter'
);
```

## ⚠️ 注意事项

1. **执行顺序很重要**：必须按 049 → 050 → 051 → 052 → 053 的顺序执行
2. **幂等性**：所有迁移文件都使用 `IF NOT EXISTS`，可以安全地重复执行
3. **外键依赖**：确保 `users` 表已存在（通常在早期迁移中创建）
4. **函数覆盖**：`deduct_credits_from_wallet` 函数会被 049 重新定义，这是预期的

## 📊 迁移后的表结构

### orders 表
- 支付订单记录
- 幂等性保证：`(provider, provider_order_id)` 和 `(provider, provider_event_id)` 唯一约束

### usage_daily 表
- 每日使用统计（Starter防刷）
- 主键：`(user_id, day)`

### starter_grants 表
- Starter Access 赠送记录（7天 bonus credits）

### render_events 表
- 渲染事件日志（风控、成本核算）
- 包含 IP 哈希、设备哈希等风控字段

### fx_rates 表
- 汇率记录（USD/CNY）
- 每天一条记录

### render_costs 表
- 渲染成本（人民币）
- 每个模型一条记录

### profit_margins 视图
- 实时计算每个模型的成本和毛利
- 自动使用最新的汇率

## ✅ 迁移完成检查清单

- [ ] 所有表已创建
- [ ] 所有函数已创建
- [ ] `profit_margins` 视图已创建
- [ ] 初始数据已插入（汇率、成本）
- [ ] 关键函数测试通过
- [ ] 现金流计算函数返回正确结果（13次 Veo Pro/月）

