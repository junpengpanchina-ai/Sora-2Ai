# ⚡ 快速部署检查清单

## 🎯 3 个关键步骤（按顺序执行）

---

### ✅ 步骤 1: 执行数据库迁移（5-10分钟）

**操作**:
1. 访问 https://supabase.com/dashboard
2. 选择项目 → **SQL Editor** → **New query**
3. 打开 `supabase/migrations/049_add_wallet_system_complete.sql`
4. 复制全部内容 → 粘贴到 SQL Editor → **Run**

**验证**:
```sql
-- 检查表（应该返回 5 行）
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wallets', 'user_entitlements', 'usage_daily', 'purchases', 'risk_devices');

-- 检查函数（应该返回 3 行）
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('deduct_credits', 'check_and_increment_daily_usage', 'apply_purchase');
```

✅ **完成标志**: 看到 5 个表和 3 个函数

---

### ✅ 步骤 2: 设置环境变量（2分钟）

**操作**:
1. 访问 https://dashboard.stripe.com → **Developers** → **API keys**
2. 复制 **Secret key** (`sk_test_*****` 或 `sk_live_*****`)
3. 访问 https://vercel.com/dashboard → 项目 → **Settings** → **Environment Variables**
4. 点击 **Add New**:
   - Key: `STRIPE_SECRET_KEY`
   - Value: 粘贴 Secret key
   - Environment: 全选（Production, Preview, Development）
5. 点击 **Save**
6. **重新部署**: Deployments → 最新部署 → "..." → **Redeploy**

✅ **完成标志**: 环境变量列表中看到 `STRIPE_SECRET_KEY`，部署状态为 "Ready"

---

### ✅ 步骤 3: 测试支付流程（5分钟）

**操作**:
1. 访问 `/pricing` 页面
2. 点击任意档位的 **"Get"** 按钮
3. 应该跳转到 Stripe Checkout
4. 使用测试卡支付:
   - 卡号: `4242 4242 4242 4242`
   - 过期: `12/25`
   - CVC: `123`
   - 邮编: `12345`
5. 支付成功后应跳转到 `/billing/success`
6. 页面应显示 "✅ Credits added successfully!"

**验证**:
- [ ] 跳转到 Stripe Checkout 成功
- [ ] 支付成功
- [ ] 跳转到 `/billing/success` 成功
- [ ] 积分已入账（检查 `wallets` 表）

✅ **完成标志**: 支付成功，积分正确入账

---

## 🐛 常见问题快速修复

| 问题 | 检查 | 解决 |
|------|------|------|
| 迁移失败 | 表已存在？ | 先删除旧表，再执行迁移 |
| API Key 错误 | 环境变量名称？ | 确认是 `STRIPE_SECRET_KEY`（大小写） |
| 支付后无入账 | Vercel 日志？ | 检查 Functions Logs，查看错误信息 |
| 积分扣除失败 | 钱包余额？ | 检查 `wallets` 表，确认积分足够 |

---

## 📞 需要详细步骤？

查看完整指南：`DEPLOYMENT_EXECUTION_GUIDE.md`

---

**预计总时间**: 15-20 分钟
**状态**: ⏳ 等待执行

