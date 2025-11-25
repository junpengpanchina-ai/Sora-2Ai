-- 011_add_users_insert_policy.sql
-- Allow authenticated users to insert their own user record after OAuth login

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_insert_own ON users;
CREATE POLICY users_insert_own
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


