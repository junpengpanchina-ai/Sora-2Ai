# 📊 数据库和 Admin 更新总结

## ✅ 数据库迁移状态

### 已完成的迁移

1. **049_add_wallet_system_complete.sql** ✅
   - 5 个表已创建：`wallets`, `user_entitlements`, `usage_daily`, `purchases`, `risk_devices`
   - 3 个函数已创建：`deduct_credits`, `check_and_increment_daily_usage`, `apply_purchase`
   - **状态**: ✅ 已执行（已验证）

2. **050_update_admin_credits_to_wallet.sql** ⏳ **需要执行**
   - 更新 `admin_adjust_user_credits` 函数以使用新的钱包系统
   - **状态**: ⏳ 等待执行

---

## ✅ Admin API 更新状态

### 已更新 ✅

1. **`app/api/admin/payment-plans/route.ts`** ✅
   - **更改**: 从使用数据库 `payment_plans` 表改为使用 `PRICING_CONFIG`
   - **效果**: Admin 页面现在显示所有 4 个档位（包括 Studio $99）
   - **状态**: ✅ 已更新

2. **`app/api/admin/credits/route.ts`** ✅
   - **GET**: 已更新为从 `wallets` 表读取积分（永久 + Bonus）
   - **显示**: 现在显示 `wallet_permanent` 和 `wallet_bonus` 字段
   - **状态**: ✅ 已更新

### 需要执行数据库迁移 ⚠️

**`app/api/admin/credits/route.ts`** 的 **POST** 方法（积分调整）仍然调用 `admin_adjust_user_credits` 函数，该函数需要更新为使用钱包系统。

**迁移文件**: `supabase/migrations/050_update_admin_credits_to_wallet.sql`

---

## 🔧 需要执行的步骤

### 步骤 1: 执行数据库迁移（必须）

**文件**: `supabase/migrations/050_update_admin_credits_to_wallet.sql`

**操作**:
1. 访问 Supabase Dashboard → SQL Editor
2. 打开迁移文件
3. 复制全部内容
4. 粘贴到 SQL Editor → 点击 **Run**

**验证**:
```sql
-- 检查函数是否已更新
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'admin_adjust_user_credits';
```

**预期**: 函数应该更新 `wallets` 表而不是 `users.credits`

---

## 📋 更新内容总结

### Admin 支付计划管理

**之前**:
- 从数据库 `payment_plans` 表读取
- 可能缺少 Studio ($99) 档位
- 与前端不一致

**现在**:
- ✅ 从 `PRICING_CONFIG` 读取（与前端一致）
- ✅ 显示所有 4 个档位：Starter, Creator, Studio, Pro
- ✅ 自动同步配置

### Admin 积分管理

**之前**:
- 从 `users.credits` 字段读取
- 调整积分时更新 `users.credits`
- 不显示永久/Bonus 积分

**现在**:
- ✅ GET: 从 `wallets` 表读取（永久 + Bonus）
- ✅ 显示 `wallet_permanent` 和 `wallet_bonus`
- ⏳ POST: 需要执行迁移 050 后才会更新钱包系统

---

## ⚠️ 重要提醒

### 执行迁移 050 之前

- Admin 积分调整仍然更新 `users.credits`（向后兼容）
- 新系统使用 `wallets` 表
- 两个系统可能不同步

### 执行迁移 050 之后

- ✅ Admin 积分调整会更新 `wallets.permanent_credits`
- ✅ 同时更新 `users.credits`（向后兼容）
- ✅ 记录到 `credit_ledger` 表
- ✅ 所有积分操作统一使用钱包系统

---

## 📝 下一步操作

1. **立即执行**: 迁移 050（更新 admin 积分调整函数）
2. **验证**: Admin 页面显示正确的积分（永久 + Bonus）
3. **测试**: 在 Admin 页面调整积分，验证钱包更新

---

## ✅ 完成检查清单

### 数据库迁移
- [x] 049_add_wallet_system_complete.sql - 已执行
- [ ] 050_update_admin_credits_to_wallet.sql - **等待执行**

### Admin API
- [x] `/api/admin/payment-plans` - 已更新（使用 PRICING_CONFIG）
- [x] `/api/admin/credits` GET - 已更新（显示钱包信息）
- [ ] `/api/admin/credits` POST - **等待迁移 050 后生效**

---

**最后更新**: 2026-01-07
**状态**: Admin API 已更新，等待执行迁移 050

