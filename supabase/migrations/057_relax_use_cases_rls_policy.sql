-- 057_relax_use_cases_rls_policy.sql
-- 放宽 use_cases 表的 RLS 策略，允许 quality_status 为 null 或 'approved' 的记录显示
-- 这样可以显示那些还没有审核但已发布的内容

-- 更新 RLS 策略：允许已发布且（已审核通过或未审核）的内容公开访问
DROP POLICY IF EXISTS use_cases_public_select ON use_cases;
CREATE POLICY use_cases_public_select
  ON use_cases
  FOR SELECT
  TO anon, authenticated
  USING (
    is_published = TRUE 
    AND (quality_status = 'approved' OR quality_status IS NULL)
  );

