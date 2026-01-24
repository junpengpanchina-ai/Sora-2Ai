# 未收录 URL 分类工具：该删 / 该留 / 该增强

> **目标**：将 1,126 个未收录 URL 按优先级分类，制定处理策略  
> **使用场景**：从 GSC 导出未收录 URL 列表后，使用 SQL 工具进行分类

---

## 📋 一、分类标准

### 🗑️ 该删（Delete）

**标准**：
- 内容过薄（< 300 字）
- 重复内容（已有更好的 canonical）
- 测试/占位页面
- 明显错误页面

**处理方式**：
- 设置 `noindex = true`
- 设置 `in_sitemap = false`
- （可选）设置 `canonical_url` 指向主页面
- 标记 `index_health_status = 'deleted'`

---

### ✅ 该留（Keep）

**标准**：
- 内容完整（≥ 300 字）
- 结构合理
- 只是暂时未收录（"已发现未编入"）
- 符合 SEO 标准

**处理方式**：
- 无需处理，等待 Google 自然收录
- 持续监控状态

---

### 🔧 该增强（Enhance）

**标准**：
- 内容基本完整但可能触发 Soft 404
- 缺少差异化元素（导致 canonical 问题）
- 缺少关键 SEO 元素（FAQ、结构化数据等）
- 内容质量可提升

**处理方式**：
- 增强内容差异化
- 添加行业特定内容
- 优化 FAQ 部分
- 增加示例和用例

---

## 🔍 二、SQL 分类工具

### 1. 识别"该删"的页面

```sql
-- 检查内容过薄、占位、测试页面
SELECT 
  id,
  slug,
  title,
  LENGTH(content) as content_length,
  CASE 
    WHEN content IS NULL THEN 'NULL_CONTENT'
    WHEN LENGTH(content) < 300 THEN 'THIN_CONTENT'
    WHEN content LIKE '%coming soon%' OR content LIKE '%暂无内容%' OR content LIKE '%正在生成%' THEN 'PLACEHOLDER'
    WHEN title LIKE '%test%' OR title LIKE '%测试%' THEN 'TEST_PAGE'
    ELSE 'OK'
  END as delete_reason,
  noindex,
  in_sitemap,
  canonical_url
FROM use_cases 
WHERE is_published = true
  AND (
    content IS NULL 
    OR LENGTH(content) < 300
    OR content LIKE '%coming soon%'
    OR content LIKE '%暂无内容%'
    OR content LIKE '%正在生成%'
    OR title LIKE '%test%'
    OR title LIKE '%测试%'
  )
ORDER BY content_length ASC
LIMIT 200;
```

---

### 2. 识别"该增强"的页面（Soft 404 风险）

```sql
-- 检查可能触发 Soft 404 的页面
SELECT 
  id,
  slug,
  title,
  LENGTH(content) as content_length,
  -- 检查是否缺少关键元素
  CASE 
    WHEN content NOT LIKE '%FAQ%' AND content NOT LIKE '%Frequently Asked%' THEN 'MISSING_FAQ'
    WHEN content NOT LIKE '%example%' AND content NOT LIKE '%Example%' THEN 'MISSING_EXAMPLES'
    WHEN content NOT LIKE '%industry%' AND content NOT LIKE '%Industry%' THEN 'MISSING_INDUSTRY_CONTEXT'
    ELSE 'OK'
  END as enhancement_needed,
  use_case_type,
  industry,
  noindex,
  in_sitemap
FROM use_cases 
WHERE is_published = true
  AND in_sitemap = true
  AND noindex = false
  AND LENGTH(content) >= 300  -- 基本内容完整
  AND (
    content NOT LIKE '%FAQ%' 
    OR content NOT LIKE '%example%'
    OR content NOT LIKE '%industry%'
  )
ORDER BY content_length ASC
LIMIT 200;
```

---

### 3. 识别重复内容（Canonical 问题）

