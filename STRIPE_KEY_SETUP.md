# Stripe 密钥配置说明

## ✅ 已配置

Stripe Secret Key 已添加到 `.env.local` 文件中：

```
STRIPE_SECRET_KEY=sk_live_51SKht2DqGbi6No9vvjGIoXiYMFQ7MRaQjOyouRV4iq8hXvvA1DsnBPj08RkdN36o6f5qvLxnKaZqLNZVzFAm55sN00krtZcwTE
```

## 🔒 安全提醒

⚠️ **重要**：这是生产环境的 Stripe 密钥，请妥善保管：

1. ✅ `.env.local` 文件已在 `.gitignore` 中，不会被提交到代码库
2. ⚠️ **不要**在代码中硬编码密钥
3. ⚠️ **不要**在公开场合分享此密钥
4. ⚠️ 如果密钥泄露，请立即在 Stripe Dashboard 中撤销并重新生成

## 📋 还需要配置

### 1. Stripe Webhook Secret

在 Stripe Dashboard 中配置 Webhook 后，获取 Webhook Secret 并添加到 `.env.local`：

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

**获取步骤**：
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Developers** > **Webhooks**
3. 添加端点：`https://your-domain.com/api/payment/webhook`
4. 选择事件：`checkout.session.completed`
5. 复制 **Signing secret**（以 `whsec_` 开头）

### 2. 应用 URL（生产环境）

更新生产环境的 URL：

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🔍 验证配置

配置完成后，系统会自动使用 Stripe API 来：
- ✅ 创建支付会话
- ✅ 处理支付 Webhook
- ✅ 查询支付状态
- ✅ 验证支付完成

## 📝 当前使用位置

Stripe 密钥在以下文件中使用：
- `app/api/payment/webhook/route.ts` - Webhook 处理
- `app/api/payment/payment-link/route.ts` - Payment Link 处理
- `app/api/payment/check-session/route.ts` - 查询支付状态
- `app/api/payment/check-recharge/route.ts` - 验证支付状态
- `app/api/payment/verify-payment/route.ts` - 手动验证支付
- `app/api/recharge/route.ts` - 充值处理

## 🚀 下一步

1. 配置 Webhook Secret（见上方说明）
2. 在 Stripe Dashboard 配置 Webhook 端点
3. 测试支付流程
4. 监控支付状态

