# 生产级护栏实现总结

## 实现日期
2026-01-20

## 三个生产级护栏

### 1. 防重复 enqueue ✅

**问题**：幂等不只防"重复创建"，还要防"重复 enqueue"。如果创建成功但 enqueue 请求超时重试，可能重复推队列。

**解决方案**：
- 在 `batch_jobs` 表中添加 `enqueued_at` 字段（migration 105）
- enqueue 前检查 `enqueued_at` 是否已存在
- enqueue 成功后写入 `enqueued_at` 时间戳
- worker claim 时也可作为二次确认

**实现位置**：`app/api/enterprise/video-batch/route.ts` (第 360-375 行)

```typescript
// 检查 enqueued_at 是否已存在
const { data: existingBatch } = await client
  .from("batch_jobs")
  .select("enqueued_at")
  .eq("id", batchId)
  .maybeSingle();

if (!existingBatch?.enqueued_at) {
  // 只有 enqueued_at 为空时才 enqueue
  enqueueResult = await tryEnqueueBatch(batchId);
  
  if (enqueueResult.enqueued) {
    // enqueue 成功后写入 enqueued_at
    await client
      .from("batch_jobs")
      .update({ enqueued_at: new Date().toISOString() })
      .eq("id", batchId);
  }
}
```

### 2. 返回字段 `enqueue` ✅

**问题**：让企业客户/你自己排障更直观，知道 batch 是否已 enqueue。

**解决方案**：
- 正常创建：`enqueue: "queued"`
- 幂等重放：`enqueue: "skipped_idempotent"`
- 额外字段：`enqueue_mode: "bullmq" | "pull-worker"`

**实现位置**：`app/api/enterprise/video-batch/route.ts` (第 250-255 行，第 390-395 行)

**返回示例**：
```json
{
  "ok": true,
  "batch_id": "uuid",
  "enqueue": "queued",  // 或 "skipped_idempotent"
  "enqueue_mode": "bullmq",  // 或 "pull-worker"
  ...
}
```

### 3. 余额快照标识 ✅

**问题**：把 `available_credits` 的语义固定成"调用时刻的可用余额快照"，避免客户误解为实时余额。

**解决方案**：
- 返回字段中添加 `balance_snapshot: true`
- 明确标识这是调用时刻的快照，不保证实时

**实现位置**：`app/api/enterprise/video-batch/route.ts` (第 252 行，第 392 行)

**返回示例**：
```json
{
  "ok": true,
  "available_credits": 1000,
  "balance_snapshot": true,  // 明确标识为快照
  ...
}
```

## A/B 两套代码实现

### A) Enterprise API (`/api/enterprise/video-batch`)

**功能**：
- ✅ 余额预检（基于 `credit_wallet`）
- ✅ 入库（`batch_jobs` + `video_tasks`）
- ✅ 幂等（`request_id`）
- ✅ enqueue（可选 BullMQ，有则推队列；没有则保持 queued 给 pull-worker）

**关键特性**：
- 支持 BullMQ（动态导入，可选依赖）
- 完整的幂等处理（usage unique constraint）
- 防重复 enqueue（`enqueued_at` 检查）
- 返回完整结构（含 `enqueue`、`balance_snapshot`）

### B) Internal Worker (`/api/internal/batch-worker`)

**功能**：
- ✅ 并发处理（一次 claim N 个 batch；每个 batch 内并发处理 M 个 task）
- ✅ 重试（对"可重试错误"自动重试，用 `MAX_TASK_RETRIES` 控制）
- ✅ 失败回滚（批次结算时自动按成功数扣费、失败数退款）
- ✅ Webhook 回调（批次完成/部分完成/失败时，给企业 webhook 发通知，HMAC 签名）

**关键特性**：
- 扣费只在 freeze 一次性预扣
- 结算只在 finalize 一次性退款差额
- 幂等 + 不重复扣
- 支持任务级重试（可配置重试次数）
- Webhook 签名（HMAC-SHA256）

## 环境变量配置

### A 侧（Enterprise API）
```bash
# 可选：BullMQ（有 REDIS_URL 才启用）
export REDIS_URL=""  # 没有就空：走 pull-worker
export BATCH_QUEUE_NAME="batch_jobs"  # 可选

# 必选
export ENTERPRISE_BATCH_COST_PER_VIDEO=10
```

### B 侧（Internal Worker）
```bash
# 必选
export INTERNAL_WORKER_SECRET="xxx"
export BATCH_CLAIM_LIMIT=5
export BATCH_TASK_CONCURRENCY=3
export MAX_TASK_RETRIES=2

# 接真实生成才需要
export INTERNAL_GENERATE_ENDPOINT="https://your-domain/api/internal/generate"
export INTERNAL_GENERATE_SECRET="xxx"
```

## 数据库 Migration

### Migration 105: `enqueued_at` 字段
```sql
alter table batch_jobs
add column if not exists enqueued_at timestamptz;

create index if not exists idx_batch_jobs_enqueued_at
on batch_jobs(enqueued_at)
where enqueued_at is not null;
```

## 关键提醒（防线上事故的 2 条硬规）

1. **扣费只能在 freeze 发生一次**（已做到）
   - 所有扣费逻辑都在 `freeze_credits_for_batch` RPC 中
   - 幂等保障：RPC 内部有幂等检查

2. **幂等闸门必须在入库前生效**（已用 usage unique constraint 做到）
   - `enterprise_api_usage` 表的 `(api_key_id, request_id)` 唯一约束
   - 在写入 usage 时立即检查冲突
   - 冲突时直接返回已存在的 batch_id

## 测试建议

### 1. 幂等性测试
```bash
# 使用相同 request_id 连续 POST 2 次
REQ_ID="test-$(date +%s)"
curl -X POST "$BASE_URL/api/enterprise/video-batch" \
  -H "x-api-key: $KEY" \
  -H "x-request-id: $REQ_ID" \
  -d '{"items":[{"prompt":"test"}]}'

# 第二次应返回 idempotent_replay: true
curl -X POST "$BASE_URL/api/enterprise/video-batch" \
  -H "x-api-key: $KEY" \
  -H "x-request-id: $REQ_ID" \
  -d '{"items":[{"prompt":"test"}]}'
```

### 2. Enqueue 防重复测试
```bash
# 创建 batch 后，检查 enqueued_at 是否写入
# 再次调用 enqueue（应该被跳过）
```

### 3. Worker 测试
```bash
# 触发 worker
curl -X POST "$BASE_URL/api/internal/batch-worker" \
  -H "x-worker-secret: $SECRET"

# 检查：
# - 是否并发处理任务
# - 失败任务是否重试
# - 结算是否正确（成功扣费，失败退款）
# - Webhook 是否发送
```

## 相关文件

- `app/api/enterprise/video-batch/route.ts` - Enterprise API 实现
- `app/api/internal/batch-worker/route.ts` - Internal Worker 实现
- `supabase/migrations/105_add_enqueued_at_to_batch_jobs.sql` - enqueued_at 字段
- `scripts/test-batch-flow.sh` - 自动化测试脚本

## 验证结果

- ✅ 编译通过
- ✅ 无 lint 错误（已修复）
- ✅ 三个生产级护栏已实现
- ✅ A/B 两套代码已覆盖

## 下一步

1. ✅ 已完成：三个生产级护栏、A/B 两套代码
2. 🔄 建议：运行完整测试流程，验证所有功能
3. 🔄 建议：在生产环境部署前，再次验证幂等性和 enqueue 防重复逻辑
