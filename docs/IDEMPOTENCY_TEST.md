# 幂等性测试说明

## 测试位置
`scripts/test-batch-flow.sh` - Step 1.5

## 测试目的
验证 Enterprise API 的幂等性保障：使用相同的 `request_id` 连续 POST 2 次，第二次应返回 `idempotent_replay === true` 且 `batch_id` 与第一次一致。

## 测试流程

### 1. 第一次调用（Step 1）
```bash
POST /api/enterprise/video-batch
Headers:
  x-api-key: $ENTERPRISE_API_KEY
  x-request-id: $REQ_ID
Body:
  {
    "items": [
      {"prompt":"A cinematic video of a city at sunset"},
      {"prompt":"An anime style video of a cat playing"}
    ]
  }
```

**预期返回**：
```json
{
  "ok": true,
  "batch_id": "uuid-1",
  "total_count": 2,
  "cost_per_video": 10,
  "required_credits": 20,
  "available_credits": 1000,
  "status": "queued",
  "request_id": "test-xxx"
}
```

### 2. 第二次调用（Step 1.5 - 幂等性测试）
使用**相同的 `request_id`** 再次调用：

```bash
POST /api/enterprise/video-batch
Headers:
  x-api-key: $ENTERPRISE_API_KEY
  x-request-id: $REQ_ID  # 相同！
Body:
  {
    "items": [
      {"prompt":"A cinematic video of a city at sunset"},
      {"prompt":"An anime style video of a cat playing"}
    ]
  }
```

**预期返回**：
```json
{
  "ok": true,
  "batch_id": "uuid-1",  # 与第一次相同！
  "idempotent_replay": true,  # 关键字段
  "total_count": 2,
  "cost_per_video": 10,
  "required_credits": 20,
  "available_credits": 1000,
  "status": "queued",
  "request_id": "test-xxx"
}
```

## 断言检查

脚本会自动检查以下 3 个断言：

1. ✅ **`ok === true`**
   - 第二次调用必须返回成功
   - 失败则退出并显示错误

2. ✅ **`idempotent_replay === true`**
   - 必须标识为幂等重放
   - 失败则退出并显示错误

3. ✅ **`batch_id` 一致**
   - 第二次返回的 `batch_id` 必须与第一次相同
   - 失败则退出并显示两个 batch_id

## 测试输出示例

### 成功场景
```
1.5) 🔄 Test idempotency (same request_id, POST twice) ...
   First call batch_id: 123e4567-e89b-12d3-a456-426614174000
   Making second call with same request_id: test-1705747200
{
  "ok": true,
  "batch_id": "123e4567-e89b-12d3-a456-426614174000",
  "idempotent_replay": true,
  "total_count": 2,
  "cost_per_video": 10,
  "required_credits": 20,
  "available_credits": 1000,
  "status": "queued",
  "request_id": "test-1705747200"
}
✅ Idempotency test passed:
   idempotent_replay: true
   batch_id matches: 123e4567-e89b-12d3-a456-426614174000
```

### 失败场景（batch_id 不匹配）
```
❌ Idempotency test failed: batch_id mismatch
   First call:  123e4567-e89b-12d3-a456-426614174000
   Second call: 987fcdeb-51a2-43f1-b789-123456789abc
```

## 运行方式

```bash
export ENTERPRISE_API_KEY="your-key"
export INTERNAL_WORKER_SECRET="your-secret"

./scripts/test-batch-flow.sh
```

## 依赖

- ✅ `jq`（推荐）：用于 JSON 解析和断言
- ✅ `curl`：必需
- ⚠️ 如果没有 `jq`，幂等性测试会被跳过（但不会影响其他测试）

## 注意事项

1. **不会重复扣费**：第二次调用不会创建新的 batch，也不会扣除 credits
2. **不会重复入库**：第二次调用不会插入新的 `batch_jobs` 或 `video_tasks` 记录
3. **返回完整结构**：幂等返回包含所有字段（与正常创建一致）
4. **真实状态**：如果 batch 状态已变化（processing/completed），返回真实状态

## 相关文件

- `scripts/test-batch-flow.sh` - 测试脚本
- `app/api/enterprise/video-batch/route.ts` - API 实现
- `docs/ENTERPRISE_API_IDEMPOTENCY_UPGRADE.md` - 幂等性升级文档
