# 修复"添加积分失败"错误

## 🔍 问题诊断

如果遇到"添加积分失败: Failed to add credits"错误，通常是以下原因之一：

### 1. 数据库迁移未执行（最常见）

**症状**：
- 错误信息包含 "column" 或 "credits"
- 提示 "Credits字段不存在"

**原因**：
- `users` 表中还没有 `credits` 字段
- 数据库迁移文件 `004_add_credits_system.sql` 未执行

## ✅ 解决方案

### 方法 1：执行完整数据库迁移（推荐）

1. **访问 Supabase Dashboard**
   - 打开 [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - 选择您的项目

2. **进入 SQL Editor**
   - 点击左侧菜单的 **SQL Editor**
   - 点击 **New query**

3. **执行迁移文件**
   - 打开项目文件：`supabase/migrations/004_add_credits_system.sql`
   - 复制全部 SQL 代码
   - 粘贴到 SQL Editor
   - 点击 **Run** 执行

4. **验证迁移**
   - 执行以下查询验证：
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'credits';
   ```
   - 应该返回一行，显示 `credits` 字段

### 方法 2：快速修复（仅添加 credits 字段）

如果只需要快速修复，执行以下 SQL：

```sql
-- 添加 credits 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 CHECK (credits >= 0);

-- 更新所有现有用户的积分为 0
UPDATE users SET credits = 0 WHERE credits IS NULL;
```

### 方法 3：使用修复脚本

项目中有修复脚本：`scripts/fix-credits-field.sql`

1. 打开该文件
2. 复制 SQL 代码
3. 在 Supabase SQL Editor 中执行

## 🧪 诊断工具

### 使用诊断 API

访问以下 URL 检查数据库状态：

```
http://localhost:3000/api/debug/check-credits
```

或者在浏览器控制台运行：

```javascript
fetch('/api/debug/check-credits')
  .then(r => r.json())
  .then(data => {
    console.log('诊断结果:', data)
    if (data.diagnostics) {
      console.log('推荐操作:', data.diagnostics.recommendation)
      if (data.diagnostics.quickFix) {
        console.log('快速修复SQL:', data.diagnostics.quickFix)
      }
    }
  })
```

## 📋 完整迁移步骤

如果需要完整的积分系统（包括充值记录表等），执行完整迁移：

### 1. 执行主迁移文件

```sql
-- 文件: supabase/migrations/004_add_credits_system.sql

-- 确保可用的 UUID 生成函数
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 在 users 表中添加积分字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 CHECK (credits >= 0);

-- 创建充值记录表
CREATE TABLE IF NOT EXISTS recharge_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  credits INTEGER NOT NULL CHECK (credits > 0),
  payment_method TEXT,
  payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建消费记录表
CREATE TABLE IF NOT EXISTS consumption_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_task_id UUID REFERENCES video_tasks(id) ON DELETE SET NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  description TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recharge_records_user_id ON recharge_records(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_records_status ON recharge_records(status);
CREATE INDEX IF NOT EXISTS idx_recharge_records_created_at ON recharge_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consumption_records_user_id ON consumption_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_records_video_task_id ON consumption_records(video_task_id);
CREATE INDEX IF NOT EXISTS idx_consumption_records_created_at ON consumption_records(created_at DESC);
```

### 2. 验证迁移

执行以下查询验证所有表都已创建：

```sql
-- 检查 credits 字段
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'credits';

-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('recharge_records', 'consumption_records')
AND table_schema = 'public';
```

## 🔄 测试修复

修复后，重新测试添加积分：

1. **刷新页面**
2. **点击 "+100测试积分" 按钮**
3. **检查是否成功**

或者在浏览器控制台运行：

```javascript
fetch('/api/debug/add-credits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ credits: 100 })
})
.then(r => r.json())
.then(data => {
  console.log('结果:', data)
  if (data.success) {
    alert('✅ 成功！积分已添加')
    window.location.reload()
  } else {
    alert('❌ 失败: ' + data.error + '\n详情: ' + (data.details || ''))
  }
})
```

## ⚠️ 其他可能的问题

### 权限问题

如果执行 SQL 时遇到权限错误：
- 确保使用的是 Supabase Dashboard 的 SQL Editor
- 不要使用只读用户

### 表已存在错误

如果表已存在，迁移会安全跳过（使用 `IF NOT EXISTS`），不会报错。

### 字段已存在但值为 NULL

执行以下 SQL 修复：

```sql
UPDATE users SET credits = 0 WHERE credits IS NULL;
```

## 📚 相关文件

- `supabase/migrations/004_add_credits_system.sql` - 完整迁移文件
- `scripts/fix-credits-field.sql` - 快速修复脚本
- `app/api/debug/add-credits/route.ts` - 添加积分 API
- `app/api/debug/check-credits/route.ts` - 诊断 API

## 💡 预防措施

确保在部署前执行所有数据库迁移：

1. 检查 `supabase/migrations/` 目录下的所有迁移文件
2. 按顺序执行（000, 001, 002, 003, 004...）
3. 验证每个迁移是否成功