```sql
-- 检查标题相似度高的页面（可能触发 canonical 问题）
WITH title_similarity AS (
  SELECT 
    a.id as id_a,
    a.slug as slug_a,
    a.title as title_a,
    b.id as id_b,
    b.slug as slug_b,
    b.title as title_b,
    -- 使用简单的相似度计算（实际可用 pg_trgm）
    CASE 
      WHEN LOWER(a.title) = LOWER(b.title) THEN 1.0
      WHEN LOWER(a.title) LIKE '%' || LOWER(b.title) || '%' OR LOWER(b.title) LIKE '%' || LOWER(a.title) || '%' THEN 0.8
      ELSE 0.0
    END as similarity
  FROM use_cases a
  JOIN use_cases b ON a.id < b.id
  WHERE a.is_published = true
    AND b.is_published = true
    AND a.use_case_type = b.use_case_type  -- 同类型才比较
    AND a.id != b.id
)
SELECT 
  id_a,
  slug_a,
  title_a,
  id_b,
  slug_b,
  title_b,
  similarity,
  CASE 
    WHEN similarity >= 0.8 THEN 'HIGH_DUPLICATE'
    WHEN similarity >= 0.6 THEN 'MEDIUM_DUPLICATE'
    ELSE 'LOW_DUPLICATE'
  END as duplicate_level
FROM title_similarity
WHERE similarity >= 0.6
ORDER BY similarity DESC
LIMIT 100;
```

---

### 4. 综合分类查询（推荐使用）

```sql
-- 综合分类：该删 / 该留 / 该增强
SELECT 
  id,
  slug,
  title,
  LENGTH(content) as content_length,
  use_case_type,
  industry,
  noindex,
  in_sitemap,
  canonical_url,
  -- 分类逻辑
  CASE 
    -- 该删：内容过薄或占位
    WHEN content IS NULL OR LENGTH(content) < 300 THEN 'DELETE'
    WHEN content LIKE '%coming soon%' OR content LIKE '%暂无内容%' OR content LIKE '%正在生成%' THEN 'DELETE'
    WHEN title LIKE '%test%' OR title LIKE '%测试%' THEN 'DELETE'
    
    -- 该增强：内容基本完整但缺少关键元素
    WHEN LENGTH(content) >= 300 
      AND (content NOT LIKE '%FAQ%' OR content NOT LIKE '%example%' OR content NOT LIKE '%industry%') 
    THEN 'ENHANCE'
    
    -- 该留：内容完整，结构合理
    ELSE 'KEEP'
  END as classification,
  -- 具体原因
  CASE 
    WHEN content IS NULL THEN 'NULL_CONTENT'
    WHEN LENGTH(content) < 300 THEN 'THIN_CONTENT'
    WHEN content LIKE '%coming soon%' THEN 'PLACEHOLDER'
    WHEN content NOT LIKE '%FAQ%' THEN 'MISSING_FAQ'
    WHEN content NOT LIKE '%example%' THEN 'MISSING_EXAMPLES'
    WHEN content NOT LIKE '%industry%' THEN 'MISSING_INDUSTRY'
    ELSE 'GOOD'
  END as reason
FROM use_cases 
WHERE is_published = true
ORDER BY 
  CASE classification
    WHEN 'DELETE' THEN 1
    WHEN 'ENHANCE' THEN 2
    WHEN 'KEEP' THEN 3
  END,
  content_length ASC
LIMIT 500;
```

---

## 🛠️ 三、批量处理 SQL

### 批量标记"该删"页面

```sql
-- 将内容过薄的页面标记为 noindex
UPDATE use_cases
SET 
  noindex = true,
  in_sitemap = false,
  index_health_status = 'deleted',
  updated_at = NOW()
WHERE is_published = true
  AND (
    content IS NULL 
    OR LENGTH(content) < 300
    OR content LIKE '%coming soon%'
    OR content LIKE '%暂无内容%'
    OR content LIKE '%正在生成%'
  )
  AND noindex = false;  -- 只更新未标记的
```

