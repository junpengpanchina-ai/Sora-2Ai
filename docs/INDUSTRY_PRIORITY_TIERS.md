# 行业优先级分类（GEO 优化版）

> **目标**：优先做 A 类行业，暂停 C 类行业，最大化 GEO 命中率

---

## 🎯 分类原则

**GEO 可引用度 = Answer-first 质量 × 行业不可胡说性**

- **A 类**：高不可胡说性 + 高 GEO 引用率
- **B 类**：中等不可胡说性，但需筛选场景
- **C 类**：低不可胡说性，暂停新增

---

## ✅ A 类行业（优先，必做）

**特征**：
- 高不可胡说性（医疗、法律、工程等）
- AI 搜索经常引用
- 专业性强，内容稳定

**行业列表**：
1. **Healthcare**（医疗健康）
   - 场景：Patient Education, Medical Training, Procedure Explanations
   - 优先级：⭐⭐⭐⭐⭐

2. **Manufacturing**（制造业）
   - 场景：Safety Training, Compliance Education, Process Documentation
   - 优先级：⭐⭐⭐⭐⭐

3. **Legal**（法律）
   - 场景：Legal Education, Compliance Training, Document Explanations
   - 优先级：⭐⭐⭐⭐⭐

4. **Engineering**（工程）
   - 场景：Technical Training, Safety Protocols, Process Documentation
   - 优先级：⭐⭐⭐⭐⭐

5. **Construction**（建筑）
   - 场景：Safety Training, Compliance Education, Project Documentation
   - 优先级：⭐⭐⭐⭐

6. **Education**（教育）
   - 场景：Course Content, Training Materials, Educational Explanations
   - 优先级：⭐⭐⭐⭐

7. **Finance**（金融）
   - 场景：Compliance Training, Financial Education, Regulatory Explanations
   - 优先级：⭐⭐⭐⭐

8. **Real Estate**（房地产）
   - 场景：Property Education, Compliance Training, Process Documentation
   - 优先级：⭐⭐⭐⭐

---

## 🟡 B 类行业（筛选场景，非营销优先）

**特征**：
- 中等不可胡说性
- 需筛选场景（避免营销场景）
- 优先做：Education / Training / Compliance / Onboarding / Demo / Explainer

**行业列表**：
1. **Technology**（科技）
   - ✅ 可做：Product Demo, Technical Training, Process Documentation
   - ❌ 暂停：Marketing, Brand Storytelling

2. **Food & Beverage**（餐饮）
   - ✅ 可做：Training, Compliance, Process Documentation
   - ❌ 暂停：Marketing, Social Media Content

3. **Retail**（零售）
   - ✅ 可做：Training, Compliance, Process Documentation
   - ❌ 暂停：Marketing, Advertising

4. **Automotive**（汽车）
   - ✅ 可做：Training, Safety Education, Process Documentation
   - ❌ 暂停：Marketing, Brand Storytelling

5. **Fitness & Sports**（健身运动）
   - ✅ 可做：Training, Education, Process Documentation
   - ❌ 暂停：Marketing, Social Media Content

---

## ❌ C 类行业（暂停新增）

**特征**：
- 低不可胡说性
- 营销场景为主
- AI 搜索引用率低

**行业列表**：
1. **Marketing & Advertising**（营销广告）
   - 原因：营销场景为主，AI 引用率低
   - 状态：暂停新增

2. **Social Media**（社交媒体）
   - 原因：内容生命周期短，语义漂移快
   - 状态：暂停新增

3. **Entertainment**（娱乐）
   - 原因：热点驱动，不稳定
   - 状态：暂停新增

4. **Fashion & Beauty**（时尚美妆）
   - 原因：趋势驱动，生命周期短
   - 状态：暂停新增

5. **Gaming**（游戏）
   - 原因：热点驱动，不稳定
   - 状态：暂停新增

---

## 📊 执行优先级

### 当前阶段（接下来 30 天）

| 优先级 | 行业类型 | 每日发布量 | 场景筛选 |
|--------|----------|------------|----------|
| **P0** | A 类行业 | 20-30 页 | 全部场景 |
| **P1** | B 类行业（非营销） | 10-20 页 | 仅 Education/Training/Compliance |
| **P2** | B 类行业（营销） | 0 页 | 暂停 |
| **P3** | C 类行业 | 0 页 | 暂停 |

### 目标占比

- **A 类行业**：> 60%
- **B 类行业（非营销）**：30-40%
- **B 类行业（营销）**：0%
- **C 类行业**：0%

---

## 🔍 场景优先级（B 类行业适用）

### ✅ 优先场景（高 GEO 引用率）

1. **Education & Explainer**（教育讲解）
   - AI 引用率：高
   - 稳定性：高

2. **Training**（培训）
   - AI 引用率：高
   - 稳定性：高

3. **Compliance**（合规）
   - AI 引用率：高
   - 稳定性：高

4. **Onboarding**（入职培训）
   - AI 引用率：中高
   - 稳定性：高

5. **Product Demo**（产品演示）
   - AI 引用率：中
   - 稳定性：中

### ❌ 暂停场景（低 GEO 引用率）

1. **Advertising & Promotion**（广告推广）
   - AI 引用率：低
   - 原因：营销语言，AI 不爱引用

2. **Social Media Content**（社交媒体内容）
   - AI 引用率：低
   - 原因：生命周期短，语义漂移快

3. **Brand Storytelling**（品牌叙事）
   - AI 引用率：低
   - 原因：营销语言，AI 不爱引用

---

## 📈 趋势映射示例

### Google Trends 上升 → 映射到行业 × 场景

**示例 1**：
```
Google Trends: "AI safety training" 上升

✅ 映射到：
- Industry: Manufacturing
- Scene: Safety Training
- Page: AI Video for Manufacturing Safety Training
```

**示例 2**：
```
Google Trends: "Workplace compliance" 上升

✅ 映射到：
- Industry: Construction
- Scene: Compliance Education
- Page: AI Video for Construction Compliance Education
```

**示例 3**：
```
Google Trends: "Healthcare education" 上升

✅ 映射到：
- Industry: Healthcare
- Scene: Patient Education
- Page: AI Video for Healthcare Patient Education
```

---

## ✅ 检查清单

### 生成新页面前

- [ ] 行业是否属于 A 类？
- [ ] 如果不是 A 类，场景是否属于优先场景（Education/Training/Compliance）？
- [ ] 是否避免了营销场景？
- [ ] Answer-first 是否清晰、无废话？

### 发布前

- [ ] GEO 可引用度是否达标？
- [ ] 行业不可胡说性是否高？
- [ ] 是否属于当前优先级范围？

---

## 📚 相关文档

- `docs/GEO_V2_EXECUTION_GUIDE.md` - 执行级操作手册
- `docs/TREND_MAPPING_GUIDE.md` - 趋势映射法详细指南
- `docs/CORE_USE_CASES_SAMPLE_LAYER.md` - 核心样本层指导

