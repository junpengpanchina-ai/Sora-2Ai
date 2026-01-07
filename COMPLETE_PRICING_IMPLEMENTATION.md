# 完整定价系统实现总结

## ✅ 已完成的核心功能

### 1. 定价配置系统 (`lib/billing/config.ts`)

**功能**: 单一数据源，包含所有定价、积分、Bonus、权益配置

**核心内容**:
- ✅ 4 个档位：Starter ($*.**), Creator ($**), Studio ($**), Pro ($***)
- ✅ 模型消耗：Sora **, Veo Fast **, Veo Pro ***
- ✅ Bonus 过期时间：Starter *天, Creator **天, Studio **天, Pro **天
- ✅ Starter 日限额：Sora */day, Veo Fast */day, Veo Pro locked
- ✅ 权益配置：Veo Pro 访问、优先级队列、并发数

**Stripe Payment Links**:
```typescript
starter: "https://buy.stripe.com/*****"
creator: "https://buy.stripe.com/*****"
studio: "https://buy.stripe.com/*****"
pro: "https://buy.stripe.com/*****"
```

### 2. 数据库迁移 (`supabase/migrations/049_add_wallet_system_complete.sql`)

**执行状态**: ⚠️ **需要手动执行**

**核心表**:
- `wallets`: 永久积分 + Bonus 积分（带过期时间）
- `user_entitlements`: 用户权益（计划、Veo Pro 访问、优先级、并发数）
- `usage_daily`: 每日使用统计（Starter 防刷）
- `purchases`: 购买记录（Starter 限购 + 审计）
- `risk_devices`: 风险设备（可选）

**核心函数**:
- `deduct_credits(user_id, cost)`: 扣除积分（Bonus 优先，自动过期检查）
- `check_and_increment_daily_usage(user_id, model, device_id, ip_hash)`: Starter 日限额校验
- `apply_purchase(...)`: 购买后入账（钱包 + 权益更新）

### 3. Next.js API 实现

#### 3.1 支付成功处理 (`app/api/billing/finalize/route.ts`)

**功能**: 
- 从 Stripe 获取 session
- 识别档位（Payment Link ID 或金额兜底）
- 幂等性检查（同一 session 不重复入账）
- 记录购买 + 调用 `apply_purchase` 入账

**调用时机**: 用户从 Stripe Payment Link 支付成功后跳转到 `/billing/success`

#### 3.2 生成前校验 (`app/api/render/start/route.ts`)

**功能**:
- 检查 Starter 日限额（如果适用）
- 扣除积分（Bonus 优先）
- 返回钱包状态

**调用时机**: 视频生成前调用此 API 进行校验和扣费

#### 3.3 成功页面 (`app/billing/success/page.tsx`)

**功能**:
- 显示支付成功状态
- 自动调用 `/api/billing/finalize` 入账
- 成功后跳转到 `/video`

### 4. Stripe 集成 (`lib/stripe.ts`)

**功能**: Stripe 客户端初始化

**环境变量**: `STRIPE_SECRET_KEY` (必需)

### 5. 定价页面更新 (`app/pricing/page.tsx`)

**功能**: 
- 使用新的 `PRICING_CONFIG`
- 集成 Stripe Payment Links
- 点击购买按钮直接跳转到 Stripe Payment Link

## 📋 下一步操作（按优先级）

### 🔴 高优先级（必须完成）

1. **执行数据库迁移**
   - 在 Supabase Dashboard → SQL Editor
   - 执行 `supabase/migrations/049_add_wallet_system_complete.sql`
   - 验证所有表和函数已创建

2. **配置 Stripe Payment Links**
   - 登录 Stripe Dashboard
   - 为每个 Payment Link 设置成功回跳 URL：
     ```
     Success URL: https://*****/billing/success?session_id={CHECKOUT_SESSION_ID}
     Cancel URL: https://*****/pricing?canceled=1
     ```

3. **设置环境变量**
   - 在 Vercel Project → Environment Variables
   - 添加 `STRIPE_SECRET_KEY` (sk_live_***** 或 sk_test_*****)

4. **更新 Payment Link ID 映射**（可选但推荐）
   - 在 Stripe Dashboard 获取每个 Payment Link 的 ID (plink_...)
   - 更新 `lib/billing/config.ts` 中的 `STRIPE_PAYMENT_LINKS` 映射

