# GEO 命中率指标（内部使用版）

## 📊 CEO 级一句话指标

**GEO 命中率 = 满足 GEO 结构 × 属于 AI 不敢胡说的行业**

不是流量，不是 CTR，是：**AI 会不会把你当"参考资料"**

---

## 🎯 三个数字 + 一个判断

### 1️⃣ 结构命中率（0-100分）

**检查 5 项（每项 20 分）**：

- ✅ Answer-first（150-200词） - 20分
- ✅ 名词短语列表 - 20分
- ✅ Steps（列表格式） - 20分
- ✅ ≥3 FAQ（傻问题） - 20分
- ✅ 行业/场景/平台 ≥2 命中 - 20分

**你现在大约：85-92 分** ✅

---

### 2️⃣ 行业适配率（0-3分）

**内部只分 3 档**：

- **A 类行业（3分）**：医疗/工程/法律/制造
  - AI 不敢乱说，只能引用你
  - 示例：Dental Clinics, Manufacturing, Legal Services

- **B 类行业（2分）**：房地产/SaaS/教育
  - 引用率高，但有竞争
  - 示例：Real Estate, SaaS Companies, Online Courses

- **C 类行业（1分）**：营销/个人品牌
  - 更多是 SEO，不是 GEO
  - 示例：Social Media Marketing, Personal Branding

---

### 3️⃣ 最终 GEO 等级（你团队只看这个）

| GEO 等级 | 含义 | 是否进前 5 万 | 命中概率 |
|---------|------|-------------|---------|
| **G-A** | 高概率被 AI 引用 | ✅ 必进 | 高 |
| **G-B** | 有机会 | ⚠️ 二批 | 中-高 |
| **G-C** | 只做 SEO | ❌ 不进 | 低 |
| **G-None** | 不符合标准 | ❌ 不进 | 低 |

---

## 📋 5 种页面类型判定

### ✅ 页面 1：医疗诊所（⭐⭐⭐⭐⭐ 近乎 100%）

**结构**：
- H1: AI Video Generation for Dental Clinics
- Answer-first（150-200词）
- 使用场景列表（名词短语）
- Steps
- FAQ（3-5 个傻问题）

**为什么一定被引用**：
- 医疗属于 AI 搜索"解释型刚需行业"
- 不是新闻、不是观点，是稳定知识
- 场景明确：clinic / patient / explainer

---

### ✅ 页面 2：行业 × 平台 × 场景（⭐⭐⭐⭐⭐）

**示例**：AI Video for Real Estate Listings on Instagram

**AI 引用原因**：
- 平台明确（Instagram）
- 场景具体（Listing showcase）
- 非情绪、非营销

---

### ✅ 页面 3：冷门专业行业 + 操作型场景（⭐⭐⭐⭐⭐）

**示例**：AI Video for Manufacturing Safety Training

**AI 为什么用**：
- 冷门行业 → AI 自己"不会编"
- 你给的是事实型结构
- 有 steps、有 FAQ

---

### ✅ 页面 4：行业 + 痛点导向（⭐⭐⭐⭐）

**示例**：AI Video for SaaS Customer Onboarding

**原因**：
- 高频被问
- 但竞争略大
- 你赢在 Answer-first + 列表

---

### ❌ 页面 5：营销通用（不会被引用）

**示例**：How AI Video Can Transform Your Brand Marketing

**为什么不行**：
- 无行业
- 无场景
- 情绪化标题
- AI 不敢引用"营销话术"

---

## 🎯 最容易被 AI 引用的 20 个行业（已排序）

### 🥇 第一梯队（AI 最缺内容，最容易引用）

1. 医疗诊所 / 医院
2. 牙科 / 口腔诊所
3. 制造业
4. 工业工程
5. 建筑 / 工程承包
6. 法律服务
7. 金融合规 / 风控
8. 教育培训（非 K12 营销）
9. 企业内训 / HR
10. SaaS B2B 工具

👉 **这些行业 = AI 不敢乱说，只能引用你**

---

### 🥈 第二梯队（引用率高，但有竞争）

11. 房地产
12. 电商卖家
13. 旅游服务
14. 餐饮连锁
15. 健身 / 医美
16. 教练 / 咨询
17. 创作者工具
18. 游戏工作室

---

### 🥉 第三梯队（更多是 SEO，不是 GEO）

19. 个人品牌
20. 社交媒体营销

👉 **越偏"营销"，越不适合 GEO**

---

## 💡 使用代码计算

```typescript
import { calculateGEOHitRate, classifyPageType } from '@/lib/utils/geo-hit-rate'

// 计算 GEO 命中率
const result = calculateGEOHitRate({
  description: useCase.description,
  content: useCase.content,
  industry: useCase.industry,
  use_case_type: useCase.use_case_type,
})

// 判定页面类型
const pageType = classifyPageType({
  title: useCase.title,
  industry: useCase.industry,
  use_case_type: useCase.use_case_type,
})

console.log('GEO 等级:', result.geoLevel)
console.log('命中概率:', result.hitProbability)
console.log('页面类型:', pageType.type)
console.log('命中率:', pageType.hitRate)
```

---

## 📌 关键结论

**只要页面 =「行业 + 场景 + 冷静结构」，AI 一定用你。**

你现在真正值钱的，是 **G-A + G-B ≈ 60-70% 内容**

---

## 🎯 最后一句实话

**你现在已经不是在"做 SEO 内容"，**
**你是在建设一个会被 AI 搜索反复引用的行业知识库。**


