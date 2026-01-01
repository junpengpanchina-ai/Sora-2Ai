# 批量更新 Purchase Intent 指南

> **问题**：一次性更新 20 万+ 条记录会导致超时  
> **解决方案**：分批处理

---

## 🚨 问题原因

- 203,062 条记录一次性更新会导致超时
- 需要分批处理，每次 5,000 条（或更小）

---

## ✅ 最简单方案：手动分批执行（推荐）

### 每次执行这个 SQL，更新 5,000 条

```sql
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
      WHEN uc.use_case_type IN ('brand-storytelling', 'social-media-content') THEN 1
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
```

**执行方式**：
1. 复制上面的 SQL
2. 在 SQL Editor 中执行
3. 查看结果（应该显示更新了 5,000 条或更少）
4. **重复执行**，直到返回 "0 rows affected"

**如果还是超时**，改用更小的批次（1,000 条）：

```sql
-- 将 LIMIT 5000 改为 LIMIT 1000
WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  LIMIT 1000  -- 改为 1000
),
-- ... 其余代码相同
```

**检查进度**：
```sql
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;
```

---

## 🔄 方案 2：使用存储过程（更灵活）

### Step 1：创建存储过程

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
CREATE OR REPLACE FUNCTION batch_update_purchase_intent(
  batch_size INTEGER DEFAULT 10000
)
RETURNS TABLE (
  updated_count INTEGER,
  remaining_count INTEGER
) AS $$
DECLARE
  v_updated INTEGER;
  v_remaining INTEGER;
BEGIN
  -- 更新一批
  WITH batch AS (
    SELECT pm.page_id
    FROM page_meta pm
    INNER JOIN use_cases uc ON pm.page_id = uc.id
    WHERE pm.page_type = 'use_case'
      AND pm.status = 'published'
      AND pm.purchase_intent = 0
    LIMIT batch_size
  )
  UPDATE page_meta pm
  SET 
    purchase_intent = CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
      WHEN uc.use_case_type IN ('brand-storytelling', 'social-media-content') THEN 1
      ELSE 0
    END,
    layer = CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
      ELSE 'asset'
    END
  FROM use_cases uc
  WHERE pm.page_id = uc.id
    AND pm.page_id IN (SELECT page_id FROM batch);
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  -- 计算剩余数量
  SELECT COUNT(*) INTO v_remaining
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0;
  
  RETURN QUERY SELECT v_updated, v_remaining;
END;
$$ LANGUAGE plpgsql;
```

---

### Step 2：执行存储过程（重复执行直到完成）

```sql
-- 第一次执行
SELECT * FROM batch_update_purchase_intent(10000);
```

**预期输出**：
```
updated_count | remaining_count
--------------+-----------------
10000         | 193062
```

**继续执行**：
```sql
-- 第二次执行
SELECT * FROM batch_update_purchase_intent(10000);

-- 第三次执行
SELECT * FROM batch_update_purchase_intent(10000);

-- ... 重复执行，直到 remaining_count = 0
```

---

## 🔄 自动化方案：使用 DO 块（一次性执行）

如果你想一次性执行完所有更新，使用这个：

```sql
DO $$
DECLARE
  v_batch_size INTEGER := 10000;
  v_updated INTEGER;
  v_total_updated INTEGER := 0;
  v_remaining INTEGER;
BEGIN
  -- 计算总数
  SELECT COUNT(*) INTO v_remaining
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0;
  
  RAISE NOTICE '需要更新 % 条记录', v_remaining;
  
  -- 循环更新
  LOOP
    -- 更新一批
    WITH batch AS (
      SELECT pm.page_id
      FROM page_meta pm
      INNER JOIN use_cases uc ON pm.page_id = uc.id
      WHERE pm.page_type = 'use_case'
        AND pm.status = 'published'
        AND pm.purchase_intent = 0
      LIMIT v_batch_size
    )
    UPDATE page_meta pm
    SET 
      purchase_intent = CASE
        WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
        WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
        WHEN uc.use_case_type IN ('brand-storytelling', 'social-media-content') THEN 1
        ELSE 0
      END,
      layer = CASE
        WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
        WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
        ELSE 'asset'
      END
    FROM use_cases uc
    WHERE pm.page_id = uc.id
      AND pm.page_id IN (SELECT page_id FROM batch);
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    v_total_updated := v_total_updated + v_updated;
    
    -- 如果没有更新任何记录，退出循环
    EXIT WHEN v_updated = 0;
    
    RAISE NOTICE '已更新 % 条，总计 % 条', v_updated, v_total_updated;
    
    -- 短暂延迟，避免锁表
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  RAISE NOTICE '完成！总共更新 % 条记录', v_total_updated;
END $$;
```

**注意**：这个方案可能需要较长时间（20+ 分钟），但可以一次性完成。

---

## 📊 检查更新进度

```sql
-- 查看 Purchase Intent 分布
SELECT 
  purchase_intent,
  layer,
  COUNT(*) as count
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
GROUP BY purchase_intent, layer
ORDER BY purchase_intent DESC, layer;

-- 查看还有多少未更新
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;
```

---

## 🎯 推荐执行顺序

1. **先创建存储过程**（方法 1）
2. **执行几次测试**（每次 10,000 条）
3. **如果稳定，使用 DO 块一次性完成**（方法 3）

---

## ⚠️ 注意事项

- 分批处理可以避免超时
- 每次更新后可以检查进度
- 如果中途中断，可以继续执行（只更新 `purchase_intent = 0` 的记录）

---

**推荐使用存储过程方式，更灵活且可以随时检查进度！** ✅

