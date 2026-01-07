# 钱包系统完整实现总结

## ✅ 已完成的核心功能

### 1. 数据库迁移（048_add_credit_wallet_system.sql）

**执行状态**: ⚠️ **需要手动执行**

在 Supabase Dashboard 的 SQL Editor 中执行以下迁移文件：
```
supabase/migrations/048_add_credit_wallet_system.sql
```

**核心表结构**:
- `credit_wallet`: 存储用户的永久积分和 Bonus 积分（带过期时间）
- `credit_ledger`: 记录所有积分交易（购买、赠送、消费、退款、调整）
- `render_job`: 记录生成任务（用于风控和成本核算）
- `risk_profile`: 风控画像（防薅羊毛）

**核心函数**:
- `get_total_available_credits(user_uuid)`: 获取用户总可用积分（永久 + 未过期 Bonus）
- `deduct_credits_from_wallet(user_uuid, credits_needed, model_type)`: 扣除积分（优先 Bonus，Veo Pro 不能用 Bonus）
- `add_credits_to_wallet(user_uuid, permanent_amount, bonus_amount, bonus_expires_at, is_starter)`: 添加积分到钱包
- `can_purchase_starter(user_uuid)`: 检查是否可以购买 Starter（只能买 1 次）
- `can_use_bonus_for_model(user_uuid, model_type)`: 检查 Bonus 是否可用于指定模型

### 2. 充值档位识别系统（lib/billing/tier-identification.ts）

**功能**: 根据支付金额（USD）自动识别充值档位，并返回对应的永久积分、Bonus 积分和过期时间。

**档位定义（海外市场）**:
- **Starter Access**: $4.90 → 200 bonus credits (7 days), 0 permanent
- **Creator**: $39 → 2,000 permanent + 600 bonus (14 days)
- **Studio**: $99 → 6,000 permanent + 1,500 bonus (30 days)
- **Pro**: $299 → 20,000 permanent + 4,000 bonus (60 days)

**核心函数**:
- `identifyTierFromAmount(amountUsd: number)`: 识别档位（允许 ±$0.50 误差）
- `calculateBonusExpiresAt(daysFromNow: number)`: 计算 Bonus 过期时间

### 3. 充值流程更新

#### 3.1 支付 Webhook（app/api/payment/webhook/route.ts）

**更新内容**:
- ✅ 使用 `identifyTierFromAmount()` 识别档位
- ✅ 使用 `addCreditsToWallet()` 添加永久积分和 Bonus 积分
- ✅ 自动设置 Bonus 过期时间
- ✅ 标记 Starter Access 购买记录

**处理流程**:
1. 验证 Stripe Webhook 签名
2. 处理 `checkout.session.completed` 事件
3. 识别充值档位（根据金额）
4. 调用钱包系统添加积分（永久 + Bonus）
5. 更新充值记录状态为 `completed`

#### 3.2 支付验证 API（app/api/payment/verify-payment/route.ts）

**更新内容**:
- ✅ 使用档位识别系统
- ✅ 使用钱包系统添加积分
- ✅ 支持手动验证待处理支付

**处理流程**:
1. 查询充值记录
2. 通过 Stripe API 验证支付状态
3. 识别档位并添加积分到钱包
4. 更新充值记录状态

#### 3.3 支付同步 API（app/api/payment/sync-payments/route.ts）

**更新内容**:
- ✅ 更新 `syncCreditsToWallet()` 函数使用档位识别
- ✅ 所有调用点改为传入金额（USD）而非积分
- ✅ 自动识别档位并设置永久/Bonus 积分

**处理流程**:
1. 查询 Stripe 最近 7 天的支付记录
2. 匹配或创建充值记录
3. 识别档位并同步积分到钱包

### 4. 积分扣除系统（已实现）

**文件**: `lib/credits.ts`

**功能**:
- ✅ 使用 `deductCreditsFromWallet()` 扣除积分
- ✅ 优先使用 Bonus 积分（Veo Pro 除外）
- ✅ 自动记录到 `credit_ledger`
- ✅ 支持按模型类型扣除（Sora: 10, Veo Flash: 50, Veo Pro: 250）

### 5. Veo 升级提示组件集成（已完成）

**文件**: `app/video/VideoPageClient.tsx`

**集成位置**: 视频生成成功后（Sora 模型）

**组件**: `VeoUpgradeNudge` (components/growth/VeoUpgradeNudge.tsx)

**触发点**:
- `AFTER_SORA_2`: 完成第 2 次 Sora 生成后
- `REMIX_3`: 同一提示词 remix ≥3 次
- `EXPORT_CLICK`: 点击下载/分享时
- `BONUS_NEAR_EMPTY`: Bonus 积分使用 ≥80%

**当前状态**: ✅ 已集成，但 `bonusUsageRatio` 需要从钱包信息计算（TODO）

## 📋 待完成的任务

### 1. 执行数据库迁移

**操作步骤**:
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 执行 `supabase/migrations/048_add_credit_wallet_system.sql`
4. 验证所有表和函数已创建

