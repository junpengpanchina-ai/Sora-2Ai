# Checkout Session 完整实现总结

## ✅ 已完成的更新

### 1. Checkout Session 创建 API (`app/api/checkout/create/route.ts`)

✅ **支持两种方案**：
- **方案 A（推荐）**：使用 `payment_link: plink_...` - 继承 Payment Link 所有设置
- **方案 B（兜底）**：使用 `line_items: [{ price: price_... }]` - 需要配置 Price ID

✅ **关键功能**：
- 从 Authorization header 获取 JWT token
- 验证用户身份（`supabaseAdmin.auth.getUser(jwt)`）
- 写入 metadata：
  - `user_id` - 用户 ID
  - `plan_id` - 计划 ID
  - `device_id` - 设备 ID
  - `payment_link_url` - Payment Link URL（用于回退识别）
  - `ip_prefix` - IP 前缀（用于风控）
- 设置 `client_reference_id` = userId（双重保障）

---

### 2. Webhook 更新 (`app/api/stripe/webhook/route.ts`)

✅ **优先级调整**：
```typescript
// 优先用 metadata.plan_id（最稳）
const planId =
  (session.metadata?.plan_id as PlanId | undefined) ??
  resolvePlanIdFromStripePaymentLink({ paymentLinkId, paymentLinkUrl }) ??
  null;

// 优先用 metadata.user_id，回退到 client_reference_id
const userId =
  (session.metadata?.user_id as string | undefined) ??
  (session.client_reference_id as string | undefined);

// deviceId 直接取 metadata
const deviceId = (session.metadata?.device_id as string | undefined) ?? null;
```

✅ **优势**：
- 不依赖 Payment Link ID/URL 映射（metadata 最稳）
- 即使更换 Payment Link，也能正确识别计划
- 支持未来扩展（metadata 可随时添加字段）

---

### 3. 前端 Buy 按钮更新

✅ **`app/pricing/page.tsx`**：
- 获取 device_id（`getOrCreateDeviceId()`）
- 获取 Supabase session token
- 调用 `/api/checkout/create` 并传递 `Authorization: Bearer ${token}`
- 处理响应 `{ url: ... }` 并跳转

✅ **`app/HomePageClient.tsx`**：
- 已更新响应处理逻辑（使用 `json.url` 而不是 `json.checkout_url`）

---

## 🚀 立即执行的步骤

### 1. 获取 Payment Link ID（推荐方案 A）

在 Stripe Dashboard：
1. 进入 **Products** → **Payment Links**
2. 打开每个 Payment Link
3. 在 URL 或详情页找到 `plink_...` ID
4. 更新 `lib/billing/planConfig.ts`：

```typescript
stripe: {
  paymentLinkId: "plink_xxxxxxxxxxxxx", // 填入实际 ID
  paymentLinkUrl: "https://buy.stripe.com/...", // 保留作为 fallback
}
```

### 2. 配置 Stripe Webhook（必须）

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Add endpoint**
3. **URL**: `https://sora2aivideos.com/api/stripe/webhook`
4. **Events**: 勾选 `checkout.session.completed`
5. **复制 Signing Secret** (`whsec_...`)
6. **Vercel** → **Environment Variables** → 添加 `STRIPE_WEBHOOK_SECRET`

### 3. 测试流程（10 分钟验收）

1. **本地/线上打开** `/pricing`
2. **登录后点击 Buy**
3. **验证**：
   - ✅ 能跳到 Stripe Checkout
   - ✅ 支付成功回到 `/billing/success`
   - ✅ Supabase `purchases` 表增加一条（含 `plan_id`、`stripe_event_id`）
   - ✅ `wallets` 表永久/bonus 正确入账
4. **幂等性测试**：
   - 在 Stripe Dashboard → Webhooks → 重放同一 event
   - ✅ 不会重复发币（幂等成功）

---

## 📋 系统架构

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
  - payment_link: plink_... (方案 A)
  - metadata: { user_id, plan_id, device_id, payment_link_url, ip_prefix }
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
  2. 幂等性检查 (purchases.stripe_event_id)
  3. 识别计划 (metadata.plan_id 优先)
  4. 获取用户 (metadata.user_id 优先)
  5. Starter 防薅校验 (isStarterAllowed)
  6. 记录购买 (purchases 表)
  7. 发币 (grant_credits SQL)
  8. 记录设备 (user_devices 表)
```

---

## 🔐 安全特性

1. **服务端验证**：
   - JWT token 验证（`supabaseAdmin.auth.getUser(jwt)`）
   - 不信任前端传入的 user_id

2. **幂等性**：
   - `purchases.stripe_event_id` unique 约束
   - 同一 event 只会发一次币

3. **防薅闭环**：
   - device_id 从 metadata 获取（前端生成，后端验证）
   - IP prefix 从请求头提取
   - 卡 fingerprint 从 Payment Intent 提取
   - 三重校验：账号/设备/卡指纹

---

## ⚠️ 注意事项

### Payment Link vs Checkout Session

- **Payment Link**：一次性配置，用户直接访问链接
- **Checkout Session**：动态创建，可以写入 metadata

**当前方案**：Checkout Session 使用 Payment Link（`payment_link: plink_...`）
- ✅ 继承 Payment Link 的所有设置（价格、描述、图片等）
- ✅ 同时可以写入 metadata（user_id、device_id 等）
- ✅ 两全其美

### 环境变量

确保以下环境变量已配置：
- `STRIPE_SECRET_KEY` - Stripe API Key
- `STRIPE_WEBHOOK_SECRET` - Webhook Signing Secret
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key
- `NEXT_PUBLIC_APP_URL` 或 `NEXT_PUBLIC_SITE_URL` - 网站 URL（用于 success/cancel URL）

---

## 📊 数据流验证

### 购买记录（purchases 表）

```sql
SELECT 
  plan_id,
  user_id,
  device_id,
  ip_prefix,
  card_fingerprint,
  stripe_event_id,
  stripe_checkout_session_id,
  status
FROM purchases
WHERE user_id = '...'
ORDER BY created_at DESC;
```

### 钱包余额（wallets 表）

```sql
SELECT 
  permanent_credits,
  bonus_credits,
  bonus_expires_at
FROM wallets
WHERE user_id = '...';
```

### 账本记录（wallet_ledger 表）

```sql
SELECT 
  delta_permanent,
  delta_bonus,
  reason,
  ref_type,
  ref_id,
  created_at
FROM wallet_ledger
WHERE user_id = '...'
ORDER BY created_at DESC;
```

---

**实现完成时间**: 2026-01-07  
**状态**: ✅ 完整实现，等待 Payment Link ID 配置和 Webhook 测试

