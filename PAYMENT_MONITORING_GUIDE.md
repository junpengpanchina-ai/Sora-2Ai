# 支付监控指南

## 支付监控机制

系统已经实现了**三层支付监控机制**，确保能准确监控支付状态：

### 1. Webhook 自动监控（主要方式）

**工作原理**：
- Stripe 支付完成后，自动发送 webhook 到 `/api/payment/webhook`
- Webhook 验证签名后，自动更新用户积分和充值记录状态
- **响应时间**：通常在支付完成后几秒内完成

**配置要求**：
1. 在 Stripe Dashboard 配置 Webhook 端点
2. 设置环境变量 `STRIPE_WEBHOOK_SECRET`
3. 监听事件：`checkout.session.completed`

### 2. 主动查询 Stripe API（备用方式）

**工作原理**：
- 当充值记录状态为 `pending` 时，系统会主动调用 Stripe API 查询支付状态
- 如果 Stripe 确认支付成功，自动更新数据库
- **触发时机**：
  - 用户访问支付成功页面时
  - 调用 `/api/payment/check-recharge` API 时

**API 端点**：
- `GET /api/payment/check-recharge?recharge_id=xxx` - 检查充值状态（会自动查询 Stripe）

### 3. 手动验证 API（调试/修复）

**工作原理**：
- 可以手动调用 API 验证特定充值记录的支付状态
- 用于修复可能遗漏的支付

**API 端点**：
- `POST /api/payment/verify-payment` - 手动验证支付状态

**请求示例**：
```json
{
  "recharge_id": "xxx-xxx-xxx"
}
```

## 支付状态检查流程

### 自动检查（推荐）

1. **用户支付完成** → Stripe 发送 webhook
2. **Webhook 处理** → 更新积分和充值记录
3. **用户返回网站** → 支付成功页面自动检查状态
4. **如果仍为 pending** → 主动查询 Stripe API 验证

### 手动检查

如果 webhook 失败或延迟，可以：

1. **通过 API 检查**：
   ```bash
   GET /api/payment/check-recharge?recharge_id=xxx
   ```

2. **手动验证支付**：
   ```bash
   POST /api/payment/verify-payment
   {
     "recharge_id": "xxx"
   }
   ```

## 支付状态说明

### 充值记录状态

- `pending` - 等待支付
- `completed` - 支付完成，积分已添加
- `failed` - 支付失败

### 支付验证结果

- `payment_verified: true` - Stripe 确认支付成功
- `payment_verified: false` - 支付未确认或仍在处理中

## 监控建议

### 1. 定期检查未完成的支付

可以创建一个定时任务，定期检查 `pending` 状态的充值记录：

```typescript
// 示例：检查所有超过 1 小时的 pending 充值
const pendingRecharges = await supabase
  .from('recharge_records')
  .select('*')
  .eq('status', 'pending')
  .lt('created_at', new Date(Date.now() - 3600000).toISOString())

// 对每个充值记录调用 verify-payment API
```

### 2. 监控 Webhook 日志

在 Stripe Dashboard 中查看 Webhook 日志，确保：
- Webhook 成功发送
- 没有错误响应
- 响应时间正常

### 3. 设置告警

建议设置告警监控：
- Webhook 失败率
- 长时间 pending 的充值记录
- 支付成功但积分未添加的情况

## 故障排查

### 问题：支付完成但积分未添加

**检查步骤**：
1. 检查 Webhook 是否收到事件
2. 查看服务器日志，确认 webhook 处理是否成功
3. 手动调用 `/api/payment/verify-payment` 验证支付
4. 检查数据库充值记录状态

### 问题：Webhook 未收到

**可能原因**：
1. Webhook URL 配置错误
2. Webhook Secret 不匹配
3. 服务器无法访问 Stripe
4. 防火墙阻止了 webhook 请求

**解决方案**：
1. 检查 Stripe Dashboard 中的 Webhook 配置
2. 验证 `STRIPE_WEBHOOK_SECRET` 环境变量
3. 使用 Stripe CLI 测试 webhook：`stripe listen --forward-to localhost:3000/api/payment/webhook`

### 问题：支付成功但状态仍为 pending

**解决方案**：
1. 调用 `/api/payment/verify-payment` 手动验证
2. 检查 Stripe Dashboard 中的支付记录
3. 确认 payment_id 是否正确保存

## 技术细节

### Stripe API 调用

系统使用以下 Stripe API：
- `stripe.checkout.sessions.retrieve()` - 查询 Checkout Session
- `stripe.paymentIntents.list()` - 查询 Payment Intents
- `stripe.webhooks.constructEvent()` - 验证 Webhook 签名

### 数据库更新

支付确认后，系统会：
1. 更新 `recharge_records` 表：`status = 'completed'`
2. 更新 `users` 表：`credits = credits + rechargeRecord.credits`
3. 记录 `completed_at` 时间戳

## 最佳实践

1. **主要依赖 Webhook**：Webhook 是最可靠的方式，确保正确配置
2. **主动查询作为备用**：当 webhook 可能失败时，主动查询确保不遗漏
3. **定期检查**：设置定时任务检查长时间 pending 的支付
4. **日志记录**：记录所有支付相关操作，便于排查问题
5. **错误处理**：妥善处理各种异常情况，确保用户体验

## 不需要额外的 Stripe API 接口

系统已经集成了 Stripe SDK，可以直接调用 Stripe API。**不需要您提供额外的 API 接口**，只需要：

1. **Stripe Secret Key** - 已在环境变量中配置
2. **Webhook Secret** - 用于验证 webhook 签名
3. **正确的 Webhook 配置** - 在 Stripe Dashboard 中配置

系统会自动使用这些配置来监控和处理支付。

