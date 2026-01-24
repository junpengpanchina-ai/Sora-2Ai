# SEO 扩容 10 万页【风控 SOP】

> **版本**: 1.0
> **核心原则**: 任何一次扩容，都必须是可回滚的

---

## 扩容决策流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    每日检查 Dashboard                        │
│                 select * from v_seo_scaling_decision;       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ┌─────────┐    ┌─────────┐    ┌─────────┐
         │ BLOCKED │    │  HOLD   │    │  SAFE   │
         └────┬────┘    └────┬────┘    └────┬────┘
              │              │              │
              ▼              ▼              ▼
         立即停止        暂停扩容        可以继续
         所有生成        观察 7 天        扩容
```

---

## Phase 定义

### Phase 0：基线期（≤ 3,000 页）

**目标**：验证 SEO 基础设施正常运作

| 允许操作 | 条件 |
|----------|------|
| 开启 Tier1 | Index Rate ≥ 60% |
| 小量 Tier2（≤500） | tier1_empty_chunks = 0 |

**硬性指标**：

```sql
-- 必须全部满足才能进入 Phase 1
select
  case when index_rate >= 60 then '✅' else '❌' end as index_rate_ok,
  case when tier1_empty_chunks = 0 then '✅' else '❌' end as sitemap_ok,
  case when indexed > 0 then '✅' else '❌' end as has_indexed
from v_seo_dashboard_current;
```

**禁止操作**：
- ❌ 批量生成 Tier2
- ❌ 国家/语言变体扩展
- ❌ 任何 AI 批量内容

---

### Phase 1：验证期（3,000 → 10,000 页）

**目标**：验证扩容不会触发质量问题

| 允许操作 | 条件 |
|----------|------|
| 批量 Tier2 | Index Rate ≥ 50% |
| 国家/场景扩展 | Duplicate < 10% |
| | Indexed 日增 > 0 |

**每日检查**：

```sql
select * from v_seo_scaling_decision;
-- decision 必须是 SAFE_TO_SCALE 或 CAUTIOUS
```

**Kill 条件（任一触发 → 全站暂停 7 天）**：

| 条件 | 阈值 | 动作 |
|------|------|------|
| Index Rate | < 40% | 🚨 立即停止所有生成 |
| Duplicate Rate | > 20% | 🚨 暂停 + 检查去重 |
| 连续无增长 | ≥ 3 天 | ⚠️ 暂停扩容 |

**暂停后恢复条件**：
- 连续 7 天 Index Rate ≥ 50%
- Duplicate < 10%
- 无 FATAL 告警

---

### Phase 2：放量期（10,000 → 30,000 页）

**目标**：可控放量，发现问题快速回滚

| 允许操作 | 条件 |
|----------|------|
| Tier2 分组 rollout | 每批 ≤ 5,000 |
| A/B Prompt 模板 | 有对照组 |

**Rollout 策略**：

```
Day 1: 生成 5,000 页（Tier2 批次 A）
Day 3: 检查 Index Rate，如果 ≥ 50% → 继续
Day 4: 生成 5,000 页（Tier2 批次 B）
Day 6: 检查，如果正常 → 继续
...
```

**监控重点**：

| 信号 | 含义 | 动作 |
|------|------|------|
| Crawled ≫ Indexed | 内容质量问题 | 优化模板 |
| Soft 404 上升 | AI 生成空内容 | 检查 Prompt |
| Duplicate 上升 | 去重失败 | 检查 hash |

**回滚机制**：

```sql
-- 一键 noindex 某批次 Tier2
update pages
set noindex = true, in_sitemap = false
where tier = 2 and batch_id = 'xxx';
```

---

### Phase 3：规模期（30,000 → 100,000 页）

**目标**：稳定运营，追求绝对增量而非比率

**必备条件**：

- [x] Kill-switch 已实现（一键 noindex Tier2）
- [x] Sitemap 自动健康检查（每日）
- [x] Dashboard 全绿 ≥ 14 天

**策略转变**：

| 之前 | 现在 |
|------|------|
| 追求 Index Rate % | 追求 Indexed 绝对增量 |
| 全量监控 | 采样监控 |
| 每页检查 | 批次检查 |

**日常运营**：

```sql
-- 每日必看
select * from v_seo_dashboard_current;
select * from v_seo_alerts_recent where status = 'open';

-- 每周复盘
select * from v_seo_trend_14d;
```

---

## Kill-Switch 实现

### 1. 一键暂停所有生成

```typescript
// lib/seo/kill-switch.ts
export async function pauseAllGeneration() {
  await supabase
    .from('system_config')
    .upsert({ key: 'seo_generation_paused', value: true })
  
  console.log('🚨 SEO generation paused')
}
```

### 2. 一键 noindex Tier2

```sql
-- 紧急情况：所有 Tier2 下线
update pages
set noindex = true, in_sitemap = false, updated_at = now()
where tier = 2;

-- 从 sitemap 移除
-- （下次 sitemap 重新生成时自动生效）
```

### 3. 一键回滚到 Core Only

```sql
-- 只保留 Core + Tier1
update pages
set noindex = true, in_sitemap = false
where tier = 2;

-- 验证
select tier, count(*), sum(case when in_sitemap then 1 else 0 end) as in_sitemap
from pages
group by tier;
```

---

## 告警响应 Playbook

### 🚨 FATAL: Tier1 空 chunk

**症状**：`tier1_empty_chunks > 0`

**响应时间**：立即

**动作**：
1. 检查 sitemap index 引用
2. 检查 RPC 函数是否正常
3. 检查数据源是否有数据
4. 修复后重新部署
5. 验证 tier1-0.xml URL 数 > 0

### 🚨 FATAL: Index Rate < 40%

**症状**：`index_rate < 40`

**响应时间**：24 小时内

**动作**：
1. 暂停所有 Tier2 生成
2. 检查 Duplicate 是否上升
3. 检查 Soft 404 是否上升
4. 检查 canonical 配置
5. 等待 Index Rate 恢复到 50% 以上

### ⚠️ WARNING: 连续无增长

**症状**：连续 3 天 `index_delta <= 0`

**响应时间**：7 天观察期

**动作**：
1. 暂停扩容
2. 检查 sitemap 是否正常被消费
3. 检查 Pages 报告中的问题
4. 考虑增加内链
5. 等待恢复后再扩容

---

## 阈值速查表

| 指标 | 健康 | 警告 | 危险 |
|------|------|------|------|
| Index Rate | ≥ 70% | 50-70% | < 40% |
| Duplicate Rate | < 10% | 10-20% | > 20% |
| Tier1 空 chunk | 0 | - | > 0 |
| 连续无增长天数 | 0-1 | 2 | ≥ 3 |
| Soft 404 Rate | < 5% | 5-10% | > 10% |

---

## 永久铁律

> **"任何一次扩容，都必须是可回滚的。"**

1. 每批生成必须有 `batch_id`
2. 每批生成前必须检查 `can_scale_seo()`
3. 生成后 24h 必须检查 Index 增量
4. 发现问题立即回滚，不要等

---

*文档版本: 1.0 | 创建时间: 2026-01-24*
