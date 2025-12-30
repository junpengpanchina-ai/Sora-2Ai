# Index Health Dashboard（表格版 · 执行级）

> **工具建议**：Google Sheets / Excel / 飞书表格  
> **更新频率**：每天 1 次（固定时间）  
> 👉 不需要 site:  
> 👉 不猜、不焦虑  
> 👉 每天 3 分钟就能判断：发 / 慢 / 停

---

## 📊 Sheet 1：INDEX_DASHBOARD（总览）

### 表头结构

| 指标 | 公式 / 来源 | 当前值 | 阈值 | 状态 | 行动 |
|------|------------|--------|------|------|------|
| Discovered | GSC → Pages → Discovered | | | | |
| Crawled | GSC → Crawled | | | | |
| Indexed | GSC → Indexed | | | | |
| Index Health | `=Indexed / (Discovered + Crawled)` | | ≥60% | | |
| Avg GEO Score | 内容系统 | | ≥80 | | |

### 自动公式

**状态自动判断（C 列）**：
```
=IF(E2>=0.6,"健康期",IF(E2>=0.4,"限速期","风险期"))
```

**行动自动判断（F 列）**：
```
=IF(E2>=0.6,"✅ 放量",IF(E2>=0.4,"⚠️ 限速","⛔ 暂停"))
```

### 使用说明

1. **每天固定时间**（建议：早上 9 点）
2. **打开 GSC** → Pages
3. **抄 3 个数**：Discovered、Crawled、Indexed
4. **Index Health 自动计算**
5. **状态和行动自动显示**

---

## 🧭 Sheet 2：INDEX_ACTION_MAP（行动映射表）

### 表头结构

| Index Health | 阶段 | 每日发布量 | 允许趋势 | 禁止事项 |
|--------------|------|------------|----------|----------|
| ≥60% | 慢吃期 | 40–80 | 趋势映射 ≤2 | ❌ 热搜 |
| 40–59% | 限速期 | 20–40 | 解释型趋势 | ❌ 专题 |
| <40% | 风险期 | ≤10 | 不允许 | ❌ 一切趋势 |

### 使用说明

- **对照当前 Index Health**，找到对应阶段
- **查看每日发布量范围**
- **确认允许的趋势类型**
- **遵守禁止事项**

👉 **你现在就在「限速期」**

---

## 🔥 Sheet 3：TREND_PRESSURE_TABLE（趋势压力计算表）

### 表头结构

| 内容类型 | Pressure | 说明 |
|---------|----------|------|
| Evergreen 解释页 | 0 | 无趋势压力 |
| 行业 × 场景 | 1 | 轻微趋势 |
| 趋势映射词（非热搜） | 2 | 中等趋势 |
| 热搜 / 时效词 | 4 | 高风险 |

### 🚨 当日规则

**如果 Index Health < 60%**：
```
→ 当日所有内容 Pressure 总和 ≤ 2
```

**如果 Index Health ≥ 60%**：
```
→ 当日所有内容 Pressure 总和 ≤ 4
```

### 使用说明

- **选择内容类型**，查看对应 Pressure
- **计算当日总 Pressure**
- **对照规则判断是否允许**

---

## 🧠 Sheet 4：DAILY_PUBLISH_PLAN（每日排产主表）

### 表头结构

| 日期 | 行业 | 场景 | 内容类型 | GEO 分 | Pressure | Index Health | 是否可发 | 备注 |
|------|------|------|----------|--------|----------|--------------|----------|------|
| 2025-12-30 | Dental | Patient education | Evergreen | 85 | 0 | 50% | ✅ | |
| 2025-12-30 | E-commerce | Product demo | Trend-mapped | 82 | 2 | 50% | ⚠️ | |
| 2025-12-30 | Fitness | Short video | Hot topic | 78 | 4 | 50% | ⛔ | |

### 自动公式

**是否可发（H 列）**：
```
=IF(AND(F2>=80,G2<=2,IF(INDEX_DASHBOARD!E2<0.6,G2<=2,G2<=4),INDEX_DASHBOARD!E2>=0.4),"✅",IF(AND(F2>=80,G2<=2,INDEX_DASHBOARD!E2>=0.4),"⚠️","⛔"))
```

**简化版（如果 Index Health 在 Sheet 1 的 E2）**：
```
=IF(AND(F2>=80,G2<=2,INDEX_DASHBOARD!E2>=0.4),"✅","⛔")
```

### 使用说明

1. **每天填写计划内容**
2. **填写行业、场景、内容类型**
3. **填写 GEO 分、Pressure**
4. **是否可发自动判断**
5. **只保留 ✅ 的行**
6. **删除 ⛔ 的行，不讨论**

