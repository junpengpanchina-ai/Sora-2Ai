# 趋势映射词库（Anti-Hotspot 安全版）

> **定位**：替代"热点词"的，是"趋势行为词 + 场景状态词"  
> 👉 Google 能感知趋势  
> 👉 不触发 Hot Query / News / Freshness 惩罚

---

## 🧠 映射公式（你以后只用这个）

```
【热点事件 / 热搜词】
    ↓（去名词）
【行为变化】
    ↓（去时间）
【长期场景】
    ↓
【可长期索引的趋势映射词】
```

---

## 🔐 核心趋势映射词库（通用版）

### ① 内容消费趋势（替代：短视频 / 平台热搜）

| 热点不可用词 | 映射安全词（可长期） |
|-------------|---------------------|
| short video trend | visual-first content |
| TikTok / Reels | platform-native video |
| viral video | high-engagement video |
| creator economy | independent content creators |
| algorithm boost | content discoverability |

**✅ 用途**：教育、营销、展示类页面  
**❌ 禁用**：H1 / URL

---

### ② AI 热点（替代：模型名 / 新发布）

| 热点词 | 安全映射 |
|--------|---------|
| Gemini-3 / GPT-5 | latest multimodal models |
| new AI release | recent AI advancements |
| AI breakthrough | rapidly evolving AI capabilities |
| AI trend 2025 | current AI adoption patterns |

👉 **永远不写具体模型名**

---

### ③ 行业行为变化（最值钱）

| 行业 | 趋势映射词 |
|------|-----------|
| 医疗 | patient pre-visit education |
| 教育 | self-paced learning materials |
| 电商 | product visualization before purchase |
| 地产 | remote property walkthroughs |
| SaaS | onboarding without live demos |

📌 **这些词索引周期长、不会过期**

---

### ④ 用户决策变化（GEO 特别吃）

| 热点表达 | GEO 映射词 |
|---------|-----------|
| people prefer video | decision support content |
| attention span shorter | concise explanatory formats |
| social proof trend | example-driven explanations |

👉 **AI Summary / SGE 非常爱引用这一层**

---

### ⑤ 季节性趋势（不写年份）

| 错误写法 | 正确映射 |
|---------|---------|
| 2025 marketing trend | seasonal planning cycles |
| end of year trend | annual review periods |
| holiday campaign | peak engagement periods |

---

## 🧱 放置规则（一定照做）

| 位置 | 是否可用 |
|------|---------|
| URL | ❌ 禁止 |
| H1 | ❌ 禁止 |
| H2 | ⚠️ 偶尔 |
| Answer-first 段 | ✅ 强烈建议 |
| Example / Scenario | ✅ 最安全 |

---

## 📋 使用示例

### ❌ 错误用法

**热点词**：`TikTok video trend 2025`

**错误写法**：
- URL: `/tiktok-video-trend-2025`
- H1: `TikTok Video Trend 2025`
- 内容：大量提及"TikTok"、"trend"、"2025"

### ✅ 正确用法

**热点词**：`TikTok video trend 2025`

**映射过程**：
1. 去名词：`video trend` → `visual content consumption`
2. 去时间：`2025` → 移除
3. 长期场景：`platform-native video` / `visual-first content`

**正确写法**：
- URL: `/ai-video-for-social-media-content`（不变）
- H1: `AI Video Generation for Social Media – Content Creation`（不变）
- Answer-first: "Many teams now use platform-native video formats for high-engagement content..."
- Examples: "visual-first content for social platforms"

---

## 🎯 行业特定映射词库

### 医疗行业

| 热点词 | 安全映射 |
|--------|---------|
| telemedicine trend | remote patient communication |
| health app boom | digital health resources |
| wellness content | preventive care education |

### 教育行业

| 热点词 | 安全映射 |
|--------|---------|
| online learning surge | self-paced learning materials |
| microlearning trend | concise educational formats |
| edtech adoption | digital learning resources |

### 电商行业

| 热点词 | 安全映射 |
|--------|---------|
| live shopping trend | interactive product presentation |
| AR try-on | product visualization |
| social commerce | platform-integrated shopping |

### SaaS 行业

