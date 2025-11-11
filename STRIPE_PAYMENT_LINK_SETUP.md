# Stripe Payment Link 配置指南

## 问题：如何让用户支付完成后看到积分增加？

由于 Stripe Payment Link 是外部链接，支付完成后需要配置成功页面，让用户能够返回我们的网站查看积分更新。

## 解决方案

### 方案 1：在 Stripe Dashboard 配置成功页面（推荐）

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Products** > **Payment Links**
3. 找到你的 Payment Link（$39 和 $299 套餐）
4. 点击编辑 Payment Link
5. 在 **After payment** 部分：
   - 选择 **Redirect to a URL**
   - 输入成功页面 URL：
     ```
     https://your-domain.com/payment/return?recharge_id={CLIENT_REFERENCE_ID}
     ```
   - 或者使用固定URL（系统会自动通过localStorage获取recharge_id）：
     ```
     https://your-domain.com/payment/return
     ```
6. 保存设置

### 方案 2：使用 Webhook + 前端轮询（已实现）

当前系统已经实现了以下机制：

1. **Webhook 自动处理**：
   - Stripe 支付完成后自动发送 webhook
   - Webhook 更新用户积分和充值记录状态
   - 通常在几秒内完成

2. **用户返回网站后**：
   - 系统通过 `localStorage` 保存的 `recharge_id` 自动跳转到成功页面
   - 成功页面自动轮询检查充值状态
   - 实时显示积分更新

3. **积分更新通知**：
   - 支付成功页面显示当前积分
   - 通过自定义事件通知首页更新积分显示
   - 用户返回首页时自动刷新积分

## 当前实现流程

### 1. 用户点击购买
- 未登录：提示登录，跳转到登录页面
- 已登录：创建充值记录，保存 `recharge_id` 到 `localStorage`，跳转到 Stripe Payment Link

### 2. 用户完成支付
- Stripe 处理支付
- Webhook 自动更新积分（后台处理）

### 3. 用户返回网站
- 方式 A：Stripe 配置了成功页面，自动跳转到 `/payment/return`
- 方式 B：用户手动返回网站，访问 `/payment/success?recharge_id=xxx`
- 系统自动检查充值状态，显示积分更新

### 4. 积分显示
- 支付成功页面显示当前积分余额
- 首页监听积分更新事件，自动刷新显示
- 用户可以看到实时的积分增加

## 配置步骤

### 1. 环境变量

确保 `.env.local` 中有：
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Stripe Dashboard 配置

#### 配置 Webhook（必需）
1. 进入 **Developers** > **Webhooks**
2. 添加端点：`https://your-domain.com/api/payment/webhook`
3. 监听事件：
   - `checkout.session.completed`
   - `checkout.session.async_payment_failed`

#### 配置 Payment Link 成功页面（可选但推荐）
1. 进入 **Products** > **Payment Links**
2. 编辑每个 Payment Link
3. 设置 **After payment** > **Redirect to a URL**：
   ```
   https://your-domain.com/payment/return
   ```

## 测试流程

1. 登录网站
2. 点击 "Buy Plan" 按钮
3. 选择套餐，点击 "Buy Now"
4. 完成 Stripe 支付
5. 返回网站（自动或手动）
6. 查看支付成功页面，确认积分已更新
7. 返回首页，确认导航栏积分已更新

## 故障排查

### 问题：支付完成后看不到积分更新

**解决方案**：
1. 检查 Webhook 是否配置正确
2. 检查 `STRIPE_WEBHOOK_SECRET` 是否正确
3. 查看服务器日志，确认 Webhook 是否收到
4. 手动访问 `/payment/success?recharge_id=xxx` 检查状态

### 问题：用户无法返回网站

**解决方案**：
1. 在 Stripe Dashboard 配置 Payment Link 成功页面
2. 或者提供返回链接给用户
3. 或者用户手动访问网站首页，系统会自动检查未完成的充值

## 技术细节

### 支付流程
```
用户点击购买
  ↓
创建充值记录（pending状态）
  ↓
保存 recharge_id 到 localStorage
  ↓
跳转到 Stripe Payment Link
  ↓
用户完成支付
  ↓
Stripe 发送 Webhook
  ↓
Webhook 更新积分和充值记录（completed状态）
  ↓
用户返回网站
  ↓
从 localStorage 获取 recharge_id
  ↓
跳转到 /payment/success?recharge_id=xxx
  ↓
页面轮询检查充值状态
  ↓
显示积分更新
```

### 关键 API
- `/api/payment/payment-link` - 创建充值记录，返回 Payment Link URL
- `/api/payment/webhook` - 处理 Stripe Webhook，更新积分
- `/api/payment/check-recharge` - 查询充值状态
- `/payment/success` - 支付成功页面，显示积分更新
- `/payment/return` - 支付返回页面，自动跳转到成功页面

