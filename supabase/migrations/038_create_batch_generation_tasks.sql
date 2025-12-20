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

