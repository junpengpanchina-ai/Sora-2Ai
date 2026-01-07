# 🧪 步骤 3: 测试支付流程

## ✅ 前置条件检查

- [x] 步骤 1: 数据库迁移已完成（5 个表 + 3 个函数）
- [x] 步骤 2: 环境变量 `STRIPE_SECRET_KEY` 已设置
- [ ] 步骤 3: 测试支付流程（当前步骤）

---

## 🚀 测试步骤

### 1. 确认项目已重新部署

**检查**:
- 访问 Vercel Dashboard → Deployments
- 确认最新部署状态为 **"Ready"**
- 如果还没有重新部署，请执行：
  - Deployments → 最新部署 → "..." → **Redeploy**

### 2. 访问定价页面

1. 打开浏览器，访问你的网站 `/pricing` 页面
   - 例如：`https://sora2aivideos.com/pricing`
   - 或本地开发：`http://localhost:3000/pricing`

2. **预期结果**:
   - 应该能看到 4 个档位：Starter, Creator, Studio, Pro
   - 每个档位都有 **"Get"** 或 **"Purchase"** 按钮

### 3. 点击购买按钮

1. 点击任意档位的购买按钮（建议先测试 **Creator** 或 **Starter**）
2. **预期结果**:
   - 应该跳转到 **Stripe Checkout** 页面（不是 Payment Link）
   - 如果看到 Stripe 的支付表单，说明 API 调用成功 ✅

### 4. 使用测试卡完成支付

**Stripe 测试卡信息**:
- **卡号**: `4242 4242 4242 4242`
- **过期日期**: 任意未来日期（如 `12/25`）
- **CVC**: 任意 3 位数字（如 `123`）
- **邮编**: 任意 5 位数字（如 `12345`）
- **姓名**: 任意姓名

**操作**:
1. 填写测试卡信息
2. 点击 **"Pay"** 或 **"Complete payment"**
3. **预期结果**: 支付成功后应该自动跳转到 `/billing/success?session_id=xxx`

### 5. 验证支付成功

#### 5.1 检查页面跳转
- ✅ 应该自动跳转到 `/billing/success` 页面
- ✅ URL 应该包含 `session_id` 参数

#### 5.2 检查页面显示
- ✅ 页面应该显示 **"✅ Credits added successfully!"**
- ✅ 几秒后应该自动跳转到 `/video` 页面

#### 5.3 检查积分入账（在 Supabase Dashboard）

1. 访问 Supabase Dashboard → **Table Editor**
2. 检查 `purchases` 表:
   - 应该能看到一条购买记录
   - `item_id` 应该对应你购买的档位
   - `status` 应该是 `paid`
   - `amount_usd` 应该正确

3. 检查 `wallets` 表:
   - 找到你的 `user_id` 对应的记录
   - `permanent_credits` 和/或 `bonus_credits` 应该已入账
   - 如果购买的是 Starter，应该只有 `bonus_credits`
   - 如果购买的是 Creator/Studio/Pro，应该有 `permanent_credits` 和 `bonus_credits`

4. 检查 `user_entitlements` 表:
   - 找到你的 `user_id` 对应的记录
   - `plan_id` 应该已更新为你购买的档位
   - 如果购买的是 Creator/Studio/Pro，`veo_pro_enabled` 应该是 `true`

---

## 🐛 如果遇到问题

### 问题 1: 点击购买按钮没有反应

**检查**:
- 打开浏览器控制台（F12 → Console）
- 查看是否有错误信息
- 检查网络请求（Network 标签）是否发送到 `/api/payment/create-plan-checkout`

**解决**:
- 检查 Vercel 部署日志
- 确认环境变量 `STRIPE_SECRET_KEY` 已设置
- 确认项目已重新部署

### 问题 2: 跳转到 Stripe 失败

**检查**:
- 浏览器控制台是否有错误
- Vercel Functions Logs 是否有错误

**解决**:
- 检查 `/api/payment/create-plan-checkout` API 是否正常
- 确认 Stripe Secret Key 是否正确

### 问题 3: 支付成功后没有跳转

**检查**:
- Stripe Checkout Session 的 Success URL 是否正确
- 浏览器控制台是否有错误
- Vercel Functions Logs

**解决**:
- 检查 `app/api/payment/create-plan-checkout/route.ts` 中的 `baseUrl`
- 确认域名配置正确

### 问题 4: 支付成功但积分没有入账

**检查**:
- Supabase `purchases` 表是否有记录
- Supabase `wallets` 表是否有积分
- Vercel Functions Logs 是否有错误

**解决**:
- 检查 `/api/billing/finalize` API 是否被调用
- 查看 Vercel Functions Logs 中的错误信息
- 检查 Supabase 日志（Dashboard → Logs → Postgres Logs）

---

## ✅ 测试完成检查清单

- [ ] 访问 `/pricing` 页面成功
- [ ] 点击购买按钮跳转到 Stripe Checkout
- [ ] 使用测试卡完成支付
- [ ] 支付成功后自动跳转到 `/billing/success`
- [ ] 页面显示 "✅ Credits added successfully!"
- [ ] `purchases` 表有购买记录
- [ ] `wallets` 表有积分记录
- [ ] `user_entitlements` 表已更新

---

## 🎉 完成！

如果所有检查项都通过，恭喜！你的定价系统已经成功部署并正常工作了！

**下一步建议**:
- 测试积分扣除（生成一个视频）
- 测试 Starter 用户的日限额
- 准备切换到生产环境（如果还在测试环境）

---

**最后更新**: 2026-01-07

