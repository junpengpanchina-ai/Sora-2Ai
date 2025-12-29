# 趋势映射法详细指南

> **核心原则**：不碰热点词，但吃"趋势红利"  
> **方法**：用趋势判断「哪些行业 × 场景值得优先做」

---

## 🎯 核心原则

### ❌ 错误做法

**直接用趋势词当关键词**：
```
❌ AI Safety Training Trend 2025
❌ Workplace Compliance News
❌ Healthcare Education Update
```

**问题**：
- 生命周期短
- 语义漂移快
- AI 最爱"自己编"，最不爱"引用"
- 一旦大量用 Gemini-3-flash 生成趋势词 = 自毁 GEO

### ✅ 正确做法

**用趋势判断「哪些行业 × 场景值得优先做」**：
```
✅ AI Video for Manufacturing Safety Training
✅ AI Video for Construction Compliance Education
✅ AI Video for Healthcare Patient Education
```

**优势**：
- 吃的是「需求侧上升」，不是「词本身」
- 内容稳定，AI 愿意引用
- 符合 GEO-A v2 模板

---

## 🔧 趋势映射流程

### Step 1：获取 Google Trends 数据

**关注指标**：
- 搜索量上升（+50% 以上）
- 持续上升（不是单日峰值）
- 相关主题上升

### Step 2：提取行业信号

**从趋势词中提取**：
- 行业关键词（Healthcare, Manufacturing, Legal 等）
- 场景关键词（Training, Compliance, Education 等）
- 需求关键词（Safety, Onboarding, Documentation 等）

### Step 3：映射到行业 × 场景

**映射规则**：
```
趋势词 → 行业（Industry）
       × 固定场景（Education / Training / Compliance / Onboarding / Demo / Explainer）
```

---

## 📊 映射示例

### 示例 1：AI Safety Training

**Google Trends 显示**：
- "AI safety training" 上升 +80%
- 相关主题：Workplace Safety, Manufacturing Training

**❌ 错误映射**：
```
直接生成：AI Safety Training Trend 2025（死）
```

**✅ 正确映射**：
```
行业：Manufacturing
场景：Safety Training
页面：AI Video for Manufacturing Safety Training

行业：Construction
场景：Safety Training
页面：AI Video for Construction Safety Training
```

### 示例 2：Workplace Compliance

**Google Trends 显示**：
- "Workplace compliance" 上升 +60%
- 相关主题：Legal Compliance, Regulatory Training

**❌ 错误映射**：
```
直接生成：Workplace Compliance News（死）
```

**✅ 正确映射**：
```
行业：Legal
场景：Compliance Training
页面：AI Video for Legal Compliance Training

行业：Manufacturing
场景：Compliance Education
页面：AI Video for Manufacturing Compliance Education
```

### 示例 3：Healthcare Education

**Google Trends 显示**：
- "Healthcare education" 上升 +70%
- 相关主题：Patient Education, Medical Training

**❌ 错误映射**：
```
直接生成：Healthcare Education Update（死）
```

**✅ 正确映射**：
```
行业：Healthcare
场景：Patient Education
页面：AI Video for Healthcare Patient Education

行业：Healthcare
场景：Medical Training
页面：AI Video for Healthcare Medical Training
```

---

## 🚫 永远不生成的词类型

### 1. 事件型词
- ❌ "AI Safety Training Event 2025"
- ❌ "Workplace Compliance Conference"
- ❌ "Healthcare Education Summit"

### 2. 时间型词
- ❌ "AI Safety Training Trend 2025"
- ❌ "Workplace Compliance Update 2025"
- ❌ "Healthcare Education News 2025"

### 3. 新闻型词
- ❌ "AI Safety Training News"
- ❌ "Workplace Compliance Update"
- ❌ "Healthcare Education Report"

### 4. 情绪型词
- ❌ "Revolutionary AI Safety Training"
- ❌ "Ultimate Workplace Compliance"
- ❌ "Best Healthcare Education"

---

## ✅ 可生成的词类型

### 1. 行业 × 场景组合
- ✅ "AI Video for Manufacturing Safety Training"
- ✅ "AI Video for Construction Compliance Education"
- ✅ "AI Video for Healthcare Patient Education"

### 2. 功能型描述
- ✅ "AI Video for Safety Training in Manufacturing"
- ✅ "AI Video for Compliance Education in Construction"
- ✅ "AI Video for Patient Education in Healthcare"

### 3. 用途型描述
- ✅ "How Manufacturing Teams Use AI Video for Safety Training"
- ✅ "How Construction Teams Use AI Video for Compliance Education"
- ✅ "How Healthcare Teams Use AI Video for Patient Education"

---

## 📋 映射检查清单

### 生成新页面前

- [ ] 趋势词是否映射到行业（不是直接使用）？
- [ ] 行业是否属于 A 类（或 B 类非营销）？
- [ ] 场景是否属于优先场景（Education/Training/Compliance）？
- [ ] 是否避免了事件型/时间型/新闻型/情绪型词？
- [ ] 页面标题是否符合 GEO-A v2 模板？

---

## 🎯 优先级判断

### 高优先级（立即做）

**条件**：
- 趋势上升 > 50%
- 映射到 A 类行业
- 场景属于优先场景（Education/Training/Compliance）

**示例**：
```
趋势：AI Safety Training (+80%)
行业：Manufacturing (A 类)
场景：Safety Training (优先)
→ 立即生成：AI Video for Manufacturing Safety Training
```

### 中优先级（本周做）

**条件**：
- 趋势上升 30-50%
- 映射到 A 类行业或 B 类非营销
- 场景属于优先场景

**示例**：
```
趋势：Workplace Compliance (+40%)
行业：Legal (A 类)
场景：Compliance Training (优先)
→ 本周生成：AI Video for Legal Compliance Training
```

### 低优先级（暂缓）

**条件**：
- 趋势上升 < 30%
- 映射到 B 类营销或 C 类
- 场景不属于优先场景

**示例**：
```
趋势：Social Media Content (+20%)
行业：Social Media (C 类)
场景：Social Media Content (暂停)
→ 暂缓生成
```

---

## 📚 相关文档

- `docs/GEO_V2_EXECUTION_GUIDE.md` - 执行级操作手册
- `docs/INDUSTRY_PRIORITY_TIERS.md` - 行业优先级分类
- `docs/CORE_USE_CASES_SAMPLE_LAYER.md` - 核心样本层指导

