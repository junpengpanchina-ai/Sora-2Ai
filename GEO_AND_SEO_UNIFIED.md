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
- ✅ **补强 1**：在 Answer-first 后添加 Authoritativeness 锚点（知识库说明）
- ✅ **补强 2**：FAQ 必须包含 ≥1 FAQ-A（新手认知）+ ≥1 FAQ-B（决策边界）
- ✅ **补强 3**：每个 Industry 固定添加 "Industry Constraints" 段（2-3 句）
- ✅ **补强 4**：建立 Industry 级别的差异化内链策略

## 🎯 给工程/内容团队的一句话

**We use one page for both SEO and GEO.**
- Top section optimized for LLM citation (GEO)
- Middle for SEO depth (Google)
- Bottom for FAQ and steps (GEO reinforcement)
- No duplicated pages, no new systems needed.

**GEO is a content strategy, not an engineering problem.**

## 🛡️ 必须补的 4 个护城河细节（加固策略）

> **不是推翻，是加固。**  
> **不补这 4 个，你会慢；补了，你会慢但不可替代。**

### 🔧 补强 1：给 AI 一个"你是谁"的稳定锚点（Authoritativeness）

**问题**：AI 知道"这段内容好"，但还不够知道"这是谁的内容"。

**解决方案**：在页面极靠前（Answer-first 段落之后，但不营销）加一句：

```
This page is part of a structured knowledge base on AI video use cases, 
covering over X industries and Y scenarios.
```

**放置位置**：
- 在 Answer-first 段落（GEO-1）之后
- 在 "Why This Matters" 之前
- 1-2 句话，不营销，纯事实陈述

**意义**：
- 告诉 AI：这是系统性知识库，不是孤立页面
- 这是 GEO 的 E-E-A-T 版本（Experience, Expertise, Authoritativeness, Trustworthiness）
- 增强 AI 对内容来源的信任度

**实现方式**：
- 在 prompt 模板中固定添加
- X 和 Y 可以是动态数字（基于实际数据）
- 或者使用固定表述："covering multiple industries and scenarios"

---

### 🔧 补强 2：FAQ 的"问题类型分层"（非常重要）

**当前状态**：FAQ 是对的，但可以再进化一层。

**解决方案**：把 FAQ 分成两类（不用明写，只在 prompt 里控制）：

#### FAQ-A（新手认知类）

**目标**：回答非专家会问的基础问题

**示例**：
- "Is AI video suitable for small clinics?"
- "Do I need filming equipment?"
- "Is this expensive?"
- "Can small teams use this?"

**特征**：
- 新手友好
- 降低使用门槛
- AI Overview 经常引用

#### FAQ-B（决策边界类）

**目标**：帮助用户判断何时使用、何时不使用

**示例**：
- "When should AI video not be used?"
- "What are common limitations in this industry?"
- "What scenarios are not suitable for AI-generated video?"
- "Are there industry-specific constraints?"

**特征**：
- AI 非常喜欢引用（降低误用风险）
- 增强内容可信度
- 体现专业边界感

**实现规则**：
- 每个页面至少 3 个 FAQ
- 必须包含 ≥1 个 FAQ-A（新手认知）
- 必须包含 ≥1 个 FAQ-B（决策边界）
- 在 prompt 中明确要求两类问题

---

### 🔧 补强 3：给 Google 一个"非重复"的信号（防 10 万页疲劳）

**问题**：110k 页是优势也是风险，容易触发：
- Thin content 判断
- Template spam 风险
- 重复内容惩罚

**解决方案**：每个 Industry 固定一个 "Industry Constraints" 小段

**位置**：
- 在 "Why This Matters" 之后
- 在 "How to Create" 之前
- 2-3 句话，讲这个行业的现实限制

**模板**：
```
H2: Industry Constraints and Considerations

In the [industry] sector, AI-generated video may have limitations 
when [specific constraint 1], [specific constraint 2], or 
[specific constraint 3]. Teams should consider [consideration] 
before applying this approach to [specific scenario].
```

**关键点**：
- 每个行业固定不同的约束点
- 不是营销话术，是真实限制
- 2-3 句话即可，不要过长
- 这会极大降低重复内容风险

**示例（Healthcare）**：
```
In the healthcare sector, AI-generated video may have limitations 
when dealing with patient-specific medical information, regulatory 
compliance requirements, or situations requiring real-time clinical 
interaction. Teams should consider privacy regulations and accuracy 
requirements before applying this approach to patient-facing content.
```

