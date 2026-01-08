# 最终定价发币系统 - 完整实现

## ✅ 已完成的所有组件

### 1. PlanConfig 配置（4个 Payment Link ID 已固化）

✅ **文件**: `lib/billing/planConfig.ts`

- ✅ Starter: `plink_1SjMNLDqGbi6No9vUku66neA` ($4.9)
- ✅ Creator: `plink_1SRxHLDqGbi6No9vhu7i5iud` ($39)
- ✅ Studio: `plink_1SmxBiDqGbi6No9v4L6dFvvK` ($99)
- ✅ Pro: `plink_1SNF1zDqGbi6No9vqtJXYMhQ` ($299)

✅ **发币配置**：
- Starter: 0 permanent + 200 bonus (7 days)
- Creator: 2000 permanent + 600 bonus (14 days)
- Studio: 6000 permanent + 1500 bonus (30 days)
- Pro: 20000 permanent + 4000 bonus (60 days)

✅ **模型成本**：
- Sora: 10 credits
- Veo Fast: 50 credits
- Veo Pro: 250 credits

---

### 2. Webhook（简化版，优先 metadata.plan_id）

✅ **文件**: `app/api/stripe/webhook/route.ts`

✅ **关键特性**：
- ✅ 优先使用 `metadata.plan_id`（最稳）
- ✅ 回退到 `payment_link` 识别
- ✅ 幂等性：`purchases.stripe_event_id` unique
- ✅ 用户识别：`client_reference_id` → `metadata.user_id` → email 匹配
- ✅ 待处理记录：如果找不到用户，存入 `pending_credit_grants`

---

### 3. 数据库迁移（完整钱包系统）

✅ **文件**: `supabase/migrations/055_billing_complete.sql`

✅ **表结构**：
- `profiles` - 用户邮箱映射（用于 webhook 用户识别）
- `wallets` - 钱包（永久 + bonus 积分）
- `wallet_ledger` - 账本（所有加减币记录）
- `purchases` - 购买记录（幂等锚点）
- `pending_credit_grants` - 待处理发币（用户未找到时）

✅ **SQL 函数**：
- `ensure_wallet()` - 确保钱包存在
- `grant_credits_for_purchase()` - 原子发币（幂等）
- `deduct_credits_from_wallet()` - 扣币（Bonus 优先，Veo Pro 只用永久）

✅ **文件**: `supabase/migrations/056_starter_anti_abuse.sql`

✅ **防薅表**：
- `user_devices` - 设备跟踪
- `starter_purchase_guards` - Starter 购买防护

---

### 4. 扣币逻辑（TS 调用）

✅ **文件**: `lib/billing/wallet.ts`

✅ **函数**：
- `deductCredits()` - 扣币（调用 SQL 函数）
- `refundCredits()` - 退款（生成失败时）

---

### 5. Starter 防薅接口

✅ **文件**: `app/api/pay/route.ts`

✅ **规则**：
- ✅ 同 device_id：Starter 只能买一次
- ✅ 同 IP：24h 内最多 3 次
- ✅ 其他计划直接跳转 Payment Link

✅ **使用方式**：
```
/api/pay?plan=starter&device_id=xxx&email=xxx@example.com
```

---

### 6. Veo Fast / Veo Pro 页面（高端英文文案）

✅ **Veo Pro** (`components/veo/VeoProPage.tsx`):
- Hero: "Veo Pro - Studio-grade motion, richer detail, and sound — for the final cut"
- 使用场景：Exporting for client, Publishing to social, Product demo, Final version
- 工作流：Draft with Sora → Upgrade with Veo Pro
- 模型指南：Sora Preview / Veo Fast / Veo Pro
- 透明积分：10/50/250 credits per render

✅ **Veo Fast** (`components/veo/VeoFastPage.tsx`):
- Hero: "Veo Fast - A clean quality upgrade — still fast enough to keep your workflow moving"
- 优势：Better detail still fast, Great for quick upgrades, Predictable credits
- 工作流：Sora Preview → Veo Fast → Veo Pro (when needed)

---

## 🚀 立即执行的步骤

### P0（今天必须做，直接开始收钱）

#### 1. 执行数据库迁移

在 Supabase Dashboard → SQL Editor 依次执行：

```sql
-- 1. 完整钱包系统
-- 执行: supabase/migrations/055_billing_complete.sql

-- 2. Starter 防薅表
-- 执行: supabase/migrations/056_starter_anti_abuse.sql
```

#### 2. 配置 Stripe Webhook

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Add endpoint**
3. **URL**: `https://sora2aivideos.com/api/stripe/webhook`
4. **Events**: 勾选 `checkout.session.completed`
5. **复制 Signing Secret** (`whsec_...`)
6. **Vercel** → **Environment Variables** → 添加 `STRIPE_WEBHOOK_SECRET`

