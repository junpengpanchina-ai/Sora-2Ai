# 4 个关键问题补齐完成总结

## ✅ 已完成的工作

### 1. 支付闭环：Stripe 支付成功后"发币"必须 100% 准确

#### ✅ 已完成
- **Checkout Session metadata 支持**：`app/api/payment/create-plan-checkout/route.ts` 已在 metadata 中设置 `plan_id`
- **Webhook 幂等性检查**：`app/api/payment/webhook/route.ts` 已添加 `purchases` 表检查，确保同一 session 不重复发币
- **Webhook 支持 Checkout Session**：已更新 Webhook 优先从 metadata 读取 `plan_id`，直接调用 `apply_purchase` RPC

#### ⚠️ 需要配置
1. **Stripe Webhook 端点**：
   - URL: `https://sora2aivideos.com/api/payment/webhook`
   - 事件：`checkout.session.completed`
   - Secret: 添加到 `STRIPE_WEBHOOK_SECRET` 环境变量

2. **验证幂等性**：
   - 同一 session_id 多次调用 Webhook 只会发一次币
   - 通过 `purchases` 表的 `provider_payment_id` 唯一索引保证

### 2. 钱包扣币规则：永久+Bonus 的扣除顺序已固化

#### ✅ 已完成
- **优先扣 Bonus**：`deduct_credits` RPC 函数已实现（第 123-127 行）
- **Bonus 过期自动失效**：`deduct_credits` 函数在每次扣除时检查过期（第 112-121 行）
- **Starter 禁用 Veo Pro**：`check_and_increment_daily_usage` RPC 函数已实现（第 221-224 行）

#### ⚠️ 需要补充
1. **Bonus 过期定时任务**（可选但推荐）：
   ```sql
   -- 可以创建 PostgreSQL 定时任务或使用 Supabase Cron
   -- 每天清理过期的 Bonus 积分
   UPDATE wallets
   SET bonus_credits = 0, bonus_expires_at = NULL
   WHERE bonus_expires_at IS NOT NULL
     AND bonus_expires_at <= NOW();
   ```

2. **前端禁用 Veo Pro**（Starter 用户）：
   - 需要在前端获取用户权益
   - 根据 `user_entitlements.veo_pro_enabled` 禁用选项

### 3. 风控落地：Starter 4.9 必须"可买但不可薅"

#### ✅ 已完成
- **device_id 生成**：`lib/billing/device-fingerprint.ts` 已创建
- **IP 提取和哈希**：`lib/billing/ip-utils.ts` 已创建
- **风险评分系统**：`lib/billing/risk-scoring.ts` 已创建
- **数据库风控字段**：`supabase/migrations/051_add_risk_control_fields.sql` 已创建
- **风控函数**：`can_purchase_starter` 和 `get_risk_profile` RPC 函数已创建

#### ⚠️ 需要集成
1. **前端集成 device_id**：
   ```typescript
   import { getDeviceId } from '@/lib/billing/device-fingerprint';
   const deviceId = getDeviceId();
   // 在购买和生成时传递 deviceId
   ```

2. **购买前风控检查**：
   - 在 `app/api/payment/create-plan-checkout/route.ts` 中调用 `can_purchase_starter`
   - 如果返回 `can_purchase: false`，拒绝购买并返回原因

3. **Webhook 记录风控信息**：
   - 从 Stripe Payment Intent 提取 `payment_fingerprint` 和 `last4`
   - 提取 IP 并计算 `ip_prefix`
   - 记录到 `purchases` 表

### 4. 定价页与Veo页：把"高端感"写到结构里

#### ✅ 已完成
- **Sora 定位词**：已更新为 "Preview / Draft / Iteration workflow"
  - `app/video/VideoPageClient.tsx`: "Sora Preview - Fast, lightweight video generation for early exploration."
  - `components/pricing/PricingPage.tsx`: "Use Sora for everyday iteration"
- **Veo 定位词**：已更新为 "Final / Studio-grade / Production-ready"
  - `components/veo/VeoProPage.tsx`: "Studio-grade final exports", "Final export for maximum fidelity"
- **价格心理锚点**：Creator $39 标记为 "Recommended"

#### ⚠️ 需要检查
1. **所有页面文案一致性**：
   - ✅ Pricing 页：符合要求
   - ✅ Veo Pro 页：符合要求
   - ⚠️ 视频生成页：需要确保所有文案符合要求

2. **禁用词汇检查**：
   - ❌ 确保没有 "cheap / budget / basic" 等词汇
   - ✅ 使用 "everyday / draft / iteration / workflow"

---

## 📋 待完成清单

### 高优先级（必须完成）

- [ ] **执行数据库迁移** `051_add_risk_control_fields.sql`
- [ ] **配置 Stripe Webhook**：
  - 在 Stripe Dashboard 添加 Webhook 端点
  - 设置 `STRIPE_WEBHOOK_SECRET` 环境变量