---

### 批量标记"该增强"页面

```sql
-- 标记需要增强的页面（用于后续批量处理）
UPDATE use_cases
SET 
  index_health_status = 'needs_enhancement',
  updated_at = NOW()
WHERE is_published = true
  AND in_sitemap = true
  AND noindex = false
  AND LENGTH(content) >= 300
  AND (
    content NOT LIKE '%FAQ%' 
    OR content NOT LIKE '%example%'
    OR content NOT LIKE '%industry%'
  )
  AND index_health_status IS NULL;
```

---

## 📊 四、从 GSC 导出后的处理流程

### 步骤 1：导出未收录 URL 列表

1. 打开 GSC → Pages → 未编入索引
2. 导出 CSV 文件
3. 提取 URL 中的 slug（例如：`/use-cases/xxx` → `xxx`）

### 步骤 2：匹配数据库记录

```sql
-- 根据 slug 列表匹配未收录页面
-- 假设你有一个 slug 列表，可以这样查询：
WITH unindexed_slugs AS (
  SELECT unnest(ARRAY[
    'slug1', 'slug2', 'slug3'  -- 替换为实际从 GSC 导出的 slug
  ]) as slug
)
SELECT 
  uc.id,
  uc.slug,
  uc.title,
  uc.content,
  LENGTH(uc.content) as content_length,
  uc.use_case_type,
  uc.industry,
  uc.noindex,
  uc.in_sitemap,
  uc.canonical_url,
  -- 分类
  CASE 
    WHEN uc.content IS NULL OR LENGTH(uc.content) < 300 THEN 'DELETE'
    WHEN uc.content LIKE '%coming soon%' THEN 'DELETE'
    WHEN LENGTH(uc.content) >= 300 AND (uc.content NOT LIKE '%FAQ%' OR uc.content NOT LIKE '%example%') THEN 'ENHANCE'
    ELSE 'KEEP'
  END as classification
FROM use_cases uc
INNER JOIN unindexed_slugs us ON uc.slug = us.slug
WHERE uc.is_published = true
ORDER BY 
  CASE 
    WHEN uc.content IS NULL OR LENGTH(uc.content) < 300 THEN 1
    WHEN uc.content LIKE '%coming soon%' THEN 1
    WHEN LENGTH(uc.content) >= 300 AND (uc.content NOT LIKE '%FAQ%' OR uc.content NOT LIKE '%example%') THEN 2
    ELSE 3
  END;
```

---

## 📈 五、处理优先级建议

### 优先级 1：立即处理（该删）

- 内容为 NULL 的页面
- 内容 < 100 字的页面
- 明显的测试/占位页面

**预计数量**：50-200 个

---

### 优先级 2：本周处理（该增强）

- 内容 300-500 字但缺少 FAQ
- 内容完整但缺少示例
- 可能触发 Soft 404 的页面

**预计数量**：200-400 个

---

### 优先级 3：持续监控（该留）

- 内容完整、结构合理
- 只是暂时未收录
- 等待 Google 自然收录

**预计数量**：500-800 个

---

## 🎯 六、执行建议

1. **先运行分类查询**，了解分布情况
2. **批量处理"该删"页面**（立即执行）
3. **分批处理"该增强"页面**（本周内完成）
4. **持续监控"该留"页面**（无需处理）

---

## 📝 七、检查清单

- [ ] 运行综合分类查询，了解分布
- [ ] 批量标记"该删"页面（noindex + 出 sitemap）
- [ ] 标记"该增强"页面（用于后续批量处理）
- [ ] 从 GSC 导出未收录 URL，匹配数据库记录
- [ ] 制定增强计划（参考模板增强清单）

---

**相关文档**：
- [AI 页面模板增强清单](./AI_PAGE_TEMPLATE_ENHANCEMENT.md)
- [GSC 健康指标](./GSC_HEALTH_INDICATORS_AI_SITES.md)
