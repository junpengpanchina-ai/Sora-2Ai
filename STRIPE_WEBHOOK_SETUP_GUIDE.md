# Stripe Webhook 配置完整指南

## 🎯 目标

配置 Stripe Webhook 以确保支付成功后 100% 准确发币，即使：
- 用户关闭了浏览器
- 网络中断
- 支付成功但未跳转回网站

---

## 📋 配置步骤

### 步骤 1：登录 Stripe Dashboard

1. 访问：https://dashboard.stripe.com/
2. 登录你的 Stripe 账号
3. 确保在正确的环境（Test Mode 或 Live Mode）

---

### 步骤 2：创建 Webhook 端点

1. **进入 Webhooks 页面**
   - 左侧菜单 → **Developers** → **Webhooks**
   - 或直接访问：https://dashboard.stripe.com/webhooks

2. **添加端点（Add endpoint）**
   - 点击右上角 **"Add endpoint"** 按钮

3. **配置端点信息**
   - **Endpoint URL**: 
     ```
     https://sora2aivideos.com/api/payment/webhook
     ```
   - **Description**（可选）:
     ```
     Sora2Ai - Payment success webhook for credit distribution
     ```

4. **选择事件**
   - 点击 **"Select events"**
   - 选择 **"Select events to listen to"**
   - 勾选以下事件：
     - ✅ `checkout.session.completed`（必需）
     - ✅ `checkout.session.async_payment_failed`（可选，用于记录失败）

5. **创建端点**
   - 点击 **"Add endpoint"** 按钮

---

### 步骤 3：获取 Webhook Secret

1. **查看端点详情**
   - 创建后，点击新创建的端点进入详情页

2. **复制 Signing secret**
   - 在 **"Signing secret"** 部分
   - 点击 **"Reveal"** 或 **"Click to reveal"**
   - 复制 Secret（格式：`whsec_...`）
   - ⚠️ **重要**：这个 Secret 只显示一次，请立即保存

3. **保存 Secret**
   - 格式：`whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - 示例：`whsec_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t`

---

### 步骤 4：在 Vercel 添加环境变量

#### 方法 1：Vercel Dashboard（推荐）

1. **登录 Vercel**
   - 访问：https://vercel.com/dashboard
   - 选择你的项目

2. **进入项目设置**
   - 点击项目名称
   - 点击 **"Settings"** 标签
   - 点击 **"Environment Variables"**

3. **添加环境变量**
   - 点击 **"Add New"**
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: 粘贴从 Stripe 复制的 Secret（`whsec_...`）
   - **Environment**: 选择所有环境（Production, Preview, Development）
   - 点击 **"Save"**

4. **重新部署**
   - 环境变量添加后，需要重新部署才能生效
   - 可以触发一次新的部署，或等待下次自动部署

#### 方法 2：Vercel CLI

```bash
# 安装 Vercel CLI（如果还没安装）
npm i -g vercel

# 登录
vercel login

# 添加环境变量
vercel env add STRIPE_WEBHOOK_SECRET

# 按提示输入 Secret 值
# 选择环境：Production, Preview, Development
```

---

### 步骤 5：验证 Webhook 配置

#### 5.1 检查环境变量

在 Vercel Dashboard 中确认：
- ✅ `STRIPE_WEBHOOK_SECRET` 已添加
- ✅ 值以 `whsec_` 开头
- ✅ 已应用到所有环境

#### 5.2 测试 Webhook（使用 Stripe CLI，可选）

如果你安装了 Stripe CLI：

```bash
# 安装 Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# 或访问: https://stripe.com/docs/stripe-cli

# 登录
stripe login

# 转发 Webhook 到本地（用于测试）
stripe listen --forward-to localhost:3000/api/payment/webhook

