# 📊 Admin 和数据库更新状态

## ✅ 数据库迁移状态

### 已完成 ✅
- [x] 迁移文件已创建：`supabase/migrations/049_add_wallet_system_complete.sql`
- [x] 迁移已执行（已验证）：
  - ✅ 5 个表已创建：`wallets`, `user_entitlements`, `usage_daily`, `purchases`, `risk_devices`
  - ✅ 3 个函数已创建：`deduct_credits`, `check_and_increment_daily_usage`, `apply_purchase`

### 数据库状态
- ✅ 新钱包系统已就绪
- ⚠️ 旧的 `payment_plans` 表仍然存在（用于 admin 管理，但前端已改用 `PRICING_CONFIG`）

---

## ⚠️ Admin 页面需要更新

### 1. Admin 支付计划管理 (`app/api/admin/payment-plans/route.ts`)

**当前状态**: ❌ 仍从数据库 `payment_plans` 表读取

**问题**:
- Admin 页面显示的是数据库中的旧数据
- 可能缺少 Studio ($99) 档位
- 与前端使用的 `PRICING_CONFIG` 不一致

**建议**:
- 选项 A：更新 admin API 也使用 `PRICING_CONFIG`（推荐，保持一致性）
- 选项 B：在数据库中手动添加 Studio 档位记录

### 2. Admin 积分管理 (`app/api/admin/credits/route.ts`)

**当前状态**: ❌ 仍使用旧的 `users.credits` 字段

**问题**:
- Admin 查看/调整积分时使用的是旧系统
- 新系统使用 `wallets` 表（`permanent_credits` + `bonus_credits`）
- 积分调整可能不会正确更新钱包

**需要更新**:
- 积分查询：从 `wallets` 表读取（永久 + Bonus）
- 积分调整：更新 `wallets` 表，并记录到 `credit_ledger`

---

## 🔧 需要执行的更新

### 更新 1: Admin 支付计划 API

**文件**: `app/api/admin/payment-plans/route.ts`

**更改**: 从 `PRICING_CONFIG` 读取，而不是数据库

### 更新 2: Admin 积分管理 API

**文件**: `app/api/admin/credits/route.ts`

**更改**: 
- GET: 从 `wallets` 表读取积分
- POST: 更新 `wallets` 表并记录到 `credit_ledger`

### 更新 3: Admin 前端显示

**文件**: `app/admin/AdminClient.tsx` 和 `app/admin/AdminHomepageManager.tsx`

**更改**: 显示永久积分和 Bonus 积分（如果适用）

---

## 📝 下一步操作

1. **立即更新**: Admin 支付计划 API（使用 `PRICING_CONFIG`）
2. **重要更新**: Admin 积分管理 API（使用新钱包系统）
3. **可选更新**: Admin 前端显示（显示永久/Bonus 积分）

---

**最后更新**: 2026-01-07

