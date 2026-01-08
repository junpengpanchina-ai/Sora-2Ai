# 完整定价发币系统实现总结

## ✅ 已实现的核心组件

### 1. 计划配置系统 (`lib/billing/planConfig.ts`)

✅ **四档计划配置**：
- `starter`: $4.9, 0 permanent + 200 bonus (7 days)
- `creator`: $39, 2000 permanent + 600 bonus (14 days)
- `studio`: $99, 6000 permanent + 1500 bonus (30 days)
- `pro`: $299, 20000 permanent + 4000 bonus (60 days)

✅ **Stripe 映射**：
- 支持 `paymentLinkId` (plink_...) 和 `paymentLinkUrl` 两种方式
- `resolvePlanIdFromStripePaymentLink()` 函数自动识别

✅ **Starter 防薅规则**：
- `allowVeoPro: false`
- `dailySoraCap: 6`
- `dailyVeoFastCap: 1`
- `onePerAccount/Device/CardFingerprint: true`

---

### 2. 数据库迁移

✅ **052_billing_wallet_schema.sql**：
- `wallets` - 永久 + bonus 积分
- `wallet_ledger` - 账本（每次加减币记录）
- `purchases` - 购买记录（幂等 + 风控）
- `usage_daily` - 每日用量（Starter 限频）
- `user_devices` - 设备表
- `risk_events` - 风险事件

✅ **053_grant_credits_functions.sql**：
- `ensure_wallet()` - 确保钱包存在
- `grant_credits()` - 发币（永久 + bonus + 过期时间）
- `expire_bonus_credits()` - 过期清理

✅ **054_deduct_credits_function.sql**：
- `deduct_credits_from_wallet()` - 扣币（Bonus 优先，自动过期检查）
- `increment_usage_daily()` - 原子累加用量（并发安全）

---

### 3. Webhook 处理 (`app/api/stripe/webhook/route.ts`)

✅ **幂等性**：
- 通过 `purchases.stripe_event_id` unique 约束保证
- 同一 event.id 只会发一次币

✅ **计划识别**：
- 优先从 `paymentLinkId` 识别
- 回退到 `paymentLinkUrl` 识别
- 支持两种映射方式

✅ **Starter 防薅校验**：
- `isStarterAllowed()` 函数检查：
  - 同账号一次
  - 同设备一次
  - 同卡指纹一次
  - IP /24 每天最多 3 个

✅ **风控信息记录**：
- `device_id` - 从 metadata 获取
- `ip_prefix` - 从请求头提取
- `card_fingerprint` - 从 Payment Intent 提取

✅ **发币流程**：
- 调用 `grant_credits()` SQL 函数
- 记录到 `wallet_ledger`
- 记录设备到 `user_devices`

---

### 4. Checkout Session 创建 (`app/api/checkout/create/route.ts`)

✅ **关键功能**：
- 创建 Stripe Checkout Session（替代直接 Payment Link）
- 在 `client_reference_id` 和 `metadata` 中写入 `user_id`
- 在 `metadata` 中写入 `device_id`
- 支持所有 4 个计划

✅ **前端集成**：
- `app/pricing/page.tsx` - 已更新使用新 API
- `app/HomePageClient.tsx` - 已更新使用新 API
- 自动获取并传递 `device_id`

---

### 5. 钱包扣币系统 (`lib/billing/charge.ts`)

✅ **扣币逻辑**：
- 调用 `deduct_credits_from_wallet()` SQL 函数
- Bonus 优先，自动过期检查
- 不足时从永久积分扣除

✅ **Starter 限制**：
- 禁止 Veo Pro（`starter_veo_pro_locked`）
- 日限额检查（`starter_daily_sora_cap` / `starter_daily_veo_fast_cap`）
- 使用 `increment_usage_daily()` 原子累加

✅ **模型成本** (`lib/billing/cost.ts`)：
- Sora: 10 credits
- Veo Fast: 50 credits
- Veo Pro: 250 credits

---

### 6. Device ID 工具 (`lib/risk/deviceId.ts`)

✅ **功能**：
- `getOrCreateDeviceId()` - 生成并持久化到 localStorage
- 使用 `crypto.randomUUID()`
- 自动存储到 `device_id_v1` key

---

### 7. Veo Fast / Veo Pro 页面（高端英文文案）

✅ **Veo Fast 页面** (`components/veo/VeoFastPage.tsx`):
- Hero: "Veo Fast — Fast, high-fidelity upgrades for your draft"
- 定位: "When Sora helps you explore, Veo Fast helps you refine"
- 使用场景: "Crisp product shots", "Cleaner textures", "Faster iteration"
- 工作流: "Draft in Sora → Refine in Veo Fast"
- FAQ: "Is Veo Fast better than Sora?" - "They serve different moments"

✅ **Veo Pro 页面** (`components/veo/VeoProPage.tsx`):
- Hero: "Veo Pro — Studio-grade final renders"
- 定位: "For production-ready motion, realism, and the cleanest final export"
- 使用场景: "More realistic motion", "Higher fidelity detail", "Cleaner final output"
- 工作流: "Step 1 — Draft in Sora → Step 2 — Finalize with Veo Pro"
- FAQ: "Do I need Veo Pro for every video?" - "No. Most workflows start with Sora"

✅ **路由**：
- `/veo-fast` - Veo Fast 页面
- `/veo-pro` - Veo Pro 页面

---

