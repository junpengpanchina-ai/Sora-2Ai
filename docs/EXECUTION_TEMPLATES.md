# 执行模板（完整交付版）

> **目标**：今天就能用、直接跑起来的执行模板  
> **不是思路，是可直接落地的工具**

---

## ✅ 1️⃣ Index Health Dashboard（可直接用表格）

### 用于：每天 1 分钟判断是否该放量 / 刹车

---

### 📊 Index Health Dashboard（主表）

| 日期 | Discovered | Crawled | Indexed | ΔDiscovered | ΔCrawled | ΔIndexed | Index Health | 状态 | 行动 |
|------|------------|---------|---------|-------------|----------|----------|--------------|------|------|
| 04-01 | 25,000 | 18,000 | 14,000 | +1,200 | +800 | +600 | 56% | 🟡 | 稳定发布 |
| 04-02 | 26,300 | 18,900 | 14,600 | +1,300 | +900 | +600 | 56.1% | 🟡 | 稳定发布 |
| 04-03 | 27,800 | 20,500 | 15,000 | +1,500 | +1,600 | +400 | 52% | ⚠️ | 减速 |
| 04-04 | 28,200 | 22,200 | 15,100 | +400 | +1,700 | +100 | 44% | 🔴 | 停止 |

---

### 📐 计算公式（直接复制）

#### Google Sheets / Excel 公式

**Index Health（H 列）**：
```
=IF((B2+C2)=0,0,ROUND(D2/(B2+C2),3))
```

**ΔDiscovered（E 列）**：
```
=IF(ROW()=2,B2,B2-OFFSET(B2,-1,0))
```

**ΔCrawled（F 列）**：
```
=IF(ROW()=2,C2,C2-OFFSET(C2,-1,0))
```

**ΔIndexed（G 列）**：
```
=IF(ROW()=2,D2,D2-OFFSET(D2,-1,0))
```

**状态（I 列）**：
```
=IF(H2>=0.6,"🟢 健康",IF(H2>=0.45,"🟡 消化中",IF(H2>=0.35,"🟠 风险","🔴 危险")))
```

**行动（J 列）**：
```
=IF(H2>=0.6,"放量",IF(H2>=0.45,"稳定",IF(H2>=0.35,"降速","停止")))
```

---

### 🧭 判定规则（自动）

| Index Health | 状态 | 行动 | 每日上限 |
|--------------|------|------|----------|
| **≥ 60%** | 🟢 健康 | 放量 | 60-80 页 |
| **45–59%** | 🟡 消化中 | 稳定 | 20-40 页 |
| **35–44%** | 🟠 风险 | 降速 | 5-10 页 |
| **< 35%** | 🔴 危险 | 停止 | 0 页 |

---

### 📉 辅助指标（建议）

| 指标 | 正常 | 危险 | 计算公式 |
|------|------|------|----------|
| **ΔIndexed / ΔCrawled** | **≥ 30%** | **< 15%** | `=IF(F2=0,0,ROUND(G2/F2,3))` |
| **Crawl Requests/day** | 稳定 | 突降或暴涨 | GSC → Settings → Crawl stats |
| **Sitemap 读取** | 每日 | 超过 3 天无更新 | GSC → Sitemaps |

---

### 📋 使用说明

1. **每天固定时间**（建议：早上 9 点）
2. **打开 GSC** → Pages
3. **填写 3 个数**：Discovered、Crawled、Indexed
4. **公式自动计算**：Index Health、状态、行动
5. **对照判定规则**：决定今日发布策略

---

## ✅ 2️⃣ Purchase Intent 自动算分逻辑（伪代码）

### 用于：决定哪些页面能卖钱

---

### 🎯 Intent Score 规则

#### Step 1：基础分（按场景）

```typescript
function baseIntentScore(sceneType: string): number {
  // 3 分：明确交付任务
  if (['product-demo', 'listing', 'promo', 'recruitment', 
       'product-demo-showcase', 'advertising-promotion'].includes(sceneType)) {
    return 3
  }
  
  // 2 分：工作场景强，但不立即交付
  if (['training', 'education', 'onboarding', 'compliance',
       'education-explainer', 'ugc-creator-content'].includes(sceneType)) {
    return 2
  }
  
  // 1 分：学习/解释型
  if (['explainer', 'guide', 'what-is', 'how-to', 
       'brand-storytelling'].includes(sceneType)) {
    return 1
  }
  
  // 0 分：纯泛营销/空泛场景
  return 0
}
```

