# GEO-A v2 业务整合策略（从"发布内容"转向"经营资产"）

> **核心转变**：将思维从"快速填满网站"转为"精心培育每一篇已发布内容，使其成为高价值的SEO资产"  
> **当前阶段**：信任建立期（黄金期）  
> **核心矛盾**：生成能力（每天数万条）远大于 Google 的安全收录速度（每天20-40页）

---

## 🎯 策略核心：从"发布内容"转向"经营资产"

### 当前阶段定位

**你正处于黄金的"信任建立期"**

**核心矛盾**：
- ✅ 你的生成能力：每天数万条
- ⚠️ Google 的安全收录速度：每天20-40页

**关键转变**：
- ❌ 从"快速填满网站"
- ✅ 转为"精心培育每一篇已发布内容，使其成为高价值的SEO资产"

👉 **这与"构建场景词库作为核心壁垒"一脉相承**

---

## 💡 结合业务的三个关键执行点

### 1️⃣ 用"商业价值"反推"发布优先级"

#### 问题

在 A 类行业中，先发哪篇？后发哪篇？

#### 行动

在决定每天发布哪 20-40 篇时，加入商业价值判断。

**优先发布那些**：

1. ✅ **客户画像明确**的用例
   - 例如："Construction Project Managers"
   - 例如："Healthcare Compliance Officers"
   - 例如："Finance Product Managers"

2. ✅ **易于展示视频效果**的用例
   - 例如："Safety Training Demo"
   - 例如："Product Demonstration"
   - 例如："Process Explanation"
   - **方便你后续嵌入 Sora2/Veo 的生成案例**

3. ✅ **付费意愿强的行业细分**
   - Healthcare 合规培训
   - Finance 产品解说
   - Manufacturing 安全培训
   - Legal 流程说明

#### 目的

确保有限的收录名额，优先给未来最能带来付费客户的内容。

---

### 2️⃣ 强化"核心样本层"的引导与转化设计

#### 问题

`/core-use-cases/` 下的 50-100 篇精品，除了给 Google 看，如何给用户看？

#### 行动

将这些核心页面，设计成你网站的 **"展示窗"** 和 **"引流钩"**。

**设计要点**：

1. ✅ **自然嵌入最精彩的 AI 生成视频示例**
   - 用你成本极低的 Sora2 视频即可
   - 展示实际生成效果
   - 增强用户信任

2. ✅ **在侧边栏或文末，加入清晰的引导**

   **示例引导文案**：
   ```
   想为您的 [行业] 定制一个这样的视频？
   → 免费试用 Sora2
   
   查看更多 [细分场景] 案例
   → 查看相关用例合集
   ```

3. ✅ **链接至转化入口**
   - 免费试用注册页
   - 相关用例合集
   - 行业专属案例库

#### 目的

直接将这些 SEO 资产转化为营销触点和转化入口。

---

### 3️⃣ 将"趋势映射"能力产品化

#### 问题

如何安全地利用趋势？

#### 行动

将指南中的"趋势映射法"固化到你的场景词生成流程中。

**示例**：当监测到"供应链可视化"热度上升时

**❌ 不要生成**：
- `/trends/supply-chain-visualization-2025`
- `/hot-topics/supply-chain-trend`

**✅ 应该生成**：
- `AI Video for Manufacturing Supply Chain Training`
- `AI Video for Logistics Process Explanation`
- `AI Video for Warehouse Operations Training`

#### 目的

让你的海量场景词库具备：
- ✅ **热点免疫力**
- ✅ **持续时效性**
- ✅ **规模化竞争优势**

---

## ⚙️ 落地整合：更新你的工作流

### 1. 在生成指令前加"过滤器"

#### 实现方式

运行生成任务前，先用脚本或简单判断，确保当天的关键词组合 `{行业} + {用例}` 符合：

- ✅ **A 类优先原则**
- ❌ **避开 C 类行业**

#### 代码示例

```typescript
// lib/content-priority-filter.ts

const A_CLASS_INDUSTRIES = [
  'Healthcare',
  'Manufacturing',
  'Legal',
  'Engineering',
  'Construction',
  'Education',
  'Finance',
  'Real Estate',
]

const C_CLASS_INDUSTRIES = [
  'Marketing & Advertising',
  'Social Media',
  'Entertainment',
  'Fashion & Beauty',
  'Gaming',
]

export function shouldGenerate(industry: string, useCase: string): {
  shouldGenerate: boolean
  priority: 'high' | 'medium' | 'low'
  reason: string
} {
  // A 类行业 = 高优先级
  if (A_CLASS_INDUSTRIES.includes(industry)) {
    return {
      shouldGenerate: true,
      priority: 'high',
      reason: 'A 类行业，优先发布',
    }
  }
  
  // C 类行业 = 禁止
  if (C_CLASS_INDUSTRIES.includes(industry)) {
    return {
      shouldGenerate: false,
      priority: 'low',
      reason: 'C 类行业，禁止发布',
    }
  }
  
  // 其他 = 中等优先级
  return {
    shouldGenerate: true,
    priority: 'medium',
    reason: 'B 类行业，可发布',
  }
}
```

