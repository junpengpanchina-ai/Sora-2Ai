# Stripe API Key 更新指南

## 🔴 当前问题

错误信息显示：
```
stripeErrorCode: 'api_key_expired'
details: 'Expired API Key provided: sk_live_...tZcwTE'
```

**原因：** Vercel 环境变量中的 `STRIPE_SECRET_KEY` 已过期。

## ✅ 解决步骤

### 步骤 1: 获取新的 Stripe API Key

1. **登录 Stripe Dashboard**
   - 访问：https://dashboard.stripe.com/
   - 使用你的 Stripe 账户登录

2. **进入 API Keys 页面**
   - 点击左侧菜单 **Developers**
   - 选择 **API keys**

3. **检查当前密钥状态**
   - 查看 **Secret keys** 部分
   - 如果显示 "Expired" 或 "Revoked"，需要创建新密钥

4. **创建或使用现有密钥**
   - 如果已有有效密钥，直接复制
   - 如果需要创建新密钥：
     - 点击 **Create secret key**
     - 输入描述（如：Sora2Ai Production）
     - 复制生成的密钥（以 `sk_live_` 开头）

### 步骤 2: 在 Vercel 中更新环境变量

1. **进入 Vercel Dashboard**
   - 访问：https://vercel.com/dashboard
   - 选择你的项目

2. **打开环境变量设置**
   - 点击 **Settings**
   - 选择 **Environment Variables**

3. **更新 STRIPE_SECRET_KEY**
   - 找到 `STRIPE_SECRET_KEY` 变量
   - 点击 **Edit**（或 **...** > **Edit**）
   - 粘贴新的 Secret Key
   - **重要：** 确保选择了正确的环境（Production, Preview, Development）
   - 点击 **Save**

### 步骤 3: 重新部署

1. **手动触发部署**
   - 在 Vercel Dashboard 中
   - 进入 **Deployments** 标签
   - 找到最新的部署
   - 点击 **...** > **Redeploy**
   - 或点击 **Redeploy** 按钮

2. **等待部署完成**
   - 部署通常需要 1-3 分钟
   - 可以在 Deployments 页面查看进度

### 步骤 4: 验证修复

1. **刷新应用页面**
   - 等待部署完成后
   - 刷新你的网站

2. **测试购买功能**
   - 点击任意购买按钮
   - 应该能正常跳转到 Stripe Checkout
   - 不再出现 "Failed to create checkout session" 错误

## 🔍 验证 API Key 是否有效

### 方法 1: 使用 Stripe Dashboard

1. 登录 Stripe Dashboard
2. 进入 **Developers** > **API keys**
3. 查看密钥状态：
   - ✅ **Active** = 有效
   - ❌ **Expired** = 已过期
   - ❌ **Revoked** = 已撤销

### 方法 2: 使用 Stripe CLI（可选）

```bash
# 安装 Stripe CLI（如果未安装）
# macOS: brew install stripe/stripe-cli/stripe
# 或访问: https://stripe.com/docs/stripe-cli

# 测试 API Key
stripe customers list --api-key sk_live_你的密钥
```

### 方法 3: 查看 Vercel 日志

1. 在 Vercel Dashboard 中
2. 进入 **Deployments** > 最新部署
3. 点击 **Functions** > `/api/payment/create-plan-checkout`
4. 查看 **Logs** 标签
5. 如果看到 `api_key_expired` 错误，说明密钥仍然无效

## ⚠️ 注意事项

1. **不要提交密钥到 Git**
   - Secret Key 应该只在环境变量中
   - 确保 `.env.local` 在 `.gitignore` 中

2. **区分测试和生产环境**
   - 测试环境使用 `sk_test_` 开头的密钥
   - 生产环境使用 `sk_live_` 开头的密钥

3. **密钥安全**
   - 不要分享 Secret Key
   - 如果密钥泄露，立即在 Stripe Dashboard 中撤销

4. **环境变量作用域**
   - 确保在 Vercel 中为所有环境（Production, Preview, Development）设置了正确的密钥

## 📞 需要帮助？

如果更新后仍然有问题：

1. 检查 Vercel 日志中的详细错误信息
2. 确认密钥已正确保存（没有多余空格）
3. 确认已重新部署
4. 检查 Stripe Dashboard 中的密钥状态

## 🎯 快速检查清单

- [ ] 登录 Stripe Dashboard
- [ ] 检查 API Key 状态
- [ ] 获取新的 Secret Key（如果需要）
- [ ] 在 Vercel 中更新 `STRIPE_SECRET_KEY`
- [ ] 重新部署应用
- [ ] 测试购买功能
- [ ] 确认错误已解决

