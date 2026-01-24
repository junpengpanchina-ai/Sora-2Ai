# AI 自动生成页面的模板增强清单（专为抢回 Canonical）

> **目标**：通过模板增强，减少 Google 的 canonical 去重决策，提高页面差异化  
> **适用场景**：大规模 AI 自动生成站点，页面模板高度一致

---

## 🎯 一、核心策略

### 问题诊断

**当前状态**：
- 页面模板高度一致
- 国家页 / 场景页 / 关键词页结构相似
- Google 认为"这些我只要留一个代表页就好"

**解决方案**：
- 在模板中引入变量段落
- 增加示例视频 / use case 差异
- 添加国家/行业独立 FAQ
- 强化内容差异化信号

---

## 📋 二、模板增强清单

### ✅ 1. Answer-First 段落差异化

**当前模板**：
```markdown
In [industry], AI-generated videos are commonly used for [use case].
```

**增强版本**（引入变量）：
```markdown
In [industry], AI-generated videos are commonly used for [use case]. 
[Industry-specific context: 2-3 sentences about why this industry particularly benefits]
[Regional variation: For [country/region], teams typically use this for [specific local use case]
```

**实现方式**：
- 根据 `industry` 字段，从预定义库中选择 3-5 个行业特定段落（随机选择 1 个）
- 根据 `use_case_type`，添加场景特定说明
- 根据国家/地区（如果有），添加本地化内容

**SQL 检查**：
```sql
-- 检查哪些页面缺少行业特定内容
SELECT id, slug, title, industry, use_case_type
FROM use_cases
WHERE is_published = true
  AND in_sitemap = true
  AND content NOT LIKE '%' || industry || '%'  -- 内容中未提及行业
LIMIT 100;
```

---

### ✅ 2. 行业约束段落（Industry Constraints）

**当前模板**：
```markdown
H2: Why AI video is suitable for this scenario
```

**增强版本**（添加约束段落）：
```markdown
H2: Why AI video is suitable for this scenario
[3-5 points]

H2: Industry Constraints and Considerations
In the [industry] sector, AI-generated video may have limitations when:
- [Constraint 1: specific to industry]
- [Constraint 2: specific to use case]
- [Constraint 3: technical limitation]

Teams should consider [consideration] before applying this approach to [specific scenario].
```

**实现方式**：
- 为每个 `industry` 预定义 3-5 个约束模板
- 为每个 `use_case_type` 预定义 2-3 个场景特定约束
- 随机组合，确保每页不同

**检查 SQL**：
```sql
-- 检查哪些页面缺少约束段落
SELECT id, slug, title, industry, use_case_type
FROM use_cases
WHERE is_published = true
  AND in_sitemap = true
  AND (content NOT LIKE '%constraint%' AND content NOT LIKE '%limitation%' AND content NOT LIKE '%consideration%')
LIMIT 100;
```

---

### ✅ 3. 示例视频差异化（Video Examples）

**当前模板**：
```markdown
H2: Video generation examples
- Example 1
- Example 2
- Example 3
```

**增强版本**（行业/场景特定示例）：
```markdown
H2: Video generation examples for [industry] [use case]

**Example 1: [Specific industry scenario]**
Prompt: "[Industry-specific prompt with real context]"
Use case: [Why this example is relevant to this industry]
Format: [Platform-specific format: 9:16 for TikTok, 16:9 for YouTube]

**Example 2: [Different scenario within same industry]**
[Similar structure]

**Example 3: [Edge case or advanced use]**
[Similar structure]
```

**实现方式**：
- 为每个 `industry` × `use_case_type` 组合，预定义 5-10 个示例模板
- 每页随机选择 3 个，确保差异化
- 示例中包含真实的行业术语和场景

**检查 SQL**：
```sql
-- 检查哪些页面缺少具体示例
SELECT id, slug, title, industry, use_case_type
FROM use_cases
WHERE is_published = true
  AND in_sitemap = true
  AND (content NOT LIKE '%Example%' OR content NOT LIKE '%example%' OR content LIKE '%Example 1%' AND content NOT LIKE '%Example 2%')
LIMIT 100;
```

---

### ✅ 4. FAQ 差异化（抢回 Canonical 的关键）

**当前模板**：
```markdown
H2: Frequently Asked Questions
- Is AI video suitable for [industry]?
- Do I need filming equipment?
- Is this expensive?
```

