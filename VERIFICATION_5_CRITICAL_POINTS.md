# 5 个关键点验证清单

## ✅ 1. planConfig()（四档发币：永久/bonus/过期）

### 实现位置
- **文件**: `lib/billing/config.ts`
- **函数**: `getPlanConfig(itemId: PlanId | "veoProUpgrade")`

### 功能验证
✅ **四档支持**：
- `starter`: 0 permanent, 120 bonus, 7 days
- `creator`: 600 permanent, 60 bonus, 30 days
- `studio`: 1800 permanent, 270 bonus, 45 days
- `pro`: 6000 permanent, 1200 bonus, 60 days

✅ **返回值结构**：
```typescript
{
  permanent: number,        // 永久积分
  bonus: number,            // Bonus 积分
  bonusExpiresAt: string,  // ISO 日期字符串（过期时间）
  ent: {                   // 权益配置
    planId: PlanId,
    veoProEnabled: boolean,
    priority: boolean,
    maxConcurrency: number,
  }
}
```

✅ **使用位置**：
- `app/api/payment/webhook/route.ts` - Webhook 发币
- `app/api/billing/finalize/route.ts` - 支付成功处理

### 状态：✅ 已完成

---

## ✅ 2. Stripe webhook（幂等发币）

### 实现位置
- **文件**: `app/api/payment/webhook/route.ts`
- **事件**: `checkout.session.completed`

### 功能验证
✅ **幂等性检查**（第 69-85 行）：
```typescript
// 检查 purchases 表是否已处理过此 session
const { data: existingPurchase } = await supabase
  .from('purchases')
  .select('id')
  .eq('provider', 'stripe')
  .eq('provider_payment_id', session.id)
  .limit(1)
  .maybeSingle();

if (existingPurchase) {
  return NextResponse.json({ 
    success: true, 
    message: 'Already processed',
    alreadyApplied: true 
  });
}
```

✅ **发币流程**：
1. 验证 Webhook 签名
2. 幂等性检查（purchases 表）
3. 从 metadata 读取 `plan_id`
4. 调用 `getPlanConfig()` 获取配置
5. 调用 `apply_purchase` RPC 函数发币
6. 记录购买到 `purchases` 表

✅ **风控信息记录**：
- `payment_fingerprint`（从 Payment Intent 提取）
- `payment_last4`（卡号后4位）
- `ip_hash` 和 `ip_prefix`（IP 风控）

### 状态：✅ 已完成

---

## ✅ 3. 钱包扣币 SQL/TS

### 实现位置
- **SQL 函数**: `supabase/migrations/049_add_wallet_system_complete.sql`
- **函数名**: `deduct_credits(p_user_id UUID, p_cost INT)`

### 功能验证
✅ **扣除顺序**（第 111-138 行）：
1. **检查 Bonus 过期**（第 112-121 行）：
   ```sql
   IF w.bonus_expires_at IS NOT NULL AND w.bonus_expires_at <= now_ts THEN
     UPDATE wallets SET bonus_credits = 0, bonus_expires_at = NULL;
   END IF;
   ```

2. **优先扣 Bonus**（第 123-127 行）：
   ```sql
   IF w.bonus_credits > 0 THEN
     take_bonus := LEAST(w.bonus_credits, cost_left);
     cost_left := cost_left - take_bonus;
   END IF;
   ```

3. **然后扣永久积分**（第 129-138 行）：
   ```sql
   IF cost_left > 0 THEN
     IF w.permanent_credits < cost_left THEN
       RETURN 'insufficient_credits';
     END IF;
     take_perm := cost_left;
   END IF;
   ```

✅ **TypeScript 调用**：
- `app/api/render/start/route.ts` - 生成前扣币
- 使用 `supabase.rpc("deduct_credits", { p_user_id, p_cost })`

### 状态：✅ 已完成

---

## ✅ 4. Starter 防薅校验（device/ip/fingerprint）

### 实现位置
- **购买前检查**: `app/api/payment/create-plan-checkout/route.ts`（第 63-101 行）
- **数据库函数**: `supabase/migrations/051_add_risk_control_fields.sql`
- **函数名**: `can_purchase_starter(...)`

### 功能验证
✅ **device_id 生成**：
- **文件**: `lib/billing/device-fingerprint.ts`
- **函数**: `getDeviceId()` - 自动生成并持久化到 localStorage

✅ **IP 提取**：
- **文件**: `lib/billing/ip-utils.ts`
- **函数**: `getIpPrefix(ip)` - 提取 /24 CIDR

