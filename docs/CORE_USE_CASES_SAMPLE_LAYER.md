# 核心样本层（/core-use-cases/）指导

> **目标**：给 Google 一个"样本层"，告诉 Google 站不是垃圾场

---

## 🎯 核心目的

**这个动作对索引帮助巨大**：

- ✅ 告诉 Google：站不是垃圾场
- ✅ 提供高质量样本供 Google 学习
- ✅ 建立内链结构，提升整体权重

---

## 📁 目录结构

### 新建目录
```
/core-use-cases/
```

### 特征
- ✅ A 类行业
- ✅ 手动挑 50–100 个
- ✅ 内链到大量普通 use case

---

## 📋 样本选择标准

### 必须满足的条件

1. **行业分类**
   - ✅ 必须是 A 类行业（Healthcare, Manufacturing, Legal, Engineering 等）

2. **内容质量**
   - ✅ Answer-first 清晰、无废话
   - ✅ GEO 可引用度高
   - ✅ 行业不可胡说性高

3. **场景类型**
   - ✅ 优先：Education, Training, Compliance, Onboarding
   - ❌ 避免：Marketing, Advertising, Social Media

4. **内容完整性**
   - ✅ 结构完整（符合 GEO-A v2 模板）
   - ✅ 无营销语言
   - ✅ FAQ 包含入门问题

---

## 🎯 样本数量建议

### 第一阶段（立即执行）

| 指标 | 数值 |
|------|------|
| **总数量** | 50-100 页 |
| **A 类行业占比** | 100% |
| **行业分布** | 每个 A 类行业 5-10 页 |

### 行业分布示例

```
Healthcare: 15 页
Manufacturing: 15 页
Legal: 10 页
Engineering: 10 页
Construction: 10 页
Education: 10 页
Finance: 10 页
Real Estate: 10 页
其他 A 类: 10 页
```

---

## 🔗 内链策略

### 核心原则

**每个核心页必须内链到 5-10 个普通 use case 页面**

### 内链结构

```
/core-use-cases/healthcare-patient-education
  ├─ 内链到 → /use-cases/healthcare-treatment-explanations
  ├─ 内链到 → /use-cases/healthcare-procedure-demos
  ├─ 内链到 → /use-cases/healthcare-compliance-training
  └─ 内链到 → /use-cases/healthcare-onboarding
```

### 内链位置

1. **Answer-first 段落**（自然提及）
2. **Use Cases 列表**（相关场景）
3. **Real-world Examples**（实际应用）
4. **Related Use Cases**（专门区块）

---

## 📝 内容优化建议

### 核心页特殊要求

1. **更详细的 Answer-first**
   - 可以稍微长一点（160-200 词）
   - 包含更多行业特定信息

2. **更丰富的 Use Cases 列表**
   - 8-12 个名词短语（不是 5-8）
   - 覆盖更多相关场景

3. **更完整的 FAQ**
   - 至少 5 个问题（不是 3）
   - 包含更多行业特定问题

4. **Related Use Cases 区块**（新增）
   - 列出 5-10 个相关普通 use case
   - 每个都有内链

---

## 🚀 执行步骤

### Step 1：选择样本（今天）

- [ ] 从现有页面中筛选 A 类行业页面
- [ ] 评估 GEO 可引用度
- [ ] 选择 50-100 个高质量页面

### Step 2：创建目录结构（今天）

- [ ] 创建 `/core-use-cases/` 目录
- [ ] 设置路由规则
- [ ] 配置 SEO（meta tags, sitemap）

### Step 3：迁移/复制页面（本周）

- [ ] 将选中的页面复制到 `/core-use-cases/`
- [ ] 更新 URL slug
- [ ] 保持内容不变（或轻微优化）

### Step 4：添加内链（本周）

- [ ] 每个核心页添加 5-10 个内链
- [ ] 内链指向相关普通 use case
- [ ] 确保内链自然、相关

### Step 5：提交 GSC（本周）

- [ ] 更新 sitemap（包含核心页）
- [ ] 提交核心页 URL（手动提交 10-20 个）
- [ ] 监控索引状态

---

## 📊 监控指标

### GSC 指标

- **Discovered – not indexed**：核心页是否被发现
- **Crawled – not indexed**：核心页是否被抓取
- **Indexed**：核心页是否被索引

### 内链指标

- 每个核心页的内链数量（目标：5-10）
- 内链指向的页面索引率
- 内链点击率（如果有数据）

---

## ✅ 检查清单

### 创建核心页前

- [ ] 行业是否属于 A 类？
- [ ] GEO 可引用度是否高？
- [ ] Answer-first 是否清晰、无废话？
- [ ] 内容是否完整（符合 GEO-A v2）？

### 添加内链前

- [ ] 内链是否自然、相关？
- [ ] 内链数量是否足够（5-10）？
- [ ] 内链指向的页面是否存在？

### 提交 GSC 前

- [ ] sitemap 是否已更新？
- [ ] 核心页 URL 是否正确？
- [ ] meta tags 是否已配置？

---

## 📚 相关文档

- `docs/GEO_V2_EXECUTION_GUIDE.md` - 执行级操作手册
- `docs/INDUSTRY_PRIORITY_TIERS.md` - 行业优先级分类
- `docs/GEO_A_V2_RELEASE_SCHEDULE.md` - 发布节奏表

