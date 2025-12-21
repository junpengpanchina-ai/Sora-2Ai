# 🚨 快速修复：批量生成功能无法使用

## 问题诊断

**错误信息：** `Could not find the table 'public.batch_generation_tasks' in the schema cache`

**原因：** 数据库表 `batch_generation_tasks` 还没有在 Supabase 中创建。

## ✅ 立即修复（5 分钟）

### 步骤 1: 打开 Supabase Dashboard

1. 访问：https://supabase.com/dashboard
2. 登录你的账号
3. 选择项目：**Sora AI Platform** (hgzpzsiafycwlqrkzbis)

### 步骤 2: 执行 SQL 迁移

1. 在左侧菜单点击 **SQL Editor**
2. 点击 **New query**（新建查询）
3. **复制下面的完整 SQL 代码**，粘贴到编辑器中
4. 点击 **Run** 按钮（或按 `Cmd+Enter` / `Ctrl+Enter`）

```sql
-- 创建批量生成任务表
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

### 步骤 3: 验证迁移成功

1. 在左侧菜单点击 **Table Editor**
2. 应该能看到 `batch_generation_tasks` 表
3. 点击表名查看结构

### 步骤 4: 验证功能

1. 刷新管理后台页面
2. 尝试创建批量生成任务
3. 应该不再出现 500 错误

## 🔍 验证脚本

你也可以运行检查脚本验证表是否存在：

```bash
node scripts/check-batch-generation-table.js
```

如果看到 `✅ 表存在！`，说明迁移成功。

## ⚠️ 常见问题

### Q: 执行 SQL 时出现错误 "function update_updated_at_column does not exist"

**A:** 需要先创建这个函数。执行以下 SQL：

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Q: 执行 SQL 时出现错误 "relation admin_users does not exist"

**A:** 需要先创建 `admin_users` 表。请检查是否有相关的迁移文件。

### Q: 迁移后仍然出现 500 错误

**A:** 
1. 检查 Vercel 日志，查看具体错误信息
2. 确认 RLS 策略是否正确
3. 确认环境变量 `SUPABASE_SERVICE_ROLE_KEY` 是否正确配置

## 📞 需要帮助？

如果迁移后仍然有问题，请：
1. 查看 Vercel 日志中的详细错误信息
2. 运行 `node scripts/check-batch-generation-table.js` 检查表状态
3. 提供错误日志以便进一步诊断

