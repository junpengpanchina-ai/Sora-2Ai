# 执行数据库迁移 051_add_risk_control_fields.sql

## 📋 迁移内容

此迁移将：
1. 在 `purchases` 表中添加风控字段（device_id, payment_fingerprint, ip_hash 等）
2. 创建风控查询索引
3. 创建 `can_purchase_starter()` 函数（Starter 防薅校验）
4. 创建 `get_risk_profile()` 函数（风险评分）

## 🚀 执行步骤

### 方法 1：Supabase Dashboard（推荐）

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目

2. **打开 SQL Editor**
   - 点击左侧菜单 "SQL Editor"
   - 点击 "New query"

3. **复制并执行 SQL**
   - 复制下面的完整 SQL 代码
   - 粘贴到 SQL Editor
   - 点击 "Run" 或按 `Cmd/Ctrl + Enter`

4. **验证执行结果**
   - 应该看到 "Success. No rows returned"
   - 如果有错误，检查错误信息

---

## 📝 完整 SQL 代码

```sql
-- Migration: 051_add_risk_control_fields.sql
-- Add risk control fields to purchases table for anti-abuse tracking

-- Add risk control fields to purchases table
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS payment_last4 TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS ip_prefix TEXT;

-- Create index for risk queries
CREATE INDEX IF NOT EXISTS idx_purchases_device_id ON public.purchases(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_payment_fingerprint ON public.purchases(payment_fingerprint) WHERE payment_fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_ip_prefix ON public.purchases(ip_prefix) WHERE ip_prefix IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_item_id_device ON public.purchases(item_id, device_id) WHERE item_id = 'starter' AND device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_item_id_ip ON public.purchases(item_id, ip_prefix) WHERE item_id = 'starter' AND ip_prefix IS NOT NULL;

-- Function: Check if user can purchase Starter (anti-abuse)
CREATE OR REPLACE FUNCTION public.can_purchase_starter(
  p_user_id UUID,
  p_device_id TEXT,
  p_ip_prefix TEXT,
  p_payment_fingerprint TEXT
) RETURNS TABLE (
  can_purchase BOOLEAN,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  device_count INT := 0;
  ip_count INT := 0;
  fingerprint_count INT := 0;
  user_has_starter BOOLEAN := false;
BEGIN
  -- Check if user already purchased Starter
  SELECT EXISTS(
    SELECT 1 FROM public.purchases
    WHERE user_id = p_user_id
      AND item_id = 'starter'
      AND status = 'paid'
  ) INTO user_has_starter;

  IF user_has_starter THEN
    RETURN QUERY SELECT FALSE, 'user_already_purchased_starter';
    RETURN;
  END IF;

  -- Check device count (same device, different users)
  IF p_device_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT user_id) INTO device_count
    FROM public.purchases
    WHERE device_id = p_device_id
      AND item_id = 'starter'
      AND status = 'paid'
      AND created_at > NOW() - INTERVAL '7 days';
  END IF;

  IF device_count >= 1 THEN
    RETURN QUERY SELECT FALSE, 'device_already_used_for_starter';
    RETURN;
  END IF;

  -- Check IP count (same IP /24, different users)
  IF p_ip_prefix IS NOT NULL THEN
    SELECT COUNT(DISTINCT user_id) INTO ip_count
    FROM public.purchases
    WHERE ip_prefix = p_ip_prefix
      AND item_id = 'starter'
      AND status = 'paid'
      AND created_at > NOW() - INTERVAL '1 day';
  END IF;

  IF ip_count >= 3 THEN
    RETURN QUERY SELECT FALSE, 'ip_prefix_limit_reached';
    RETURN;
  END IF;

  -- Check payment fingerprint (same card, different users)
  IF p_payment_fingerprint IS NOT NULL THEN
    SELECT COUNT(DISTINCT user_id) INTO fingerprint_count
    FROM public.purchases
    WHERE payment_fingerprint = p_payment_fingerprint
      AND item_id = 'starter'
      AND status = 'paid';
  END IF;

  IF fingerprint_count >= 1 THEN
    RETURN QUERY SELECT FALSE, 'payment_fingerprint_already_used';
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

-- Function: Get risk profile for user
CREATE OR REPLACE FUNCTION public.get_risk_profile(
  p_user_id UUID,
  p_device_id TEXT,
  p_ip_prefix TEXT
) RETURNS TABLE (
  starter_attempts INT,
  device_count_7d INT,
  ip_count_7d INT,
  velocity_renders_24h INT,
  payment_fingerprints INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Starter attempts
    (SELECT COUNT(*)::INT
     FROM public.purchases
     WHERE user_id = p_user_id
       AND item_id = 'starter'
       AND status = 'paid') AS starter_attempts,
    
    -- Device count (same device, different users)
    (SELECT COUNT(DISTINCT user_id)::INT
     FROM public.purchases
     WHERE device_id = p_device_id
       AND item_id = 'starter'
       AND status = 'paid'
       AND created_at > NOW() - INTERVAL '7 days') AS device_count_7d,
    
    -- IP count (same IP /24, different users)
    (SELECT COUNT(DISTINCT user_id)::INT
     FROM public.purchases
     WHERE ip_prefix = p_ip_prefix
       AND item_id = 'starter'
       AND status = 'paid'
       AND created_at > NOW() - INTERVAL '7 days') AS ip_count_7d,
    
    -- Velocity (renders in last 24h) - approximate from usage_daily
    (SELECT COALESCE(SUM(sora_count + veo_fast_count + veo_pro_count), 0)::INT
     FROM public.usage_daily
     WHERE user_id = p_user_id
       AND day = (NOW() AT TIME ZONE 'utc')::DATE) AS velocity_renders_24h,
    
    -- Payment fingerprints (different cards used)
    (SELECT COUNT(DISTINCT payment_fingerprint)::INT
     FROM public.purchases
     WHERE user_id = p_user_id
       AND payment_fingerprint IS NOT NULL) AS payment_fingerprints;
END;
$$;
```