**验证命令**:
```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('credit_wallet', 'credit_ledger', 'render_job', 'risk_profile');

-- 检查函数是否存在
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_total_available_credits', 'deduct_credits_from_wallet', 'add_credits_to_wallet');
```

### 2. 更新积分查询 API

**文件**: `app/api/stats/route.ts`

**需要更新**: 使用 `getTotalAvailableCredits()` 替代直接查询 `users.credits`

**示例**:
```typescript
import { getTotalAvailableCredits } from '@/lib/credit-wallet'

// 替换
const credits = user.credits || 0

// 为
const credits = await getTotalAvailableCredits(supabase, user.id)
```

### 3. 完善 VeoUpgradeNudge 组件

**文件**: `app/video/VideoPageClient.tsx`

**需要更新**: 计算 `bonusUsageRatio` 从钱包信息

**示例**:
```typescript
import { getWalletInfo } from '@/lib/credit-wallet'

// 在组件中获取钱包信息
const walletInfo = await getWalletInfo(supabase, userId)
const bonusUsageRatio = walletInfo 
  ? (walletInfo.bonusCredits / (walletInfo.bonusCredits + walletInfo.permanentCredits))
  : 0
```

### 4. 更新 Starter Access 限制检查

**文件**: `lib/starter-access-control.ts`

**需要更新**: 使用 `credit_wallet.starter_purchased_at` 检查 Starter Access 状态

## 🎯 核心策略总结

### 积分消耗（统一计价）

- **Sora**: 10 credits / render
- **Veo Flash**: 50 credits / render（≈ 5×Sora）
- **Veo Pro**: 250 credits / render（≈ 25×Sora）

### 充值档位（海外市场）

| 档位 | 价格 | 永久积分 | Bonus 积分 | Bonus 过期 |
|------|------|----------|------------|------------|
| Starter Access | $4.90 | 0 | 200 | 7 天 |
| Creator | $39 | 2,000 | 600 | 14 天 |
| Studio | $99 | 6,000 | 1,500 | 30 天 |
| Pro | $299 | 20,000 | 4,000 | 60 天 |

### 积分使用规则

1. **Bonus 优先**: 扣除积分时优先使用 Bonus（Veo Pro 除外）
2. **Veo Pro 限制**: Veo Pro 不能使用 Bonus 积分，只能使用永久积分
3. **过期处理**: Bonus 积分过期后自动失效，不影响永久积分
4. **Starter 限制**: Starter Access 只能购买 1 次，Bonus 仅可用于 Sora + Veo Flash

### 防薅机制

1. **Starter 限购**: 每个账号只能购买 1 次 Starter Access
2. **Bonus 过期**: Starter Bonus 7 天过期，无法囤积
3. **Veo Pro 锁定**: Starter 用户无法使用 Veo Pro
4. **每日限制**: Starter 用户有每日生成限制（Sora 6/day, Veo Flash 1/day）

## 📊 验收指标

### 功能验收

- [ ] 数据库迁移执行成功
- [ ] 充值后积分正确添加到钱包（永久 + Bonus）
- [ ] Bonus 积分优先扣除（Veo Pro 除外）
- [ ] Veo Pro 只能使用永久积分
- [ ] Starter Access 只能购买 1 次
- [ ] VeoUpgradeNudge 组件正确显示

### 数据验收

- [ ] `credit_wallet` 表数据正确
- [ ] `credit_ledger` 表记录所有交易
- [ ] `render_job` 表记录生成任务
- [ ] Bonus 积分过期后自动失效

### 性能验收

- [ ] 积分扣除操作 < 100ms
- [ ] 充值处理 < 500ms
- [ ] 钱包查询 < 50ms

## 🚀 下一步操作

1. **执行数据库迁移**（最重要）
2. **测试充值流程**: 使用测试 Stripe 账号购买各档位，验证积分添加
3. **测试积分扣除**: 生成视频验证积分扣除逻辑
4. **更新积分查询 API**: 使用钱包系统替代 `users.credits`
5. **完善 VeoUpgradeNudge**: 计算真实的 `bonusUsageRatio`
6. **监控日志**: 观察充值、扣除、过期的日志输出

## 📝 注意事项

1. **向后兼容**: 未识别的金额会使用旧逻辑（全部作为永久积分），不会导致错误
2. **错误处理**: 所有钱包操作都有错误处理和日志记录
3. **幂等性**: 充值处理支持重复调用（不会重复添加积分）
4. **数据迁移**: 现有用户的 `users.credits` 需要迁移到 `credit_wallet`（可选，不影响新功能）

## 🔗 相关文件

- `supabase/migrations/048_add_credit_wallet_system.sql`: 数据库迁移
- `lib/billing/tier-identification.ts`: 档位识别
- `lib/credit-wallet.ts`: 钱包操作函数
- `app/api/payment/webhook/route.ts`: 支付 Webhook
- `app/api/payment/verify-payment/route.ts`: 支付验证
- `app/api/payment/sync-payments/route.ts`: 支付同步
- `lib/credits.ts`: 积分扣除逻辑
- `components/growth/VeoUpgradeNudge.tsx`: 升级提示组件

---

**实现完成时间**: 2026-01-07
**状态**: ✅ 代码实现完成，等待数据库迁移执行

