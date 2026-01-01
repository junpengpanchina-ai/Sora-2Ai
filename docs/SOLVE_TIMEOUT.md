# 解决 SQL 超时问题

## 🚨 问题

执行一次性更新时遇到超时：
```
Error: SQL query ran into an upstream timeout
```

## ✅ 解决方案

### 方案 1：使用自动循环 SQL（推荐）

**文件**: `database/migrations/batch_update_purchase_intent_auto_safe.sql`

**特点**：
- ✅ 批次大小：3,000 条（更安全）
- ✅ 自动循环，无需手动操作
- ✅ 自动显示进度
- ✅ 自动停止

**执行步骤**：
1. 打开 Supabase Dashboard → SQL Editor
2. 复制 `batch_update_purchase_intent_auto_safe.sql` 的内容
3. 执行

**预计时间**：10-15 分钟

---

### 方案 2：如果方案 1 还是超时

进一步减小批次大小：

```sql
DO $$
DECLARE
  v_batch_size INTEGER := 2000;  -- 改为 2000
  v_updated INTEGER;
  v_total_updated INTEGER := 0;
  v_iteration INTEGER := 0;
  v_max_iterations INTEGER := 110;
BEGIN
  -- ... 其余代码相同
  PERFORM pg_sleep(1.0);  -- 增加延迟到 1 秒
END $$;
```

---

### 方案 3：使用存储过程（更可控）

先创建存储过程，然后调用：

```sql
-- 1. 创建存储过程（执行一次）
CREATE OR REPLACE FUNCTION batch_update_purchase_intent_safe()
RETURNS TABLE (
  total_updated INTEGER,
  iterations INTEGER
) AS $$
DECLARE
  v_batch_size INTEGER := 3000;
  v_updated INTEGER;
  v_total_updated INTEGER := 0;
  v_iteration INTEGER := 0;
BEGIN
  LOOP
    v_iteration := v_iteration + 1;
    
    IF v_iteration > 70 THEN
      RETURN QUERY SELECT v_total_updated, v_iteration;
      RETURN;
    END IF;
    
    -- 更新逻辑（同方案 1）
    WITH batch AS (
      SELECT pm.page_id
      FROM page_meta pm
      WHERE pm.page_type = 'use_case'
        AND pm.status = 'published'
        AND pm.purchase_intent = 0
      LIMIT v_batch_size
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
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    v_total_updated := v_total_updated + v_updated;
    
    IF v_updated = 0 THEN
      RETURN QUERY SELECT v_total_updated, v_iteration;
      RETURN;
    END IF;
    
    PERFORM pg_sleep(0.8);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. 调用存储过程
SELECT * FROM batch_update_purchase_intent_safe();
```

---

## 🎯 推荐执行顺序

1. **先尝试**: `batch_update_purchase_intent_auto_safe.sql`（批次 3000）
2. **如果超时**: 手动修改批次大小为 2000
3. **如果还超时**: 使用存储过程方案，可以随时中断和恢复

---

## 📊 执行后检查

```sql
-- 检查剩余数量
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

-- 检查分布
SELECT 
  purchase_intent,
  layer,
  COUNT(*) as count
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent > 0
GROUP BY purchase_intent, layer
ORDER BY purchase_intent DESC, layer;
```

---

## ⚠️ 注意事项

1. **不要在高峰期执行**：避免影响其他查询
2. **保持连接**：执行过程中不要关闭 SQL Editor
3. **监控进度**：注意查看 NOTICE 输出
4. **如果中断**：可以重新执行，会自动跳过已更新的记录

---

## ✅ 总结

**最简单的方法**：执行 `batch_update_purchase_intent_auto_safe.sql`，一次完成所有更新，无需手动操作。

**如果超时**：减小批次大小（3000 → 2000 → 1000）或增加延迟时间。

