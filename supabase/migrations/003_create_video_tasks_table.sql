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


