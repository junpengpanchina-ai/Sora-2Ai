# 执行数据库迁移指南

> **文件**：`database/migrations/add_page_meta.sql`  
> **方案**：方案 A - 使用 `page_meta` 表（不修改原表）

---

## 🎯 推荐方式：Supabase Dashboard（最简单）

### Step 1：打开 Supabase Dashboard

1. 访问：https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis
2. 或：https://supabase.com/dashboard → 选择项目 `hgzpzsiafycwlqrkzbis`

---

### Step 2：进入 SQL Editor

1. 在左侧菜单中，点击 **SQL Editor**
2. 点击 **New query** 创建新查询

---

### Step 3：复制并执行 SQL

1. 打开文件：`database/migrations/add_page_meta.sql`
2. **全选并复制**所有内容（Ctrl+A / Cmd+A，然后 Ctrl+C / Cmd+C）
3. 粘贴到 SQL Editor 中
4. 点击 **Run** 或按 `Ctrl+Enter` / `Cmd+Enter`

---

### Step 4：验证执行结果

执行成功后，你应该看到：
- ✅ 创建了 `page_meta` 表
- ✅ 创建了 `index_health_daily` 表
- ✅ 创建了 `page_priority_queue` 表
- ✅ 创建了视图和函数

**验证方法**：
1. 在左侧菜单中，点击 **Table Editor**
2. 你应该能看到新的表：
   - `page_meta`
   - `index_health_daily`
   - `page_priority_queue`

---

## 🔧 方式二：使用 psql 命令行

### Step 1：获取数据库连接字符串

1. 访问 Supabase Dashboard
2. 进入 **Settings** > **Database**
3. 找到 **Connection string** 部分
4. 选择 **URI** 模式
5. 复制连接字符串

**格式**：
```
postgresql://postgres:[YOUR-PASSWORD]@db.hgzpzsiafycwlqrkzbis.supabase.co:5432/postgres
```

**注意**：将 `[YOUR-PASSWORD]` 替换为你的数据库密码（`peng000000`）

---

### Step 2：执行迁移

```bash
# 方式 1：使用连接字符串
psql "postgresql://postgres:peng000000@db.hgzpzsiafycwlqrkzbis.supabase.co:5432/postgres" -f database/migrations/add_page_meta.sql

# 方式 2：使用环境变量
export PGHOST=db.hgzpzsiafycwlqrkzbis.supabase.co
export PGPORT=5432
export PGDATABASE=postgres
export PGUSER=postgres
export PGPASSWORD=peng000000

psql -f database/migrations/add_page_meta.sql
```

---

## ✅ 执行后检查清单

- [ ] `page_meta` 表已创建
- [ ] `index_health_daily` 表已创建
- [ ] `page_priority_queue` 表已创建
- [ ] `unified_pages` 视图已创建
- [ ] `calculate_index_health()` 函数已创建
- [ ] `get_current_index_health()` 函数已创建
- [ ] `update_updated_at_column()` 触发器已创建
- [ ] `get_or_create_page_meta()` 函数已创建

---

## 🚨 常见问题

### 问题 1：表已存在错误

**错误信息**：`relation "page_meta" already exists`

**解决方案**：
- SQL 中使用了 `CREATE TABLE IF NOT EXISTS`，不会报错
- 如果表已存在，迁移会跳过创建步骤

---

### 问题 2：权限不足

**错误信息**：`permission denied`

**解决方案**：
- 确保使用正确的数据库用户（`postgres`）
- 检查 Supabase 项目权限设置

---

### 问题 3：连接超时

**错误信息**：`connection timeout`

**解决方案**：
- 检查网络连接
- 使用 Supabase Dashboard 的 SQL Editor（更稳定）

---

## 📚 下一步

迁移执行成功后：

1. **更新 Prisma Schema**
   - 将 `prisma/schema-page-meta.prisma` 的内容添加到你的 `schema.prisma`
   - 运行 `npx prisma generate`

2. **测试连接**
   - 使用 `lib/page-meta-helper.ts` 测试创建/更新 page_meta 记录

3. **开始使用**
   - 为现有页面创建 page_meta 记录
   - 运行页面挑选算法

---

**推荐使用 Supabase Dashboard 的 SQL Editor，最简单且最稳定！**

