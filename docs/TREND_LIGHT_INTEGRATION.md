# 趋势「轻接入」版 Prompt（不动 URL，不伤索引）

> **核心原则一句话**：  
> 不用热点词当关键词，只把"趋势信号"当修饰变量

---

## ❌ 你现在绝对不能做的

- ❌ 用「Avatar 3」「Rob Reiner」当 URL / H1
- ❌ 批量生成"热搜专题页"
- ❌ 改 sitemap 结构

👉 **这些在限速期 = 自杀**

---

## ✅ 正确姿势：Trend → Scene → 修饰层

### 🔁 映射逻辑（非常关键）

```
Google Trends
    ↓
趋势"动词 / 行为 / 场景"
    ↓
你的既有「行业 × 用例」
    ↓
只进正文，不进 URL
```

---

## 🔥 趋势轻接入 Prompt（直接可用）

```markdown
You are generating a GEO-A v2 use case page.

IMPORTANT:
- Do NOT use trending terms as primary keywords
- Do NOT change the page URL or core topic
- Use trend signals ONLY as contextual background

Trend Signal (optional context only):
- User behavior: short-form video consumption
- Platform shift: social video platforms
- Seasonal interest: end-of-year communication

Instructions:
- Keep H1 and URL focused on: [Industry] + [Use Case]
- If relevant, subtly reflect trend context in examples or scenarios
- Do NOT mention trend names, events, or celebrities
- Do NOT change page intent

The trend signal should feel like:
"this page happens to exist in 2025"
not:
"this page is chasing a hot topic"
```

---

## 🧩 举个你能立刻用的例子

### 不变的页面：

**AI Video Generation for Dental Clinics – Patient Education**

### Answer-first 里的变化（轻微）：

**Instead of long printed explanations, many clinics now use short, platform-friendly videos that patients can review before or after appointments.**

📌 **没有热点词**  
📌 **但 Google 知道你在跟趋势**

---

## 🚦 什么时候可以"稍微重一点"？

### 满足 3 个条件才行：

1. ✅ **Indexed > 5,000**
2. ✅ **Crawl stats 连续 14 天稳定**
3. ✅ **模板 ≥30 天未改**

### 👉 那时可以：

- ✅ 新增 `/insights/`（非核心目录）
- ✅ 少量趋势解释页（10–20/周）

---

## 📋 趋势映射示例

### ❌ 错误做法

**Google Trends**: "AI safety training" 上升

**❌ 错误**：
- URL: `/ai-safety-training-trend-2025`
- H1: `AI Safety Training Trend 2025`
- 内容：大量提及"trend"、"2025"、"hot topic"

### ✅ 正确做法

**Google Trends**: "AI safety training" 上升

**✅ 正确**：
- URL: `/ai-video-for-manufacturing-safety-training`（不变）
- H1: `AI Video Generation for Manufacturing – Safety Training`（不变）
- 内容：在 Answer-first 中轻微提及"Many manufacturing teams now use short, platform-friendly training videos..."

---

## 🎯 趋势信号类型

### 1. User Behavior（用户行为）

**趋势信号**：
- Short-form video consumption
- Mobile-first viewing
- Social platform engagement

**如何接入**：
- 在 Answer-first 中提及"platform-friendly videos"
- 在 Examples 中提及"short videos for social platforms"
- **不改变** URL、H1、核心主题

### 2. Platform Shift（平台迁移）

**趋势信号**：
- Social video platforms
- Vertical video format
- Creator economy

**如何接入**：
- 在 Examples 中提及"9:16 format for TikTok/Shorts"
- 在 Benefits 中提及"platform-ready formats"
- **不改变** URL、H1、核心主题

### 3. Seasonal Interest（季节性兴趣）

**趋势信号**：
- End-of-year communication
- Holiday marketing
- Q4 business planning

**如何接入**：
- 在 Scenarios 中提及"end-of-year communication"
- 在 Examples 中提及"seasonal content"
- **不改变** URL、H1、核心主题

---

## 🔧 实现方式

### 在现有 Prompt 中添加趋势信号（可选）

```typescript
// 在 buildGEOAV2Prompt 函数中添加可选参数
export function buildGEOAV2Prompt(params: {
  industry: string
  useCase: string
  // ... 其他参数
  trendSignal?: {
    type: 'user_behavior' | 'platform_shift' | 'seasonal_interest'
    description: string
  }
}): string {
  // ... 现有逻辑
  
  // 如果有趋势信号，添加到 Prompt 末尾
  if (params.trendSignal) {
    prompt += `
    
TREND SIGNAL (optional context only):
- Type: ${params.trendSignal.type}
- Description: ${params.trendSignal.description}

IMPORTANT:
- Do NOT use this trend as primary keyword
- Do NOT change URL or H1
- Only subtly reflect in examples or scenarios
- The trend should feel like "this page happens to exist in 2025"
`
  }
  
  return prompt
}
```

---

## 🧨 最重要的一句话（给你吃定心丸）

**趋势不是用来追的，是用来"被动体现"的。**

Google 要的是：
- ✅ **你本来就在这里**
- ❌ **不是：你刚刚冲过来**

---

## 📊 检查清单

在限速期，每次使用趋势信号前，确认：

- [ ] URL 没有改变
- [ ] H1 没有改变
- [ ] 核心主题没有改变
- [ ] 没有提及热点词、事件名、名人
- [ ] 趋势信号只在正文中轻微体现
- [ ] 模板稳定 ≥30 天

---

## 🚨 警告信号

如果出现以下情况，立即停止使用趋势信号：

- ⚠️ Discovered 停止增长
- ⚠️ Crawled 大量失败
- ⚠️ Indexed 停滞或回落
- ⚠️ 模板频繁改动

**👉 回到基础：只做行业 × 用例，不碰趋势**

---

## 📚 相关文档

- `docs/TREND_MAPPING_LEXICON.md` - 趋势映射词库（Anti-Hotspot 安全版）⭐
- `docs/GEO_PRIORITY_PRODUCTION_TABLE.md` - GEO 命中率 × 索引率 双优先排产表 ⭐
- `docs/INDEX_HEALTH_DASHBOARD.md` - 索引健康仪表盘
- `docs/GSC_THROTTLING_PERIOD_STRATEGY.md` - 限速期策略
- `docs/GEO_A_V2_RELEASE_SCHEDULE.md` - 发布节奏表
- `lib/prompts/geo-a-template-prompt-v2.ts` - GEO-A v2 Prompt 实现

---

## 💡 关键提醒

**你现在已经做对 80% 的人一辈子做不到的事**

接下来拼的不是技术，是克制。

**趋势不是用来追的，是用来"被动体现"的。**

