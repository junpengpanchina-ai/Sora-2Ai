# Enterprise API 幂等性升级总结

## 升级日期
2026-01-20

## 升级内容

### 1. 添加辅助函数 ✅

#### `normalizeRequestId(v: unknown): string | null`
- **功能**：规范化 request_id，避免空串/超长导致索引或日志问题
- **规则**：
  - 非字符串返回 `null`
  - 空串返回 `null`
  - 超过 128 字符自动截断

#### `successResponse(p: SuccessPayload)`
- **功能**：统一成功返回结构，避免前端/客户 SDK 出现分支 bug
- **类型**：`SuccessPayload` 包含所有必要字段

### 2. 幂等处理逻辑增强 ✅

#### 早期幂等检查（116-171行）
- **改进前**：只返回 `batch_id` 和 `idempotent_replay`
- **改进后**：返回完整结构，包括：
  - `total_count`
  - `cost_per_video`
  - `required_credits`
  - `available_credits`
  - `status`（从 batch_jobs 读取真实状态）

#### 主要幂等处理（298-376行）
- **改进前**：简单查询，缺少错误处理
- **改进后**：
  - ✅ 完整的错误处理（`IDEMPOTENCY_LOOKUP_FAILED`, `IDEMPOTENCY_INCONSISTENT`, `IDEMPOTENCY_BATCH_NOT_FOUND`）
  - ✅ 从 batch_jobs 读取 `status`，返回真实状态（queued/processing/completed/partial/failed）
  - ✅ 使用 `successResponse` 统一返回结构

### 3. 成功返回统一化 ✅

#### 正常成功返回（506行）
- **改进前**：直接 `NextResponse.json(...)`
- **改进后**：使用 `successResponse(...)` 统一函数

**返回结构**：
```typescript
{
  ok: true,
  request_id: string | null,
  batch_id: string,
  total_count: number,
  cost_per_video: number,
  required_credits: number,
  available_credits: number,
  status: "queued" | "processing" | "completed" | "partial" | "failed"
}
```

**幂等返回**（额外字段）：
```typescript
{
  ...（同上所有字段）,
  idempotent_replay: true
}
```

## 关键改进点

### ✅ 可卖级保障

1. **统一返回结构**
   - 正常创建和幂等重放返回完全一致的结构
   - 前端/客户 SDK 无需处理分支逻辑

2. **真实状态返回**
   - 幂等重放时返回 batch 的真实状态（queued/processing/completed 等）
   - 客户重放请求时能看到 batch 的当前状态

3. **完整错误处理**
   - `IDEMPOTENCY_LOOKUP_FAILED`：查询已存在 usage 失败
   - `IDEMPOTENCY_INCONSISTENT`：有 unique 冲突却查不到记录（理论上不会发生）
   - `IDEMPOTENCY_BATCH_NOT_FOUND`：batch_job_id 存在但 batch 不存在

4. **request_id 规范化**
   - 自动截断超长 request_id（>128 字符）
   - 避免索引和日志问题

## 测试建议

### 1. 正常创建测试
```bash
curl -X POST "$BASE_URL/api/enterprise/video-batch" \
  -H "x-api-key: $ENTERPRISE_API_KEY" \
  -H "x-request-id: test-$(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"prompt":"test"}]}'
```

**预期**：
- `ok: true`
- `status: "queued"`
- 包含所有字段（total_count, cost_per_video, required_credits, available_credits）

### 2. 幂等重放测试
```bash
REQ_ID="test-$(date +%s)"
# 第一次调用
curl -X POST "$BASE_URL/api/enterprise/video-batch" \
  -H "x-api-key: $ENTERPRISE_API_KEY" \
  -H "x-request-id: $REQ_ID" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"prompt":"test"}]}'

# 第二次调用（相同 request_id）
curl -X POST "$BASE_URL/api/enterprise/video-batch" \
  -H "x-api-key: $ENTERPRISE_API_KEY" \
  -H "x-request-id: $REQ_ID" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"prompt":"test"}]}'
```

**预期**：
- 第二次调用返回 `idempotent_replay: true`
- 返回相同的 `batch_id`
- 返回完整结构（与第一次一致）
- 如果 batch 状态已变化（processing/completed），返回真实状态

### 3. 超长 request_id 测试
```bash
LONG_ID="$(python3 -c "print('a' * 200)")"
curl -X POST "$BASE_URL/api/enterprise/video-batch" \
  -H "x-api-key: $ENTERPRISE_API_KEY" \
  -H "x-request-id: $LONG_ID" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"prompt":"test"}]}'
```

**预期**：
- request_id 自动截断为 128 字符
- 功能正常，无错误

## 相关文件

- `app/api/enterprise/video-batch/route.ts` - 主 API 实现
- `scripts/test-batch-flow.sh` - 自动化测试脚本（已支持断言）

## 验证结果

- ✅ 编译通过
- ✅ 无 lint 错误
- ✅ 所有函数正确引用
- ✅ 类型安全（TypeScript）

## 下一步

1. ✅ 已完成：统一返回结构、幂等处理增强、错误处理完善
2. 🔄 建议：运行完整测试流程，验证幂等性
3. 🔄 建议：在生产环境部署前，再次验证所有边界情况
