# GEO 和 SEO 统一策略

## 🎯 核心原则

**一句话总结：**
- **GEO = Generative Engine Optimization**（生成式引擎优化）- 让AI搜索引用你的内容
- **SEO = Search Engine Optimization**（搜索引擎优化）- 让Google排名你的内容
- **共用同一套页面，双收益**

## 📋 GEO 的双重含义（代码中的使用）

### 1. 地理位置参数（geo parameter）
- **用途**：Google Trends API、批量生成任务记录
- **代码位置**：
  - `app/api/trends/route.ts` - 获取不同地区的趋势数据
  - `batch_generation_tasks.geo` - 记录生成任务的地区
  - `middleware.ts` - 语言检测（国际SEO）

### 2. Generative Engine Optimization（内容优化策略）
- **用途**：优化内容结构，让AI搜索能直接引用
- **实现方式**：内容生成时遵循GEO 5条标准

## ✅ SEO + GEO 共用页面结构

### 标准结构（你已经在做）

```
页面顶部（GEO优先区 - AI最爱）
├─ H1: Industry + Use Case + AI Video
├─ 150-200词明确答案
│  ├─ 明确行业
│  ├─ 明确使用场景
│  └─ 明确解决问题
│
页面中部（SEO主体区 - Google最爱）
├─ 行业背景
├─ 详细说明
├─ 扩展场景
└─ 自然融关键词
│
页面下部（GEO强化区 - AI二次抓取）
├─ How to / Steps
└─ FAQ（至少3个）
```

## 🔥 GEO 5条最低标准（内容生成时必须满足）

### ✅ GEO-1：页面开头给答案（150-200词，可引用句式）

**强制模板（LLM最爱）：**
```
In [industry], AI-generated videos are commonly used for [use case].
Typical applications include:
- [noun phrase 1]
- [noun phrase 2]
- [noun phrase 3]

This page explains how teams use AI video tools for this purpose,
which platforms are most suitable, and practical steps to get started.
```

**关键点：**
- 定义 + 列表 + 总结结构
- 使用名词短语，不是营销句
- 150-200词明确答案区

### ✅ GEO-2：必须有可引用列表（名词短语，非营销句）

**✅ 正确示例（AI最爱）：**
- "Product demo videos"
- "Onboarding explainer clips"
- "Social media short-form ads"
- "Client testimonial videos"

**❌ 错误示例（AI不引用）：**
- "Boost your brand visibility"
- "Increase engagement dramatically"
- "Drive conversions effectively"

**关键点：**
- AI引用偏向"百科式表达"，不是营销copy
- 使用名词短语，清晰直接

### ✅ GEO-3：必须有 How to / Steps
```
How to create AI videos for this use case:
1. [action]
2. [action]
3. [action]
```

**关键点：**
- 清晰、可执行的步骤
- AI Overview特别喜欢步骤型内容

### ✅ GEO-4：至少3个FAQ（"傻问题化"）

**FAQ必须回答非专家会问的问题：**

✅ 好问题：
- "Is AI video suitable for small clinics?"
- "Do I need filming equipment?"
- "Which platform works best for this industry?"

❌ 差问题：
- "Why is our platform the best?"
- "How can we maximize ROI?"

**关键点：**
- 问题清晰、直接
- 回答2-4句
- 不要营销话术
- AI Overview特别喜欢这种问题

### ✅ GEO-5：行业 + 场景 + 平台至少命中2个
- 用在哪个行业？
- 什么场景？
- 哪个平台？

**关键点：**
- 必须明确回答至少2个维度
- 这是GEO内容的核心特征

## 📊 你现在的110,515条内容分层

### 🟢 Tier 1（GEO核心池）≈ 40%
- **内容类型**：Industry × Scene × Platform
- **特征**：满足GEO 5条标准
- **处理**：优先进入前5万抓取，sitemap单独一组

### 🟡 Tier 2（GEO潜力池）≈ 35%
- **内容类型**：行业 + 场景，但结构稍弱
- **处理**：轻改结构（加列表、加FAQ、加Steps）

### 🔵 Tier 3（SEO辅助池）≈ 25%
- **内容类型**：泛内容、博客、教程
- **处理**：给Google，不指望AI引用

## 🚫 不进前5万的5类页面

1. ❌ 纯"是什么"页面（无场景）
2. ❌ 无行业指向的通用营销页
3. ❌ 赌博/灰产/合规风险行业
4. ❌ 内容极短/重复率高的页
5. ❌ 强时效/新闻类内容

## 💻 代码实现（保持简单）

### 当前实现
- ✅ `geo` 参数用于Google Trends和任务记录（保持不变）
- ✅ 批量生成时选择地区（用于趋势数据参考）
- ✅ 场景配置已简化（按场景应用配置模型）

### 不需要做的
- ❌ 不需要新的GEO配置表
- ❌ 不需要新的API
- ❌ 不需要新的数据库字段

### 需要做的（内容层面）
- ✅ 内容生成时遵循GEO 5条标准
- ✅ 批量生成的内容自动包含列表、Steps、FAQ
- ✅ 页面结构优化（已在use case页面实现）

## 🎯 给工程/内容团队的一句话

**We use one page for both SEO and GEO.**
- Top section optimized for LLM citation (GEO)
- Middle for SEO depth (Google)
- Bottom for FAQ and steps (GEO reinforcement)
- No duplicated pages, no new systems needed.

**GEO is a content strategy, not an engineering problem.**

## ✅ 最终执行 Checklist

### 内容生成必须满足
- ✅ 150–200 词答案区（行业 + 场景，使用可引用句式）
- ✅ 至少 1 个可引用列表（名词短语，非营销句）
- ✅ 明确 How-to Steps
- ✅ ≥3 个 FAQ（非营销，"傻问题化"）
- ✅ 行业 / 场景 / 平台 命中 ≥2

### 工程必须坚持
- ✅ 不新增 GEO 表
- ✅ 不新增 GEO API
- ✅ geo 继续只做地理参数
- ✅ GEO 逻辑只存在于 prompt & 页面结构

### SEO / GEO 共用
- ✅ 同一 URL
- ✅ 同一 canonical
- ✅ 同一 sitemap（仅分组，不分站）

## 🎯 核心认知

**你现在做的不是"SEO 优化"，**
**而是在给未来 2–3 年的 AI 搜索构建"可引用内容库"。**

这是平台级思维，不是工具站思维。

## 📌 关键结论

1. **SEO和GEO共用同一套页面** ✅
2. **你现在的"行业 × 场景 × 平台"内容天生适合GEO** ✅
3. **不需要新系统，只需要优化内容结构** ✅
4. **保持代码简单，GEO是内容策略，不是工程问题** ✅