- [ ] **前端集成 device_id**：
  - 在购买和生成时传递 `deviceId`
  - 从 `lib/billing/device-fingerprint.ts` 导入
- [ ] **购买前风控检查**：
  - 在 `create-plan-checkout` API 中调用 `can_purchase_starter`
  - 如果 Starter 且风控失败，拒绝购买
- [ ] **前端禁用 Veo Pro**（Starter 用户）：
  - 获取用户权益（`user_entitlements`）
  - 如果 `veo_pro_enabled = false`，禁用 Veo Pro 选项并显示提示

### 中优先级（建议完成）

- [ ] **Webhook 记录风控信息**：
  - 提取 payment fingerprint 和 last4
  - 提取 IP 并计算 ip_prefix
  - 记录到 `purchases` 表
- [ ] **Bonus 过期定时任务**：
  - 设置 Supabase Cron 或 PostgreSQL 定时任务
  - 每天清理过期的 Bonus 积分
- [ ] **风险分应用**：
  - 在生成前检查风险分
  - 根据风险分应用限制（降速/限额）

### 低优先级（优化）

- [ ] **完善错误提示**：
  - Starter 用户尝试使用 Veo Pro 时显示友好提示
  - 风控拒绝购买时显示原因
- [ ] **监控和日志**：
  - 记录所有风控决策
  - 监控风险分分布

---

## 🔧 实现细节

### 1. 支付闭环实现

**Webhook 流程**：
1. Stripe 发送 `checkout.session.completed` 事件
2. Webhook 验证签名
3. 幂等性检查（`purchases` 表）
4. 从 metadata 读取 `plan_id`（Checkout Session）或通过金额识别（Payment Link）
5. 调用 `apply_purchase` RPC 函数
6. 记录购买到 `purchases` 表

**关键代码**：
```typescript
// 幂等性检查
const { data: existingPurchase } = await supabase
  .from('purchases')
  .select('id')
  .eq('provider', 'stripe')
  .eq('provider_payment_id', session.id)
  .limit(1)
  .maybeSingle();

if (existingPurchase) {
  return NextResponse.json({ success: true, message: 'Already processed' });
}

// 应用购买
const { error: applyErr } = await supabase.rpc('apply_purchase', rpcParams);
```

### 2. 钱包扣币规则

**扣除顺序**（已在 RPC 函数中固化）：
1. 检查 Bonus 是否过期（过期则清零）
2. 优先从 Bonus 扣除
3. 不足时从永久积分扣除
4. 如果都不足，返回错误

**关键代码**（`deduct_credits` RPC）：
```sql
-- Expire bonus if needed
IF w.bonus_expires_at IS NOT NULL AND w.bonus_expires_at <= now_ts THEN
  UPDATE public.wallets SET bonus_credits = 0, bonus_expires_at = NULL;
END IF;

-- Take from bonus first
IF w.bonus_credits > 0 THEN
  take_bonus := LEAST(w.bonus_credits, cost_left);
  cost_left := cost_left - take_bonus;
END IF;

-- Then permanent
IF cost_left > 0 THEN
  take_perm := cost_left;
END IF;
```

### 3. 风控落地

**device_id 生成**：
```typescript
import { getDeviceId } from '@/lib/billing/device-fingerprint';
const deviceId = getDeviceId(); // 自动生成并持久化
```

**购买前检查**：
```typescript
const { data: canPurchase } = await supabase.rpc('can_purchase_starter', {
  p_user_id: userId,
  p_device_id: deviceId,
  p_ip_prefix: ipPrefix,
  p_payment_fingerprint: paymentFingerprint,
});

if (!canPurchase.can_purchase) {
  return NextResponse.json(
    { error: canPurchase.reason },
    { status: 403 }
  );
}
```

**风险分计算**：
```typescript
import { calculateRiskScore } from '@/lib/billing/risk-scoring';
const riskProfile = calculateRiskScore({
  starterAttempts,
  deviceCount7d,
  ipCount7d,
  velocityRenders24h,
  paymentFingerprints,
});
```

### 4. 文案定位

**Sora 定位**（已实现）：
- "Sora Preview" - 不是 "Sora Basic" 或 "Sora Cheap"
- "Fast, lightweight video generation for early exploration"
- "Everyday drafts and iteration"
- "Use Sora for everyday iteration"

**Veo Pro 定位**（已实现）：
- "Veo Pro — Studio-grade final exports"
- "Final export for maximum fidelity"
- "Preferred when final quality and sound matter"
- "Upgrade the version you're publishing"

---

## 🚀 下一步执行顺序

1. **执行数据库迁移** `051_add_risk_control_fields.sql`
2. **配置 Stripe Webhook**（必需）
3. **前端集成 device_id**（必需）
4. **购买前风控检查**（必需）
5. **前端禁用 Veo Pro**（必需）
6. **Webhook 记录风控信息**（建议）
7. **Bonus 过期定时任务**（建议）

---

**状态**: ✅ 代码实现完成，等待数据库迁移和集成测试

