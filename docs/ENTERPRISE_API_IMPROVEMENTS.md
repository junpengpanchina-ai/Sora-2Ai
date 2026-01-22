# Enterprise API 改进总结

## 改进日期
2026-01-20

## 改进内容

### 1. 余额 RPC 返回值解包增强 ✅

**问题**：`get_total_available_credits` RPC 返回值可能以不同格式返回，直接 `Number(balanceData ?? 0)` 可能误判。

**解决方案**：实现稳健的多格式兼容解包：

```typescript
const raw = balanceData as any;
const available =
  typeof raw === "number"
    ? raw
    : typeof raw?.total === "number"
      ? raw.total
      : typeof raw?.available === "number"
        ? raw.available
        : typeof raw?.credits === "number"
          ? raw.credits
          : Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "number"
            ? raw[0]
            : 0;
const availableBalance = Number(available) || 0;
```

**兼容性**：
- ✅ 直接返回 INTEGER（当前实现）
- ✅ 返回 `{total: number}`
- ✅ 返回 `{available: number}`
- ✅ 返回 `{credits: number}`
- ✅ 返回数组 `[number]`

### 2. 幂等返回结构完善 ✅

**问题**：幂等重放时返回结构不完整，缺少 `cost_per_video`、`required_credits`、`available_credits` 等字段。

**解决方案**：
- 从已存在的 `batch_jobs` 读取 `total_count` 和 `cost_per_video`
- 计算 `required_credits = total_count * cost_per_video`
- 复用已计算的 `availableBalance`
- 返回完整结构，与正常创建一致

**幂等返回示例**：
```json
{
  "ok": true,
  "request_id": "test-xxx",
  "batch_id": "uuid",
  "idempotent_replay": true,
  "total_count": 2,
  "cost_per_video": 10,
  "required_credits": 20,
  "available_credits": 1000,
  "status": "queued"
}
```

### 3. 测试脚本自动断言升级 ✅

**改进**：在 `scripts/test-batch-flow.sh` 中加入完整的自动断言逻辑。

**断言项**：
1. ✅ `ok === true`（失败直接退出）
2. ✅ `status === "queued"`（状态必须正确）
3. ✅ `total_count === 2`（数量必须正确）
4. ✅ `cost_per_video === ENTERPRISE_BATCH_COST_PER_VIDEO`（成本必须匹配）
5. ✅ `required_credits === 2 * cost_per_video`（计算必须正确）
6. ✅ `available_credits >= required_credits`（余额必须充足，否则应被拒绝）
7. ✅ 幂等重放检测（`idempotent_replay === true` 时跳过部分断言）

**使用方式**：
```bash
export ENTERPRISE_API_KEY="your-key"
export INTERNAL_WORKER_SECRET="your-secret"
export COST_PER_VIDEO_EXPECT=10  # 可选，用于断言

./scripts/test-batch-flow.sh
```

**输出示例**：
```
✅ Assert passed: status=queued total_count=2 cost_per_video=10 required=20 available=1000
```

### 4. 字段验证确认 ✅

**验证结果**：
- ✅ `minute_bucket` 字段存在于 `enterprise_api_usage`（migration 102）
- ✅ 唯一约束 `(api_key_id, request_id)` 已创建（migration 102）
- ✅ 成功返回已包含所有必要字段：
  - `batch_id`
  - `total_count`
  - `cost_per_video`
  - `required_credits`
  - `available_credits`
  - `status`
  - `request_id`

## 可卖级特性清单

### ✅ 已实现
- [x] API Key 验证
- [x] 硬限流（基于 `minute_bucket`）
- [x] 余额预检（基于 `credit_wallet`）
- [x] 幂等性（基于 `request_id`）
- [x] Usage 审计（含 IP、User-Agent、request_id）
- [x] 完整返回结构（含成本、余额、状态）
- [x] 自动测试断言（PASS/FAIL）

### 🔄 待完善（可选）
- [ ] Webhook 回调签名验证
- [ ] Webhook 重试队列
- [ ] IP 白名单（按 API Key）
- [ ] 批量上限动态配置（按 API Key）

## 测试建议

### 1. 正常流程测试
```bash
./scripts/test-batch-flow.sh
```
应看到：✅ Assert passed

### 2. 幂等性测试
```bash
REQ_ID="test-$(date +%s)"
./scripts/test-batch-flow.sh  # 第一次
REQ_ID="test-$(date +%s)"  # 使用相同 REQ_ID
./scripts/test-batch-flow.sh  # 第二次
```
应看到：✅ Idempotent replay detected

### 3. 余额不足测试
```bash
# 手动设置低余额（在 Supabase 中）
# 然后运行脚本
./scripts/test-batch-flow.sh
```
应看到：❌ INSUFFICIENT_CREDITS (402)

### 4. 限流测试
```bash
# 快速连续调用多次（超过 rate_limit_per_min）
for i in {1..65}; do
  curl -X POST "$BASE_URL/api/enterprise/video-batch" \
    -H "x-api-key: $ENTERPRISE_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"items":[{"prompt":"test"}]}'
done
```
应看到：❌ RATE_LIMIT_EXCEEDED (429)

## 相关文件

- `app/api/enterprise/video-batch/route.ts` - 主 API 实现
- `scripts/test-batch-flow.sh` - 自动化测试脚本
- `supabase/migrations/102_enterprise_api_usage_idempotency.sql` - 幂等性支持
- `supabase/migrations/101_enterprise_api_usage_enhancements.sql` - Usage 增强

## 下一步

1. ✅ 已完成：余额解包、幂等返回、测试断言
2. 🔄 建议：运行完整测试流程，验证所有断言通过
3. 🔄 建议：在生产环境部署前，再次验证幂等性和限流逻辑
