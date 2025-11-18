# RLS 安全策略迁移指南

## 📋 概述

此迁移文件为所有数据库表添加 Row Level Security (RLS) 策略，确保用户只能访问自己的数据，防止数据泄露。

## ⚠️ 重要提示

**在执行此迁移前，请确保：**
1. 已备份数据库（可选但推荐）
2. 所有之前的迁移都已执行（001-009）
3. 了解此迁移会限制数据访问权限

## 🚀 执行步骤

### 步骤 1: 打开 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录你的账号
3. 选择你的项目

### 步骤 2: 进入 SQL Editor

1. 在左侧菜单中找到 **SQL Editor**
2. 点击 **SQL Editor**
3. 点击 **New query**（新建查询）

### 步骤 3: 执行迁移 SQL

1. 打开项目文件：`supabase/migrations/010_add_rls_policies.sql`
2. **复制全部 SQL 代码**
3. 粘贴到 Supabase SQL Editor 中
4. 点击 **Run** 按钮（或按 `Cmd+Enter` / `Ctrl+Enter`）

### 步骤 4: 验证迁移成功

执行后应该看到：
- ✅ "Success. No rows returned" 或类似成功消息
- ✅ 没有错误信息

## 🔍 验证 RLS 策略

### 方法 1: 在 Supabase Dashboard 中验证

1. 进入 **Table Editor**
2. 选择任意表（如 `users`、`video_tasks` 等）
3. 查看表设置，应该能看到 "Row Level Security" 已启用

### 方法 2: 运行测试脚本

执行测试脚本验证 RLS 策略：

```bash
npm run test:rls
```

或手动运行：

```bash
node scripts/test-rls.js
```

## 📊 添加的 RLS 策略详情

### 1. users 表
- ✅ 用户只能查看和修改自己的数据
- ✅ service_role 可访问所有数据

### 2. video_tasks 表
- ✅ 用户只能查看和修改自己的任务
- ✅ service_role 可访问所有任务

### 3. recharge_records 表
- ✅ 用户只能查看自己的充值记录
- ✅ service_role 可访问所有记录

### 4. consumption_records 表
- ✅ 用户只能查看自己的消费记录
- ✅ service_role 可访问所有记录

### 5. after_sales_issues 表
- ✅ 允许匿名用户和认证用户提交问题
- ✅ 认证用户只能查看和修改自己提交的问题
- ✅ service_role 可访问所有问题

## 🧪 测试 API 端点

迁移后，测试以下 API 端点确保功能正常：

### 用户相关
- `GET /api/stats` - 获取用户统计
- `GET /api/video/tasks` - 获取用户任务列表
- `GET /api/payment/recharge-records` - 获取充值记录

### 管理员相关（使用 service_role）
- `GET /api/admin/stats` - 获取所有统计数据
- `GET /api/admin/videos` - 获取所有视频任务
- `GET /api/admin/recharges` - 获取所有充值记录

## ⚠️ 常见问题

### 问题 1: "permission denied for table users"
**原因**: RLS 策略阻止了访问  
**解决**: 确保 API 使用正确的认证方式，或使用 service_role 进行管理操作

### 问题 2: 用户无法查看自己的数据
**原因**: auth.uid() 可能为 null  
**解决**: 确保用户已正确登录，session 有效

### 问题 3: service_role 无法访问数据
**原因**: 策略配置错误  
**解决**: 检查策略中的 `TO service_role` 部分是否正确

## 🔄 回滚（如果需要）

如果需要回滚 RLS 策略，执行以下 SQL：

```sql
-- 禁用所有表的 RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE video_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE recharge_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_issues DISABLE ROW LEVEL SECURITY;

-- 删除所有策略
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_service_role_all ON users;
-- ... 其他策略
```

**⚠️ 警告**: 回滚会移除所有安全限制，不推荐在生产环境使用。

## 📚 相关文件

- `supabase/migrations/010_add_rls_policies.sql` - 迁移文件
- `scripts/test-rls.js` - RLS 测试脚本
- `RLS_MIGRATION_GUIDE.md` - 本指南

## ✅ 完成检查清单

- [ ] 在 Supabase Dashboard 中执行了迁移
- [ ] 验证迁移成功（无错误）
- [ ] 测试用户 API 端点（需要登录）
- [ ] 测试管理员 API 端点（使用 service_role）
- [ ] 验证用户无法访问其他用户的数据
- [ ] 检查应用功能是否正常

