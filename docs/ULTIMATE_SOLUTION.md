# 终极解决方案：解决超时问题

## 🚨 问题

即使使用自动循环的 DO 块，Supabase Dashboard 的 SQL Editor 仍然超时。

## ✅ 解决方案（按优先级）

### 方案 1：超安全版本（推荐先试这个）

**文件**: `database/migrations/batch_update_purchase_intent_ultra_safe.sql`

**特点**：
- 批次大小：**1,000 条**（极小）
- 延迟时间：**1.5 秒/批**
- 预计时间：5-6 分钟
- 最大迭代：210 次

**执行**：直接复制 SQL 执行

---

### 方案 2：如果方案 1 还是超时 → 使用 psql 直接连接

Supabase Dashboard 有超时限制，但直接连接数据库没有。

#### 步骤 1：获取连接信息

在 Supabase Dashboard → Settings → Database → Connection string

#### 步骤 2：使用 psql 连接

```bash
# 安装 psql（如果还没有）
# macOS: brew install postgresql
# 或使用 Docker: docker run -it postgres psql

# 连接（替换为你的连接信息）
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

#### 步骤 3：执行 SQL

```sql
-- 在 psql 中执行
\i database/migrations/batch_update_purchase_intent_ultra_safe.sql

-- 或者直接粘贴 SQL 内容
```

**优点**：
- ✅ 没有超时限制
- ✅ 可以长时间运行
- ✅ 可以看到实时进度

---

### 方案 3：分段手动执行（最保险）

**文件**: `database/migrations/batch_update_purchase_intent_by_id_range.sql`

**方法**：
1. 每次执行更新 10,000 条
2. 执行后检查剩余数量
3. 重复执行，直到完成

**优点**：
- ✅ 完全可控
- ✅ 可以随时中断
- ✅ 不会超时（每批都很小）

**缺点**：
- ⚠️ 需要手动执行多次（约 21 次）

---

### 方案 4：使用 TypeScript 脚本（推荐用于生产环境）

**文件**: `scripts/batch-update-purchase-intent.ts`

**前提**：
1. 需要配置 `SUPABASE_SERVICE_ROLE_KEY`
2. 需要创建 RPC 函数（可选）

**执行**：
```bash
npm run batch-update-intent
```

**优点**：
- ✅ 可以添加重试逻辑
- ✅ 可以记录日志
- ✅ 可以集成到 CI/CD

---

## 🎯 推荐执行顺序

1. **先试**: `batch_update_purchase_intent_ultra_safe.sql`（1,000 条/批）
2. **如果超时**: 使用 `psql` 直接连接数据库执行
3. **如果不想用 psql**: 使用分段手动执行方案
4. **长期方案**: 使用 TypeScript 脚本

---

## 📊 各方案对比

| 方案 | 批次大小 | 预计时间 | 超时风险 | 难度 |
|------|----------|----------|----------|------|
| 超安全版本 | 1,000 | 5-6 分钟 | 低 | ⭐ 简单 |
| psql 直接连接 | 1,000 | 5-6 分钟 | 无 | ⭐⭐ 中等 |
| 分段手动 | 10,000 | 10-15 分钟 | 无 | ⭐⭐⭐ 需要手动 |
| TypeScript 脚本 | 可配置 | 可配置 | 低 | ⭐⭐⭐ 需要配置 |

---

## 🔧 如果所有方案都超时

### 终极方案：创建临时表 + 批量更新

```sql
-- 1. 创建临时表，存储需要更新的数据（分批创建）
CREATE TEMP TABLE temp_updates AS
SELECT 
  pm.page_id,
  CASE
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
    WHEN uc.use_case_type = 'brand-storytelling' THEN 1
    WHEN uc.use_case_type = 'social-media-content' THEN 0
    ELSE 0
  END as purchase_intent,
  CASE
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
    ELSE 'asset'
  END as layer
FROM page_meta pm
INNER JOIN use_cases uc ON pm.page_id = uc.id
WHERE pm.page_type = 'use_case'
  AND pm.status = 'published'
  AND pm.purchase_intent = 0
LIMIT 50000;  -- 分批创建，每次 50,000 条

-- 2. 创建索引加速更新
CREATE INDEX idx_temp_updates_page_id ON temp_updates(page_id);

-- 3. 批量更新（这个会很快，因为数据已经在临时表中）
UPDATE page_meta pm
SET 
  purchase_intent = t.purchase_intent,
  layer = t.layer
FROM temp_updates t
WHERE pm.page_id = t.page_id;

-- 4. 清理临时表
DROP TABLE IF EXISTS temp_updates;

-- 5. 重复步骤 1-4，直到所有数据更新完成
```

---

## ✅ 总结

**最简单的方法**：
1. 先试 `batch_update_purchase_intent_ultra_safe.sql`（1,000 条/批）
2. 如果超时，使用 `psql` 直接连接执行
3. 如果不想用 psql，使用分段手动执行

**最可靠的方法**：使用 `psql` 直接连接，没有超时限制。

