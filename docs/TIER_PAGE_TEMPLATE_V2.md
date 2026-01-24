# Tier Page 模板 V2（工程可批量生成）

> **目标**：每个页面"同框架、但首屏差异化 + 示例差异化 + FAQ差异化"，抢回 canonical  
> **适用场景**：大规模 AI 自动生成站点，解决模板重复导致的 canonical 问题

---

## 🎯 一、核心设计原则

### 1. 统一框架，差异化内容

**框架统一**：
- 页面结构固定（H1 → Answer-First → 示例 → FAQ → 内链）
- 技术实现统一（Next.js Server Component）

**内容差异化**：
- 首段必须包含：`audience + pain_points[0] + intent`
- FAQ 每页至少 1 个"该页专属词"
- 示例 prompt 必须包含：`primary_keyword` 或 `intent` 同义词

---

### 2. 去重约束

**首段约束**：
- 必须包含 `audience`
- 必须包含 `pain_points[0]`
- 必须包含 `intent`
- 不能是纯模板文本

**FAQ 约束**：
- 每页至少 1 个 FAQ 包含 `primary_keyword` 或 `intent` 同义词
- 不能完全复用其他页面的 FAQ

**示例约束**：
- 示例 prompt 必须包含 `primary_keyword` 或 `intent` 同义词
- 不能是通用示例

---

## 📋 二、数据输入格式（JSON）

```json
{
  "tier": "tier2",
  "slug": "anime-video-generator",
  "primary_keyword": "anime ai video generator",
  "intent": "create anime short videos",
  "audience": "social media creators",
  "pain_points": ["low budget", "fast iteration", "style consistency"],
  "example": {
    "prompt": "Create a 9:16 anime-style short video of a cat playing in neon Tokyo, cinematic lighting.",
    "settings": {
      "ratio": "9:16",
      "duration": 10,
      "style": "anime"
    }
  },
  "faq": [
    {
      "q": "Can I generate anime videos without watermark?",
      "a": "Yes, Sora2 generates watermark-free anime videos suitable for social media platforms."
    },
    {
      "q": "What aspect ratios are supported for anime videos?",
      "a": "Sora2 supports 9:16 (vertical for TikTok/Shorts) and 16:9 (horizontal for YouTube) formats."
    }
  ],
  "internal_links": {
    "hub": "/video-generator",
    "siblings": [
      "/cinematic-video-generator",
      "/cartoon-video-generator"
    ],
    "features": [
      "/pricing",
      "/api",
      "/sora-2",
      "/veo-3"
    ]
  }
}
```

---

## 🏗️ 三、页面结构（V2 必须包含）

### 1. H1 标题

**格式**：
```markdown
# {primary_keyword} - {intent} for {audience}
```

**示例**：
```markdown
# Anime AI Video Generator - Create Anime Short Videos for Social Media Creators
```

**约束**：
- 必须包含 `primary_keyword`
- 必须包含 `intent` 或同义词
- 必须包含 `audience`

---

### 2. 差异化首段（Answer-First Structure）

**格式**：
```markdown
{audience} use AI-generated videos to {intent}, addressing key challenges like {pain_points[0]}, {pain_points[1]}, and {pain_points[2]}.

Typical applications include:
- [Application 1 specific to audience + intent]
- [Application 2 specific to audience + intent]
- [Application 3 specific to audience + intent]

This page explains how {audience} use AI video tools for {intent}, which platforms are most suitable, and practical steps to get started.
```

**约束**：
- ✅ 必须包含 `audience`
- ✅ 必须包含 `pain_points[0]`
- ✅ 必须包含 `intent`
- ❌ 不能是纯模板文本（必须有具体描述）

**示例**：
```markdown
Social media creators use AI-generated videos to create anime short videos, addressing key challenges like low budget, fast iteration, and style consistency.

Typical applications include:
- TikTok anime-style content (9:16 vertical format)
- Instagram Reels with consistent anime aesthetics
- YouTube Shorts featuring anime characters

This page explains how social media creators use AI video tools to create anime short videos, which platforms are most suitable, and practical steps to get started.
```

