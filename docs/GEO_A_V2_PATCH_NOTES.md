# GEO-A v2 补丁说明（6 处优化）

> **更新时间**：2025-12-29  
> **版本**：v2.1（补丁版）  
> **原则**：不推翻、不重写，只打补丁

---

## 🎯 补丁目标

**这不是"内容模板"，这是一个"搜索系统可以长期信任的内容协议"。**

当前版本评分：
- Google 索引安全性：⭐⭐⭐⭐☆ (4.5/5)
- GEO / AI 引用率：⭐⭐⭐⭐⭐ (5/5)
- 模板同构风险：⭐⭐⭐⭐☆
- 积分效率：⭐⭐⭐⭐⭐
- 可规模化：⭐⭐⭐⭐☆

**👉 已经是"可以冻结跑 30 天"的版本**

---

## 🔧 6 处补丁详情

### 补丁 1：H1 格式扩展（避免 "for X in Y" 全站统一模式）

**问题**：
- `${keyword} in ${industry}` 在长尾量极大时会形成语义完全一致的 programmatic footprint
- Google 对 "for X in Y" 这类模板特别敏感

**修复**：
- 从 2 种变体扩展到 **3 种变体**（随机选择）
- 新增变体：
  - `AI Video Use Cases in [Industry]: [Use Case]`
  - `How [Industry] Teams Apply AI Video to [Use Case]`

**代码位置**：
- `lib/prompts/geo-a-template-prompt-v2.ts` - `selectH1Variant()`
- `app/admin/UseCaseBatchGenerator.tsx` - H1 生成逻辑
- `scripts/batch-update-geo-content.js` - 批量更新脚本

---

### 补丁 2：Answer-first 应用介绍句式池

**问题**：
- "Typical applications include..." 在每页都出现会形成同构雷区
- Google 不是看句子一模一样，而是看语义角色 + 位置 + 功能

**修复**：
- 添加 **3 种句式池**（随机选择）：
  - "Common ways teams apply this include..."
  - "This approach is often used for..."
  - "In practice, these videos support tasks such as..."

**代码位置**：
- `lib/prompts/geo-a-template-prompt-v2.ts` - `buildGEOAV2Prompt()`
- `app/admin/UseCaseBatchGenerator.tsx` - 应用介绍逻辑
- `scripts/batch-update-geo-content.js` - 批量更新脚本

---

### 补丁 3：Why This Matters 痛点类型加权概率

**问题**：
- 当前是 25% / 25% / 25% / 25% 均匀分布
- 真实世界 AI 引用情况：理解型 > 规模型 > 时间型 > 成本型

**修复**：
- 改为 **加权概率**：
  - Understanding: **40%**（AI 更爱「解释难、理解难」）
  - Scale: **30%**
  - Time: **20%**
  - Cost: **10%**（Google 不关心"省钱"）

**代码位置**：
- `lib/prompts/geo-a-template-prompt-v2.ts` - `selectPainPointType()`
- `app/admin/UseCaseBatchGenerator.tsx` - 痛点类型选择逻辑
- `scripts/batch-update-geo-content.js` - 批量更新脚本

---

### 补丁 4：FAQ 问题池优化（降频比较型问题）

**问题**：
- "Which platform works best..." 这类比较型/评测型问题
- AI 搜索不喜欢，Google 容易判为「商业意图增强」

**修复**：
- **优先问题**（AI search prefers）：
  - "How is AI video typically used in [industry]?"
  - "Is AI-generated video suitable for non-technical teams?"
  - "Can these videos be reused across different contexts?"
  - "Do I need any equipment?"
  - "Is this expensive?"
  - "Can small teams use this?"
- **降频问题**：
  - "Which platform works best..."（避免或谨慎使用）

**代码位置**：
- `lib/prompts/geo-a-template-prompt-v2.ts` - FAQ 部分
- `app/admin/UseCaseBatchGenerator.tsx` - FAQ 生成逻辑
- `scripts/batch-update-geo-content.js` - 批量更新脚本

---

### 补丁 5：CTA 标题改为中性信息型

**问题**：
- "Get started with Sora2 for ${keyword}" 在 programmatic 站点中
- 大量 "Get started" H2 是弱垃圾信号

**修复**：
- H2 标题改为：`Using Sora2 for [Use Case] in [Industry]`
- CTA 文案保留（放在内容中，不是标题）

**代码位置**：
- `lib/prompts/geo-a-template-prompt-v2.ts` - CTA 部分
- `app/admin/UseCaseBatchGenerator.tsx` - CTA 生成逻辑
- `scripts/batch-update-geo-content.js` - 批量更新脚本

---

### 补丁 6：Prompt 顶部添加「作者意图偏移器」

**问题**：
- 15w 规模下，需要防止 Google 判定为模板生成
- 需要改变模型的「意图分布」

**修复**：
- 在 Prompt 最前面添加：
  ```
  Assume this page is written by a different industry specialist each time, 
  with a slightly different explanatory focus and writing intent.
  ```
- 这句话不会明显改变内容，但会改变模型的「意图分布」

**代码位置**：
- `lib/prompts/geo-a-template-prompt-v2.ts` - `GEO_A_V2_PROMPT`
- `app/admin/UseCaseBatchGenerator.tsx` - `userPrompt`
- `scripts/batch-update-geo-content.js` - `buildGEOPrompt()`

---

## ✅ 补丁效果预期

### Google 索引安全性
- ✅ 避免 "for X in Y" 全站统一模式
- ✅ 避免固定的 "Typical applications include..." 句式
- ✅ 避免大量 "Get started" H2 标题
- ✅ 作者意图偏移器降低模板判定风险

### GEO / AI 引用率
- ✅ 痛点类型加权（Understanding 40%）提升 AI 引用率
- ✅ FAQ 问题池优化（优先非比较型问题）提升 AI 引用率

### 模板同构风险
- ✅ H1 从 2 种扩展到 3 种变体
- ✅ 应用介绍句式池（3 种变体）
- ✅ 作者意图偏移器

---

## 📋 检查清单

### 生成新页面前

- [ ] H1 是否使用了 3 种变体之一（不是固定的 "for X in Y"）？
- [ ] 应用介绍是否使用了句式池（不是固定的 "Typical applications include..."）？
- [ ] 痛点类型是否按加权概率选择（Understanding 40%）？
- [ ] FAQ 是否优先使用非比较型问题？
- [ ] CTA 标题是否是中性信息型（不是 "Get started"）？
- [ ] Prompt 顶部是否包含作者意图偏移器？

---

## 🚀 下一步

**你现在该做的只有一件事：冻结它，让 Google 和 AI 都"习惯你"。**

- ✅ 不该再加复杂度
- ✅ 不该再追热点
- ✅ 不该再提高产量
- ✅ 冻结 30 天，让系统学习你的内容结构

---

## 📚 相关文档

- `docs/GEO_V2_EXECUTION_GUIDE.md` - 执行级操作手册
- `docs/QUICK_REFERENCE.md` - 快速参考指南
- `docs/LATEST_CONTENT_GENERATION_INSTRUCTIONS.md` - 最新文案生成指令