**增强版本**（行业/场景特定 FAQ）：
```markdown
H2: Frequently Asked Questions

**FAQ-A: Beginner Cognitive Questions**
- Is AI video suitable for [industry] [use case]?
  Answer: [2-3 sentences specific to industry + use case combination]
  
- Do [industry] teams need [specific equipment/tool] for [use case]?
  Answer: [Industry-specific answer]

**FAQ-B: Decision Boundary Questions**
- When should AI video NOT be used in [industry] for [use case]?
  Answer: [Honest limitations specific to industry]
  
- What are common limitations of AI-generated video for [industry] [use case]?
  Answer: [Technical/business constraints]

**FAQ-C: Industry-Specific Questions**
- How do [industry] teams typically integrate AI video into [specific workflow]?
  Answer: [Industry workflow integration]
  
- What are the ROI considerations for [industry] using AI video for [use case]?
  Answer: [Industry-specific ROI context]
```

**实现方式**：
- 为每个 `industry` 预定义 10-15 个行业特定 FAQ
- 为每个 `use_case_type` 预定义 5-8 个场景特定 FAQ
- 每页随机选择 5-7 个，确保差异化

**检查 SQL**：
```sql
-- 检查哪些页面 FAQ 数量不足或过于通用
SELECT 
  id, 
  slug, 
  title, 
  industry, 
  use_case_type,
  (LENGTH(content) - LENGTH(REPLACE(content, '?', ''))) as faq_count  -- 粗略计算 FAQ 数量
FROM use_cases
WHERE is_published = true
  AND in_sitemap = true
  AND (
    (LENGTH(content) - LENGTH(REPLACE(content, '?', ''))) < 3  -- FAQ 少于 3 个
    OR content NOT LIKE '%' || industry || '%'  -- FAQ 中未提及行业
  )
LIMIT 100;
```

---

### ✅ 5. 国家/地区差异化（如果有地理定位）

**当前模板**：
```markdown
H2: Target Audience / Applicable Industries
```

**增强版本**（添加国家/地区特定内容）：
```markdown
H2: Target Audience / Applicable Industries

**Primary Markets:**
- [Country 1]: [Specific use case in this country, local context]
- [Country 2]: [Different use case or variation]
- [Country 3]: [Regional variation]

**Regional Considerations:**
- [Platform preferences by region]
- [Content style variations]
- [Regulatory or cultural considerations]
```

**实现方式**：
- 如果页面有国家/地区标记，添加本地化内容
- 如果没有，可以基于 `industry` 推断主要市场

---

### ✅ 6. 结构化数据增强

**当前状态**：
- 已有基本结构化数据（Article, FAQPage）

**增强版本**：
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Title with industry + use case]",
  "about": {
    "@type": "Thing",
    "name": "[Industry]",
    "description": "[Industry-specific context]"
  },
  "mentions": [
    {
      "@type": "Thing",
      "name": "[Use case type]",
      "description": "[Use case specific context]"
    }
  ],
  "mainEntity": {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "[Industry-specific FAQ question]",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "[Industry-specific answer]"
        }
      }
    ]
  }
}
```

**实现方式**：
- 在 `app/use-cases/[slug]/page.tsx` 中增强结构化数据
- 添加 `about` 和 `mentions` 字段，明确行业和场景

---

## 🛠️ 三、批量增强工具

### 1. 识别需要增强的页面

```sql
-- 综合检查：哪些页面需要增强
SELECT 
  id,
  slug,
  title,
  industry,
  use_case_type,
  LENGTH(content) as content_length,
  -- 检查各项指标
  CASE 
    WHEN content NOT LIKE '%' || industry || '%' THEN 'MISSING_INDUSTRY_CONTEXT'
    WHEN content NOT LIKE '%constraint%' AND content NOT LIKE '%limitation%' THEN 'MISSING_CONSTRAINTS'
    WHEN (LENGTH(content) - LENGTH(REPLACE(content, '?', ''))) < 3 THEN 'MISSING_FAQ'
    WHEN content NOT LIKE '%Example%' OR content LIKE '%Example 1%' AND content NOT LIKE '%Example 2%' THEN 'MISSING_EXAMPLES'
    ELSE 'OK'
  END as enhancement_needed
FROM use_cases
WHERE is_published = true
  AND in_sitemap = true
  AND noindex = false
  AND LENGTH(content) >= 300
ORDER BY 
  CASE enhancement_needed
    WHEN 'MISSING_INDUSTRY_CONTEXT' THEN 1
    WHEN 'MISSING_CONSTRAINTS' THEN 2
    WHEN 'MISSING_FAQ' THEN 3
    WHEN 'MISSING_EXAMPLES' THEN 4
    ELSE 5
  END