---

### 3. 示例 Prompt + 参数块（必有）

**格式**：
```markdown
## Video Generation Example

**Prompt:**
```
{example.prompt}
```

**Settings:**
- Aspect Ratio: {example.settings.ratio}
- Duration: {example.settings.duration} seconds
- Style: {example.settings.style}
```

**约束**：
- ✅ 示例 prompt 必须包含 `primary_keyword` 或 `intent` 同义词
- ✅ 不能是通用示例

**示例**：
```markdown
## Video Generation Example

**Prompt:**
```
Create a 9:16 anime-style short video of a cat playing in neon Tokyo, cinematic lighting.
```

**Settings:**
- Aspect Ratio: 9:16
- Duration: 10 seconds
- Style: anime
```

---

### 4. 对比/决策块：Sora vs Veo（按 model 自动渲染）

**格式**：
```markdown
## Sora vs Veo for {intent}

**Sora 2:**
- Best for: {sora_best_for}
- Strengths: {sora_strengths}
- Limitations: {sora_limitations}

**Veo 3:**
- Best for: {veo_best_for}
- Strengths: {veo_strengths}
- Limitations: {veo_limitations}

**Recommendation for {audience}:**
{recommendation}
```

**约束**：
- 必须根据 `intent` 和 `audience` 提供具体对比
- 不能是通用对比文本

---

### 5. 用例块（按 intent/audience 写）

**格式**：
```markdown
## Use Cases for {audience}

### Use Case 1: {specific_use_case_1}
{description specific to audience + intent}

### Use Case 2: {specific_use_case_2}
{description specific to audience + intent}

### Use Case 3: {specific_use_case_3}
{description specific to audience + intent}
```

**约束**：
- 必须针对 `audience` 和 `intent` 写具体用例
- 不能是通用用例

---

### 6. FAQ（2-3 条独有）

**格式**：
```markdown
## Frequently Asked Questions

### {faq[0].q}
{faq[0].a}

### {faq[1].q}
{faq[1].a}

### {faq[2].q}
{faq[2].a}
```

**约束**：
- ✅ 每页至少 1 个 FAQ 包含 `primary_keyword` 或 `intent` 同义词
- ✅ 不能完全复用其他页面的 FAQ
- ✅ FAQ 必须针对 `audience` 和 `intent` 写

**示例**：
```markdown
## Frequently Asked Questions

### Can I generate anime videos without watermark?
Yes, Sora2 generates watermark-free anime videos suitable for social media platforms.

### What aspect ratios are supported for anime videos?
Sora2 supports 9:16 (vertical for TikTok/Shorts) and 16:9 (horizontal for YouTube) formats.

### How long does it take to generate an anime video?
Anime videos are typically generated in 2-5 minutes, depending on complexity and platform settings.
```

---

### 7. 内链三件套：hub + siblings + feature

**格式**：
```markdown
## Related Pages

**Main Hub:** [{hub_title}]({internal_links.hub})

**Similar Tools:**
- [{sibling_1_title}]({internal_links.siblings[0]})
- [{sibling_2_title}]({internal_links.siblings[1]})

**Features:**
- [{feature_1_title}]({internal_links.features[0]})
- [{feature_2_title}]({internal_links.features[1]})
```

---

### 8. 结构化数据（FAQPage + BreadcrumbList）

**JSON-LD 格式**：
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{primary_keyword} - {intent} for {audience}",
  "about": {
    "@type": "Thing",
    "name": "{intent}",
    "description": "{intent description}"
  },
  "mainEntity": {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "{faq[0].q}",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "{faq[0].a}"
        }
      },
      {
        "@type": "Question",
        "name": "{faq[1].q}",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "{faq[1].a}"
        }
      }
    ]
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://sora2aivideos.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "{primary_keyword}",
        "item": "https://sora2aivideos.com/use-cases/{slug}"
      }
    ]
  }
}
```

---

## 🛠️ 四、工程实现

### 1. 内容生成 Prompt（LLM）

**输入**：
- JSON 数据（如上）
- 去重约束列表

**输出**：
- Markdown 格式的完整页面内容
- 确保满足所有约束

**Prompt 模板**：
```
Generate a use case page for Sora2 AI video generation platform.