| 热点词 | 安全映射 |
|--------|---------|
| product-led growth | self-service onboarding |
| no-code movement | accessible automation tools |
| remote work tools | distributed team resources |

---

## 🔧 实现方式

### 在代码中使用映射词库

```typescript
// lib/trend-mapping.ts

export const TREND_MAPPING_LEXICON = {
  content_consumption: {
    'short video trend': 'visual-first content',
    'TikTok / Reels': 'platform-native video',
    'viral video': 'high-engagement video',
    'creator economy': 'independent content creators',
    'algorithm boost': 'content discoverability',
  },
  ai_hotspots: {
    'Gemini-3 / GPT-5': 'latest multimodal models',
    'new AI release': 'recent AI advancements',
    'AI breakthrough': 'rapidly evolving AI capabilities',
    'AI trend 2025': 'current AI adoption patterns',
  },
  industry_behavior: {
    healthcare: {
      'telemedicine trend': 'remote patient communication',
      'health app boom': 'digital health resources',
    },
    education: {
      'online learning surge': 'self-paced learning materials',
      'microlearning trend': 'concise educational formats',
    },
    ecommerce: {
      'live shopping trend': 'interactive product presentation',
      'AR try-on': 'product visualization',
    },
  },
  user_decision: {
    'people prefer video': 'decision support content',
    'attention span shorter': 'concise explanatory formats',
    'social proof trend': 'example-driven explanations',
  },
  seasonal: {
    '2025 marketing trend': 'seasonal planning cycles',
    'end of year trend': 'annual review periods',
    'holiday campaign': 'peak engagement periods',
  },
}

/**
 * 将热点词映射为安全词
 */
export function mapTrendToSafeTerm(
  hotTerm: string,
  category?: keyof typeof TREND_MAPPING_LEXICON
): string | null {
  // 遍历所有类别查找映射
  if (category && TREND_MAPPING_LEXICON[category]) {
    const categoryMap = TREND_MAPPING_LEXICON[category]
    if (typeof categoryMap === 'object' && hotTerm in categoryMap) {
      return (categoryMap as Record<string, string>)[hotTerm]
    }
  }
  
  // 全局搜索
  for (const [cat, map] of Object.entries(TREND_MAPPING_LEXICON)) {
    if (typeof map === 'object' && hotTerm in map) {
      return (map as Record<string, string>)[hotTerm]
    }
  }
  
  return null
}
```

---

## 🚨 禁止使用规则

### 绝对禁止在以下位置使用热点词：

1. ❌ **URL 路径**
   - `/tiktok-trend-2025` ❌
   - `/ai-video-for-social-media` ✅

2. ❌ **H1 标题**
   - `TikTok Video Trend 2025` ❌
   - `AI Video Generation for Social Media – Content Creation` ✅

3. ❌ **Meta Title / Description**
   - 避免在 SEO 元数据中使用热点词

### 可以使用映射词的位置：

1. ✅ **Answer-first 段落**
   - "Many teams now use platform-native video formats..."

2. ✅ **Examples / Scenarios**
   - "visual-first content for social platforms"
   - "high-engagement video formats"

3. ✅ **Benefits 列表**
   - "content discoverability"
   - "decision support content"

---

## 📊 检查清单

在使用趋势映射词前，确认：

- [ ] 热点词已映射为安全词
- [ ] URL 中没有热点词
- [ ] H1 中没有热点词
- [ ] 映射词只在 Answer-first / Examples 中使用
- [ ] 没有提及具体年份（如 2025）
- [ ] 没有提及具体平台名（如 TikTok）
- [ ] 没有提及具体模型名（如 Gemini-3）

---

## 💡 关键提醒

**趋势不是用来追的，是用来"被动体现"的。**

Google 要的是：
- ✅ **你本来就在这里**
- ❌ **不是：你刚刚冲过来**

**索引吃的是稳定，不是聪明。**

---

## 📚 相关文档

- `docs/TREND_LIGHT_INTEGRATION.md` - 趋势轻接入指南
- `docs/INDEX_HEALTH_DASHBOARD.md` - 索引健康仪表盘
- `docs/GEO_PRIORITY_PRODUCTION_TABLE.md` - GEO 命中率 × 索引率 双优先排产表

