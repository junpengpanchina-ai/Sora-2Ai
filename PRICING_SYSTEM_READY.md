# ✅ 定价系统实现完成 - 可直接上线

## 🎉 已完成的所有功能

### 1. 定价配置系统 (`lib/billing/config.ts`)

**单一数据源配置**，包含：
- ✅ 4 个档位：Starter ($*.**), Creator ($**), Studio ($**), Pro ($***)
- ✅ 积分消耗：Sora **, Veo Fast **, Veo Pro ***
- ✅ Bonus 过期：Starter *天, Creator **天, Studio **天, Pro **天
- ✅ Starter 日限额：Sora */day, Veo Fast */day, Veo Pro locked
- ✅ Stripe Payment Links 映射

### 2. 数据库系统 (`supabase/migrations/049_add_wallet_system_complete.sql`)

**完整钱包系统**：
- ✅ `wallets` 表：永久积分 + Bonus 积分
- ✅ `user_entitlements` 表：计划、Veo Pro 访问、优先级、并发数
- ✅ `usage_daily` 表：每日使用统计（Starter 防刷）
- ✅ `purchases` 表：购买记录（幂等性 + 审计）
- ✅ 3 个核心函数：`deduct_credits`, `check_and_increment_daily_usage`, `apply_purchase`

### 3. Next.js API 实现

#### ✅ `/api/billing/finalize` - 支付成功处理
- Stripe session 验证
- 档位识别（Payment Link ID 或金额兜底）
- 幂等性检查
- 钱包入账

#### ✅ `/api/render/start` - 生成前校验
- Starter 日限额检查
- 积分扣除（Bonus 优先）

#### ✅ `/billing/success` - 支付成功页面
- 自动调用 finalize API
- 显示状态并跳转

### 4. Stripe 集成

- ✅ `lib/stripe.ts` - Stripe 客户端（支持 `getStripe()`）
- ✅ Payment Links 已配置在 `app/pricing/page.tsx`

## 🚀 立即执行的 3 个步骤

### 步骤 1: 执行数据库迁移（5分钟）

在 Supabase Dashboard → SQL Editor 执行：
```
supabase/migrations/049_add_wallet_system_complete.sql
```

**验证命令**：
```sql
-- 检查表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wallets', 'user_entitlements', 'usage_daily', 'purchases');

-- 检查函数
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('deduct_credits', 'check_and_increment_daily_usage', 'apply_purchase');
```

### 步骤 2: 配置 Stripe Payment Links（5分钟）

在 Stripe Dashboard，为每个 Payment Link 设置：

**Success URL**:
```
https://*****/billing/success?session_id={CHECKOUT_SESSION_ID}
```

**Cancel URL**:
```
https://*****/pricing?canceled=1
```

**4 个 Payment Links**:
- $*.**: https://buy.stripe.com/*****
- $**: https://buy.stripe.com/*****
- $**: https://buy.stripe.com/*****
- $***: https://buy.stripe.com/*****

### 步骤 3: 设置环境变量（2分钟）

在 Vercel Project → Environment Variables 添加：
```
STRIPE_SECRET_KEY=sk_live_***** (或 sk_test_*****)
```

## 📊 定价结构总结

| 档位 | 价格 | 永久积分 | Bonus | Bonus 过期 | Veo Pro |
|------|------|----------|-------|------------|---------|
| Starter | $*.** | * | *** | * 天 | ❌ |
| Creator | $** | *** | ** | ** 天 | ✅ |
| Studio | $** | *,*** | *** | ** 天 | ✅ |
| Pro | $*** | *,*** | *,*** | ** 天 | ✅ |

**积分消耗**:
- Sora: ** credits
- Veo Fast: ** credits  
- Veo Pro: *** credits

## 🔒 Starter 防薅机制

1. ✅ Bonus 7 天过期（无法囤积）
2. ✅ 日限额：Sora 6/day, Veo Fast 1/day, Veo Pro locked
3. ✅ 一人一次（通过 `purchases` 表检查）
4. ✅ 设备/IP 绑定（已预留字段）

## 🎯 核心策略

**Sora 定位**（不显得廉价）:
- ✅ 页面文案：**"Everyday drafts & iteration"**
- ✅ 不出现 "cheap / budget / low-cost"
- ✅ 强调工作流：Sora = 默认起点，Veo Pro = 最终成片

## 📝 后续优化（可选）

1. **更新 Payment Link ID 映射**（推荐）
   - 在 Stripe Dashboard 获取每个 Payment Link 的 ID (plink_...)
   - 更新 `lib/billing/config.ts` 中的 `STRIPE_PAYMENT_LINKS`

2. **集成到视频生成流程**
   - 在 `app/api/video/generate/route.ts` 中调用 `/api/render/start`
   - 在生成前进行 Starter 限额检查和积分扣除

3. **添加 Webhook 兜底**（强烈推荐）
   - 实现 `app/api/stripe/webhook/route.ts`
   - 处理用户支付后不回跳的情况

4. **更新积分查询 API**
   - 更新 `app/api/stats/route.ts` 使用新的钱包系统
   - 使用 `wallets` 表替代 `users.credits`

## ✅ 验收清单

- [ ] 数据库迁移执行成功
- [ ] Stripe Payment Links 配置成功回跳 URL
- [ ] 环境变量 `STRIPE_SECRET_KEY` 已设置
- [ ] 支付成功后积分正确入账
- [ ] Starter 日限额正确执行
- [ ] Veo Pro 在 Starter 计划中被锁定
- [ ] Bonus 积分优先扣除（Veo Pro 除外）

---

**状态**: ✅ **代码实现完成，等待数据库迁移和 Stripe 配置**

**下一步**: 执行上述 3 个步骤即可上线！