---

## ✅ 验证步骤

执行完成后，运行以下 SQL 验证：

### 1. 检查字段是否添加成功

```sql
-- 检查 purchases 表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'purchases'
  AND column_name IN ('device_id', 'payment_fingerprint', 'payment_last4', 'stripe_customer_id', 'ip_hash', 'ip_prefix')
ORDER BY column_name;
```

**预期结果**：应该看到 6 个字段

### 2. 检查索引是否创建成功

```sql
-- 检查索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'purchases'
  AND indexname LIKE 'idx_purchases%'
ORDER BY indexname;
```

**预期结果**：应该看到 5 个索引

### 3. 检查函数是否创建成功

```sql
-- 检查函数
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('can_purchase_starter', 'get_risk_profile')
ORDER BY routine_name;
```

**预期结果**：应该看到 2 个函数

### 4. 测试函数（可选）

```sql
-- 测试 can_purchase_starter 函数（使用测试 UUID）
SELECT * FROM public.can_purchase_starter(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'test_device_id',
  '192.168.1.0/24',
  NULL
);
```

**预期结果**：应该返回 `can_purchase: true, reason: null`

---

## 🔧 方法 2：使用 Supabase CLI（可选）

如果你使用 Supabase CLI：

```bash
# 在项目根目录执行
supabase db push
```

或者直接执行 SQL：

```bash
supabase db execute -f supabase/migrations/051_add_risk_control_fields.sql
```

---

## ⚠️ 注意事项

1. **备份数据库**（生产环境）：
   - 执行前建议备份 `purchases` 表
   - 使用 Supabase Dashboard → Database → Backups

2. **执行时间**：
   - 此迁移应该很快完成（< 1 秒）
   - 如果表很大，索引创建可能需要几秒

3. **回滚**（如果需要）：
   ```sql
   -- 删除字段（谨慎操作）
   ALTER TABLE public.purchases
     DROP COLUMN IF EXISTS device_id,
     DROP COLUMN IF EXISTS payment_fingerprint,
     DROP COLUMN IF EXISTS payment_last4,
     DROP COLUMN IF EXISTS stripe_customer_id,
     DROP COLUMN IF EXISTS ip_hash,
     DROP COLUMN IF EXISTS ip_prefix;
   
   -- 删除函数
   DROP FUNCTION IF EXISTS public.can_purchase_starter(UUID, TEXT, TEXT, TEXT);
   DROP FUNCTION IF EXISTS public.get_risk_profile(UUID, TEXT, TEXT);
   ```

---

## 📊 迁移后的效果

执行成功后：

1. ✅ **购买记录将包含风控信息**：
   - `device_id` - 设备指纹
   - `payment_fingerprint` - 支付卡指纹
   - `ip_hash` 和 `ip_prefix` - IP 信息

2. ✅ **Starter 防薅校验生效**：
   - 购买 Starter 前会自动检查 device/ip/fingerprint
   - 防止同一设备/IP/卡重复购买

3. ✅ **风险评分可用**：
   - 可以调用 `get_risk_profile()` 获取用户风险分
   - 用于后续的风控决策

---

**执行完成后，请更新状态**：✅ 迁移已执行

