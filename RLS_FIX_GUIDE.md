# RLS 策略修复指南

## ⚠️ 当前问题

测试结果显示：
- ❌ anon 用户可以访问 `users` 表数据（不应该）
- ❌ anon 用户可以访问 `video_tasks` 表数据（不应该）
- ✅ `prompt_library` 表工作正常（这是预期的）

**原因：** RLS 迁移文件 `010_add_rls_policies.sql` 还没有在 Supabase 中执行。

## 🔧 立即修复步骤

### 步骤 1: 在 Supabase Dashboard 中执行迁移

1. **访问 Supabase Dashboard**
   - 打开 [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - 登录并选择你的项目

2. **打开 SQL Editor**
   - 左侧菜单 → **SQL Editor**
   - 点击 **New query**

3. **执行迁移文件**
   - 打开项目文件：`supabase/migrations/010_add_rls_policies.sql`
   - **复制全部 SQL 代码**
   - 粘贴到 SQL Editor
   - 点击 **Run** 执行

4. **验证执行成功**
   - 应该看到 "Success. No rows returned" 或类似成功消息
   - 没有错误信息

### 步骤 2: 验证 RLS 已启用

在 Supabase Dashboard 中：

1. **进入 Table Editor**
   - 左侧菜单 → **Table Editor**

2. **检查每个表**
   - 点击 `users` 表
   - 查看右上角的设置图标
   - 应该看到 "Row Level Security" 已启用（绿色开关）

3. **检查策略**
   - 在表设置中，查看 "Policies" 标签
   - 应该能看到我们创建的策略：
     - `users_select_own`
     - `users_update_own`
     - `users_service_role_all`

### 步骤 3: 重新运行测试

```bash
npm run test:rls
```

现在应该看到：
- ✅ anon 用户无法访问 `users` 表
- ✅ anon 用户无法访问 `video_tasks` 表
- ✅ `prompt_library` 表仍然可以访问（已发布的内容）

## 🔍 手动验证 SQL

如果迁移执行后仍有问题，可以在 Supabase SQL Editor 中执行以下查询检查：

### 检查 RLS 是否启用

```sql
SELECT 
  tablename,
  (SELECT relrowsecurity 
   FROM pg_class 
   WHERE relname = tablename 
   AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'video_tasks', 'recharge_records', 'consumption_records', 'after_sales_issues')
ORDER BY tablename;
```

**预期结果：** 所有表的 `rls_enabled` 应该是 `true`

### 检查策略是否存在

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'video_tasks', 'recharge_records', 'consumption_records', 'after_sales_issues')
ORDER BY tablename, policyname;
```

**预期结果：** 每个表应该有多个策略（select_own, insert_own, service_role_all 等）

## 🚨 如果迁移执行失败

### 错误 1: "relation does not exist"
**原因：** 表还没有创建  
**解决：** 先执行之前的迁移文件（001-009）

### 错误 2: "permission denied"
**原因：** 权限不足  
**解决：** 确保使用正确的 Supabase 项目，检查 API 密钥

### 错误 3: "policy already exists"
**原因：** 策略已经存在  
**解决：** 这是正常的，迁移文件使用了 `DROP POLICY IF EXISTS`，会先删除再创建

## 📋 执行后的检查清单

- [ ] 在 Supabase Dashboard 中执行了 `010_add_rls_policies.sql`
- [ ] 验证执行成功（无错误）
- [ ] 在 Table Editor 中确认 RLS 已启用
- [ ] 运行 `npm run test:rls` 测试通过
- [ ] anon 用户无法访问受保护的表
- [ ] service_role 可以访问所有表（如果配置了）

## 🔄 快速修复命令

如果迁移文件已执行但仍有问题，可以手动启用 RLS：

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recharge_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_issues ENABLE ROW LEVEL SECURITY;
```

然后重新执行完整的迁移文件。

## 📞 需要帮助？

如果问题仍然存在：
1. 检查 Supabase Dashboard 中的错误日志
2. 确认所有之前的迁移都已执行
3. 验证环境变量配置正确