---

#### Step 2：行业权重加成

```typescript
function industryBoost(industry: string): number {
  // 高价值行业：+1 分
  if (['real estate', 'ecommerce', 'saas', 'education', 'healthcare',
       'Real Estate', 'E-commerce', 'SaaS', 'Education', 'Healthcare'].includes(industry)) {
    return 1
  }
  
  // 中等价值行业：+0.5 分
  if (['manufacturing', 'compliance', 'training', 'construction',
       'Manufacturing', 'Construction', 'Legal'].includes(industry)) {
    return 0.5
  }
  
  // 其他行业：不加分
  return 0
}
```

---

#### Step 3：最终 Intent 评分

```typescript
function calcIntentScore(sceneType: string, industry: string): 0 | 1 | 2 | 3 {
  const baseScore = baseIntentScore(sceneType)
  const boost = industryBoost(industry)
  const finalScore = baseScore + boost
  
  // 最终评分（0-3 分）
  if (finalScore >= 2.6) return 3
  if (finalScore >= 1.6) return 2
  if (finalScore >= 0.6) return 1
  return 0
}
```

---

#### Step 4：是否进入"转化层"

```typescript
function allowConversion(intentScore: number, geoScore: number): boolean {
  // 只有 Intent ≥2 且 GEO ≥80 的页面才能进入转化层
  return intentScore >= 2 && geoScore >= 80
}
```

---

### 📊 输出示例

```json
{
  "sceneType": "product-demo-showcase",
  "industry": "E-commerce",
  "baseScore": 3,
  "industryBoost": 1,
  "intentScore": 3,
  "geoScore": 87,
  "conversionAllowed": true,
  "layer": "conversion"
}
```

---

### 🔧 TypeScript 实现

```typescript
// lib/purchase-intent-calculator.ts

export type SceneType = 
  | 'product-demo-showcase'
  | 'advertising-promotion'
  | 'education-explainer'
  | 'training'
  | 'onboarding'
  | 'brand-storytelling'
  | 'ugc-creator-content'

export type PurchaseIntent = 0 | 1 | 2 | 3

export interface IntentCalculation {
  sceneType: string
  industry: string
  baseScore: number
  industryBoost: number
  intentScore: PurchaseIntent
  geoScore: number
  conversionAllowed: boolean
  layer: 'asset' | 'conversion' | 'core-sample'
}

export function baseIntentScore(sceneType: string): number {
  // 3 分：明确交付任务
  const highIntentTypes = [
    'product-demo-showcase',
    'advertising-promotion',
    'listing',
    'promo',
    'recruitment',
  ]
  
  if (highIntentTypes.some(type => sceneType.toLowerCase().includes(type))) {
    return 3
  }
  
  // 2 分：工作场景强
  const mediumIntentTypes = [
    'training',
    'education',
    'onboarding',
    'compliance',
    'education-explainer',
    'ugc-creator-content',
  ]
  
  if (mediumIntentTypes.some(type => sceneType.toLowerCase().includes(type))) {
    return 2
  }
  
  // 1 分：学习/解释型
  const lowIntentTypes = [
    'explainer',
    'guide',
    'what-is',
    'how-to',
    'brand-storytelling',
  ]
  
  if (lowIntentTypes.some(type => sceneType.toLowerCase().includes(type))) {
    return 1
  }
  
  return 0
}

export function industryBoost(industry: string): number {
  const highValueIndustries = [
    'real estate', 'ecommerce', 'saas', 'education', 'healthcare',
    'Real Estate', 'E-commerce', 'SaaS', 'Education', 'Healthcare',
  ]
  
  if (highValueIndustries.includes(industry)) {
    return 1
  }
  
  const mediumValueIndustries = [
    'manufacturing', 'compliance', 'training', 'construction',
    'Manufacturing', 'Construction', 'Legal',
  ]
  
  if (mediumValueIndustries.includes(industry)) {
    return 0.5
  }
  
  return 0
}

export function calcIntentScore(
  sceneType: string,
  industry: string
): PurchaseIntent {
  const base = baseIntentScore(sceneType)
  const boost = industryBoost(industry)
  const finalScore = base + boost
  
  if (finalScore >= 2.6) return 3
  if (finalScore >= 1.6) return 2
  if (finalScore >= 0.6) return 1
  return 0
}

export function allowConversion(
  intentScore: PurchaseIntent,
  geoScore: number
): boolean {
  return intentScore >= 2 && geoScore >= 80
}

export function calculateIntent(
  sceneType: string,
  industry: string,
  geoScore: number
): IntentCalculation {
  const baseScore = baseIntentScore(sceneType)
  const boost = industryBoost(industry)
  const intentScore = calcIntentScore(sceneType, industry)
  const conversionAllowed = allowConversion(intentScore, geoScore)
  
  let layer: 'asset' | 'conversion' | 'core-sample'
  if (intentScore >= 2 && geoScore >= 80) {
    layer = 'conversion'
  } else if (intentScore === 1) {
    layer = 'asset'
  } else {
    layer = 'asset'
  }
  
  return {
    sceneType,
    industry,
    baseScore,
    industryBoost: boost,
    intentScore,
    geoScore,
    conversionAllowed,
    layer,
  }
}
```

