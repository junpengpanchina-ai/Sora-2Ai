# Prompt 埋点事件名规范（prompt_template_events）

目标：让 7d/30d/Gate/ROI/A-B 指标长期稳定可算，避免出现 `video_success` / `gen_ok` / `purchase_done` 这种自由发挥导致的数据污染。

## 事实表与字段约定

表：`public.prompt_template_events`

### 必填（强制）

- `occurred_at`：事件发生时间（server 写入）
- `event_type`：事件类型（严格白名单）
- `prompt_template_id`
- `session_id`（强烈建议）

### 强烈建议（用于幂等与可观测）

- `request_id`：幂等追踪（同一次执行的唯一 id，建议客户端生成）
- `props`：JSON payload（严格规范字段名）

## event_type 白名单（只允许这些）

### 核心四个（用于 4 个 LTV 指标）

- `execute`：用户点击生成 / 开始执行
- `success`：视频生成成功且可交付
- `failure`：生成失败（可重试）
- `paid`：发生付费（充值成功/订单成功，可选）

> 推荐口径（更稳）：**不强依赖 `paid` 事件**，而是把“付费发生”统一记录为 `revenue_cents > 0`（写在任意相关事件上都行，比如 `success` 或单独的 `paid`）。
> 这样不需要区分“充值/购买/升级”，ΔCR/ROI 永远算得通。

### 其它（可选但推荐）

- `impression`：Prompt 被展示/分配
- `variant_shown`：A/B variant 被分桶/曝光
- `variant_generate`：用户在成功页点“生成 variants”
- `favorite`：收藏 Prompt（强复用信号）
- `reuse`：同 prompt 第二次及以后执行（也可由后端派生）

> 规则：任何历史命名都必须映射到以上白名单（例：`video_generated_ok` → `success`，`payment_succeeded` → `paid` 或 `revenue_cents > 0`）。

## props 统一字段（强规范）

所有事件 `props` 建议按下面命名（统一 camel_case，避免未来 join/聚合痛苦）：

```ts
export type PromptEventProps = {
  scene_id?: string;

  // AB
  experiment_id?: string;
  variant_id?: string;        // "A" | "B" | "WINNER" | uuid
  rollout_pct?: number;       // 0-100
  weight?: number;            // 0-100

  // Execution
  model_target?: "Sora-2" | "Veo-Fast" | "Veo-Pro";
  duration_sec?: number;
  aspect_ratio?: "9:16" | "16:9" | "1:1";
  locale?: string;

  // Outcome
  error_code?: string;        // e.g. "MODEL_TIMEOUT"
  error_class?: string;       // e.g. "ProviderError"
  provider?: "grsai" | "openai" | "google";
  latency_ms?: number;

  // Commerce
  amount_cents?: number;
  currency?: string;          // "USD"
  credits_purchased?: number;
  credits_spent?: number;
  plan_id?: string;           // e.g. "credits_500"
};
```

## 建议的前端统一入口

前端只允许通过一个函数发埋点，避免散落：

- `lib/analytics/prompt-template-events.ts`
  - `trackPromptEvent(...)`
  - `PromptEventType` 白名单

对应后端入口：

- `POST /api/events/prompt-template`

## 上线必做检查（10 分钟）

- 全仓检查：是否存在不在白名单内的 `event_type`
- DB 检查：最近 24h 的 `event_type` 分布是否有脏值
- Admin 列表确认 4 个字段可见且不报错：
  - `t_first_success_median_sec_30d`
  - `completion_rate_30d`
  - `reuse_rate_30d`
  - `delta_cr_30d`