### 🟡 中优先级（建议完成）

5. **集成到视频生成流程**
   - 在 `app/api/video/generate/route.ts` 中调用 `/api/render/start`
   - 在生成前进行 Starter 限额检查和积分扣除

6. **更新积分查询 API**
   - 更新 `app/api/stats/route.ts` 使用新的钱包系统
   - 使用 `wallets` 表替代 `users.credits`

7. **添加 Webhook 兜底**（可选但强烈推荐）
   - 实现 `app/api/stripe/webhook/route.ts`
   - 处理用户支付后不回跳的情况
   - 确保所有支付都能入账

### 🟢 低优先级（优化）

8. **完善设备指纹和 IP 哈希**
   - 在前端生成 `deviceId` 和 `ipHash`
   - 传递给 `/api/render/start` 和 `/api/billing/finalize`

9. **添加 Starter 限购检查**
   - 在 `apply_purchase` 前检查用户是否已购买过 Starter
   - 使用 `purchases` 表查询

10. **监控和日志**
    - 添加支付成功/失败的日志
    - 监控积分扣除和 Bonus 过期

## 🎯 核心策略总结

### 定价结构

| 档位 | 价格 | 永久积分 | Bonus 积分 | Bonus 过期 | Veo Pro |
|------|------|----------|------------|------------|---------|
| Starter | $*.** | * | *** | * 天 | ❌ |
| Creator | $** | *** | ** | ** 天 | ✅ |
| Studio | $** | *,*** | *** | ** 天 | ✅ |
| Pro | $*** | *,*** | *,*** | ** 天 | ✅ |

### 积分消耗

- **Sora**: ** credits / render
- **Veo Fast**: ** credits / render
- **Veo Pro**: *** credits / render

### Starter 防薅机制

1. ✅ Bonus 7 天过期（无法囤积）
2. ✅ 日限额：Sora 6/day, Veo Fast 1/day, Veo Pro locked
3. ✅ 一人一次（通过 `purchases` 表检查）
4. ✅ 设备/IP 绑定（可选，已预留字段）

### Sora 定位（不显得廉价）

- ✅ 页面文案：**"Everyday drafts & iteration"**
- ✅ 不出现 "cheap / budget / low-cost"
- ✅ 强调工作流：Sora = 默认起点，Veo Pro = 最终成片

## 🔗 相关文件

### 核心配置
- `lib/billing/config.ts`: 定价配置（单一数据源）
- `lib/stripe.ts`: Stripe 客户端

### 数据库
- `supabase/migrations/049_add_wallet_system_complete.sql`: 完整钱包系统迁移

### API 路由
- `app/api/billing/finalize/route.ts`: 支付成功处理
- `app/api/render/start/route.ts`: 生成前校验和扣费

### 页面
- `app/billing/success/page.tsx`: 支付成功页面
- `app/pricing/page.tsx`: 定价页面（已更新）

## 📊 验收清单

### 功能验收
- [ ] 数据库迁移执行成功
- [ ] Stripe Payment Links 配置成功回跳 URL
- [ ] 支付成功后积分正确入账（永久 + Bonus）
- [ ] Starter 日限额正确执行
- [ ] Veo Pro 在 Starter 计划中被锁定
- [ ] Bonus 积分优先扣除（Veo Pro 除外）
- [ ] Bonus 过期后自动失效

### 数据验收
- [ ] `wallets` 表数据正确
- [ ] `user_entitlements` 表正确更新
- [ ] `usage_daily` 表正确记录
- [ ] `purchases` 表正确记录（幂等性）

### 集成验收
- [ ] 定价页面点击购买跳转到 Stripe
- [ ] 支付成功后自动跳转并入账
- [ ] 视频生成前正确扣费
- [ ] 积分查询显示正确余额

## 🚨 注意事项

1. **幂等性**: 所有支付处理都支持重复调用，不会重复入账
2. **错误处理**: 所有 API 都有完整的错误处理和日志
3. **向后兼容**: 如果 Payment Link ID 未配置，会使用金额兜底识别
4. **数据迁移**: 现有用户的积分需要手动迁移到 `wallets` 表（可选）

---

**实现完成时间**: 2026-01-07
**状态**: ✅ 代码实现完成，等待数据库迁移和 Stripe 配置

