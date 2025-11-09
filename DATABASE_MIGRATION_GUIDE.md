# 数据库迁移指南 - 创建 video_tasks 表

## ❌ 当前错误

```
Could not find the table 'public.video_tasks' in the schema cache
```

这个错误表示 `video_tasks` 表还没有在 Supabase 数据库中创建。

## ✅ 解决方案

需要在 Supabase Dashboard 中执行数据库迁移。

### 步骤 1: 打开 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录你的账号
3. 选择项目：**Sora AI Platform** (hgzpzsiafycwlqrkzbis)

### 步骤 2: 进入 SQL Editor

1. 在左侧菜单中找到 **SQL Editor**
2. 点击 **SQL Editor**
3. 点击 **New query**（新建查询）

### 步骤 3: 执行迁移 SQL

1. 打开项目文件：`supabase/migrations/003_create_video_tasks_table.sql`
2. **复制全部 SQL 代码**
3. 粘贴到 Supabase SQL Editor 中
4. 点击 **Run** 按钮（或按 `Cmd+Enter` / `Ctrl+Enter`）

### 步骤 4: 验证表创建

1. 在左侧菜单中找到 **Table Editor**
2. 点击 **Table Editor**
3. 应该能看到 `video_tasks` 表
4. 点击表名查看结构

## 📋 迁移 SQL 内容

以下是需要执行的 SQL（已保存在 `supabase/migrations/003_create_video_tasks_table.sql`）：

```sql
-- 创建视频生成任务表
CREATE TABLE IF NOT EXISTS video_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grsai_task_id TEXT, -- grsai.com 返回的任务 ID
  model TEXT DEFAULT 'sora-2', -- 使用的模型
  prompt TEXT NOT NULL, -- 提示词
  reference_url TEXT, -- 参考图片 URL
  aspect_ratio TEXT DEFAULT '9:16', -- 视频比例: 9:16, 16:9
  duration INTEGER DEFAULT 10, -- 视频时长(秒): 10, 15
  size TEXT DEFAULT 'small', -- 视频清晰度: small, large
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')), -- 任务状态
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100), -- 任务进度 0~100
  video_url TEXT, -- 生成的视频 URL
  remove_watermark BOOLEAN DEFAULT true, -- 是否去除水印
  pid TEXT, -- 任务 PID
  failure_reason TEXT, -- 失败原因: output_moderation, input_moderation, error
  error_message TEXT, -- 错误详细信息
  webhook_url TEXT, -- 回调地址
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE -- 完成时间
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_video_tasks_user_id ON video_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_video_tasks_status ON video_tasks(status);
CREATE INDEX IF NOT EXISTS idx_video_tasks_created_at ON video_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_tasks_grsai_task_id ON video_tasks(grsai_task_id);

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_video_tasks_updated_at ON video_tasks;
CREATE TRIGGER update_video_tasks_updated_at BEFORE UPDATE ON video_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## ⚠️ 重要提示

1. **确保 `users` 表已存在**
   - 如果还没有创建 `users` 表，需要先执行 `001_create_users_table.sql`

2. **确保 `update_updated_at_column` 函数已存在**
   - 这个函数在 `001_create_users_table.sql` 中创建
   - 如果不存在，迁移会失败

3. **执行顺序**
   - 如果这是第一次设置，按顺序执行：
     1. `001_create_users_table.sql`
     2. `002_handle_new_user_trigger.sql`
     3. `003_create_video_tasks_table.sql`

## ✅ 验证迁移成功

执行 SQL 后，应该看到：
- ✅ "Success. No rows returned" 或类似成功消息
- ✅ 在 Table Editor 中能看到 `video_tasks` 表
- ✅ 表结构包含所有必要的字段

## 🔄 执行后

迁移完成后：
1. **刷新应用页面**（不需要重启开发服务器）
2. 再次访问 `/video` 页面
3. 应该不再出现 500 错误
4. 可以正常创建和查看视频任务

## 🐛 如果遇到错误

### 错误 1: "relation 'users' does not exist"
- **原因**: `users` 表还没有创建
- **解决**: 先执行 `001_create_users_table.sql`

### 错误 2: "function update_updated_at_column() does not exist"
- **原因**: 更新函数还没有创建
- **解决**: 先执行 `001_create_users_table.sql`（包含函数定义）

### 错误 3: "permission denied"
- **原因**: 权限不足
- **解决**: 确保使用正确的 Supabase 项目，检查 API 密钥

## 📚 相关文件

- `supabase/migrations/003_create_video_tasks_table.sql` - 迁移文件
- `supabase/migrations/001_create_users_table.sql` - 用户表迁移
- `supabase/migrations/002_handle_new_user_trigger.sql` - 用户触发器

