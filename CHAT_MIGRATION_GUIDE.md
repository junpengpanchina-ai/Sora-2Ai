# 聊天功能数据库迁移指南

## ❌ 当前错误

```
Could not find the table 'public.admin_chat_sessions' in the schema cache
```

这个错误表示聊天功能的数据库表还没有在 Supabase 数据库中创建。

## ✅ 解决方案

需要在 Supabase Dashboard 中执行数据库迁移。

### 步骤 1: 打开 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录你的账号
3. 选择项目：**Sora AI Platform** (或你的项目名称)

### 步骤 2: 进入 SQL Editor

1. 在左侧菜单中找到 **SQL Editor**
2. 点击 **SQL Editor**
3. 点击 **New query**（新建查询）

### 步骤 3: 执行迁移 SQL

1. 打开项目文件：`supabase/migrations/041_create_admin_chat_history.sql`
2. **复制全部 SQL 代码**（见下方）
3. 粘贴到 Supabase SQL Editor 中
4. 点击 **Run** 按钮（或按 `Cmd+Enter` / `Ctrl+Enter`）

### 步骤 4: 验证表创建

1. 在左侧菜单中找到 **Table Editor**
2. 点击 **Table Editor**
3. 应该能看到以下表：
   - ✅ `admin_chat_sessions` - 聊天会话表
   - ✅ `admin_chat_messages` - 聊天消息表
4. 点击表名查看结构是否正确

## 📋 迁移 SQL 内容

以下是需要执行的完整 SQL：

```sql
-- 创建管理员聊天历史记录表
-- 支持多图片、文字消息，保存完整的对话历史

-- 聊天会话表
CREATE TABLE IF NOT EXISTS admin_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  title TEXT, -- 会话标题（自动生成或手动设置）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 聊天消息表
CREATE TABLE IF NOT EXISTS admin_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES admin_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT, -- 文本内容（可为空，如果只有图片）
  images JSONB DEFAULT '[]', -- 图片数组，存储图片的 base64 或 URL
  model TEXT, -- 使用的模型（gemini-2-flash, gemini-3-flash, gemini-3-pro）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_chat_sessions_admin_user_id ON admin_chat_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_chat_sessions_updated_at ON admin_chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_session_id ON admin_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_created_at ON admin_chat_messages(created_at);

-- 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_admin_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_chat_sessions_updated_at
  BEFORE UPDATE ON admin_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_chat_sessions_updated_at();

-- 添加 RLS 策略
-- 注意：管理员使用自定义认证系统，API 路由会通过 validateAdminSession 验证权限
-- 这里使用 service_role 策略，允许服务端访问（API 路由已验证权限）
ALTER TABLE admin_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_chat_messages ENABLE ROW LEVEL SECURITY;

-- 默认策略：拒绝所有访问
CREATE POLICY admin_chat_sessions_default_policy ON admin_chat_sessions
  USING (false);

CREATE POLICY admin_chat_messages_default_policy ON admin_chat_messages
  USING (false);

-- 允许 service_role 访问（API 路由已验证权限）
CREATE POLICY admin_chat_sessions_service_role_all
  ON admin_chat_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY admin_chat_messages_service_role_all
  ON admin_chat_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## ⚠️ 重要提示

1. **确保 `admin_users` 表已存在**
   - 这个表在 `007_create_admin_users_and_sessions.sql` 中创建
   - 如果不存在，迁移会失败

2. **执行顺序**
   - 如果这是第一次设置，确保已执行：
     - `007_create_admin_users_and_sessions.sql`（创建 admin_users 表）
     - `041_create_admin_chat_history.sql`（创建聊天表）

## ✅ 验证迁移成功

执行 SQL 后，应该看到：
- ✅ "Success. No rows returned" 或类似成功消息
- ✅ 在 Table Editor 中能看到 `admin_chat_sessions` 和 `admin_chat_messages` 表
- ✅ 表结构包含所有必要的字段

## 🔄 执行后

迁移完成后：
1. **刷新应用页面**（不需要重启开发服务器）
2. 再次运行诊断代码：`await fullDiagnostics()`
3. 应该不再出现 500 错误
4. 可以正常创建和查看聊天会话

## 🐛 如果遇到错误

### 错误 1: "relation 'admin_users' does not exist"
- **原因**: `admin_users` 表还没有创建
- **解决**: 先执行 `007_create_admin_users_and_sessions.sql`

### 错误 2: "permission denied"
- **原因**: 权限不足
- **解决**: 确保使用正确的 Supabase 项目，检查 API 密钥

### 错误 3: "policy already exists"
- **原因**: 策略已经存在（可能是之前执行过部分迁移）
- **解决**: 可以忽略，或者先删除策略再重新创建

## 📚 相关文件

- `supabase/migrations/041_create_admin_chat_history.sql` - 迁移文件
- `supabase/migrations/007_create_admin_users_and_sessions.sql` - 管理员用户表迁移

## 🧪 测试

迁移完成后，在浏览器 Console 中运行：

```javascript
await fullDiagnostics()
```

应该看到：
- ✅ 状态: 200 ✅
- ✅ 成功，会话数: 0（初始为空是正常的）
- ✅ 可以创建新会话