## ⚠️ 待完成的工作

### 1. 执行数据库迁移（必须）

```sql
-- 在 Supabase Dashboard → SQL Editor 依次执行：
-- 1. supabase/migrations/052_billing_wallet_schema.sql
-- 2. supabase/migrations/053_grant_credits_functions.sql
-- 3. supabase/migrations/054_deduct_credits_function.sql
```

### 2. 更新视频生成 API（建议）

当前 `app/api/video/generate/route.ts` 仍使用旧的 `deductCredits()` 函数。

**迁移步骤**：
1. 获取用户计划：`const planId = await getUserPlan(userProfile.id)`
2. 映射模型：`const modelId = model === 'sora-2' ? 'sora' : model === 'veo-flash' ? 'veo_fast' : 'veo_pro'`
3. 调用新扣币：`await chargeForRender({ userId: userProfile.id, model: modelId, jobId: videoTask.id, planId })`

**示例代码**：
```typescript
// 替换旧的 deductCredits 调用
import { chargeForRender } from '@/lib/billing/charge'
import { getUserPlan } from '@/lib/billing/get-user-plan'

// 在创建 videoTask 后
const planId = await getUserPlan(userProfile.id)
const modelId = model === 'sora-2' ? 'sora' : model === 'veo-flash' ? 'veo_fast' : 'veo_pro'

try {
  await chargeForRender({
    userId: userProfile.id,
    model: modelId,
    jobId: videoTask.id,
    planId,
  })
} catch (err: any) {
  // 删除任务记录
  await supabase.from('video_tasks').delete().eq('id', videoTask.id)
  
  if (err.message === 'starter_veo_pro_locked') {
    return jsonResponse({ error: 'Veo Pro is not available on Starter Access' }, { status: 403 })
  }
  if (err.message === 'insufficient_credits') {
    return jsonResponse({ error: 'Insufficient credits' }, { status: 402 })
  }
  if (err.message?.includes('starter_daily')) {
    return jsonResponse({ error: err.message }, { status: 429 })
  }
  return jsonResponse({ error: 'Failed to charge credits' }, { status: 500 })
}
```

### 3. 配置 Stripe Webhook（必须）

1. **在 Stripe Dashboard 创建 Webhook**：
   - URL: `https://sora2aivideos.com/api/stripe/webhook`
   - 事件: `checkout.session.completed`
   - 复制 Signing Secret

2. **在 Vercel 添加环境变量**：
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...`

3. **验证**：
   - 测试购买后检查 Webhook 日志（状态应为 200）
   - 检查数据库 `purchases` 和 `wallets` 表

### 4. 更新 Payment Link ID（可选）

当获取到 Stripe Payment Link ID 后，更新 `lib/billing/planConfig.ts`：

```typescript
stripe: {
  paymentLinkId: "plink_xxxxxxxxxxxxx", // 填入实际 ID
  paymentLinkUrl: "https://buy.stripe.com/...", // 保留作为 fallback
}
```

---

## 📋 系统架构

### 购买流程

```
用户点击购买
  ↓
前端调用 /api/checkout/create (传递 planId + deviceId)
  ↓
后端创建 Checkout Session (写入 user_id + device_id)
  ↓
用户完成支付
  ↓
Stripe 发送 checkout.session.completed 事件
  ↓
Webhook (/api/stripe/webhook) 处理：
  1. 验证签名
  2. 幂等性检查
  3. 识别计划 (paymentLinkId/Url)
  4. Starter 防薅校验
  5. 记录购买 (purchases 表)
  6. 发币 (grant_credits SQL 函数)
  7. 记录设备 (user_devices 表)
```

### 扣币流程

```
用户生成视频
  ↓
前端调用 /api/video/generate
  ↓
后端处理：
  1. 获取用户计划 (getUserPlan)
  2. Starter 限制检查 (Veo Pro 锁定 + 日限额)
  3. 扣币 (chargeForRender → deduct_credits_from_wallet SQL)
  4. 记录用量 (increment_usage_daily SQL)
  5. 调用 Grsai API
```

---

## 🔐 安全特性

1. **幂等性**：
   - Webhook: `purchases.stripe_event_id` unique
   - 同一支付只会发一次币

2. **Starter 防薅**：
   - 账号/设备/卡指纹/IP 多重校验
   - 日限额限制
   - Veo Pro 锁定

3. **扣币一致性**：
   - SQL 函数保证原子性
   - Bonus 优先，自动过期检查
   - 账本记录所有操作

---

## 📊 数据表关系

```
auth.users
  ↓
wallets (1:1) - 永久 + bonus 积分
  ↓
wallet_ledger (1:N) - 账本记录

purchases (1:N) - 购买记录
  ↓
user_devices (N:M) - 设备关联

usage_daily (1:N) - 每日用量

risk_events (1:N) - 风险事件
```

---

## 🚀 部署检查清单

- [ ] 执行数据库迁移（052, 053, 054）
- [ ] 配置 Stripe Webhook（URL + Secret）
- [ ] 更新 Vercel 环境变量（`STRIPE_WEBHOOK_SECRET`）
- [ ] 测试购买流程（验证发币）
- [ ] 测试扣币流程（验证 Starter 限制）
- [ ] 更新 Payment Link ID（可选）

---

**实现完成时间**: 2026-01-07  
**状态**: ✅ 核心系统已实现，等待数据库迁移和 Webhook 配置

