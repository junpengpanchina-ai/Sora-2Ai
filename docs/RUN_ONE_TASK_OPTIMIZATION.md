# runOneTask() 优化总结

## 优化日期
2026-01-20

## 优化内容

### 1. 直接调用现有生成逻辑 ✅

**优化前**：
- 调用不存在的 `INTERNAL_GENERATE_ENDPOINT`
- 期望返回 `{ video_url }`，但实际生成是异步的

**优化后**：
- 直接调用 `createSoraVideoTask` 或 `createVeoVideoTask`
- 完全贴合现有的生成链路，无需手动适配
- 支持 Sora-2 和 Veo 模型（veo-flash, veo-pro）

### 2. 字段映射 ✅

**video_tasks 表字段**：
- ✅ `status` - 任务状态（queued/processing/succeeded/failed）
- ✅ `prompt` - 提示词
- ✅ `model` - 模型（sora-2/veo-flash/veo-pro）
- ✅ `reference_url` - 参考图片 URL（Sora 用 `url`，Veo 用 `urls`）
- ✅ `aspect_ratio` - 视频比例（9:16/16:9）
- ✅ `duration` - 视频时长（Sora 用，Veo 不支持）
- ✅ `meta` - JSONB 字段，可存储 Veo 特定参数（firstFrameUrl, lastFrameUrl, urls）
- ✅ `video_url` - 生成的视频 URL（通过 webhook 回调更新）
- ✅ `error_message` - 错误信息
- ✅ `grsai_task_id` - Grsai API 返回的任务 ID
- ✅ `batch_job_id`, `batch_index` - batch 关联字段

### 3. 异步生成处理 ✅

**生成流程**：
1. Worker 调用 `runOneTask()` 提交任务到 Grsai API
2. 更新 `video_tasks` 表的 `grsai_task_id` 和 `status = "processing"`
3. Grsai API 异步生成视频
4. 通过 webhook 回调更新 `video_url` 和 `status`
5. Worker 下次运行或 webhook 回调后，检查所有任务是否完成
6. 所有任务完成后，进行结算（成功扣费，失败退款）

**Webhook 配置**：
- 如果 `NEXT_PUBLIC_APP_URL` 或 `APP_URL` 存在，使用 webhook 回调
- 否则使用轮询模式（`webHook: "-1"`）

### 4. 模型参数处理 ✅

**Sora-2 模型**：
```typescript
{
  model: "sora-2",
  prompt: string,
  aspectRatio: "9:16" | "16:9",
  duration: 10 | 15,
  size: "small",
  url?: string,  // 参考图片（从 reference_url 提取）
  webHook: string,
  shutProgress: false
}
```

**Veo 模型**：
```typescript
{
  model: "veo3.1-fast" | "veo3.1-pro",
  prompt: string,
  aspectRatio: "16:9" | "9:16",
  firstFrameUrl?: string,  // 从 meta 提取
  lastFrameUrl?: string,   // 从 meta 提取
  urls?: string[],         // 从 meta 或 reference_url 提取（最多3张）
  webHook: string,
  shutProgress: false
}
```

### 5. 错误处理 ✅

- ✅ 网络错误自动重试（由 `createSoraVideoTask`/`createVeoVideoTask` 内部处理）
- ✅ API 错误（401/403/429/5xx）有明确的错误信息
- ✅ 任务提交失败时，标记为 `failed` 并记录错误信息
- ✅ 支持任务级重试（`MAX_TASK_RETRIES` 控制）

## 关键改进点

### ✅ 即插即用

- 无需配置 `INTERNAL_GENERATE_ENDPOINT`
- 直接使用现有的 Grsai API 客户端
- 自动处理 Sora 和 Veo 模型的参数差异

### ✅ 异步生成支持

- 任务提交后立即返回，不阻塞 worker
- 通过 webhook 回调或轮询更新任务状态
- Worker 只结算已完成的任务

### ✅ 字段完整映射

- 支持所有 `video_tasks` 表字段
- 正确处理 `meta` JSONB 字段（Veo 特定参数）
- 自动提取 `reference_url` 到对应的 API 参数

## 使用方式

### 环境变量（可选）

```bash
# Webhook 回调 URL（如果未设置，使用轮询模式）
export NEXT_PUBLIC_APP_URL="https://your-domain.com"
# 或
export APP_URL="https://your-domain.com"
```

### 任务数据格式

**Sora 任务**：
```json
{
  "id": "task-uuid",
  "user_id": "user-uuid",
  "prompt": "A cinematic video",
  "model": "sora-2",
  "reference_url": "https://example.com/image.jpg",
  "aspect_ratio": "9:16",
  "duration": 10
}
```

**Veo 任务**：
```json
{
  "id": "task-uuid",
  "user_id": "user-uuid",
  "prompt": "A cinematic video",
  "model": "veo-flash",
  "aspect_ratio": "16:9",
  "meta": {
    "firstFrameUrl": "https://example.com/first.jpg",
    "lastFrameUrl": "https://example.com/last.jpg",
    "urls": ["https://example.com/ref1.jpg"]
  }
}
```

## 相关文件

- `app/api/internal/batch-worker/route.ts` - Worker 实现（已优化）
- `lib/grsai/client.ts` - Grsai API 客户端
- `app/api/video/generate/route.ts` - 现有生成 API（参考实现）
- `supabase/migrations/003_create_video_tasks_table.sql` - video_tasks 表结构

## 验证结果

- ✅ 编译通过
- ✅ 无 lint 错误
- ✅ 类型安全（TypeScript）
- ✅ 完全贴合现有生成链路

## 注意事项

1. **异步生成**：任务提交后不会立即返回 `video_url`，需要通过 webhook 回调或轮询获取
2. **Webhook 回调**：确保 `/api/video/callback` 端点可以正确处理 batch 任务
3. **结算时机**：Worker 只结算已完成的任务（有 `video_url` 或 `status = "failed"`）
4. **重试逻辑**：任务提交失败会自动重试（由 Grsai API 客户端内部处理）

## 下一步

1. ✅ 已完成：`runOneTask()` 优化，直接调用现有生成逻辑
2. 🔄 建议：测试 webhook 回调是否正确更新 batch 任务状态
3. 🔄 建议：验证异步生成的结算逻辑是否正确
