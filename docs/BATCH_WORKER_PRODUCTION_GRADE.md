# Batch Worker 生产级实现总结

## 实现日期
2026-01-20

## 核心功能

### 1. 生产级 Worker（B1）
- ✅ **Dispatch 阶段**：claim queued → processing，freeze credits，启动 pending tasks
- ✅ **Poll 阶段**：更新 processing tasks（不把 transient poll error 标 failed）
- ✅ **Settle 阶段**：全完成 batch 结算+退款，并 webhook 通知

### 2. 企业 Webhook 回调（B2）
- ✅ **签名**：HMAC-SHA256 签名
- ✅ **超时**：可配置超时时间（默认 5s）
- ✅ **重试**：指数退避重试（500ms, 1500ms, 3500ms...）
- ✅ **失败不影响结算**：webhook 失败不影响资金结算

## 三个锦上添花功能

### 1. 轮询退避策略 ✅

**功能**：根据 progress 和轮询次数动态调整延迟

**实现**：
```typescript
function getPollBackoffDelay(progress: number | null | undefined, pollCount: number): number {
  // progress < 100 → 延迟 5s / 15s / 30s（根据轮询次数）
  if (progress === null || progress === undefined || progress < 100) {
    if (pollCount <= 1) return 5000;  // 5s
    if (pollCount <= 3) return 15000; // 15s
    return 30000; // 30s
  }
  return 0; // progress = 100，立即轮询
}
```

**策略**：
- 第 1 次轮询：延迟 5 秒
- 第 2-3 次轮询：延迟 15 秒
- 第 4 次及以后：延迟 30 秒
- progress = 100：立即轮询（不延迟）

**数据库字段**：
- `video_tasks.poll_count`：轮询次数
- `video_tasks.last_poll_at`：上次轮询时间

### 2. 最大轮询次数保护 ✅

**功能**：避免死任务无限轮询

**实现**：
```typescript
function shouldPollTask(task: VideoTaskRow, maxPollCount: number): { should: boolean; reason?: string } {
  const pollCount = task.poll_count ?? 0;
  if (pollCount >= maxPollCount) {
    return {
      should: false,
      reason: `MAX_POLL_COUNT_REACHED:${maxPollCount}`,
    };
  }
  // ... 退避延迟检查
  return { should: true };
}
```

**配置**：
- 环境变量：`BATCH_MAX_POLL_COUNT`（默认 20）
- 达到最大次数后，任务自动标记为 `failed`，`failure_type = "timeout"`

**保护机制**：
- 防止任务无限轮询
- 自动标记超时任务为失败
- 触发退款流程

### 3. 失败类型枚举化 ✅

**功能**：用于 Admin 统计，区分不同类型的失败原因

**失败类型枚举**：
```typescript
type FailureType =
  | "model_error"  // 模型错误（API 401/403，模型不可用）
  | "param_error"  // 参数错误（400，invalid param）
  | "timeout"      // 超时（达到最大轮询次数）
  | "network"      // 网络错误（连接失败，fetch failed）
  | "unknown";     // 未知错误
```

**分类逻辑**：
```typescript
function classifyFailureType(error: string | null): FailureType {
  if (!error) return "unknown";
  const e = error.toLowerCase();
  if (e.includes("timeout") || e.includes("超时")) return "timeout";
  if (e.includes("network") || e.includes("连接") || e.includes("fetch failed")) return "network";
  if (e.includes("model") || e.includes("api") || e.includes("401") || e.includes("403")) return "model_error";
  if (e.includes("param") || e.includes("invalid") || e.includes("400")) return "param_error";
  return "unknown";
}
```

**数据库字段**：
- `video_tasks.failure_type`：失败类型（可选，用于 Admin 统计）

**使用场景**：
- Admin 面板统计：按失败类型分组统计
- 问题诊断：快速定位是模型问题还是参数问题
- 趋势分析：监控各类型失败率变化

## 关键特性

### ✅ 并发可控
- `BATCH_WORKER_MAX_CLAIM`：每次最多 claim 的 batch 数（默认 5）
- `BATCH_WORKER_MAX_START_TASKS_PER_BATCH`：每个 batch 最多同时启动的任务数（默认 10）
- `BATCH_WORKER_MAX_POLL`：每次最多轮询的任务数（默认 25）
- `BATCH_WORKER_MAX_SETTLE`：每次最多结算的 batch 数（默认 10）

### ✅ 抗竞争
- claim 与 enqueue 都用 `eq(status, expected)` 的 CAS 更新，避免重复执行
- 使用 `maybeSingle()` 确保原子性

### ✅ 抗抖动
- poll 的网络/临时失败不把任务标 failed（只要下一轮还能继续）
- 退避策略避免频繁轮询

### ✅ 失败不污染资金
- freeze 失败直接 batch failed（不会进入结算）
- 结算独立：webhook 失败不影响结算（可卖级 SLA）

## 数据库迁移

### 107_add_poll_tracking_to_video_tasks.sql
```sql
alter table video_tasks
  add column if not exists poll_count int not null default 0,
  add column if not exists last_poll_at timestamptz,
  add column if not exists failure_type text;

create index if not exists idx_video_tasks_poll_tracking
on video_tasks(batch_job_id, status, poll_count, last_poll_at)
where status = 'processing' and grsai_task_id is not null;
```

### 106_get_enterprise_webhook_for_batch.sql
```sql
create or replace function get_enterprise_webhook_for_batch(p_batch_id uuid)
returns table (url text, secret text)
-- 从 batch_jobs.webhook_url 读取
```

## 相关文件

- `app/api/internal/batch-worker/route.ts` - 生产级 Worker（已更新）
- `lib/batch/webhook.ts` - 企业 Webhook 回调（新建）
- `lib/batch/pollRemoteTask.ts` - 精准版轮询函数（新建）
- `supabase/migrations/106_get_enterprise_webhook_for_batch.sql` - Webhook RPC（新建）
- `supabase/migrations/107_add_poll_tracking_to_video_tasks.sql` - 轮询跟踪字段（新建）

## 环境变量

```bash
# Worker 配置
BATCH_WORKER_MAX_CLAIM=5
BATCH_WORKER_MAX_START_TASKS_PER_BATCH=10
BATCH_WORKER_MAX_POLL=25
BATCH_WORKER_MAX_SETTLE=10
BATCH_MAX_POLL_COUNT=20

# Webhook 配置
ENTERPRISE_WEBHOOK_RETRIES=3
ENTERPRISE_WEBHOOK_TIMEOUT_MS=5000
ENTERPRISE_WEBHOOK_SECRET=your-secret-here

# Worker 认证
INTERNAL_WORKER_SECRET=your-worker-secret-here
```

## 验证结果

- ✅ 编译通过
- ✅ 无 lint 错误
- ✅ 类型安全（TypeScript）
- ✅ 三个锦上添花功能已实现
- ✅ 生产级 Worker 已实现
- ✅ 企业 Webhook 回调已实现

## 下一步

1. ✅ 已完成：生产级 Worker
2. ✅ 已完成：企业 Webhook 回调
3. ✅ 已完成：轮询退避策略
4. ✅ 已完成：最大轮询次数保护
5. ✅ 已完成：失败类型枚举化
6. 🔄 建议：测试轮询模式（无 baseUrl 场景）
7. 🔄 建议：验证退避策略和最大轮询次数保护
8. 🔄 建议：在 Admin 面板中展示失败类型统计