---

### 2. 为内容打上"价值标签"

#### 实现方式

生成内容时，可让 AI 在元数据中自动标记预估的"商业价值等级"（高/中/低）。

#### 价值标签判断标准

| 标签 | 标准 | 说明 |
|------|------|------|
| **高** | A 类行业 + 客户画像明确 + 易于展示 | 优先发布，重点维护 |
| **中** | A 类行业 + 一般用例 | 正常发布 |
| **低** | B 类行业或边缘用例 | 可发布，但不优先 |

#### 数据库字段建议

```sql
-- 在 use_cases 表中添加字段
ALTER TABLE use_cases ADD COLUMN business_value VARCHAR(10) DEFAULT 'medium';
-- 可选值：'high', 'medium', 'low'

ALTER TABLE use_cases ADD COLUMN customer_profile TEXT;
-- 客户画像描述

ALTER TABLE use_cases ADD COLUMN video_demo_ready BOOLEAN DEFAULT false;
-- 是否已准备好视频示例
```

---

### 3. 监控与你的业务指标挂钩

#### 除了 GSC 的三个数，增加你自己的看板

**观察指标**：

1. ✅ **核心样本层页面的用户停留时间**
   - 目标：> 2 分钟
   - 说明：内容质量高，用户感兴趣

2. ✅ **从这些页面到试用注册页的点击率**
   - 目标：> 5%
   - 说明：内容能有效引导转化

3. ✅ **核心页面的跳出率**
   - 目标：< 60%
   - 说明：内容匹配用户需求

#### 实现方式

```typescript
// lib/business-metrics.ts

export interface BusinessMetrics {
  corePageViews: number
  corePageAvgTime: number // 秒
  corePageBounceRate: number // 百分比
  corePageToTrialCTR: number // 百分比
  highValuePageViews: number
  highValuePageConversions: number
}

export function calculateBusinessHealth(metrics: BusinessMetrics): {
  score: number
  status: 'excellent' | 'good' | 'needs-improvement'
  recommendations: string[]
} {
  const recommendations: string[] = []
  let score = 0
  
  // 停留时间评分
  if (metrics.corePageAvgTime > 120) {
    score += 30
  } else if (metrics.corePageAvgTime > 60) {
    score += 20
    recommendations.push('提升核心页面停留时间')
  } else {
    score += 10
    recommendations.push('核心页面内容需要优化')
  }
  
  // 转化率评分
  if (metrics.corePageToTrialCTR > 0.05) {
    score += 40
  } else if (metrics.corePageToTrialCTR > 0.02) {
    score += 25
    recommendations.push('优化核心页面到试用页的引导')
  } else {
    score += 10
    recommendations.push('核心页面转化率需要提升')
  }
  
  // 跳出率评分
  if (metrics.corePageBounceRate < 0.6) {
    score += 30
  } else if (metrics.corePageBounceRate < 0.8) {
    score += 20
    recommendations.push('降低核心页面跳出率')
  } else {
    score += 10
    recommendations.push('核心页面内容匹配度需要提升')
  }
  
  let status: 'excellent' | 'good' | 'needs-improvement'
  if (score >= 80) {
    status = 'excellent'
  } else if (score >= 60) {
    status = 'good'
  } else {
    status = 'needs-improvement'
  }
  
  return { score, status, recommendations }
}
```

---

## 📊 业务整合排产表（更新版）

### 优先级计算（加入商业价值）

```
最终优先级 = GEO 分数 × Index Health × 商业价值权重
```

### 商业价值权重

| 商业价值 | 权重 | 说明 |
|---------|------|------|
| **高** | 1.5 | 客户画像明确 + 易于展示 + 付费意愿强 |
| **中** | 1.0 | A 类行业标准用例 |
| **低** | 0.7 | B 类行业或边缘用例 |

### 更新后的排产矩阵

