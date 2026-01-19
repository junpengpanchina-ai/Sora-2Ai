-- 在 Supabase SQL 编辑器中执行，用于修改已存在的管理员密码（堵住迁移中曾泄露的明文）。
-- 1. 将 YOUR_NEW_PASSWORD 替换为你要设置的新密码；
-- 2. 若已改过用户名，把 251144748 换成实际用户名。
-- 若 crypt/gen_salt 报错，可尝试 extensions.crypt、extensions.gen_salt。

UPDATE admin_users
SET password_hash = crypt('YOUR_NEW_PASSWORD', gen_salt('bf'))
WHERE username = '251144748';
