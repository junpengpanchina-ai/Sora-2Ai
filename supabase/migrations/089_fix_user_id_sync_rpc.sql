-- 089: RPC 与 DEFERRABLE 约束，用于安全地将 users.id 从旧值迁移到 auth.uid()
-- 当 users 行由旧 trigger 创建（id=uuid_generate_v4()）导致 users.id != auth.uid() 时，
-- fix-user-id API 会调用本 RPC，在事务内先改子表 user_id，再改 users.id，避免 FK 报错。

-- 1) 将引用 public.users(id) 的外键设为可延迟（若已存在且未设则 ALTER）
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname, (c.conrelid::regclass)::text AS tbl
    FROM pg_constraint c
    WHERE c.confrelid = 'public.users'::regclass
      AND c.contype = 'f'
      AND c.condeferrable = false
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED', r.tbl, r.conname);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'alter deferrable %: %', r.conname, SQLERRM;
    END;
  END LOOP;
END $$;

-- 2) RPC：在事务内先更新子表 user_id，再更新 users.id
CREATE OR REPLACE FUNCTION public.fix_user_id_sync(p_old_id uuid, p_new_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET CONSTRAINTS ALL DEFERRED;

  UPDATE credit_wallet    SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE credit_ledger    SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE render_job       SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE risk_profile     SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE video_tasks      SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE recharge_records SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE consumption_records SET user_id = p_new_id WHERE user_id = p_old_id;

  UPDATE users SET id = p_new_id, last_login_at = NOW() WHERE id = p_old_id;
END;
$$;

COMMENT ON FUNCTION public.fix_user_id_sync IS 'Sync users.id to auth.uid(); updates FKs that reference users(id). Called by /api/auth/fix-user-id when users.id != auth.uid().';
