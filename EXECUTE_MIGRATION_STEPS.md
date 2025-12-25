# 执行聊天表迁移 - 详细步骤

## ⚠️ 重要提示

**不要执行错误消息！** 错误消息（如 "Could not find the table..."）不是 SQL 代码。

## ✅ 正确步骤

### 步骤 1: 打开 Supabase SQL Editor

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query**（新建查询）

### 步骤 2: 检查依赖表

在执行聊天表迁移前，确保 `admin_users` 表已存在：

```sql
-- 检查 admin_users 表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'admin_users';
```

**如果返回空结果**，需要先执行：
- `supabase/migrations/007_create_admin_users_and_sessions.sql`

### 步骤 3: 执行迁移 SQL

**方法 A: 使用快速修复文件（推荐）**

1. 打开项目文件：`QUICK_FIX_CHAT_TABLES.sql`
2. **复制全部内容**
3. 粘贴到 Supabase SQL Editor
4. 点击 **Run** 按钮（或按 `Cmd+Enter` / `Ctrl+Enter`）

**方法 B: 手动复制**

复制以下 SQL 代码：

```sql
-- 创建聊天会话表
CREATE TABLE IF NOT EXISTS admin_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建聊天消息表
CREATE TABLE IF NOT EXISTS admin_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES admin_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT,
  images JSONB DEFAULT '[]',
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_chat_sessions_admin_user_id 
  ON admin_chat_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_chat_sessions_updated_at 
  ON admin_chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_session_id 
  ON admin_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_created_at 
  ON admin_chat_messages(created_at);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_admin_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_admin_chat_sessions_updated_at ON admin_chat_sessions;
CREATE TRIGGER trigger_update_admin_chat_sessions_updated_at
  BEFORE UPDATE ON admin_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_chat_sessions_updated_at();

-- 启用 RLS
ALTER TABLE admin_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_chat_messages ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS admin_chat_sessions_default_policy ON admin_chat_sessions;
DROP POLICY IF EXISTS admin_chat_messages_default_policy ON admin_chat_messages;
DROP POLICY IF EXISTS admin_chat_sessions_service_role_all ON admin_chat_sessions;
DROP POLICY IF EXISTS admin_chat_messages_service_role_all ON admin_chat_messages;

-- 创建默认策略
CREATE POLICY admin_chat_sessions_default_policy 
  ON admin_chat_sessions USING (false);
CREATE POLICY admin_chat_messages_default_policy 
  ON admin_chat_messages USING (false);

-- 创建 service_role 策略
CREATE POLICY admin_chat_sessions_service_role_all
  ON admin_chat_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY admin_chat_messages_service_role_all
  ON admin_chat_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

### 步骤 4: 验证执行结果

执行后应该看到：
- ✅ **Success** 消息（绿色对勾）
- ✅ 或者看到查询结果（两个表的 row_count = 0）

**不应该看到：**
- ❌ 红色错误消息
- ❌ "syntax error" 错误

### 步骤 5: 验证表创建

在 Supabase Dashboard 中：

1. 点击左侧菜单的 **Table Editor**
2. 应该能看到：
   - ✅ `admin_chat_sessions`
   - ✅ `admin_chat_messages`
3. 点击表名查看结构

### 步骤 6: 测试功能

1. 刷新应用页面
2. 在浏览器 Console 中运行：
   ```javascript
   await fullDiagnostics()
   ```
3. 应该看到：
   - ✅ 状态: 200 ✅
   - ✅ 可以创建新会话

## 🐛 常见错误

### 错误 1: "relation 'admin_users' does not exist"

**原因**: `admin_users` 表不存在

**解决**: 
1. 先执行 `supabase/migrations/007_create_admin_users_and_sessions.sql`
2. 然后再执行聊天表迁移

### 错误 2: "syntax error at or near 'Could'"

**原因**: 把错误消息当作 SQL 执行了

**解决**: 
- 不要执行错误消息
- 只执行 SQL 代码（CREATE TABLE 等语句）

### 错误 3: "policy already exists"

**原因**: 策略已存在（可能之前执行过部分迁移）

**解决**: 
- 使用 `QUICK_FIX_CHAT_TABLES.sql`（包含 DROP POLICY IF EXISTS）
- 或者忽略此错误（不影响功能）

## 📋 完整文件

- `QUICK_FIX_CHAT_TABLES.sql` - 可直接执行的完整 SQL
- `supabase/migrations/041_create_admin_chat_history.sql` - 原始迁移文件

