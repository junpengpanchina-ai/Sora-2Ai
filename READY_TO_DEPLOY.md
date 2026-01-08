# 🚀 定价发币系统 - 准备就绪，可直接上线

## ✅ 所有代码已完成

### 1. 数据库迁移
✅ **文件**: `supabase/migrations/0001_billing.sql`
- 包含所有表、函数、索引
- 可直接在 Supabase SQL Editor 执行

### 2. PlanConfig 配置
✅ **文件**: `lib/billing/planConfig.ts`
- 4 个 Payment Link ID 已固化
- 发币配置完整（永久/bonus/过期）

### 3. Webhook 处理
✅ **文件**: `app/api/stripe/webhook/route.ts`
- 验签 + 幂等发币
- 优先使用 `metadata.plan_id`
- 用户识别：`client_reference_id` → `metadata.user_id` → email

### 4. Starter 防薅入口
✅ **文件**: `app/api/pay/route.ts`
- device_id 限制（一次）
- IP 限制（24h 内 3 次）
- 自动跳转到 Payment Link

### 5. 前端按钮
✅ **文件**: `app/pricing/page.tsx`
- **Starter**: 走 `/api/pay` 防薅接口
- **Creator/Studio/Pro**: 走 `/api/checkout/create` Checkout Session

### 6. 扣币逻辑
✅ **文件**: `lib/billing/wallet.ts`
- `deductCredits()` - 扣币函数
- `refundCredits()` - 退款函数

### 7. Device ID 工具
✅ **文件**: `lib/risk/deviceId.ts`
- `getOrCreateDeviceId()` - 生成并持久化 device_id

---

## 🎯 立即执行的 3 步

### 步骤 1: 执行数据库迁移（必须）

1. 登录 **Supabase Dashboard**
2. 进入 **SQL Editor**
3. 打开文件 `supabase/migrations/0001_billing.sql`
4. 复制全部 SQL 代码
5. 粘贴到 SQL Editor
6. 点击 **Run** 执行
7. 确认所有表/函数创建成功

**验证**：
```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'wallets', 'wallet_ledger', 'purchases', 'pending_credit_grants', 'starter_purchase_guards');

-- 检查函数是否存在
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('ensure_wallet', 'grant_credits_for_purchase', 'deduct_credits_from_wallet');
```

---

### 步骤 2: 配置 Stripe Webhook（必须）

1. 登录 **Stripe Dashboard**
2. 进入 **Developers** → **Webhooks**
3. 点击 **Add endpoint**
4. **Endpoint URL**: 
   ```
   https://sora2aivideos.com/api/stripe/webhook
   ```
5. **Description** (可选):
   ```
   Sora2Ai - Payment success webhook for credit distribution
   ```
6. **Events to send**: 点击 **Select events**
   - ✅ 勾选 `checkout.session.completed`
   - ✅ 可选：`checkout.session.async_payment_succeeded`
7. 点击 **Add endpoint**
8. **复制 Signing Secret** (`whsec_...`)
9. 在 **Vercel Dashboard** → **Settings** → **Environment Variables** 添加：
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (刚复制的)
   - Environment: Production (和 Preview)
10. 点击 **Save**

**验证**：
- 在 Stripe Dashboard → Webhooks → 点击你的 endpoint
- 应该能看到 "Recent events" 列表（初始为空，支付后会显示）

---

### 步骤 3: 前端按钮（已完成）

✅ **已更新**: `app/pricing/page.tsx`

**逻辑**：
- **Starter**: 自动走 `/api/pay` 防薅接口
- **Creator/Studio/Pro**: 走 `/api/checkout/create` Checkout Session

**无需额外操作**，代码已就绪。

---

## 🧪 测试流程（验收）

### 测试 1: 购买流程

1. 打开 `/pricing` 页面
2. 登录账号
3. 点击 **Starter Access** 按钮
4. 验证：
   - ✅ 跳转到 `/api/pay?plan=starter&device_id=xxx&email=xxx`
   - ✅ 自动跳转到 Stripe Payment Link
   - ✅ 完成支付
   - ✅ 回到 `/billing/success`

5. 检查数据库：
```sql
-- 检查购买记录
SELECT * FROM purchases ORDER BY created_at DESC LIMIT 1;

-- 检查钱包余额
SELECT * FROM wallets WHERE user_id = 'your-user-id';

-- 检查账本记录
SELECT * FROM wallet_ledger WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 5;
```

### 测试 2: 幂等性

1. 在 Stripe Dashboard → Webhooks → 找到你的 endpoint
2. 找到刚才的 `checkout.session.completed` event
3. 点击 **Send test event** 或 **Replay**
4. 验证：
   - ✅ Webhook 返回 200 OK
   - ✅ 数据库 `purchases` 表**不会**增加新记录（幂等）
   - ✅ 钱包余额**不会**重复增加

### 测试 3: Starter 防薅

1. 使用**同一 device_id** 再次点击 Starter
2. 验证：
   - ✅ 返回 403 错误：`starter_device_limit`
   - ✅ 无法跳转到 Payment Link

3. 使用**不同 device_id**（清除 localStorage 的 `device_id`）
4. 验证：
   - ✅ 可以正常跳转

---

## 📋 环境变量检查清单

确保以下环境变量已配置（Vercel）：

- [ ] `STRIPE_SECRET_KEY` - Stripe API Key
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook Signing Secret（步骤 2 配置）
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key
- [ ] `NEXT_PUBLIC_APP_URL` 或 `NEXT_PUBLIC_SITE_URL` - 网站 URL（用于 success/cancel URL）

---

## 🔍 故障排查

### Webhook 返回 400

**可能原因**：
- `STRIPE_WEBHOOK_SECRET` 未配置或错误
- Webhook URL 不正确

**解决**：
1. 检查 Vercel 环境变量
2. 确认 Stripe Dashboard 中的 Webhook URL 正确
3. 重新复制 Signing Secret

### 购买后未发币

**可能原因**：
- Webhook 未触发
- 用户识别失败（找不到 user_id）

**排查**：
1. 检查 Stripe Dashboard → Webhooks → Recent events
2. 查看是否有 `checkout.session.completed` event
3. 检查 `pending_credit_grants` 表（如果用户未找到会存入这里）
4. 检查 `profiles` 表是否有用户邮箱记录

### Starter 防薅不生效

**可能原因**：
- `starter_purchase_guards` 表未创建
- device_id 未正确传递

**排查**：
1. 检查数据库表是否存在
2. 检查浏览器 localStorage 是否有 `device_id`
3. 查看 `/api/pay` 接口日志

---

## ✅ 上线检查清单

- [ ] 数据库迁移执行成功
- [ ] Stripe Webhook 配置完成
- [ ] 环境变量已配置
- [ ] 测试购买流程通过
- [ ] 测试幂等性通过
- [ ] 测试 Starter 防薅通过

---

**完成时间**: 2026-01-07  
**状态**: ✅ 所有代码就绪，等待执行迁移和配置 Webhook

**下一步**: 按照上面的 3 个步骤执行，即可上线！

