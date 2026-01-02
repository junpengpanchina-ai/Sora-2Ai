# 执行 Top 10 页面升级指南

## 🎯 目标

选出最该升级的 10 个页面，添加 Bridge + Conversion 模块，观察 7 天。

---

## 📋 执行步骤

### Step 1：执行 SQL，选出 Top 10 页面

#### 方法 1：使用 TypeScript 脚本（推荐）

```bash
npm run select-top-10
```

这会：
- ✅ 自动计算优先级
- ✅ 输出 Top 10 页面列表
- ✅ 生成 JSON 文件供后续使用

#### 方法 2：直接在 Supabase Dashboard 执行 SQL

**文件**：`database/migrations/select_top_10_upgrade_pages.sql`

**注意**：需要先确保 `page_meta` 表有以下字段：
- `ai_prime_score`（需要先执行 `identify_ai_prime_pool.sql`）
- `ai_signal_score`（可以从 GSC 数据计算，或使用默认值 0）

---

### Step 2：为这 10 个页面添加 Bridge + Conversion 模块

#### 2.1 添加 Bridge 模块

**位置**：在 Answer-First 段之后，How to Use 之前

**模板**（从 `BRIDGE_TO_CONVERSION_TEMPLATES.md`）：

```markdown
### What You Can Explore Next

In many real-world learning environments, understanding a concept is only the starting point.
People usually benefit from seeing how the same idea appears in different practical contexts.

For example, structured visual explanations can help clarify how processes change across use cases,
allowing learners to build confidence before applying knowledge independently.
```

#### 2.2 添加 Conversion Block（只对其中 5 个页面）

**位置**：在 Bridge 模块之后

**模板**：

```markdown
### Exploring Related Use Cases

In practice, similar approaches are often used in areas such as onboarding, skills training,
or process explanation. These use cases help illustrate how the same concept can be adapted
to different audiences and communication goals.

If you're exploring how this approach works across scenarios,
reviewing related examples can provide additional context and perspective.
```

#### 2.3 选择哪 5 个页面添加 Conversion Block？

**优先级**：
1. Purchase Intent = 3 的页面（优先）
2. Purchase Intent = 2 的页面
3. Index State = 'indexed' 的页面

---

### Step 3：观察 7 天，不要改模板

#### 每天观察 3 个指标（2 分钟）

| 指标 | 来源 | 正常信号 |
|------|------|----------|
| **Indexed** | GSC → Pages | 缓慢上升 |
| **Impressions** | GSC → Performance | 稳定或略增 |
| **Avg Position** | GSC → Performance | 不下降 |

#### 记录表（建议）

| 日期 | Indexed | Impressions | Avg Position | 备注 |
|------|---------|-------------|--------------|------|
| Day 1 | ? | ? | ? | |
| Day 2 | ? | ? | ? | |
| ... | ... | ... | ... | |

---

## ⚠️ 重要规则

### ❌ 绝对不能做

- ❌ 不改模板结构
- ❌ 不改 H1 / URL / Meta
- ❌ 不加 CTA / 产品名 / 价格
- ❌ 不追热点
- ❌ 不突然加速发布

### ✅ 应该做

- ✅ 只添加 Bridge + Conversion 模块
- ✅ 保持原有 GEO 结构
- ✅ 使用提供的模板
- ✅ 观察指标变化

---

## 📊 成功标准

### 7 天后，如果：

- ✅ Indexed 继续上升
- ✅ Impressions 稳定或增长
- ✅ Avg Position 不下降

**→ 说明升级成功，可以继续为更多页面添加模块**

### 如果出现：

- ❌ Indexed 停止增长
- ❌ Impressions 下降
- ❌ Avg Position 大幅下降

**→ 立即停止，回滚最近 3 天的修改**

---

## 🚀 快速执行命令

```bash
# 1. 选择 Top 10 页面
npm run select-top-10

# 2. 查看结果
cat scripts/top-10-upgrade-pages.json

# 3. 参考模板
# 打开 docs/BRIDGE_TO_CONVERSION_TEMPLATES.md
```

---

## 📝 执行清单

### 今天（30 分钟）

- [ ] 执行 `npm run select-top-10`
- [ ] 查看 Top 10 页面列表
- [ ] 为 10 个页面添加 Bridge 模块
- [ ] 为 5 个页面添加 Conversion Block

### 接下来 7 天

- [ ] 每天记录 3 个指标（Indexed、Impressions、Avg Position）
- [ ] 不改模板、不改结构
- [ ] 观察指标变化

### Day 8

- [ ] 评估结果
- [ ] 如果成功，继续为更多页面添加模块
- [ ] 如果失败，回滚修改

---

## 🧠 最重要的一句话

> **你现在不是在追流量，而是在训练"搜索引擎如何信任你"。**
> 
> **只要它信任你一次，后面会自己帮你放大。**

---

**最后更新**：2025年1月2日  
**状态**：✅ 执行指南已就绪