LIMIT 200;
```

---

### 2. 标记需要增强的页面

```sql
-- 标记需要增强的页面
UPDATE use_cases
SET 
  index_health_status = 'needs_enhancement',
  updated_at = NOW()
WHERE is_published = true
  AND in_sitemap = true
  AND noindex = false
  AND LENGTH(content) >= 300
  AND (
    content NOT LIKE '%' || industry || '%'
    OR (content NOT LIKE '%constraint%' AND content NOT LIKE '%limitation%')
    OR (LENGTH(content) - LENGTH(REPLACE(content, '?', ''))) < 3
    OR content NOT LIKE '%Example%'
  )
  AND index_health_status IS NULL;
```

---

## 📝 四、模板增强优先级

### 优先级 1：FAQ 差异化（最重要）

**原因**：
- FAQ 是 Google 判断页面差异化的关键信号
- 行业特定 FAQ 能显著提高页面独特性
- 结构化数据中的 FAQ 对 SEO 影响大

**执行**：
1. 为每个 `industry` 创建 10-15 个行业特定 FAQ 模板
2. 为每个 `use_case_type` 创建 5-8 个场景特定 FAQ 模板
3. 在内容生成时，随机选择 5-7 个组合

---

### 优先级 2：行业约束段落

**原因**：
- 显示页面深度和专业性
- 减少"thin content"风险
- 提高页面权威性

**执行**：
1. 为每个 `industry` 创建 3-5 个约束模板
2. 在"Why AI video is suitable"之后添加

---

### 优先级 3：示例差异化

**原因**：
- 具体示例提高页面实用性
- 行业特定示例显示专业性
- 减少模板重复感

**执行**：
1. 为每个 `industry` × `use_case_type` 组合创建示例库
2. 每页随机选择 3 个

---

### 优先级 4：Answer-First 段落增强

**原因**：
- 提高 GEO 优化效果
- 行业特定开头提高相关性

**执行**：
1. 为每个 `industry` 创建 3-5 个开头模板
2. 随机选择使用

---

## 🎯 五、实施建议

### 阶段 1：模板库建设（1-2 周）

1. **创建行业 FAQ 模板库**
   - 为每个 `industry` 创建 10-15 个 FAQ
   - 分类：Beginner Cognitive、Decision Boundary、Industry-Specific

2. **创建约束段落模板库**
   - 为每个 `industry` 创建 3-5 个约束模板
   - 包含技术限制、业务考虑、场景限制

3. **创建示例模板库**
   - 为每个 `industry` × `use_case_type` 创建 5-10 个示例
   - 包含 prompt、use case、format 说明

---

### 阶段 2：批量增强现有页面（2-4 周）

1. **识别需要增强的页面**（使用上面的 SQL）
2. **分批处理**：
   - 第 1 批：Tier 1 页面（优先级最高）
   - 第 2 批：Tier 2 页面
   - 第 3 批：其他页面

3. **使用 AI 批量生成增强内容**
   - 基于模板库，为每个页面生成差异化内容
   - 确保每页至少 3 个行业特定 FAQ
   - 确保每页有约束段落和具体示例

---

### 阶段 3：新页面生成优化（持续）

1. **更新内容生成 prompt**
   - 集成模板库选择逻辑
   - 确保新页面自动包含差异化元素

2. **监控效果**
   - 跟踪 canonical 问题是否减少
   - 监控索引率变化
   - 分析 GSC 数据

---

## 📊 六、效果监控

### 关键指标

1. **Canonical 问题数量**
   - GSC → Pages → 未编入索引 → "重复网页，Google 选择了不同的规范网页"
   - 目标：每月减少 20-30%

2. **索引率**
   - 目标：从当前 96% 提升到 98%+

3. **内容差异化指标**
   - 运行 SQL 检查，确保 90%+ 页面包含行业特定内容

---

## 🔍 七、检查清单

- [ ] 创建行业 FAQ 模板库（10-15 个/行业）
- [ ] 创建约束段落模板库（3-5 个/行业）
- [ ] 创建示例模板库（5-10 个/行业×场景）
- [ ] 运行 SQL 识别需要增强的页面
- [ ] 批量增强 Tier 1 页面
- [ ] 更新内容生成 prompt，集成模板库
- [ ] 监控 canonical 问题数量变化
- [ ] 监控索引率变化

---

**相关文档**：
- [未收录 URL 分类工具](./UNINDEXED_URL_CLASSIFICATION.md)
- [从 3 万到 10 万页面扩张策略](./SCALE_TO_100K_PAGES.md)
- [GSC 健康指标](./GSC_HEALTH_INDICATORS_AI_SITES.md)
