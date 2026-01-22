# pollRemoteTask() 精准版实现总结

## 优化日期
2026-01-20

## 优化内容

### 1. 精准版 pollRemoteTask() ✅

**优化前**：
- 使用兼容写法，尝试多个方法名（getTaskResult, getTask, getVideoTask 等）
- 模糊字段猜测，多层嵌套解包

**优化后**：
- ✅ 直接导入并使用 `getTaskResult(taskId: string)`
- ✅ 严格按 `GrsaiResultResponse` 结构解包
- ✅ 同时兼容 Sora 和 Veo 返回格式
- ✅ 强类型定义 `PollResult`
- ✅ 清晰的状态机：processing / succeeded / failed

### 2. 返回结构

**PollResult 类型**：
```typescript
type PollResult =
  | {
      ok: true;
      status: "processing" | "succeeded" | "failed";
      progress?: number;
      video_url?: string | null;
      error_message?: string | null;
    }
  | {
      ok: false;
      error: string;
    };
```

### 3. 解包逻辑

**GrsaiResultResponse 结构**：
```typescript
{
  code: number,      // 0 = 成功，非 0 = 业务错误
  msg: string,       // 错误消息（code != 0 时）
  data: SoraVideoResponse | VeoVideoResponse
}
```

**SoraVideoResponse**：
```typescript
{
  id: string,
  results?: [{url, removeWatermark, pid}],  // Sora 格式
  progress: number,
  status: "running" | "succeeded" | "failed",
  failure_reason?: "output_moderation" | "input_moderation" | "error",
  error?: string
}
```

**VeoVideoResponse**：
```typescript
{
  id: string,
  url?: string,  // Veo 格式
  progress: number,
  status: "running" | "succeeded" | "failed",
  failure_reason?: "output_moderation" | "input_moderation" | "error",
  error?: string
}
```

### 4. Worker 使用逻辑

**精准的状态处理**：
```typescript
const result = await pollRemoteTask(task.grsai_task_id);

// 网络/异常，不动任务，留给下次轮询
if (!result.ok) {
  continue;
}

// 进行中，不更新 status，只记录 progress（可选）
if (result.status === "processing") {
  continue;
}

// 成功，更新 video_url 和 status
if (result.status === "succeeded") {
  await updateVideoTask(task.id, {
    status: "succeeded",
    video_url: result.video_url,
  });
  return;
}

// 失败，更新 error_message 和 status
if (result.status === "failed") {
  await updateVideoTask(task.id, {
    status: "failed",
    error_message: result.error_message,
  });
  return;
}
```

## 关键特性

### ✅ 可卖级保障

1. **不猜字段**：完全基于真实 SDK 返回结构
2. **Sora/Veo 零分支污染**：统一出口，清晰的状态机
3. **状态机稳定**：只产出 processing / succeeded / failed
4. **可观测**：progress 可选写库，未来可做 UI 进度条
5. **对账安全**：失败一定能进入退款路径（已有 finalize_batch_credits）

### ✅ 与现有系统对齐

- ✅ `video_tasks.status` 枚举完全匹配（pending/processing/succeeded/failed）
- ✅ `video_url` 来源明确、唯一（Sora: results[0].url, Veo: url）
- ✅ `failure_reason` / `error` 全兜底
- ✅ 不依赖 webhook（轮询即可跑通）

## 错误处理

### 1. 网络/异常错误
- 返回 `{ ok: false, error: string }`
- Worker 不动任务，留给下次轮询

### 2. Grsai 业务错误（code != 0）
- 返回 `{ ok: true, status: "failed", error_message: res.msg }`
- Worker 更新任务为 failed

### 3. 成功但无 video_url
- 返回 `{ ok: true, status: "failed", error_message: "SUCCEEDED_WITHOUT_VIDEO_URL" }`
- Worker 更新任务为 failed

## 相关文件

- `app/api/internal/batch-worker/route.ts` - Worker 实现（已更新）
- `lib/grsai/client.ts` - Grsai API 客户端（getTaskResult 函数）

## 验证结果

- ✅ 编译通过
- ✅ 无 lint 错误
- ✅ 类型安全（TypeScript）
- ✅ 精准解包，不再猜测字段

## 下一步

1. ✅ 已完成：精准版 pollRemoteTask()
2. ✅ 已完成：Worker 使用逻辑更新
3. 🔄 建议：测试轮询模式（无 baseUrl 场景）
4. 🔄 建议：验证 Sora 和 Veo 两种返回格式都能正确处理