---

## ✅ 3️⃣ 7 天放量试运行计划表（安全版）

### 📅 Day 1–2（观察期）

| 项目 | 值 | 说明 |
|------|-----|------|
| **发布量** | **10–15 页/天** | 保守起步 |
| **内容类型** | **Intent ≥2** | 只推高价值内容 |
| **目标** | **建立 Index Health 基线** | 观察系统反应 |
| **监控** | 每天记录 3 个数 | Discovered / Crawled / Indexed |

**检查清单**：
- [ ] 每天更新 Dashboard
- [ ] 计算 Index Health
- [ ] 记录变化率指标
- [ ] 确认无异常波动

---

### 📅 Day 3–4（稳定期）

| 项目 | 值 | 说明 |
|------|-----|------|
| **发布量** | **20–30 页/天** | 稳定节奏 |
| **内容类型** | **Intent ≥2 + 少量 Intent=1** | 80% 高价值 + 20% 资产层 |
| **条件** | **Index Health ≥50%** | 必须满足才继续 |
| **监控** | 变化率指标 | 新增索引率、Crawl→Index 转化率 |

**检查清单**：
- [ ] Index Health ≥50%
- [ ] 新增索引率 ≥30%
- [ ] Crawl→Index 转化率 ≥30%
- [ ] 无异常波动

---

### 📅 Day 5–6（放量试探）

| 项目 | 值 | 说明 |
|------|-----|------|
| **发布量** | **40–60 页/天** | 试探性放量 |
| **内容类型** | **Intent ≥2** | 只推高价值内容 |
| **条件** | **Index Health ≥60%** | 必须满足才放量 |
| **监控** | 密切观察 | 每天检查 2 次 |

**检查清单**：
- [ ] Index Health ≥60%
- [ ] Crawl 稳定 3 天以上
- [ ] 新增索引率 ≥30%
- [ ] 无异常波动

---

### 📅 Day 7（评估日）

| 检查项 | 行动 | 说明 |
|--------|------|------|
| **Index Health ≥60%** | **保持节奏** | 可以继续放量 |
| **45–59%** | **降 30%** | 回到稳定期节奏 |
| **<45%** | **停止 3 天** | 观察系统恢复 |

**评估清单**：
- [ ] 计算 7 天平均 Index Health
- [ ] 计算 7 天平均新增索引率
- [ ] 计算 7 天平均 Crawl→Index 转化率
- [ ] 决定下一步策略

---

### 📊 7 天试运行记录表

| 日期 | 发布量 | Intent≥2 | Index Health | 新增索引率 | Crawl→Index | 状态 | 备注 |
|------|--------|----------|--------------|------------|-------------|------|------|
| Day 1 | 12 | 12 | | | | 🟡 | 观察期 |
| Day 2 | 15 | 15 | | | | 🟡 | 观察期 |
| Day 3 | 25 | 20 | | | | 🟡 | 稳定期 |
| Day 4 | 28 | 22 | | | | 🟡 | 稳定期 |
| Day 5 | 45 | 45 | | | | 🟢 | 放量试探 |
| Day 6 | 50 | 50 | | | | 🟢 | 放量试探 |
| Day 7 | 评估 | 评估 | | | | 📊 | 评估日 |

---

## ✅ 4️⃣ 首页信息架构（SEO + 转化共存）

### 目标：不破坏 GEO，又能自然转化

---

### 🧱 页面结构（从上到下）

#### ① Hero（不卖，只定位）

