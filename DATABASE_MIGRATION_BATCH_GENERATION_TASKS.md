# 数据库迁移：创建 batch_generation_tasks 表

## ⚠️ 重要：必须执行此迁移

当前错误：`Could not find the table 'public.batch_generation_tasks' in the schema cache`

这个错误表示 `batch_generation_tasks` 表还没有在 Supabase 数据库中创建。

## ✅ 解决步骤

### 步骤 1: 打开 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录你的账号
3. 选择项目：**Sora AI Platform** (hgzpzsiafycwlqrkzbis)

### 步骤 2: 进入 SQL Editor

1. 在左侧菜单中找到 **SQL Editor**
2. 点击 **SQL Editor**
3. 点击 **New query**（新建查询）

### 步骤 3: 执行迁移 SQL

复制以下 SQL 代码并粘贴到 SQL Editor 中，然后点击 **Run** 按钮：

```sql
-- 038_create_batch_generation_tasks.sql
-- 创建批量生成任务表，支持后台任务处理

CREATE TABLE IF NOT EXISTS batch_generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  
  -- 任务配置
  task_type TEXT NOT NULL DEFAULT 'industry_scenes' CHECK (task_type IN ('industry_scenes', 'use_cases', 'keywords', 'blog_posts')),
  industries TEXT[] DEFAULT ARRAY[]::TEXT[],
  scenes_per_industry INTEGER DEFAULT 100,
  use_case_type TEXT,
  
  -- 任务状态
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paused', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_industry_index INTEGER DEFAULT 0,
  total_industries INTEGER DEFAULT 0,
  total_scenes_generated INTEGER DEFAULT 0,
  total_scenes_saved INTEGER DEFAULT 0,
  
  -- 错误信息
  error_message TEXT,
  last_error TEXT,
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- 控制标志
  should_stop BOOLEAN DEFAULT FALSE,
  is_paused BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_batch_generation_tasks_status ON batch_generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_batch_generation_tasks_admin_user_id ON batch_generation_tasks(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_batch_generation_tasks_created_at ON batch_generation_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_generation_tasks_status_pending ON batch_generation_tasks(status) WHERE status = 'pending';

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_batch_generation_tasks_updated_at ON batch_generation_tasks;
CREATE TRIGGER update_batch_generation_tasks_updated_at
  BEFORE UPDATE ON batch_generation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 策略（管理员可以查看自己的任务）
ALTER TABLE batch_generation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY batch_generation_tasks_admin_select
  ON batch_generation_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND (admin_users.id = batch_generation_tasks.admin_user_id OR admin_users.is_super_admin = TRUE)
    )
  );

CREATE POLICY batch_generation_tasks_admin_insert
  ON batch_generation_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY batch_generation_tasks_admin_update
  ON batch_generation_tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND (admin_users.id = batch_generation_tasks.admin_user_id OR admin_users.is_super_admin = TRUE)
    )
  );
```

### 步骤 4: 验证表创建

1. 在左侧菜单中找到 **Table Editor**
2. 点击 **Table Editor**
3. 应该能看到 `batch_generation_tasks` 表
4. 点击表名查看结构

## ⚠️ 注意事项

1. **确保 `admin_users` 表已存在**
   - 如果还没有创建 `admin_users` 表，需要先执行相关迁移

2. **确保 `update_updated_at_column` 函数已存在**
   - 如果还没有创建此函数，需要先执行相关迁移

3. **RLS 策略**
   - 表创建后会自动启用 RLS（Row Level Security）
   - 只有管理员用户可以访问自己的任务

## ✅ 验证迁移成功

迁移成功后，你应该能够：
- 创建批量生成任务
- 查询任务状态
- 暂停/恢复/取消任务

如果仍然出现错误，请检查：
1. 表是否成功创建
2. RLS 策略是否正确
3. 环境变量是否配置正确

