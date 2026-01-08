# 定价发币系统快速参考

## 🎯 5 个关键点实现状态

| 关键点 | 状态 | 文件位置 |
|--------|------|----------|
| **1. planConfig() 四档发币** | ✅ 完成 | `lib/billing/planConfig.ts` |
| **2. Stripe webhook 幂等发币** | ✅ 完成 | `app/api/stripe/webhook/route.ts` |
| **3. 钱包扣币 SQL/TS** | ✅ 完成 | `supabase/migrations/054_deduct_credits_function.sql` + `lib/billing/charge.ts` |
| **4. Starter 防薅校验** | ✅ 完成 | `app/api/stripe/webhook/route.ts` (isStarterAllowed) |
| **5. Veo Fast/Pro 英文高端文案** | ✅ 完成 | `components/veo/VeoFastPage.tsx` + `components/veo/VeoProPage.tsx` |

---

## 📁 核心文件清单

### 配置
- `lib/billing/planConfig.ts` - 四档计划配置（永久/bonus/过期）
- `lib/billing/cost.ts` - 模型成本（Sora 10, Veo Fast 50, Veo Pro 250）

### 数据库
- `supabase/migrations/052_billing_wallet_schema.sql` - 表结构（钱包、账本、购买、用量、设备、风险）
- `supabase/migrations/053_grant_credits_functions.sql` - 发币函数
- `supabase/migrations/054_deduct_credits_function.sql` - 扣币函数 + 用量累加

### API
- `app/api/stripe/webhook/route.ts` - Webhook 处理（幂等 + 防薅 + 发币）
- `app/api/checkout/create/route.ts` - 创建 Checkout Session（写入 user_id + device_id）
- `lib/billing/charge.ts` - 扣币逻辑（Starter 限频 + Veo Pro 锁定）

### 工具
- `lib/risk/deviceId.ts` - Device ID 生成
- `lib/billing/get-user-plan.ts` - 获取用户计划

### 页面
- `components/veo/VeoFastPage.tsx` - Veo Fast 页面（高端英文）
- `components/veo/VeoProPage.tsx` - Veo Pro 页面（高端英文）
- `app/veo-fast/page.tsx` - Veo Fast 路由
- `app/veo-pro/page.tsx` - Veo Pro 路由

---

## 🚀 立即执行的 3 步

### 1. 执行数据库迁移（必须）

在 Supabase Dashboard → SQL Editor 依次执行：

```sql
-- 1. 表结构
-- 执行: supabase/migrations/052_billing_wallet_schema.sql

-- 2. 发币函数
-- 执行: supabase/migrations/053_grant_credits_functions.sql

-- 3. 扣币函数
-- 执行: supabase/migrations/054_deduct_credits_function.sql
```

### 2. 配置 Stripe Webhook（必须）

1. **Stripe Dashboard** → Webhooks → Add endpoint
2. **URL**: `https://sora2aivideos.com/api/stripe/webhook`
3. **事件**: `checkout.session.completed`
4. **复制 Secret** (`whsec_...`)
5. **Vercel** → Environment Variables → 添加 `STRIPE_WEBHOOK_SECRET`

### 3. 更新 Payment Link ID（可选）

当获取到 Stripe Payment Link ID 后，更新 `lib/billing/planConfig.ts`：

```typescript
stripe: {
  paymentLinkId: "plink_xxxxxxxxxxxxx", // 填入实际 ID
  paymentLinkUrl: "https://buy.stripe.com/...", // 保留作为 fallback
}
```

---

## 🔄 购买流程

```
用户点击购买
  ↓
前端: /api/checkout/create (planId + deviceId)
  ↓
后端: 创建 Checkout Session (user_id + device_id 写入 metadata)
  ↓
用户完成支付
  ↓
Stripe → Webhook: /api/stripe/webhook
  ↓
1. 幂等性检查 (purchases.stripe_event_id)
2. 识别计划 (paymentLinkId/Url)
3. Starter 防薅校验 (isStarterAllowed)
4. 记录购买 (purchases 表)
5. 发币 (grant_credits SQL)
```

---

## 💰 扣币流程

```
用户生成视频
  ↓
/api/video/generate
  ↓
1. 获取用户计划 (getUserPlan)
2. Starter 限制检查:
   - Veo Pro 锁定
   - 日限额 (usage_daily)
3. 扣币 (chargeForRender → deduct_credits_from_wallet SQL)
4. 记录用量 (increment_usage_daily SQL)
```

---

## 📊 四档发币配置

| 计划 | 价格 | 永久积分 | Bonus 积分 | Bonus 过期 |
|------|------|----------|------------|------------|
| Starter | $4.9 | 0 | 200 | 7 天 |
| Creator | $39 | 2000 | 600 | 14 天 |
| Studio | $99 | 6000 | 1500 | 30 天 |
| Pro | $299 | 20000 | 4000 | 60 天 |

---

## 🔒 Starter 防薅规则

- ✅ 同账号：只能买一次
- ✅ 同设备：只能买一次
- ✅ 同卡指纹：只能买一次
- ✅ 同 IP /24：每天最多 3 个
- ✅ Veo Pro：锁定
- ✅ 日限额：Sora 6/day, Veo Fast 1/day

---

## ✨ 关键特性

1. **幂等性**：同一支付只会发一次币（`purchases.stripe_event_id` unique）
2. **Bonus 优先**：扣币时优先使用 Bonus，自动过期检查
3. **账本记录**：所有加减币操作都记录到 `wallet_ledger`
4. **并发安全**：SQL 函数保证原子性操作
5. **风控完整**：device/ip/fingerprint 三重校验

---

**详细文档**: `COMPLETE_BILLING_SYSTEM_IMPLEMENTATION.md`

