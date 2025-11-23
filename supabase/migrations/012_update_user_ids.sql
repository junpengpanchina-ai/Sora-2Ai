-- 012_update_user_ids.sql
-- Sync existing users.id with auth.users.id and cascade changes to related tables

WITH mapping AS (
  SELECT u.id AS old_id, au.id AS new_id
  FROM users u
  JOIN auth.users au ON u.email = au.email
  WHERE u.id <> au.id
)
UPDATE video_tasks vt
SET user_id = m.new_id
FROM mapping m
WHERE vt.user_id = m.old_id;

WITH mapping AS (
  SELECT u.id AS old_id, au.id AS new_id
  FROM users u
  JOIN auth.users au ON u.email = au.email
  WHERE u.id <> au.id
)
UPDATE recharge_records rr
SET user_id = m.new_id
FROM mapping m
WHERE rr.user_id = m.old_id;

WITH mapping AS (
  SELECT u.id AS old_id, au.id AS new_id
  FROM users u
  JOIN auth.users au ON u.email = au.email
  WHERE u.id <> au.id
)
UPDATE consumption_records cr
SET user_id = m.new_id
FROM mapping m
WHERE cr.user_id = m.old_id;

WITH mapping AS (
  SELECT u.id AS old_id, au.id AS new_id
  FROM users u
  JOIN auth.users au ON u.email = au.email
  WHERE u.id <> au.id
)
UPDATE users u
SET id = m.new_id
FROM mapping m
WHERE u.id = m.old_id;