| GEO | Index Health | Trend Pressure | 商业价值 | 行动 | 每日限制 |
|-----|--------------|----------------|----------|------|----------|
| **G-A** | **≥60%** | **≤2** | **高** | ✅ **放量** | 50 页 |
| **G-A** | **40–59%** | **0–1** | **高** | ✅ **稳定** | 30 页 |
| **G-A** | **40–59%** | **0–1** | **中** | ✅ **稳定** | 20 页 |
| **G-A** | **40–59%** | **2** | **高** | ⚠️ **减速** | 15 页 |
| **G-A** | **<40%** | **0** | **高** | ⚠️ **样本** | 5 页 |

---

## 🎨 核心样本层页面设计模板

### 页面结构建议

```
H1: AI Video Generation for [Industry] – [Use Case]

[Answer-first 段落]
[包含行业痛点、解决方案说明]

[视频示例区域] ⭐ 新增
- 嵌入 1-2 个 Sora2 生成的视频示例
- 展示实际效果
- 增强用户信任

[Use Cases 列表]
[Benefits]
[FAQ]

[转化引导区域] ⭐ 新增
- "想为您的 [行业] 定制一个这样的视频？"
- CTA 按钮：免费试用 Sora2
- 链接：查看更多 [细分场景] 案例
```

### 转化引导组件示例

```tsx
// components/CoreUseCaseCTA.tsx

export function CoreUseCaseCTA({ industry, useCase }: {
  industry: string
  useCase: string
}) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg my-8">
      <h3 className="text-xl font-semibold mb-4">
        想为您的 {industry} 定制一个这样的视频？
      </h3>
      <p className="text-gray-700 mb-4">
        使用 Sora2 AI 视频生成平台，为您的 {useCase} 场景创建专业视频。
      </p>
      <div className="flex gap-4">
        <a
          href="/auth/signup"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          免费试用 Sora2
        </a>
        <a
          href={`/use-cases?industry=${encodeURIComponent(industry)}`}
          className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50"
        >
          查看更多 {industry} 案例
        </a>
      </div>
    </div>
  )
}
```

---

## 📋 每日工作流（业务整合版）

### Step 1：商业价值筛选（5 分钟）

1. 打开待发布内容列表
2. 按商业价值排序（高 → 中 → 低）
3. 优先选择：
   - 客户画像明确
   - 易于展示视频效果
   - 付费意愿强的行业细分

### Step 2：GEO × Index 排产（3 分钟）

1. 查看当前 Index Health
2. 对照排产矩阵
3. 确定今日发布量（20-40 页）
4. 从高商业价值内容中选择

### Step 3：内容生成与发布（按正常流程）

1. 使用批量 SGE Prompt 生成
2. 质量自检
3. 发布到网站

### Step 4：核心页面优化（每周一次）

1. 检查核心样本层页面（/core-use-cases/）
2. 确保已嵌入视频示例
3. 检查转化引导是否清晰
4. 监控业务指标（停留时间、转化率）

---

## 📊 业务指标看板

### 核心指标（每周检查）

| 指标 | 目标值 | 当前值 | 状态 |
|------|--------|--------|------|
| 核心页面平均停留时间 | > 2 分钟 | | |
| 核心页面到试用页 CTR | > 5% | | |
| 核心页面跳出率 | < 60% | | |
| 高价值页面浏览量 | 持续增长 | | |
| 高价值页面转化数 | 持续增长 | | |

---

## 🎯 总结：你的路线图

### 当前阶段

**用极具成本优势的生成能力，建造一个结构稳健、内容精准的"内容仓库"**

### Google 的角色

**Google 就是这个仓库的"质检员和搬运工"，它的节奏决定了你的上限**

### 你的任务

1. ✅ **提供最优质、最对路的"货品"**（A 类行业内容）
2. ✅ **设计好仓库里的"展示窗和通道"**（核心层与内链）
3. ✅ **静待流量和客户自然到来**

---

## 💡 关键提醒

### 三句话

1. **有限的收录名额，优先给未来最能带来付费客户的内容**
2. **将 SEO 资产转化为营销触点和转化入口**
3. **让你的海量场景词库具备热点免疫力和持续时效性**

### 核心原则

**你现在不是在"发布内容"，而是在"经营资产"**

**每一篇已发布的内容，都应该成为：**
- ✅ 高价值的 SEO 资产
- ✅ 有效的营销触点
- ✅ 清晰的转化入口

---

## 📚 相关文档

- `docs/COMPLETE_STRATEGY_GUIDE.md` - 完整策略指南
- `docs/GEO_INDEX_AUTO_PRODUCTION_TABLE.md` - GEO × Index Health 自动排产表
- `docs/INDEX_HEALTH_DASHBOARD_SHEETS.md` - Index Health Dashboard（表格版）

---

**最后更新**：2025-12-30  
**适用期限**：30 天内不用再改策略

