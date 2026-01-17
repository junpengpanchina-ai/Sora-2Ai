# 🤔 为什么要修复 Tier？以及替代方案

## 📊 当前问题

**所有场景都是 Tier2**，而脚本 068 需要 `tier = 1` 的场景才能工作。

## 🎯 为什么要修复 Tier？

### 原因 1：脚本 068 需要 Tier1 场景

脚本 `068_setup_scene_data.sql` 的条件是：
```sql
WHERE tier = 1
  AND is_published = TRUE
  AND noindex = FALSE
```

如果所有场景都是 Tier2，这个脚本就不会更新任何数据。

### 原因 2：Tier 分类的业务意义

- **Tier1**：高质量、已发布、可索引的场景（优先处理，加入 sitemap）
- **Tier2**：已发布但不可索引的场景（次要）
- **Tier3**：未发布的场景（最后处理）

正确的 tier 分类有助于：
- 优先处理高质量场景
- 优化 SEO（Tier1 场景加入 sitemap）
- 数据驱动的自动绑定（基于 ai_citation_score）

---

## 💡 替代方案：不修复 Tier，直接修改脚本 068

如果修复 tier 太麻烦（超时），**可以直接修改脚本 068，让它不依赖 tier**。

### 方案 A：修改脚本 068，基于业务条件（推荐）

**原理**：不依赖 tier，直接基于 `is_published` 和 `noindex` 设置数据。

**修改后的脚本**：
```sql
-- 为已发布且可索引的场景设置 in_sitemap = TRUE
UPDATE use_cases
SET in_sitemap = TRUE
WHERE is_published = TRUE
  AND noindex = FALSE
  AND (in_sitemap IS NULL OR in_sitemap = FALSE);

-- 为已发布且可索引的场景设置 AI 分数 0.7
UPDATE use_cases
SET ai_citation_score = 0.7
WHERE is_published = TRUE
  AND noindex = FALSE
  AND in_sitemap = TRUE
  AND (ai_citation_score IS NULL OR ai_citation_score = 0);
```

**优点**：
- 不依赖 tier，避免修复 tier 的超时问题
- 逻辑清晰，直接基于业务条件
- 即使有 21 万条记录，UPDATE 通常也很快

### 方案 B：分批修复 Tier（如果一定要修复）

如果一定要修复 tier，可以分批执行：

```sql
-- 分批修复：每次处理 1000 条
DO $$
DECLARE
  updated_count INTEGER;
  batch_size INTEGER := 1000;
  total_updated INTEGER := 0;
BEGIN
  LOOP
    UPDATE use_cases
    SET tier = 1
    WHERE tier = 2
      AND is_published = TRUE
      AND noindex = FALSE
      AND tier = 2  -- 确保只更新 Tier2
    LIMIT batch_size;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    total_updated := total_updated + updated_count;
    
    RAISE NOTICE '已处理 % 个场景，总计 %', updated_count, total_updated;
    
    EXIT WHEN updated_count = 0;
    
    COMMIT;  -- 可能需要手动提交
  END LOOP;
  
  RAISE NOTICE '✅ 完成！总共处理 % 个场景', total_updated;
END $$;
```

**缺点**：
- 需要多次执行
- 仍然可能超时
- 复杂度较高

---

## ✅ 推荐方案：直接修改脚本 068（最简单）

**不需要修复 tier**，直接创建一个新的脚本，基于业务条件设置数据。

### 创建新脚本：`068_setup_scene_data_direct.sql`

```sql
-- 068_setup_scene_data_direct.sql
-- 直接设置场景数据，不依赖 tier

-- 1. 为已发布且可索引的场景设置 in_sitemap = TRUE
UPDATE use_cases
SET in_sitemap = TRUE
WHERE is_published = TRUE
  AND noindex = FALSE
  AND (in_sitemap IS NULL OR in_sitemap = FALSE);

-- 2. 为已发布且可索引的场景设置 AI 分数 0.7
UPDATE use_cases
SET ai_citation_score = 0.7
WHERE is_published = TRUE
  AND noindex = FALSE
  AND in_sitemap = TRUE
  AND (ai_citation_score IS NULL OR ai_citation_score = 0);

-- 3. 验证（快速查询）
SELECT 
  COUNT(*) FILTER (WHERE is_published = TRUE AND noindex = FALSE AND in_sitemap = TRUE) as "已设置in_sitemap",
  COUNT(*) FILTER (WHERE is_published = TRUE AND noindex = FALSE AND ai_citation_score >= 0.65) as "已设置AI分数"
FROM use_cases
WHERE is_published = TRUE AND noindex = FALSE
LIMIT 1;
```

**优点**：
- ✅ 简单直接，不依赖 tier
- ✅ 逻辑清晰，基于业务条件
- ✅ 通常不会超时（UPDATE 通常很快）
- ✅ 达到同样的效果：设置 in_sitemap 和 AI 分数

---

## 🎯 决策建议

### 如果目标是：设置 in_sitemap 和 AI 分数

**推荐**：使用方案 A（修改脚本 068），不需要修复 tier。

理由：
- 达到同样的效果
- 避免修复 tier 的超时问题
- 更简单，更直接

### 如果目标是：建立完整的 Tier 分类体系

**推荐**：修复 tier，但使用分批执行或异步处理。

理由：
- Tier 分类对长期数据管理很重要
- 可以后续慢慢修复，不急于一时

---

## 📋 执行建议

### 立即执行（推荐）

1. **创建新脚本**：`068_setup_scene_data_direct.sql`（不依赖 tier）
2. **执行新脚本**：直接设置 in_sitemap 和 AI 分数
3. **验证结果**：检查数据是否设置成功

### 后续处理（可选）

1. **修复 tier**：可以在低峰期分批修复
2. **优化查询**：为 tier 字段创建索引
3. **异步处理**：考虑使用后台任务修复

---

## 💭 总结

**修复 tier 的作用**：
- ✅ 让脚本 068 能正常工作
- ✅ 建立正确的数据分类体系
- ✅ 支持基于 tier 的业务逻辑

**但如果修复 tier 有困难**：
- ✅ **可以直接修改脚本 068，不依赖 tier**
- ✅ 达到同样的效果（设置 in_sitemap 和 AI 分数）
- ✅ 更简单，更快速

**建议**：先使用修改后的脚本 068（不依赖 tier），完成数据设置。修复 tier 可以在后续逐步完成。
