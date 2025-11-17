-- 008_update_admin_foreign_keys.sql
-- 将售后记录与积分调整表中的管理员外键指向 admin_users

ALTER TABLE after_sales_issues
  DROP CONSTRAINT IF EXISTS after_sales_issues_handled_by_fkey;

ALTER TABLE after_sales_issues
  ADD CONSTRAINT after_sales_issues_handled_by_fkey
  FOREIGN KEY (handled_by) REFERENCES admin_users(id) ON DELETE SET NULL;

ALTER TABLE credit_adjustments
  DROP CONSTRAINT IF EXISTS credit_adjustments_admin_user_id_fkey;

ALTER TABLE credit_adjustments
  ADD CONSTRAINT credit_adjustments_admin_user_id_fkey
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL;


