# Prompt GateScore & Lifecycle（Admin-only）

本文件描述 Prompt 资产的 **GateScore（可排序分数）** 与 **生命周期建议动作**，用于后台运营与治理。

> 关键底线：Prompt 永不面向普通用户展示，不参与 SEO 页面与 sitemap。

## GateScore（7d）

目标：让 Prompt 像“可量化资产”，方便排序、Top/Bottom 榜、快速筛选。

在 DB 视图 `public.v_prompt_template_gate` 中提供：

- `executions_7d`
- `success_rate_7d`
- `gate_score_7d`（0–1）
- `gate_color_7d`（RED/YELLOW/GREEN）

### 计算公式

在 `supabase/migrations/124_prompt_template_gate_score_and_lifecycle.sql` 中实现：

\[
gate\_score\_{7d}=0.6\times S+0.4\times \min\Bigl(1,\frac{\ln(U+1)}{\ln(101)}\Bigr)
\]

- \(S\) = `success_rate_7d`
- \(U\) = `executions_7d`
- 使用 \(\ln(U+1)/\ln(101)\) 做归一化，使 usage 分数在 \(U \ge 100\) 时封顶为 1，避免被刷量冲爆。

### 颜色规则（红黄绿）

- GREEN：`gate_score_7d ≥ 0.65` 且 `executions_7d ≥ 20`
- YELLOW：`0.35 ≤ gate_score_7d < 0.65`
- RED：`gate_score_7d < 0.35`

> 注：`gate_pass` 仍然是更保守的“硬门槛”，和 GateScore 并存。

## Lifecycle（建议动作）

目标：给运营一个“下一步做什么”的明确提示，且 **不自动改库**（只推荐，不执行）。

在 DB 视图 `public.v_prompt_template_lifecycle` / `public.v_prompt_templates_admin_list` 中提供：

- `lifecycle_recommendation`：`HARD_KILL | FREEZE | PROMOTE | KEEP`
- `lifecycle_should_unpublish`：boolean（是否建议停止发布）
- `last_execute_at`：最近一次 execute 的时间（用于“冷却”判断）

### 阈值（当前实现）

- **HARD_KILL（直接淘汰）**
  - `executions_7d ≥ 20` 且 `success_rate_7d < 0.15`
  - 或 `failure_7d ≥ 10` 且 `success_7d = 0`

- **FREEZE（冷冻）**
  - `executions_7d ≥ 10` 且 `success_rate_7d < 0.30`
  - 或 `last_execute_at < now() - 7 days`（7 天未调用）

- **PROMOTE（晋升候选）**
  - `executions_30d ≥ 50`
  - `completion_rate_30d ≥ 0.65`
  - `gate_score_7d ≥ 0.70`

> PROMOTE 只代表“有资格进入 Scene Draft / 人工复核”，不会自动发布、不会自动进入 SEO。

## 隔离结构（Prompt → Scene → SEO）

Prompt（内部资产）永远不直达 SEO。唯一缓冲区是 Scene Draft，最终只有 Scene Page 面向用户与搜索引擎。

```text
Prompt (Internal Asset)
  - noindex
  - no sitemap
  - not user-facing
  - gate-controlled
        |
        v
Scene Draft (Content Candidate)
  - human review
  - still no SEO
        |
        v
Scene Page (SEO First-Class)
  - indexable
  - sitemap
  - user visible
```