**Input Data:**
{json_data}

**Constraints:**
1. H1 must include: {primary_keyword}, {intent}, {audience}
2. Answer-First paragraph must include: {audience}, {pain_points[0]}, {intent}
3. Example prompt must include: {primary_keyword} or {intent} synonym
4. At least 1 FAQ must include: {primary_keyword} or {intent} synonym
5. All content must be specific to {audience} and {intent}, not generic

**Output Format:**
- Markdown with H1, H2, H3 headings
- Include all required sections
- Ensure content differentiation
```

---

### 2. 去重检查（Post-Generation）

**检查项**：
1. 首段是否包含 `audience + pain_points[0] + intent`
2. FAQ 是否包含 `primary_keyword` 或 `intent` 同义词
3. 示例 prompt 是否包含 `primary_keyword` 或 `intent` 同义词
4. 内容相似度检查（与现有页面对比）

**SQL 检查**：
```sql
-- 检查新生成页面的去重约束
SELECT 
  id,
  slug,
  title,
  content,
  -- 检查首段是否包含必要元素
  CASE 
    WHEN content NOT LIKE '%' || (SELECT audience FROM page_data WHERE slug = use_cases.slug) || '%' THEN 'MISSING_AUDIENCE'
    WHEN content NOT LIKE '%' || (SELECT pain_points[1] FROM page_data WHERE slug = use_cases.slug) || '%' THEN 'MISSING_PAIN_POINT'
    WHEN content NOT LIKE '%' || (SELECT intent FROM page_data WHERE slug = use_cases.slug) || '%' THEN 'MISSING_INTENT'
    ELSE 'OK'
  END as constraint_check
FROM use_cases
WHERE is_published = true
  AND created_at >= NOW() - INTERVAL '7 days'
LIMIT 100;
```

---

### 3. 批量生成流程

**步骤 1：准备 JSON 数据**
- 从数据库导出或生成 JSON 数据
- 确保每个页面有唯一的 `primary_keyword`、`intent`、`audience`

**步骤 2：LLM 生成内容**
- 使用 Prompt 模板生成 Markdown
- 确保满足所有约束

**步骤 3：去重检查**
- 运行去重检查 SQL
- 修复不符合约束的页面

**步骤 4：导入数据库**
- 将生成的 Markdown 导入 `use_cases.content`
- 设置 `is_published = true`、`in_sitemap = true`

---

## 📊 五、效果监控

### 1. 差异化指标

**检查 SQL**：
```sql
-- 检查页面差异化程度
SELECT 
  id,
  slug,
  title,
  -- 检查是否包含必要差异化元素
  CASE 
    WHEN content LIKE '%' || primary_keyword || '%' THEN 'HAS_KEYWORD'
    ELSE 'MISSING_KEYWORD'
  END as keyword_check,
  CASE 
    WHEN (LENGTH(content) - LENGTH(REPLACE(content, '?', ''))) >= 3 THEN 'HAS_FAQ'
    ELSE 'MISSING_FAQ'
  END as faq_check
FROM use_cases
WHERE is_published = true
  AND in_sitemap = true
LIMIT 100;
```

---

### 2. Canonical 问题监控

**GSC 监控**：
- 跟踪"重复网页，Google 选择了不同的规范网页"数量
- 目标：每月减少 20-30%

---

## 📝 六、实施检查清单

- [ ] 创建 JSON 数据格式规范
- [ ] 创建内容生成 Prompt 模板
- [ ] 实现去重检查 SQL
- [ ] 实现批量生成流程
- [ ] 测试生成 10-20 个页面
- [ ] 检查差异化程度
- [ ] 监控 canonical 问题变化

---

**相关文档**：
- [AI 页面模板增强清单](./AI_PAGE_TEMPLATE_ENHANCEMENT.md)
- [安全增长蓝图](./SAFE_SCALE_TO_100K_BLUEPRINT.md)
