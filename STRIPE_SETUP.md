# Stripe 支付集成配置指南

## ✅ 已完成的工作

### 1. Stripe SDK 安装
- ✅ 已安装 `stripe` 和 `@stripe/stripe-js` 包

### 2. API 接口
- ✅ **POST** `/api/recharge` - 创建 Stripe Checkout 支付会话
- ✅ **POST** `/api/payment/webhook` - 处理 Stripe Webhook 回调
- ✅ **POST** `/api/payment/create-checkout` - 创建支付会话（备用）

### 3. 前端页面
- ✅ `/payment/success` - 支付成功页面
- ✅ `/payment/cancel` - 支付取消页面
- ✅ 首页充值功能已集成 Stripe Checkout

## 🔧 环境变量配置

### 1. 在 `.env.local` 文件中添加以下环境变量

```env
# Stripe 配置（必需）
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# 应用 URL（用于支付回调）
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

⚠️ **重要**：
- `STRIPE_SECRET_KEY` 是生产环境的密钥，请妥善保管
- `STRIPE_WEBHOOK_SECRET` 需要从 Stripe Dashboard 获取（见下方说明）
- 不要将 `.env.local` 文件提交到 Git

### 2. 获取 Stripe Webhook Secret

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Developers** > **Webhooks**
3. 点击 **Add endpoint**
4. 输入 Webhook URL: `https://your-domain.com/api/payment/webhook`
5. 选择要监听的事件：
   - `checkout.session.completed` - 支付成功
   - `checkout.session.async_payment_failed` - 支付失败
6. 点击 **Add endpoint**
7. 复制 **Signing secret**（以 `whsec_` 开头）
8. 将 Signing secret 添加到 `.env.local` 文件中的 `STRIPE_WEBHOOK_SECRET`

## 🚀 部署配置

### Vercel 部署

在 Vercel 项目设置中添加以下环境变量：

1. 进入项目设置 > **Environment Variables**
2. 添加以下变量：
   - `STRIPE_SECRET_KEY` = `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`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...`（从 Stripe Dashboard 获取）
   - `NEXT_PUBLIC_APP_URL` = `https://your-domain.com`

### 更新 Stripe Webhook URL

部署后，需要在 Stripe Dashboard 中更新 Webhook URL：

1. 进入 **Developers** > **Webhooks**
2. 找到你的 Webhook endpoint
3. 点击 **Settings**
4. 更新 **Endpoint URL** 为你的生产环境 URL: `https://your-domain.com/api/payment/webhook`
5. 保存更改

## 📋 支付流程

### 1. 用户充值流程

1. 用户在首页点击"充值"按钮
2. 输入充值金额或选择快速充值
3. 前端调用 `/api/recharge` API
4. 后端创建 Stripe Checkout Session
5. 前端重定向到 Stripe Checkout 页面
6. 用户完成支付
7. Stripe 重定向到 `/payment/success` 或 `/payment/cancel`

### 2. Webhook 处理流程

1. 用户完成支付后，Stripe 发送 Webhook 事件
2. Webhook 到达 `/api/payment/webhook`
3. 验证 Webhook 签名
4. 处理 `checkout.session.completed` 事件：
   - 从 metadata 中获取充值信息
   - 更新用户积分
   - 更新充值记录状态为 `completed`
5. 处理 `checkout.session.async_payment_failed` 事件：
   - 更新充值记录状态为 `failed`

## 🔒 安全注意事项

1. **API Key 安全**
   - ✅ API Key 已通过环境变量配置，不会暴露在代码中
   - ✅ `.env.local` 文件已在 `.gitignore` 中
   - ⚠️ 不要将 API Key 提交到 Git
   - ⚠️ 不要在前端代码中使用 Secret Key

2. **Webhook 安全**
   - ✅ 所有 Webhook 请求都会验证签名
   - ✅ 只有来自 Stripe 的请求才会被处理
   - ⚠️ 确保 `STRIPE_WEBHOOK_SECRET` 正确配置

3. **支付验证**
   - ✅ 使用 Stripe Checkout Session metadata 传递充值信息
   - ✅ 在 Webhook 中验证充值记录状态，避免重复处理
   - ✅ 所有充值记录都保存在数据库中，便于对账

## 🧪 测试

### 测试模式

Stripe 提供测试模式，可以使用测试 API Key：

1. 在 Stripe Dashboard 切换到 **Test mode**
2. 获取测试 API Key（以 `sk_test_` 开头）
3. 更新 `.env.local` 中的 `STRIPE_SECRET_KEY`
4. 使用测试卡号进行支付测试：
   - 成功: `4242 4242 4242 4242`
   - 失败: `4000 0000 0000 0002`

### 本地测试 Webhook

使用 Stripe CLI 在本地测试 Webhook：

```bash
# 安装 Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# 其他平台: https://stripe.com/docs/stripe-cli

# 登录
stripe login

# 转发 Webhook 到本地
stripe listen --forward-to localhost:3000/api/payment/webhook
```

## 📊 监控和日志

### Stripe Dashboard

在 Stripe Dashboard 中可以查看：
- 所有支付记录
- Webhook 事件日志
- 支付成功率
- 错误和失败原因

### 应用日志

所有支付相关操作都会记录日志：
- 充值记录创建
- Webhook 处理
- 积分更新
- 错误信息

## 🐛 故障排除

### Webhook 未收到

1. 检查 Webhook URL 是否正确配置
2. 检查 `STRIPE_WEBHOOK_SECRET` 是否正确
3. 查看 Stripe Dashboard 中的 Webhook 事件日志
4. 检查服务器日志

### 支付成功但积分未到账

1. 检查 Webhook 是否成功处理
2. 查看数据库中的充值记录状态
3. 检查用户积分是否正确更新
4. 查看应用日志中的错误信息

### 签名验证失败

1. 确认 `STRIPE_WEBHOOK_SECRET` 正确
2. 检查 Webhook URL 是否匹配
3. 确认使用的是正确的 Stripe 账户（测试/生产）

## 📝 相关文件

- `app/api/recharge/route.ts` - 充值 API（创建 Stripe Checkout）
- `app/api/payment/webhook/route.ts` - Webhook 处理
- `app/api/payment/create-checkout/route.ts` - 备用创建支付会话 API
- `app/payment/success/page.tsx` - 支付成功页面
- `app/payment/cancel/page.tsx` - 支付取消页面
- `app/HomePageClient.tsx` - 首页充值功能

## 🔗 相关链接

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe API 文档](https://stripe.com/docs/api)
- [Stripe Checkout 文档](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks 文档](https://stripe.com/docs/webhooks)

