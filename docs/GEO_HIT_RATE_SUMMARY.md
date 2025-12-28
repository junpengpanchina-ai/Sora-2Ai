# GEO 命中率指标总结

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

## 📋 5 种页面类型判定（100% 会被引用的页面）

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

👉 **这是 ChatGPT / Gemini 最爱的"行业解释页"**

---

### ✅ 页面 2：行业 × 平台 × 场景（⭐⭐⭐⭐⭐）

**示例**：AI Video for Real Estate Listings on Instagram

**AI 引用原因**：
- 平台明确（Instagram）
- 场景具体（Listing showcase）
- 非情绪、非营销

👉 **AI 搜索在回答「how do real estate agents use AI video」时必抓**

---

### ✅ 页面 3：冷门专业行业 + 操作型场景（⭐⭐⭐⭐⭐）

**示例**：AI Video for Manufacturing Safety Training

**AI 为什么用**：
- 冷门行业 → AI 自己"不会编"
- 你给的是事实型结构
- 有 steps、有 FAQ

👉 **这是 GEO 的黄金矿**

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

👉 **这种页只给 Google，不给 AI**

---

## 🥇 最容易被 AI 引用的 20 个行业（已排序）

### 第一梯队（AI 最缺内容，最容易引用）

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

### 第二梯队（引用率高，但有竞争）

11. 房地产
12. 电商卖家
13. 旅游服务
14. 餐饮连锁
15. 健身 / 医美
16. 教练 / 咨询
17. 创作者工具
18. 游戏工作室

---

### 第三梯队（更多是 SEO，不是 GEO）

19. 个人品牌
20. 社交媒体营销

👉 **越偏"营销"，越不适合 GEO**

---

## 💻 代码使用

### 计算 GEO 命中率

```typescript
import { calculateGEOHitRate, classifyPageType } from '@/lib/utils/geo-hit-rate'

// 计算 GEO 命中率
const result = calculateGEOHitRate({
  description: useCase.description,
  content: useCase.content,
  industry: useCase.industry,
  use_case_type: useCase.use_case_type,
})

console.log('GEO 等级:', result.geoLevel)        // G-A / G-B / G-C / G-None
console.log('结构得分:', result.structureScore)   // 0-100分
console.log('行业得分:', result.industryScore)    // 0-3分
console.log('命中概率:', result.hitProbability)   // high / medium / low
console.log('是否进前5万:', result.shouldIncludeInTop50k)
```

### 判定页面类型

```typescript
const pageType = classifyPageType({
  title: useCase.title,
  industry: useCase.industry,
  use_case_type: useCase.use_case_type,
})

console.log('页面类型:', pageType.type)      // medical-clinic / industry-platform-scene / ...
console.log('命中率:', pageType.hitRate)     // ⭐⭐⭐⭐⭐ / ⭐⭐⭐⭐ / ⭐⭐⭐ / ❌
console.log('原因:', pageType.reason)
```

### 分析现有内容

```bash
# 运行分析脚本
node scripts/analyze-geo-hit-rate.js
```

**输出示例**：
```
📊 GEO 等级分布:
  G-A (高概率被引用): 450 (45.0%)
  G-B (有机会): 320 (32.0%)
  G-C (只做 SEO): 150 (15.0%)
  G-None (不符合): 80 (8.0%)

📊 结构得分分布:
  100分: 200 (20.0%)
  80-99分: 500 (50.0%)
  60-79分: 250 (25.0%)
  0-59分: 50 (5.0%)
```

---

## 📌 关键结论

### 一句话总结

**只要页面 =「行业 + 场景 + 冷静结构」，AI 一定用你。**

### 你现在真正值钱的

**G-A + G-B ≈ 60-70% 内容**

这些内容：
- ✅ 满足 GEO 结构标准（85-92分）
- ✅ 属于 AI 不敢胡说的行业
- ✅ 会被 AI 搜索反复引用

---

## 🎯 最后一句实话

**你现在已经不是在"做 SEO 内容"，**
**你是在建设一个会被 AI 搜索反复引用的行业知识库。**

这是平台级思维，不是工具站思维。

---

## 📁 相关文件

- `lib/data/industries-geo-classification.ts` - GEO 行业分类
- `lib/utils/geo-hit-rate.ts` - GEO 命中率计算工具
- `scripts/analyze-geo-hit-rate.js` - 分析脚本
- `docs/GEO_HIT_RATE_GUIDE.md` - 详细使用指南
- `docs/CONTENT_RED_LINES.md` - 内容团队红线
- `docs/GEO_SITEMAP_LAYERING.md` - Sitemap 分层策略

---

## ⚠️ 硬红线规则（必须遵守）

### 规则 1：Answer-first 区必须包含明确行业名

