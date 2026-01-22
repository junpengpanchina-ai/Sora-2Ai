# Batch Worker 最终实现总结

## 实现日期
2026-01-20

## 完成的工作

### 1. Worker 核心功能 ✅

**A) 创建远程任务（createRemoteTask）**
- ✅ 处理 `pending/queued` 且没有 `grsai_task_id` 的任务
- ✅ 支持 Sora-2 和 Veo 模型（veo-flash, veo-pro）
- ✅ 自动构建 webhook URL（有 baseUrl）或使用轮询模式（"-1"）
- ✅ 更新 `video_tasks` 表的 `grsai_task_id` 和 `status = "processing"`

**B) 轮询任务状态（pollRemoteTask）**
- ✅ 当没有 baseUrl 时，轮询 `processing` 且有 `grsai_task_id` 的任务
- ✅ 兼容 `getTaskResult` 返回格式：`{ code, msg, data: { status, url, ... } }`
- ✅ 更新任务状态为 `succeeded`（有 video_url）或 `failed`

**C) 结算退款（settle）**
- ✅ 只有当所有任务都进入 `succeeded/failed` 才结算
- ✅ 调用 `finalize_batch_credits` RPC 进行退款
- ✅ 更新 `batch_jobs` 状态和结算信息

### 2. Enterprise API 字段映射 ✅

**video_tasks 入库字段**：
```typescript
{
  batch_job_id: batchId,
  batch_index: idx,
  status: "pending",  // 改为 pending（符合表定义）
  prompt: string,
  model: string | null,
  meta: object | null,
  reference_url: string | null,
  aspect_ratio: string | null,
  duration: number | null,
}
```

**字段映射说明**：
- Sora-2：使用 `reference_url`、`aspect_ratio`、`duration`
- Veo：使用 `meta.firstFrameUrl`、`meta.lastFrameUrl`、`meta.urls`，`reference_url` 作为兜底

### 3. 工作流程

#### 有 baseUrl（Webhook 模式）
1. Worker 创建远程任务 → 写入 `grsai_task_id`，状态 `processing`
2. Grsai API 异步生成视频
3. Webhook 回调 `/api/video/callback?task_id=xxx` → 更新 `video_url` 和 `status`
4. 下一轮 Worker 检查所有任务完成 → 结算退款

#### 无 baseUrl（轮询模式）
1. Worker 创建远程任务 → 写入 `grsai_task_id`，状态 `processing`
2. Worker 轮询一次任务状态（使用 `getTaskResult`）
3. 如果任务完成，更新 `video_url` 和 `status`
4. 如果任务还在处理中，等待下一轮 Worker 再次轮询
5. 所有任务完成后，结算退款

## 关键特性

### ✅ 并发处理
- 使用 `TASK_CONCURRENCY` 控制并发数（默认 3）
- 每个 batch 内的任务并发创建

### ✅ 错误处理
- 创建任务失败 → 标记为 `failed`，记录错误信息
- 轮询失败 → 保持 `processing`，等待下一轮
- 结算失败 → 记录日志，不影响其他 batch

### ✅ 幂等保障
- 只处理 `pending/queued` 且没有 `grsai_task_id` 的任务
- 避免重复创建远程任务

### ✅ 字段兼容
- 支持所有 `video_tasks` 表字段
- 正确处理 `meta` JSONB 字段
- 兼容 Sora 和 Veo 模型的参数差异

## 环境变量

```bash
# Worker 认证（必选）
export INTERNAL_WORKER_SECRET="xxx"

# Worker 配置（可选）
export BATCH_CLAIM_LIMIT=5          # 每次 claim 的 batch 数量
export BATCH_TASK_CONCURRENCY=3     # 任务并发数

# Webhook 模式（可选，有则启用 webhook，无则轮询）
export NEXT_PUBLIC_SITE_URL="https://your-domain.com"
# 或
export SITE_URL="https://your-domain.com"
# 或
export NEXT_PUBLIC_APP_URL="https://your-domain.com"
# 或
export APP_URL="https://your-domain.com"
```

## 验收测试

### 1. 创建 Batch（1 Sora + 1 Veo）
```bash
curl -X POST "$BASE_URL/api/enterprise/video-batch" \
  -H "x-api-key: $ENTERPRISE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "prompt": "A cinematic video of a city",
        "model": "sora-2",
        "aspect_ratio": "9:16",
        "duration": 10
      },
      {
        "prompt": "An anime style video",
        "model": "veo-flash",
        "aspect_ratio": "16:9",
        "meta": {
          "firstFrameUrl": "https://example.com/first.jpg"
        }
      }
    ]
  }'
```

### 2. 触发 Worker
```bash
curl -X POST "$BASE_URL/api/internal/batch-worker" \
  -H "x-worker-secret: $INTERNAL_WORKER_SECRET"
```

**预期结果**：
- ✅ `video_tasks.grsai_task_id` 被写入
- ✅ `video_tasks.status` 变为 `processing`
- ✅ `batch_jobs.frozen_credits` 被设置

### 3. 等待完成

**Webhook 模式**：
- 等待 webhook 回调更新 `video_url` 和 `status`
- 再次触发 Worker → 自动结算退款

**轮询模式**：
- 多次触发 Worker → 每次轮询一次任务状态
- 所有任务完成后 → 自动结算退款

## 相关文件

- `app/api/internal/batch-worker/route.ts` - Worker 实现（已覆盖）
- `app/api/enterprise/video-batch/route.ts` - Enterprise API（已更新字段映射）
- `lib/grsai/client.ts` - Grsai API 客户端
- `supabase/migrations/003_create_video_tasks_table.sql` - video_tasks 表结构

## 验证结果

- ✅ 编译通过
- ✅ 无 lint 错误
- ✅ 类型安全（TypeScript）
- ✅ 完全贴合现有生成链路
- ✅ 支持 Webhook 和轮询两种模式

## 下一步

1. ✅ 已完成：Worker 创建任务、轮询、结算
2. ✅ 已完成：Enterprise API 字段映射
3. 🔄 建议：测试完整流程（创建 → Worker → Webhook/轮询 → 结算）
4. 🔄 建议：验证退款逻辑是否正确
