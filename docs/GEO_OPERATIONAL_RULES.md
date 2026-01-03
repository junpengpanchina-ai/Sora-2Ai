# GEO 运营规则

## 🎯 核心原则

**GEO 命中率体系不需要推翻、不需要复杂化、不需要工程升级**

只需要坚持三件事：
1. 坚持结构一致性
2. 持续偏向 A 类行业
3. 让 G-A 内容优先被世界看到

---

## ⚠️ 硬红线规则

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
G-B 行业一旦在 Search Console 出现稳定 impressions → 升级为 G-A
```

**原因**：
- GEO 是动态概率，不是一锤子买卖
- 实际表现比理论分类更重要

**执行方法**：
1. 每月检查 Search Console 数据
2. 如果 G-B 内容连续 3 个月有稳定 impressions（>100/月）
3. 将该行业标记为"已验证高价值"
4. 在 sitemap 排序中提升优先级

**注意**：
- 不需要修改代码中的行业分类
- 只需要在运营层面调整 sitemap 排序
- 保持分类系统的稳定性

---

## 📊 GEO 等级使用规则

### G-A：高概率被 AI 引用

**处理**：
- ✅ 必进前 5 万 sitemap
- ✅ 优先抓取
- ✅ 优先索引
- ✅ 定期检查 AI 引用情况

### G-B：有机会

**处理**：
- ⚠️ 二批进入 sitemap
- ⚠️ 监控 Search Console impressions
- ⚠️ 如果稳定表现，升级为 G-A 优先级

### G-C：只做 SEO

**处理**：
- ❌ 不进前 5 万 sitemap
- ❌ 专注 SEO 优化
- ❌ 不期望 AI 引用

### G-None：不符合标准

**处理**：
- ❌ 不进前 5 万 sitemap
- ❌ 需要优化结构
- ❌ 需要添加行业信息

---

## 🔄 持续优化流程

### 每周

1. 运行 `scripts/analyze-geo-hit-rate.js` 分析新内容
2. 检查 G-A 内容的 AI 引用情况（使用 `scripts/geo-hit-observation.md`）
3. 记录高命中模式

### 每月

1. 检查 Search Console 数据
2. 识别 G-B 内容的稳定表现
3. 调整 sitemap 排序（提升已验证的 G-B 内容）

### 每季度

1. 分析行业分类准确性
2. 根据实际数据调整 A/B/C 分类
3. 优化结构检查逻辑

---

## 💡 关键认知

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

## 📌 执行清单

### 内容生成时

- [ ] Answer-first 区必须包含行业名
- [ ] FAQ 必须包含至少 1 个入门型问题
- [ ] 结构必须满足 5 项标准（每项 20 分）

### 内容审核时

- [ ] 检查 GEO 等级（G-A/G-B/G-C/G-None）
- [ ] G-A 内容优先发布
- [ ] G-None 内容需要优化

### 运营监控时

- [ ] 监控 G-A 内容的 AI 引用情况
- [ ] 识别 G-B 内容的稳定表现
- [ ] 根据数据调整优先级

---

## 🎯 最后一句

**这套 GEO 命中率体系：**

- ✅ 不需要推翻
- ✅ 不需要复杂化
- ✅ 不需要工程升级

**你现在要做的只有三件事：**

1. 坚持结构一致性
2. 持续偏向 A 类行业
3. 让 G-A 内容优先被世界看到

---

## 📁 相关文件

- `lib/utils/geo-hit-rate.ts` - GEO 命中率计算（已更新硬红线）
- `lib/data/industries-geo-classification.ts` - GEO 行业分类
- `docs/GEO_HIT_RATE_SUMMARY.md` - 完整总结
- `scripts/analyze-geo-hit-rate.js` - 分析脚本