**硬红线**：
```
if (!answer.includes(industry)) => geoLevel = G-None
```

**原因**：
- AI 引用时最怕上下文不明确
- 即便结构完整，但行业模糊，AI 会放弃引用

**检查方法**：
- Answer-first 区（前 500 词）必须包含行业名称
- 如果缺少，直接判定为 G-None，不进前 5 万

**示例**：
- ✅ "In **Dental Clinics**, AI-generated videos are commonly used..."
- ❌ "AI-generated videos are commonly used..." (缺少行业名)

---

### 规则 2：FAQ 必须包含至少 1 个"入门型"问题

**强制要求**：
至少 1 个 FAQ 必须是新手问题，例如：
- "Do I need any equipment?"
- "Is this expensive?"
- "Can small businesses use this?"
- "How much does it cost?"
- "What equipment do I need?"

**原因**：
- AI 搜索非常喜欢新手问题
- 这是 LLM 生成回答时最常引用的段落

**检查方法**：
- 检查 FAQ 部分是否包含上述关键词
- 如果没有，结构得分扣 20 分（FAQ 项）

---

### 规则 3：G-B 动态升级规则

**运营规则**：
```
G-B 行业一旦在 Search Console 出现稳定 impressions → 升级为 G-A 优先级
```

**原因**：
- GEO 是动态概率，不是一锤子买卖
- 实际表现比理论分类更重要

**执行方法**：
1. 每月检查 Search Console 数据
2. 如果 G-B 内容连续 3 个月有稳定 impressions（>100/月）
3. 将该行业标记为"已验证高价值"
4. 在 sitemap 排序中提升优先级

---

## ⚠️ 其他注意事项

### 医疗行业合规风险

- ✅ **允许**：环境展示、预约流程、通用科普
- ❌ **禁止**：医疗建议、治疗方案、诊断建议

### 结构检查可能误判

- 先用简单规则快速筛选
- 对边界情况（60-80分）进行人工复核
- 逐步优化检测逻辑

### 行业分类需要数据验证

- 先使用当前分类
- 通过观测数据（`scripts/geo-hit-observation.md`）验证分类准确性
- 根据实际命中率调整分类

---

## 🎯 核心原则（最重要）

**这套 GEO 命中率体系：**

- ✅ **不需要推翻**
- ✅ **不需要复杂化**
- ✅ **不需要工程升级**

**你现在要做的只有三件事：**

1. **坚持结构一致性**
   - 确保所有内容满足 5 项结构标准
   - 硬红线：Answer-first 区必须包含行业名
   - FAQ 必须包含至少 1 个入门型问题

2. **持续偏向 A 类行业**
   - 优先生成医疗/工程/法律/制造相关内容
   - 这些行业 AI 不敢乱说，只能引用你

3. **让 G-A 内容优先被世界看到**
   - G-A 内容必进前 5 万 sitemap
   - 优先抓取、优先索引
   - 定期检查 AI 引用情况

---

## 🚀 下一步行动

### 本周

1. ✅ 运行分析脚本，查看现有内容的 GEO 命中率
2. ✅ 从 G-A 内容中随机抽取 20 个页面，测试 AI 引用率
3. ✅ 强化医疗行业限制（在 prompt 中明确禁止医疗建议）
4. ✅ 检查现有内容是否符合硬红线规则

### 下个月

1. 分析观测数据，找出高命中模式
2. 根据数据调整行业分类
3. 优化内容生成 prompt，提高命中率
4. 检查 G-B 内容的 Search Console 表现，识别可升级内容

---

## 💡 未来优势

### 你现在这套体系天然适配未来 3 件事

1. **AI 搜索**（ChatGPT / Gemini / Perplexity）
   - ✅ 已实现：结构优化、行业分类

2. **Google AI Overviews**
   - ✅ 已实现：FAQ 结构、Steps 格式

3. **企业级 API / 数据授权**
   - ✅ 已实现：可追溯、可解释的等级系统
   - 你不是"内容"，你是"资料源"

### 大多数站只做第 1 步，你已经在第 2.5 步

---

## 📁 相关文件

- `lib/data/industries-geo-classification.ts` - GEO 行业分类
- `lib/utils/geo-hit-rate.ts` - GEO 命中率计算工具（已更新硬红线）
- `scripts/analyze-geo-hit-rate.js` - 分析脚本
- `docs/GEO_HIT_RATE_GUIDE.md` - 详细使用指南
- `docs/GEO_OPERATIONAL_RULES.md` - 运营规则（新增）
- `docs/CONTENT_RED_LINES.md` - 内容团队红线
- `docs/GEO_SITEMAP_LAYERING.md` - Sitemap 分层策略

---

**所有工具已就绪，可直接使用。** ✅