---

## 🎯 Sheet 5：GEO_LAYER（GEO 命中率分层表）

### 表头结构

| GEO 分数 | 等级 | 是否可发布 | 说明 |
|---------|------|------------|------|
| ≥80 | G-A | ✅ | AI 可引用 |
| 60–79 | G-B | ⚠️ | 可收录，但少引用 |
| <60 | G-C | ⛔ | 填充层 |

### 自动公式

**是否可发布（C 列）**：
```
=IF(A2>=80,"✅",IF(A2>=60,"⚠️","⛔"))
```

### 使用说明

- **G-C 永远不进 DAILY_PUBLISH_PLAN**
- **G-B 需要观察**
- **G-A 优先发布**

---

## 🧱 Sheet 6：SUPPLIER_CHECK（防供应商洗脑表）

### 表头结构

| 供应商建议 | 对照表 | 结论 | 你的回复 |
|-----------|--------|------|----------|
| "必须追热点" | Index Health <60% | ❌ | "Index Health 过 60% 再说" |
| "量越大越好" | Crawled 未消化 | ❌ | "等 Crawled 消化完" |
| "Gemini 能抓热搜" | Pressure = 4 | ❌ | "Pressure 4 禁止" |
| "现在不追就晚了" | Index Health <60% | ❌ | "Index Health 过 60% 再说" |

### 使用说明

- **遇到供应商建议**，对照此表
- **查看结论**
- **使用标准回复**

---

## 📅 每天 3 分钟流程

### Step 1：更新 Dashboard（1 分钟）

1. 打开 GSC → Pages
2. 抄 3 个数到 **INDEX_DASHBOARD**
   - Discovered
   - Crawled
   - Indexed
3. **Index Health 自动计算**
4. **状态和行动自动显示**

### Step 2：查看行动映射（30 秒）

1. 打开 **INDEX_ACTION_MAP**
2. 对照当前 Index Health
3. 确认每日发布量范围
4. 确认允许的趋势类型

### Step 3：填写排产计划（1.5 分钟）

1. 打开 **DAILY_PUBLISH_PLAN**
2. 填写计划内容（行业、场景、内容类型）
3. 填写 GEO 分、Pressure
4. **是否可发自动判断**
5. **只保留 ✅ 的行**
6. **删除 ⛔ 的行，不讨论**

---

## 🔧 Google Sheets 设置指南

### 1. 创建 6 个 Sheet

- `INDEX_DASHBOARD`
- `INDEX_ACTION_MAP`
- `TREND_PRESSURE_TABLE`
- `DAILY_PUBLISH_PLAN`
- `GEO_LAYER`
- `SUPPLIER_CHECK`

### 2. 设置公式引用

在 `DAILY_PUBLISH_PLAN` 的 H 列（是否可发）：
```
=IF(AND(F2>=80,G2<=2,INDEX_DASHBOARD!E2>=0.4),"✅","⛔")
```

### 3. 设置条件格式

- **✅ 绿色**：可发布
- **⚠️ 黄色**：观察
- **⛔ 红色**：禁止

---

## 📋 完整公式参考

### INDEX_DASHBOARD 表

**E2（Index Health）**：
```
=IF(B2+C2=0,0,D2/(B2+C2))
```

**F2（状态）**：
```
=IF(E2>=0.6,"健康期",IF(E2>=0.4,"限速期","风险期"))
```

**G2（行动）**：
```
=IF(E2>=0.6,"✅ 放量",IF(E2>=0.4,"⚠️ 限速","⛔ 暂停"))
```

### DAILY_PUBLISH_PLAN 表

**H2（是否可发）**：
```
=IF(AND(F2>=80,G2<=2,INDEX_DASHBOARD!E2>=0.4),"✅",IF(AND(F2>=80,G2<=2,INDEX_DASHBOARD!E2>=0.4),"⚠️","⛔"))
```

**简化版**：
```
=IF(AND(F2>=80,G2<=2,INDEX_DASHBOARD!E2>=0.4),"✅","⛔")
```

---

## 💡 正确使用心法

**Index Health 是刹车**  
**GEO 是发动机**  
**趋势只是装饰，不是方向盘**

---

## 📚 相关文档

- `docs/GEO_INDEX_AUTO_PRODUCTION_TABLE.md` - GEO × Index Health 自动排产表
- `docs/INDEX_HEALTH_DASHBOARD.md` - 索引健康仪表盘（详细版）
- `lib/production-scheduler.ts` - TypeScript 实现

