-- 037_add_quality_fields_to_use_cases.sql
-- 为使用场景表添加质量监管字段

-- 添加质量状态字段
ALTER TABLE use_cases
ADD COLUMN IF NOT EXISTS quality_status TEXT DEFAULT 'pending' CHECK (quality_status IN ('pending', 'approved', 'rejected', 'needs_review'));

-- 添加质量问题标记
ALTER TABLE use_cases
ADD COLUMN IF NOT EXISTS quality_issues TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 添加质量评分（0-100）
ALTER TABLE use_cases
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT NULL CHECK (quality_score >= 0 AND quality_score <= 100);

-- 添加审核备注
ALTER TABLE use_cases
ADD COLUMN IF NOT EXISTS quality_notes TEXT DEFAULT NULL;

-- 添加审核人ID
ALTER TABLE use_cases
ADD COLUMN IF NOT EXISTS reviewed_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- 添加审核时间
ALTER TABLE use_cases
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_use_cases_quality_status ON use_cases(quality_status);
CREATE INDEX IF NOT EXISTS idx_use_cases_quality_score ON use_cases(quality_score);
CREATE INDEX IF NOT EXISTS idx_use_cases_reviewed_at ON use_cases(reviewed_at DESC);

-- 更新 RLS 策略（已发布且已审核通过的内容才能公开访问）
DROP POLICY IF EXISTS use_cases_public_select ON use_cases;
CREATE POLICY use_cases_public_select
  ON use_cases
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE AND quality_status = 'approved');