**标题**：
```
AI Video Generation for Real Business Scenarios
```

**副标题**：
```
Create structured videos for education, training, and communication.
```

**特征**：
- ✅ 不卖产品
- ✅ 只定位场景
- ✅ 不强调"AI 最强"
- ✅ 不堆卖点

---

#### ② What You Can Create（场景入口）

**标题**：
```
What You Can Create
```

**内容**（链接到 Intent ≥2 页面）：

- ✅ **Product demo videos** → `/use-cases/product-demo-showcase`
- ✅ **Training & onboarding videos** → `/use-cases/education-explainer`
- ✅ **Customer education content** → `/use-cases/education-explainer`
- ✅ **Recruitment & internal communication** → `/use-cases/ugc-creator-content`

**设计要点**：
- ✅ 每个场景都是可点击的链接
- ✅ 链接到对应的 Intent ≥2 页面
- ✅ 不直接链接到产品页

---

#### ③ How It Works（极简 3 步）

**标题**：
```
How It Works
```

**步骤**：
1. **Choose a scenario**
   - Select from industry-specific use cases
   - Preview the structure before generating

2. **Preview the generated structure**
   - See the complete video structure
   - Review the prompt and settings

3. **Customize and export**
   - Adjust details as needed
   - Export your video

**特征**：
- ✅ 极简，不超过 3 步
- ✅ 不强调技术细节
- ✅ 不卖功能

---

#### ④ Example Preview（轻展示）

**标题**：
```
Example Preview
```

**内容**：
- ✅ 1–2 个真实 Prompt 示例（非视频）
- ✅ 让用户理解"我能得到什么"
- ✅ 展示实际生成效果

**示例**：
```
Example 1: Product Demo Video
Industry: E-commerce
Scenario: Product demonstration for online store

Prompt Preview:
"Create a professional 10-second product demo video for an e-commerce store showcasing a smart home device. The video should highlight key features in a clear, engaging way suitable for social media platforms."

[Continue generating this video] ← CTA
```

---

#### ⑤ Why Teams Use This（信任区）

**标题**：
```
Why Teams Use This
```

**内容**（列表形式）：
- ✅ Reduces manual work
- ✅ Standardized output
- ✅ Easy to adapt
- ✅ Platform-ready formats

**特征**：
- ✅ 使用名词短语
- ✅ 不营销化
- ✅ 客观陈述

---

#### ⑥ CTA（弱）

**标题**：
```
Start creating your first video
```

**副标题**：
```
No credit card required
```

**按钮**：
```
Continue → [链接到场景选择页]
```

**特征**：
- ✅ 弱 CTA，不强制
- ✅ 不强调"免费试用"
- ✅ 引导到场景选择，不是注册页

---

### 🚫 首页禁忌

**绝对不要**：
- ❌ 不讲价格
- ❌ 不讲套餐
- ❌ 不强调"AI 最强"
- ❌ 不堆卖点
- ❌ 不直接链接到注册页
- ❌ 不强调"免费"

---

### 🎯 首页 SEO 优化

#### Meta 标签

**Title**：
```
AI Video Generation for Business Scenarios | Sora2
```

**Description**：
```
Create structured videos for education, training, and communication. 
Choose from industry-specific scenarios and generate professional videos 
for your business needs.
```

**特征**：
- ✅ 包含核心关键词
- ✅ 不营销化
- ✅ 客观描述

---

#### 结构化数据

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Sora2",
  "description": "AI Video Generation for Real Business Scenarios",
  "url": "https://sora2aivideos.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://sora2aivideos.com/use-cases?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

### 📊 首页转化路径设计

```
首页
  ↓
场景选择（What You Can Create）
  ↓
Intent ≥2 页面（Product demo / Training / etc.）
  ↓
Prompt Preview（80% 填好）
  ↓
Continue generating this video
  ↓
注册/登录（如果需要）
  ↓
生成视频
```

---

### 🎯 最后的战略一句话

**你不是在卖视频生成器，而是在卖"已经想好的结果"。**

---

## 📚 相关文档

- `docs/RHYTHM_CONTROLLER.md` - 节奏控制器
- `docs/COMPLETE_GEO_SEO_GUIDE.md` - 完整 GEO & SEO 指南
- `lib/purchase-intent-calculator.ts` - Purchase Intent 计算函数（待创建）

---

**最后更新**：2025-12-30  
**适用期限**：30 天内不用再改策略