**示例（Manufacturing）**：
```
In manufacturing, AI-generated video may have limitations when 
demonstrating complex machinery operations, safety-critical procedures, 
or processes requiring precise technical specifications. Teams should 
consider the need for hands-on training and regulatory compliance 
before applying this approach to operational training content.
```

---

### 🔧 补强 4：内链结构差异化（内容关联信号）

**问题**：110k 页如果内链结构完全一致，会被识别为模板站。

**解决方案**：每个 Industry 建立不同的内链模式

**实现方式**：

1. **Industry 内链池**：
   - 每个 Industry 维护一个"相关用例池"（10-20 个）
   - 每个页面随机选择 3-5 个内链（不全部相同）

2. **跨 Industry 内链**：
   - 某些 Industry 可以跨行业链接（如 Healthcare → Education）
   - 某些 Industry 保持行业内链接（如 Legal → Legal）

3. **内链文案差异化**：
   - 不使用固定文案："Related use cases" / "See also"
   - 使用自然内嵌链接："Similar approaches are used in [link]" 
   - 或："Teams in [industry] also apply this to [link]"

**关键点**：
- 不是每个页面都链接到相同的页面
- 内链文案自然，不模板化
- 建立 Industry 级别的内链策略

---

## ✅ 最终执行 Checklist

### 内容生成必须满足
- ✅ 150–200 词答案区（行业 + 场景，使用可引用句式）
- ✅ **Authoritativeness 锚点**（Answer-first 后添加知识库说明）
- ✅ 至少 1 个可引用列表（名词短语，非营销句）
- ✅ **Industry Constraints 段**（每个行业固定约束说明）
- ✅ 明确 How-to Steps
- ✅ ≥3 个 FAQ（必须包含 ≥1 FAQ-A + ≥1 FAQ-B）
- ✅ 行业 / 场景 / 平台 命中 ≥2
- ✅ **差异化内链**（Industry 级别内链策略）

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
5. **必须补 4 个护城河：Authoritativeness + FAQ分层 + Industry Constraints + 差异化内链** ✅

---

## 🔒 隐性规则（内部执行，不对外公开）

> **⚠️ 重要：这 3 条规则不会写在公开文档里，但必须严格执行。**  
> **违反这些规则，会从"被引用对象"降级为"被搜索对象"。**

### 🔒 隐性规则 1：绝不为"热词"破坏结构

**核心原则**：哪怕一个词爆了，也绝不破坏 GEO 结构。

**禁止行为**：
- ❌ 不改 Answer-first 结构
- ❌ 不加营销句
- ❌ 不为了 CTR 动第一屏
- ❌ 不在 Answer-first 中添加趋势词
- ❌ 不为了"追热点"改变页面结构

**原因**：
- 结构一破，你就从"被引用对象"降级为"被搜索对象"
- AI 搜索更信任稳定的结构，而不是"追热点"的内容
- 热词是短期流量，结构是长期资产

**执行标准**：
- ✅ 热词可以放在页面中部（SEO 区域）
- ✅ 热词可以放在 Industry Constraints 中（作为限制说明）
- ✅ 热词可以放在 FAQ-B 中（作为边界说明）
- ❌ 热词不能出现在 Answer-first 段落
- ❌ 热词不能改变 H1 格式
- ❌ 热词不能影响 FAQ 结构

---

### 🔒 隐性规则 2：不做"单页奇观"

**核心原则**：你要的是整库被系统信任，不是某几页流量很好。

**禁止行为**：
- ❌ 不要因为个别页起量很快就兴奋
- ❌ 不要为了"爆款"而牺牲整体结构
- ❌ 不要只优化流量好的页面
- ❌ 不要因为单页数据好就改变策略

**原因**：
- 个别页起量很快 = 噪声，不是信号
- AI 搜索信任的是"系统性知识库"，不是"单页爆款"
- 单页流量 ≠ 整库信任度
- 整库信任度 = 长期引用率

**执行标准**：
- ✅ 关注整库的索引率、引用率
- ✅ 关注 Index Health 整体指标
- ✅ 关注 GEO 命中率分布（不是单页）
- ❌ 不要因为单页数据好就改变策略
- ❌ 不要为了"爆款"而破坏结构一致性

