# 在 Supabase Dashboard 中直接执行批量更新

## 🎯 为什么使用 Dashboard？

- ✅ **无需密码**：直接登录 Dashboard 即可执行
- ✅ **无需安装工具**：不需要 psql 或 Docker
- ✅ **简单方便**：直接在浏览器中操作

## ⚠️ 注意事项

- ⚠️ Dashboard 有超时限制（通常 2-5 分钟）
- ⚠️ 需要使用更小的批次（500 条/批）
- ⚠️ 预计时间：15-20 分钟（可能需要多次执行）

---

## 📋 执行步骤

### 步骤 1：打开 SQL Editor

1. 在 Supabase Dashboard 左侧菜单
2. 找到 **SQL Editor**（通常在顶部或 Database 部分）
3. 点击进入

### 步骤 2：执行 SQL

1. 复制 `database/migrations/batch_update_purchase_intent_dashboard.sql` 的内容
2. 粘贴到 SQL Editor
3. 点击 **Run** 或按 `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

### 步骤 3：等待执行

- 脚本会自动循环执行
- 每 20 批显示一次进度
- 如果超时，可以查看已更新的数量，然后继续执行

---

## 🔄 如果超时了怎么办？

### 方法 1：检查进度后继续

执行这个查询，看看还剩多少：

```sql
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;
```

如果还有剩余，**再次执行**同一个 SQL（脚本会自动跳过已更新的记录）。

### 方法 2：减小批次大小

如果还是超时，修改 SQL 中的批次大小：

```sql
v_batch_size INTEGER := 300;  -- 改为 300
PERFORM pg_sleep(3.0);  -- 延迟改为 3 秒
```

### 方法 3：分段执行

如果 Dashboard 总是超时，可以手动分段执行：

```sql
-- 每次执行更新 5,000 条
WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  LIMIT 5000
),
updates AS (
  SELECT 
    b.page_id,
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
  FROM batch b
  INNER JOIN use_cases uc ON b.page_id = uc.id
)
UPDATE page_meta pm
SET 
  purchase_intent = u.purchase_intent,
  layer = u.layer
FROM updates u
WHERE pm.page_id = u.page_id;

-- 执行后检查剩余数量
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

-- 如果 remaining > 0，重复执行上面的 SQL，直到 remaining = 0
```

---

## ✅ 执行后验证

```sql
-- 查看最终分布
SELECT 
  purchase_intent,
  layer,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent > 0
GROUP BY purchase_intent, layer
ORDER BY purchase_intent DESC, layer;
```

---

## 📊 预期结果

- **Intent 3** (conversion): ~X 条
- **Intent 2** (conversion): ~Y 条
- **Intent 1** (asset): ~Z 条
- **Intent 0** (asset): ~W 条

---

## 🎯 推荐方案

**最简单的方法**：
1. 在 Dashboard SQL Editor 中执行 `batch_update_purchase_intent_dashboard.sql`
2. 如果超时，检查剩余数量
3. 再次执行（脚本会自动跳过已更新的）
4. 重复直到完成

**如果总是超时**：
- 使用分段执行方法（每次 5,000 条）
- 或重置密码后使用 psql 脚本（更稳定）

