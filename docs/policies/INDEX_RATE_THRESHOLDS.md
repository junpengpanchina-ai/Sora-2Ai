# Index Rate 红/黄/绿 阈值定义

> **版本**: v1.0  
> **生效日期**: 2026-01-24  
> **用途**: SEO Scaling Gate 信号灯

---

## 核心公式

```
Index Rate = Indexed URLs / Discovered URLs
```

---

## 🚦 三区间定义

### 🟢 GREEN（允许扩容）

| 指标 | 阈值 |
|------|------|
| **Index Rate** | ≥ 70% |
| **趋势** | 稳定或缓慢上升 |
| **GSC 状态** | "Indexed" 为主 |

**允许动作**：

```
✅ 可启用 tier1-1.xml
✅ 可考虑合并 sitemap-core.xml
✅ 可准备下一批内容（不立即上线）
```

---

### 🟡 YELLOW（观察，不扩容）

| 指标 | 阈值 |
|------|------|
| **Index Rate** | 40% – 69% |
| **趋势** | 波动或缓慢上升 |
| **GSC 状态** | "Discovered / Crawled" 占比高 |

**允许动作**：

```
❌ 不新增 sitemap
✅ 优化内部链接 / 模板
✅ 等时间，不做结构性改动
```

---

### 🔴 RED（冻结 & 回滚）

| 指标 | 阈值 |
|------|------|
| **Index Rate** | < 40% |
| **趋势** | 持续下降 / 停滞 |
| **GSC 状态** | "Crawled – not indexed" 激增 |

**强制动作**：

```
❌ 禁止任何 sitemap 新增
❌ 禁止 tier1-1
🔁 必要时减少 URL（回滚生成）
🔍 进入诊断模式（模板 / 内容 / 重复）
```

---

## 快速判断表

| Index Rate | 区间 | 动作 |
|------------|------|------|
| ≥ 70% | 🟢 GREEN | 可扩容 |
| 65-69% | 🟡 YELLOW (上沿) | 观察，准备扩容 |
| 50-64% | 🟡 YELLOW (中间) | 观察，不动 |
| 40-49% | 🟡 YELLOW (下沿) | 警戒，优化 |
| < 40% | 🔴 RED | 冻结，诊断 |

---

## 趋势判断规则

### 上升趋势

```
连续 3 天 Index Rate 上升 → 趋势向好
```

### 稳定趋势

```
7 天内波动 ≤ ±5% → 趋势稳定
```

### 下降趋势

```
连续 3 天 Index Rate 下降 → 进入警戒
连续 5 天下降 → 触发 RED
```

---

## 与 Scaling Decision 的映射

| Index Rate | 趋势 | Scaling Decision |
|------------|------|------------------|
| ≥ 70% | 上升/稳定 | `SAFE_TO_SCALE` |
| 65-69% | 上升 | `CAUTIOUS` |
| 50-64% | 稳定 | `HOLD` |
| 40-49% | 下降 | `HOLD` + 警告 |
| < 40% | 任意 | `BLOCKED_LOW_INDEX_RATE` |

---

## SQL 实现

```sql
SELECT
  date,
  indexed_urls,
  discovered_urls,
  ROUND(indexed_urls::numeric / NULLIF(discovered_urls, 0), 3) as index_rate,
  CASE
    WHEN indexed_urls::numeric / NULLIF(discovered_urls, 0) >= 0.70 THEN '🟢 GREEN'
    WHEN indexed_urls::numeric / NULLIF(discovered_urls, 0) >= 0.40 THEN '🟡 YELLOW'
    ELSE '🔴 RED'
  END as zone,
  CASE
    WHEN indexed_urls::numeric / NULLIF(discovered_urls, 0) >= 0.70 THEN 'SAFE_TO_SCALE'
    WHEN indexed_urls::numeric / NULLIF(discovered_urls, 0) >= 0.65 THEN 'CAUTIOUS'
    WHEN indexed_urls::numeric / NULLIF(discovered_urls, 0) >= 0.40 THEN 'HOLD'
    ELSE 'BLOCKED_LOW_INDEX_RATE'
  END as scaling_decision
FROM seo_daily_metrics
ORDER BY date DESC
LIMIT 14;
```

---

## 7 日移动平均计算

```sql
SELECT
  date,
  index_rate,
  AVG(index_rate) OVER (
    ORDER BY date 
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as index_rate_7d_ma
FROM seo_daily_metrics;
```

---

## 警报触发条件

| 事件 | 触发条件 | 级别 |
|------|----------|------|
| 进入 YELLOW | Index Rate 从 GREEN 跌入 | INFO |
| 进入 RED | Index Rate < 40% | CRITICAL |
| 连续下降 | 3 天连续下降 | WARNING |
| 急剧下降 | 单日下降 > 10% | CRITICAL |

---

## 视觉参考

```
100% ┬─────────────────────────────
     │
 70% ├─────────────────────────────  ← GREEN 下限
     │         🟢 GREEN
 65% ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ← sitemap-core 准入线
     │
 50% ├─────────────────────────────  
     │         🟡 YELLOW
 40% ├─────────────────────────────  ← YELLOW 下限
     │
     │         🔴 RED
  0% └─────────────────────────────
```

---

*Policy 版本: 1.0 | 创建时间: 2026-01-24*