#### 3. 更新 Checkout Session 创建（已更新）

✅ `app/api/checkout/create/route.ts` 已更新：
- 使用 `PLAN_CONFIGS[planId].paymentLinkId`
- 写入 `metadata.plan_id`（webhook 优先用这个）

#### 4. 前端 Buy 按钮（已更新）

✅ `app/pricing/page.tsx` 已更新：
- 获取 device_id
- 获取 auth token
- 调用 `/api/checkout/create`

---

### P1（防薅 + 降风险）

#### 1. Starter 走防薅接口

更新前端 Starter Buy 按钮，使用 `/api/pay?plan=starter&device_id=xxx&email=xxx`：

```typescript
// 在 PricingPage 或 PlanCard 中
if (planId === "starter") {
  const deviceId = getOrCreateDeviceId();
  const email = user?.email || "";
  window.location.href = `/api/pay?plan=starter&device_id=${deviceId}&email=${encodeURIComponent(email)}`;
} else {
  // 其他计划走正常 checkout
  handleCheckout(planId);
}
```

#### 2. 每日限额（Starter）

在视频生成 API 中添加 Starter 日限额检查：

```typescript
// 在 app/api/video/generate/route.ts 中
if (planId === "starter") {
  const dailyCaps = PLAN_CONFIGS.starter.dailyCaps;
  const modelKey = model === "sora-2" ? "sora" : model === "veo-flash" ? "veo_fast" : "veo_pro";
  const cap = dailyCaps?.[modelKey];
  
  if (cap) {
    // 检查今日用量（使用 usage_daily 表）
    const { data: usage } = await supabase
      .from("usage_daily")
      .select("*")
      .eq("user_id", userId)
      .eq("day", new Date().toISOString().slice(0, 10))
      .single();
    
    const currentCount = usage?.[`${modelKey}_count`] || 0;
    if (currentCount >= cap) {
      return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });
    }
  }
}
```

---

### P2（增长）

#### Upsell Nudge

已有组件框架，按需触发：
- 导出时提示 Veo Pro
- 第 2 次生成后提示
- 质量意图点击时提示

---

## 📊 系统架构

### 购买流程（完整闭环）

```
用户点击 Buy
  ↓
前端: getOrCreateDeviceId() + getSession().access_token
  ↓
调用: /api/checkout/create
  - Authorization: Bearer ${token}
  - body: { planId, deviceId }
  ↓
后端验证: supabaseAdmin.auth.getUser(jwt)
  ↓
创建 Checkout Session:
  - payment_link: plink_... (从 PLAN_CONFIGS)
  - metadata: { user_id, plan_id, device_id, ip_prefix }
  - client_reference_id: userId
  ↓
返回: { url: session.url }
  ↓
前端跳转: window.location.href = url
  ↓
用户完成支付
  ↓
Stripe → Webhook: /api/stripe/webhook
  ↓
Webhook 处理:
  1. 验证签名
  2. 识别计划 (metadata.plan_id 优先)
  3. 识别用户 (client_reference_id → metadata.user_id → email)
  4. 幂等性检查 (purchases.stripe_event_id)
  5. 发币 (grant_credits_for_purchase SQL)
  6. 记录购买 (purchases 表)
```

### 扣币流程

```
用户生成视频
  ↓
/api/video/generate
  ↓
1. 获取用户计划 (getUserPlan)
2. Starter 限制检查:
   - Veo Pro 锁定
   - 日限额 (usage_daily)
3. 扣币 (deductCredits → deduct_credits_from_wallet SQL)
4. 记录用量 (increment_usage_daily SQL)
```

---

## 🔐 安全特性

1. **幂等性**：
   - `purchases.stripe_event_id` unique 约束
   - 同一 event 只会发一次币

2. **防薅闭环**：
   - device_id 从 metadata 获取
   - IP prefix 从请求头提取
   - Starter 专用接口限制

3. **扣币一致性**：
   - SQL 函数保证原子性
   - Bonus 优先，自动过期检查
   - Veo Pro 只用永久积分

---

## 📋 验收清单

- [ ] 执行数据库迁移（055 + 056）
- [ ] 配置 Stripe Webhook（URL + Secret）
- [ ] 测试购买流程（验证发币）
- [ ] 测试扣币流程（验证 Starter 限制）
- [ ] 测试幂等性（重放 webhook event）
- [ ] 测试 Starter 防薅（同 device/IP 限制）

---

**实现完成时间**: 2026-01-07  
**状态**: ✅ 完整实现，等待数据库迁移和 Webhook 配置