# 在另一个终端触发测试事件
stripe trigger checkout.session.completed
```

#### 5.3 检查 Webhook 日志

1. **在 Stripe Dashboard**
   - 进入 **Developers** → **Webhooks**
   - 点击你的端点
   - 查看 **"Recent deliveries"** 标签
   - 应该能看到最近的 Webhook 请求

2. **检查状态**
   - ✅ **200** - 成功
   - ❌ **4xx/5xx** - 失败，点击查看错误详情

---

## 🔍 验证 Webhook 是否正常工作

### 方法 1：查看 Stripe Dashboard 日志

1. 进入 **Developers** → **Webhooks** → 你的端点
2. 查看 **"Recent deliveries"**
3. 点击最近的请求查看详情
4. 检查：
   - ✅ **Status**: `200 OK`
   - ✅ **Response**: 包含 `"success": true`

### 方法 2：测试购买流程

1. **进行一次测试购买**
   - 使用 Stripe Test Mode 的测试卡：`4242 4242 4242 4242`
   - 完成购买流程

2. **检查数据库**
   ```sql
   -- 检查购买记录是否创建
   SELECT * FROM public.purchases 
   WHERE provider = 'stripe' 
   ORDER BY created_at DESC 
   LIMIT 5;
   
   -- 检查积分是否入账
   SELECT * FROM public.wallets 
   WHERE user_id = 'your_user_id';
   ```

3. **检查 Webhook 日志**
   - 在 Stripe Dashboard 查看 Webhook 请求
   - 应该看到 `checkout.session.completed` 事件
   - 状态应该是 `200 OK`

---

## ⚠️ 常见问题

### 问题 1：Webhook 返回 401 Unauthorized

**原因**：Webhook Secret 未配置或配置错误

**解决**：
1. 检查 `STRIPE_WEBHOOK_SECRET` 环境变量是否正确
2. 确认 Secret 值以 `whsec_` 开头
3. 重新部署应用

### 问题 2：Webhook 返回 400 Bad Request

**原因**：签名验证失败

**解决**：
1. 确认使用的是正确的 Webhook Secret（不是 API Key）
2. 检查 Webhook 端点 URL 是否正确
3. 查看服务器日志获取详细错误信息

### 问题 3：Webhook 成功但积分未入账

**原因**：可能是幂等性检查或数据库错误

**解决**：
1. 检查 `purchases` 表是否有记录
2. 检查 `wallets` 表积分是否增加
3. 查看服务器日志（Vercel Logs）获取错误信息

### 问题 4：Webhook 重复发送

**原因**：Stripe 会重试失败的 Webhook

**解决**：
- ✅ 我们的代码已实现幂等性检查
- ✅ 同一 `session_id` 只会发一次币
- 这是正常行为，不用担心

---

## 📊 Webhook 事件说明

### checkout.session.completed

**触发时机**：用户完成支付后

**处理逻辑**（`app/api/payment/webhook/route.ts`）：
1. 验证 Webhook 签名
2. 幂等性检查（防止重复发币）
3. 从 metadata 读取 `plan_id`
4. 调用 `getPlanConfig()` 获取配置
5. 调用 `apply_purchase` RPC 函数发币
6. 记录购买到 `purchases` 表（包含风控信息）

### checkout.session.async_payment_failed

**触发时机**：异步支付失败（如银行拒绝）

**处理逻辑**：
- 记录支付失败状态
- 不发放积分

---

## 🔐 安全注意事项

1. **Webhook Secret 保密**
   - ⚠️ 不要提交到 Git
   - ⚠️ 不要在前端代码中使用
   - ✅ 只在服务器端环境变量中使用

2. **签名验证**
   - ✅ 我们的代码已实现签名验证
   - ✅ 防止伪造的 Webhook 请求

3. **HTTPS 必需**
   - ✅ Webhook URL 必须是 HTTPS
   - ✅ Vercel 自动提供 HTTPS

---

## 📝 配置检查清单

- [ ] 在 Stripe Dashboard 创建 Webhook 端点
- [ ] 端点 URL: `https://sora2aivideos.com/api/payment/webhook`
- [ ] 选择事件: `checkout.session.completed`
- [ ] 复制 Webhook Secret（`whsec_...`）
- [ ] 在 Vercel 添加环境变量 `STRIPE_WEBHOOK_SECRET`
- [ ] 重新部署应用
- [ ] 测试购买流程
- [ ] 检查 Webhook 日志（状态应为 200）
- [ ] 验证积分是否入账

---

## 🚀 完成后的效果

配置成功后：

1. ✅ **支付成功自动发币**
   - 即使用户关闭浏览器，积分也会自动入账
   - Webhook 确保 100% 准确发币

2. ✅ **幂等性保护**
   - 同一支付只会发一次币
   - 即使 Stripe 重试 Webhook，也不会重复发币

3. ✅ **风控信息记录**
   - 自动记录 device_id, payment_fingerprint, ip_hash 等
   - 用于 Starter 防薅校验

---

**配置完成后，请更新状态**：✅ Stripe Webhook 已配置