**判断标准**：
- 🟢 健康：整库 Index Health ≥60%，引用率稳定
- 🟡 观察：单页起量，但整库指标正常
- 🔴 风险：单页起量，但整库 Index Health 下降

---

### 🔒 隐性规则 3：允许"慢爬"，不允许"结构回滚"

**核心原则**：如果收录慢，可以等、可以调，但不允许回退 GEO 结构。

**允许的行为**：
- ✅ 可以等（给 Google 时间消化）
- ✅ 可以调 sitemap 优先级
- ✅ 可以调 crawl budget
- ✅ 可以降发布频率
- ✅ 可以只发 G-A 页

**禁止的行为**：
- ❌ 不允许回退 GEO 结构
- ❌ 不允许删 FAQ-B（决策边界）
- ❌ 不允许缩短 Answer-first
- ❌ 不允许删除 Industry Constraints
- ❌ 不允许删除 Authoritativeness 锚点
- ❌ 不允许为了"快速收录"而简化结构

**原因**：
- 结构回滚 = 从"被引用对象"降级为"被搜索对象"
- 慢爬是正常的，结构回滚是致命的
- 收录慢 ≠ 结构有问题，可能是 Google 在消化
- 结构简化 = 放弃 GEO 优势

**执行标准**：
- ✅ 收录慢时：降发布频率、调 sitemap、等 Google 消化
- ✅ 索引率低时：检查内容质量，但不改结构
- ✅ 抓取慢时：优化 robots.txt、sitemap，但不删内容
- ❌ 收录慢时：不允许删 FAQ-B、缩短 Answer-first
- ❌ 索引率低时：不允许简化结构
- ❌ 抓取慢时：不允许删除 Industry Constraints

**判断标准**：
- 🟢 健康：Index Health ≥60%，结构完整，慢爬正常
- 🟡 观察：Index Health 40-59%，结构完整，需要限速
- 🔴 风险：Index Health <40%，但结构完整，必须暂停发布
- ⛔ 禁止：Index Health 低，且结构被简化 = 致命错误

---

## 🎯 隐性规则总结

| 规则 | 核心原则 | 禁止行为 | 允许行为 |
|------|---------|---------|---------|
| **规则 1** | 绝不为热词破坏结构 | 改 Answer-first、加营销句、动第一屏 | 热词放中部、Industry Constraints、FAQ-B |
| **规则 2** | 不做单页奇观 | 为单页爆款改变策略 | 关注整库指标、保持结构一致性 |
| **规则 3** | 允许慢爬，不允许结构回滚 | 删 FAQ-B、缩短 Answer-first、简化结构 | 降频率、调 sitemap、等 Google 消化 |

**记住**：
- 结构 > 流量
- 整库 > 单页
- 慢爬 > 结构回滚
- 被引用 > 被搜索

---

## ✅ 上线前检查清单（必须执行）

### 🔍 中文内容检查（Critical）

> **⚠️ 重要：中国开发者做英文网站时，可能因母语习惯未发现中文内容泄露。**  
> **上线前必须检查所有用户可见内容，确保没有中文字符。**

#### 检查脚本

```bash
# 运行中文内容检查脚本
node scripts/check-chinese-content.js

# 只检查高优先级问题（用户可见内容）
node scripts/check-chinese-content.js | grep "高优先级"

# 排除特定目录
node scripts/check-chinese-content.js --exclude-dirs=docs,scripts
```

#### 手动检查清单

**必须检查的位置**：

1. **用户界面文本** ⚠️ 最高优先级
   - [ ] 所有按钮文字（Button labels）
   - [ ] 所有表单标签（Form labels）
   - [ ] 所有占位符文本（Placeholders）
   - [ ] 所有错误消息（Error messages）
   - [ ] 所有成功消息（Success messages）
   - [ ] 所有提示文本（Tooltips）
   - [ ] 所有页面标题（Page titles）
   - [ ] 所有导航菜单（Navigation menus）

2. **内容生成相关** ⚠️ 高优先级
   - [ ] Prompt 模板中的示例文本
   - [ ] 内容生成模板中的占位符
   - [ ] SEO 模板中的示例内容
   - [ ] 批量生成任务中的示例数据

3. **API 响应** ⚠️ 高优先级
   - [ ] API 错误消息
   - [ ] API 成功消息
   - [ ] API 返回的提示文本