✅ **购买前检查**（第 80-86 行）：
```typescript
const { data: canPurchase } = await supabase.rpc("can_purchase_starter", {
  p_user_id: auth.user.id,
  p_device_id: deviceId || "",
  p_ip_prefix: ipPrefix,
  p_payment_fingerprint: null, // Will be set in webhook
});
```

✅ **数据库校验规则**（`can_purchase_starter` 函数）：
1. 同一用户只能买一次 Starter
2. 同一设备（device_id）只能买一次
3. 同一 IP /24 段每天最多 3 个 Starter
4. 同一支付指纹（payment_fingerprint）只能买一次

✅ **Webhook 记录风控信息**：
- 从 Payment Intent 提取 `payment_fingerprint` 和 `last4`
- 记录到 `purchases` 表（需要执行迁移 `051_add_risk_control_fields.sql`）

### 状态：✅ 已完成（需要执行数据库迁移）

---

## ⚠️ 5. Veo Fast / Veo Pro 的页面文案（全英文，高端）

### 实现位置
- **Veo Pro 页面**: `components/veo/VeoProPage.tsx`
- **定价页**: `components/pricing/PricingPage.tsx`
- **积分使用表**: `components/pricing/CreditUsageTable.tsx`
- **视频生成页**: `app/video/VideoPageClient.tsx`

### 文案检查

#### ✅ Veo Pro 页面（`VeoProPage.tsx`）
- ✅ **标题**: "Veo Pro — Studio-grade final exports"
- ✅ **副标题**: "Upgrade the version you're publishing. Smoother motion, higher realism, cleaner detail."
- ✅ **定位**: "Final export for maximum fidelity"
- ✅ **使用场景**: "Final export (not just testing)", "Marketing, product, or training videos"
- ✅ **高端词汇**: "Studio-grade", "Production-ready", "Final delivery"

#### ✅ 定价页（`PricingPage.tsx`）
- ✅ **Veo Fast**: "Use Veo Fast for quick quality upgrades"
- ✅ **Veo Pro**: "Upgrade the final cut with Veo when quality matters"
- ✅ **工作流**: "Step 1: Draft with Sora" / "Step 2: Finalize with Veo Pro"

#### ✅ 积分使用表（`CreditUsageTable.tsx`）
- ✅ **Veo Flash**: "Quality upgrade without slowing down"
- ✅ **Veo Pro**: "Final export, highest realism and fidelity"

#### ⚠️ 视频生成页（`VideoPageClient.tsx`）
- ✅ **Veo Flash**: "Quality upgrade with audio, still fast for drafts and testing."
- ✅ **Veo Pro**: "Preferred when final quality and sound matter."
- ⚠️ **需要确认**: 所有文案都是英文（已确认）

### 禁用词汇检查
- ❌ 没有 "cheap / budget / basic" 等词汇
- ✅ 使用 "everyday / draft / iteration / workflow"
- ✅ 使用 "final / studio-grade / production-ready"

### 状态：✅ 已完成（全英文，高端定位）

---

## 📋 总结

| 关键点 | 状态 | 备注 |
|--------|------|------|
| 1. planConfig() 四档发币 | ✅ 完成 | 永久/bonus/过期时间已实现 |
| 2. Stripe webhook 幂等发币 | ✅ 完成 | 幂等性检查已实现 |
| 3. 钱包扣币 SQL/TS | ✅ 完成 | Bonus 优先，自动过期检查 |
| 4. Starter 防薅校验 | ✅ 完成 | 需要执行迁移 `051_add_risk_control_fields.sql` |
| 5. Veo Fast/Pro 文案 | ✅ 完成 | 全英文，高端定位 |

---

## 🚀 待执行操作

### 必须执行
1. **执行数据库迁移** `051_add_risk_control_fields.sql`
   ```sql
   -- 在 Supabase Dashboard → SQL Editor 执行
   ```

2. **配置 Stripe Webhook**
   - URL: `https://sora2aivideos.com/api/payment/webhook`
   - 事件: `checkout.session.completed`
   - Secret: 添加到 `STRIPE_WEBHOOK_SECRET` 环境变量

### 建议执行
3. **测试完整流程**
   - 测试购买 Starter（应检查 device/ip/fingerprint）
   - 测试 Webhook 幂等性（重复发送应只发一次币）
   - 测试扣币顺序（Bonus 优先，过期自动失效）

---

**验证完成时间**: 2026-01-07  
**状态**: ✅ 所有5个关键点已实现

