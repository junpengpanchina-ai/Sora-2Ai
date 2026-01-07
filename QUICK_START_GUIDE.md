# 🚀 快速上线指南 - 3 个步骤

## 步骤 1: 执行数据库迁移（5-10分钟）

### 1.1 登录 Supabase Dashboard
1. 访问 https://supabase.com/dashboard
2. 选择你的项目

### 1.2 打开 SQL Editor
1. 在左侧菜单点击 **"SQL Editor"**
2. 点击 **"New query"** 创建新查询

### 1.3 执行迁移文件
1. 打开项目中的文件：`supabase/migrations/049_add_wallet_system_complete.sql`
2. **复制全部内容**（298行）
3. 粘贴到 Supabase SQL Editor
4. 点击 **"Run"** 执行

### 1.4 验证迁移成功
在 SQL Editor 中执行以下验证查询：

```sql
-- 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wallets', 'user_entitlements', 'usage_daily', 'purchases', 'risk_devices')
ORDER BY table_name;

-- 应该返回 5 行

-- 检查函数是否创建成功
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('deduct_credits', 'check_and_increment_daily_usage', 'apply_purchase')
ORDER BY routine_name;

-- 应该返回 3 行
```

✅ **如果看到 5 个表和 3 个函数，迁移成功！**

---

## 步骤 2: 配置 Stripe Payment Links（5分钟）

### 2.1 登录 Stripe Dashboard
1. 访问 https://dashboard.stripe.com
2. 确保在 **"Live mode"**（生产环境）或 **"Test mode"**（测试环境）

### 2.2 配置每个 Payment Link

#### Payment Link 1: Starter ($*.**)
1. 在左侧菜单点击 **"Payment Links"**
2. 找到或创建金额为 **$*.*** 的 Payment Link
3. 点击编辑（或创建新链接）
4. 在 **"After payment"** 部分设置：
   - **Success URL**: 
     ```
     https://*****/billing/success?session_id={CHECKOUT_SESSION_ID}
     ```
   - **Cancel URL**: 
     ```
     https://*****/pricing?canceled=1
     ```
5. 保存

#### Payment Link 2: Creator ($**)
- 金额：**$**.***
- 使用相同的 Success URL 和 Cancel URL
- 保存

#### Payment Link 3: Studio ($**)
- 金额：**$**.***
- 使用相同的 Success URL 和 Cancel URL
- 保存

#### Payment Link 4: Pro ($***)
- 金额：**$**.***
- 使用相同的 Success URL 和 Cancel URL
- 保存

### 2.3 验证 Payment Links
确保你的 4 个 Payment Links 是：
- ✅ $*.**: https://buy.stripe.com/*****
- ✅ $**: https://buy.stripe.com/*****
- ✅ $**: https://buy.stripe.com/*****
- ✅ $***: https://buy.stripe.com/*****

**重要**: 如果这些链接的金额不匹配，需要更新 `app/pricing/page.tsx` 中的链接。

---

## 步骤 3: 设置环境变量（2分钟）

### 3.1 登录 Vercel Dashboard
1. 访问 https://vercel.com/dashboard
2. 选择你的项目

### 3.2 添加环境变量
1. 进入项目设置：**Settings** → **Environment Variables**
2. 点击 **"Add New"**
3. 添加以下变量：

   **变量名**: `STRIPE_SECRET_KEY`
   
   **值**: 
   - 生产环境：`sk_live_*****`（从 Stripe Dashboard → Developers → API keys 获取）
   - 测试环境：`sk_test_*****`（用于开发测试）
   
   **环境**: 选择 **Production**, **Preview**, **Development**（全选）

4. 点击 **"Save"**

### 3.3 重新部署（如果需要）
如果项目已经在运行，环境变量添加后需要：
1. 在 Vercel Dashboard 点击 **"Deployments"**
2. 找到最新的部署，点击 **"..."** → **"Redeploy"**
3. 或推送一个空 commit 触发自动部署

---

## ✅ 验证系统是否正常工作

### 测试 1: 支付流程
1. 访问 `/pricing` 页面
2. 点击任意档位的 "Get" 按钮
3. 应该跳转到 Stripe Payment Link
4. 完成测试支付（使用 Stripe 测试卡：4242 4242 4242 4242）
5. 支付成功后应该跳转到 `/billing/success`
6. 页面应该显示 "✅ Credits added successfully!"
7. 自动跳转到 `/video` 页面

### 测试 2: 积分查询
1. 登录后访问 `/video` 或调用 `/api/stats`
2. 应该能看到钱包中的积分（永久 + Bonus）

### 测试 3: 生成视频
1. 在 `/video` 页面生成一个视频
2. 应该正确扣除积分（Bonus 优先）
3. Starter 用户应该受到日限额限制

---

## 🐛 常见问题排查

### 问题 1: 支付成功后没有入账
**检查**:
- ✅ Stripe Payment Link 的 Success URL 是否正确配置
- ✅ 环境变量 `STRIPE_SECRET_KEY` 是否正确设置
- ✅ 查看浏览器控制台和 Vercel 日志是否有错误
- ✅ 检查 Supabase 的 `purchases` 表是否有记录

### 问题 2: 数据库迁移失败
**检查**:
- ✅ 是否已经存在同名表（可能需要先删除旧表）
- ✅ SQL 语法是否正确（检查是否有语法错误）
- ✅ 是否有足够的权限执行 DDL 语句

### 问题 3: 积分扣除失败
**检查**:
- ✅ `wallets` 表是否有用户记录
- ✅ 积分是否足够（检查 `permanent_credits` + `bonus_credits`）
- ✅ Bonus 是否已过期（检查 `bonus_expires_at`）

### 问题 4: Starter 限额不生效
**检查**:
- ✅ `user_entitlements` 表中的 `plan_id` 是否为 `starter`
- ✅ `usage_daily` 表是否正确记录每日使用
- ✅ 函数 `check_and_increment_daily_usage` 是否正常执行

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 Vercel 部署日志：**Deployments** → 选择部署 → **"Functions Logs"**
2. 检查 Supabase 日志：**Logs** → **Postgres Logs**
3. 检查浏览器控制台：F12 → Console

---

## 🎉 完成！

完成以上 3 个步骤后，你的定价系统就可以正常工作了！

**下一步建议**:
- 测试完整的支付流程
- 监控第一个真实支付
- 根据实际使用情况调整 Starter 限额（如果需要）