4. **数据库内容** ⚠️ 高优先级
   - [ ] 用户可见的数据库字段值
   - [ ] 生成的页面内容
   - [ ] SEO meta 描述
   - [ ] 页面标题

5. **代码注释** ⚠️ 中优先级
   - [ ] 代码注释中的中文（建议翻译，但不强制）
   - [ ] 开发说明中的中文（可以保留，但建议翻译）

#### 检查方法

**方法 1：使用检查脚本**
```bash
node scripts/check-chinese-content.js
```

**方法 2：手动搜索**
```bash
# 搜索所有 .ts, .tsx, .js, .jsx 文件中的中文字符
grep -r "[\u4e00-\u9fff]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .

# 搜索字符串字面量中的中文
grep -r "[\u4e00-\u9fff]" --include="*.ts" --include="*.tsx" . | grep -E "['\"`].*[\u4e00-\u9fff]"
```

**方法 3：浏览器检查**
- [ ] 打开所有主要页面，检查是否有中文
- [ ] 检查所有用户交互流程（登录、注册、支付等）
- [ ] 检查所有错误场景（404、500、验证失败等）
- [ ] 检查所有成功场景（支付成功、注册成功等）

#### 常见问题位置

1. **示例数据**：开发时使用的测试数据可能包含中文
2. **注释中的示例**：代码注释中的示例可能包含中文
3. **临时调试信息**：console.log 中的调试信息可能包含中文
4. **复制粘贴**：从中文文档复制的内容可能包含中文
5. **AI 生成内容**：AI 生成的内容可能混入中文

#### 修复优先级

| 优先级 | 位置 | 必须修复 | 说明 |
|--------|------|---------|------|
| **🔴 最高** | 用户界面文本 | ✅ 必须 | 按钮、标签、占位符等用户直接看到的内容 |
| **🔴 最高** | 内容生成模板 | ✅ 必须 | Prompt 模板、SEO 模板等会生成用户可见内容 |
| **🟡 高** | API 响应消息 | ✅ 必须 | 错误消息、成功消息等用户会看到 |
| **🟡 高** | 数据库内容 | ✅ 必须 | 生成的页面内容、SEO meta 等 |
| **🟢 中** | 代码注释 | ⚠️ 建议 | 不影响用户，但建议翻译 |
| **🟢 低** | 开发文档 | ❌ 可选 | 内部文档可以保留中文 |

#### 预防措施

1. **开发规范**
   - ✅ 所有用户可见文本必须使用英文
   - ✅ 所有示例数据必须使用英文
   - ✅ 所有测试数据必须使用英文

2. **代码审查**
   - ✅ PR 审查时必须检查中文内容
   - ✅ 使用检查脚本自动检查
   - ✅ 浏览器测试时检查所有页面

3. **CI/CD 集成**
   - ✅ 在 CI 中运行检查脚本
   - ✅ 如果有高优先级问题，阻止部署

#### 快速检查命令

```bash
# 1. 运行检查脚本
node scripts/check-chinese-content.js

# 2. 如果发现问题，修复后再次检查
node scripts/check-chinese-content.js

# 3. 检查特定文件
grep -n "[\u4e00-\u9fff]" app/**/*.tsx

# 4. 检查所有字符串字面量
grep -rn "['\"\`].*[\u4e00-\u9fff]" app/ lib/ components/
```

---

### 📋 完整上线前检查清单

#### 内容检查
- [ ] 运行中文内容检查脚本
- [ ] 检查所有用户界面文本
- [ ] 检查所有 API 响应消息
- [ ] 检查所有内容生成模板
- [ ] 浏览器测试所有主要页面

#### SEO/GEO 检查
- [ ] 检查所有页面的 GEO 结构（Answer-first、FAQ、Industry Constraints）
- [ ] 检查所有页面的 SEO meta（title、description）
- [ ] 检查 sitemap 是否正确
- [ ] 检查 robots.txt 是否正确

#### 功能检查
- [ ] 所有主要功能正常工作
- [ ] 所有用户流程正常（登录、注册、支付等）
- [ ] 所有错误场景正常处理
- [ ] 所有成功场景正常显示

#### 性能检查
- [ ] 页面加载速度正常
- [ ] API 响应时间正常
- [ ] 数据库查询性能正常

---

**记住**：上线前必须运行中文内容检查，确保没有中文字符泄露到用户可见内容中！

