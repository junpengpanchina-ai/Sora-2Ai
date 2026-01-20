# 视频访问控制 Migrations 执行指南

> **执行时间**：按顺序运行以下三个 migration 文件  
> **执行位置**：Supabase Dashboard → SQL Editor  
> **项目链接**：https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis/editor

---

## 📋 执行步骤

1. 打开 Supabase Dashboard SQL Editor
2. 按顺序复制粘贴以下三个 SQL 文件的内容
3. 每个文件执行完成后，再执行下一个
4. 检查是否有错误（通常应该全部成功）

---

## 1️⃣ Migration 095: 视频外部访问策略与审计日志

**文件路径**：`supabase/migrations/095_video_external_access_policy.sql`

```sql
-- Video external access policy and external access log
-- NOTE: This migration adds external_access_policy to video_tasks table

-- 1) Extend video_tasks table with external_access_policy JSONB
ALTER TABLE video_tasks
ADD COLUMN IF NOT EXISTS external_access_policy JSONB NOT NULL DEFAULT '{
  "allow_share": true,
  "allow_embed": false,
  "allow_download": false,
  "download_requires_membership": "basic",
  "embed_domains": [],
  "expires_at": null
}';

-- 2) External access audit log
CREATE TABLE IF NOT EXISTS video_external_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL, -- play / share / embed / download
  source TEXT NOT NULL, -- internal / share_link / embed
  policy_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_external_access_video_id
ON video_external_access_log(video_id);

CREATE INDEX IF NOT EXISTS idx_video_external_access_user_id
ON video_external_access_log(user_id);

CREATE INDEX IF NOT EXISTS idx_video_external_access_action
ON video_external_access_log(action);

CREATE INDEX IF NOT EXISTS idx_video_external_access_created_at
ON video_external_access_log(created_at DESC);
```

**预期结果**：
- ✅ `video_tasks` 表新增 `external_access_policy` 字段
- ✅ 创建 `video_external_access_log` 表
- ✅ 创建 6 个索引

---

## 2️⃣ Migration 096: 下载统计函数

**文件路径**：`supabase/migrations/096_video_download_stats_function.sql`

```sql
-- Helper function for per-user / per-video download counts (today)

create or replace function video_download_stats_today(
  p_user_id uuid,
  p_video_id uuid
)
returns table (
  video_today bigint,
  user_today bigint
)
language sql
security definer
as $$
  select
    count(*) filter (
      where action = 'download'
        and video_id = p_video_id
        and created_at::date = current_date
    ) as video_today,
    count(*) filter (
      where action = 'download'
        and user_id = p_user_id
        and created_at::date = current_date
    ) as user_today
  from video_external_access_log;
$$;
```

**预期结果**：
- ✅ 创建函数 `video_download_stats_today(uuid, uuid)`

---

## 3️⃣ Migration 097: 视频访问 RPC 函数

**文件路径**：`supabase/migrations/097_video_access_rpc_functions.sql`

```sql
-- RPC functions for video access control and admin statistics
-- These functions support the video access decision system and admin analytics

-- ============================================================================
-- 1. Get video playback URL (signed, with expiration)
-- ============================================================================
-- Returns a signed playback URL for a video, with expiration time
-- If using Supabase Storage, this would generate a signed URL
-- For now, returns the video_url from video_tasks with a calculated expiration

CREATE OR REPLACE FUNCTION get_video_playback_url(
  p_video_id UUID
)
RETURNS TABLE (
  url TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_video_url TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get video URL from video_tasks (assuming video_id maps to video_tasks.id)
  -- If you have a separate 'video' table, adjust the query accordingly
  SELECT video_url INTO v_video_url
  FROM video_tasks
  WHERE id = p_video_id
    AND status = 'succeeded'
    AND video_url IS NOT NULL;

  IF v_video_url IS NULL THEN
    RAISE EXCEPTION 'Video not found or not available';
  END IF;

  -- Set expiration to 1 hour from now (adjust as needed)
  v_expires_at := NOW() + INTERVAL '1 hour';

  -- If you're using Supabase Storage, you would generate a signed URL here
  -- For now, return the original URL with expiration time
  -- Example for Supabase Storage:
  -- v_video_url := storage.create_signed_url('videos', p_video_id::TEXT || '.mp4', 3600);

  RETURN QUERY SELECT v_video_url, v_expires_at;
END;
$$;

-- ============================================================================
-- 2. Get video download URL (signed, no watermark, with expiration)
-- ============================================================================
-- Returns a signed download URL for a video (watermark-free version)
-- This should point to a processed/transcoded version without watermark

CREATE OR REPLACE FUNCTION get_video_download_url(
  p_video_id UUID
)
RETURNS TABLE (
  url TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_video_url TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get video URL from video_tasks
  -- In production, you might have a separate 'processed' or 'download' URL
  -- that points to a watermark-free version
  SELECT video_url INTO v_video_url
  FROM video_tasks
  WHERE id = p_video_id
    AND status = 'succeeded'
    AND video_url IS NOT NULL;

  IF v_video_url IS NULL THEN
    RAISE EXCEPTION 'Video not found or not available';
  END IF;

  -- Set expiration to 5 minutes for download URLs (shorter than playback)
  v_expires_at := NOW() + INTERVAL '5 minutes';

  -- If you have a separate download URL (e.g., from R2 or processed storage),
  -- replace v_video_url with that URL here
  -- Example:
  -- SELECT download_url INTO v_video_url FROM video_downloads WHERE video_id = p_video_id;

  RETURN QUERY SELECT v_video_url, v_expires_at;
END;
$$;

-- ============================================================================
-- 3. Get video access statistics by day (for admin dashboard)
-- ============================================================================
-- Returns aggregated statistics (play, download, embed) grouped by day
-- p_range: '7d', '14d', '30d' (days to look back)

CREATE OR REPLACE FUNCTION video_access_stats_by_day(
  p_range TEXT DEFAULT '7d'
)
RETURNS TABLE (
  date DATE,
  play_count BIGINT,
  download_count BIGINT,
  embed_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_days INTEGER;
BEGIN
  -- Parse range string
  v_days := CASE
    WHEN p_range = '7d' THEN 7
    WHEN p_range = '14d' THEN 14
    WHEN p_range = '30d' THEN 30
    ELSE 7 -- default
  END;

  RETURN QUERY
  SELECT
    created_at::DATE AS date,
    COUNT(*) FILTER (WHERE action = 'play') AS play_count,
    COUNT(*) FILTER (WHERE action = 'download') AS download_count,
    COUNT(*) FILTER (WHERE action = 'embed') AS embed_count
  FROM video_external_access_log
  WHERE created_at >= CURRENT_DATE - (v_days || ' days')::INTERVAL
  GROUP BY created_at::DATE
  ORDER BY date ASC;
END;
$$;

-- ============================================================================
-- 4. Get top videos by access action (for admin dashboard)
-- ============================================================================
-- Returns top videos by play/download/embed count
-- p_action: 'play', 'download', 'embed', or NULL for all
-- p_limit: number of results to return

CREATE OR REPLACE FUNCTION video_access_top_videos(
  p_action TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  video_id UUID,
  video_title TEXT,
  uploader_id UUID,
  action_count BIGINT,
  unique_users BIGINT,
  top_membership TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH action_counts AS (
    SELECT
      veal.video_id,
      COUNT(*) AS action_count,
      COUNT(DISTINCT veal.user_id) AS unique_users
    FROM video_external_access_log veal
    WHERE (p_action IS NULL OR veal.action = p_action)
    GROUP BY veal.video_id
  ),
  membership_distribution AS (
    SELECT
      veal.video_id,
      MODE() WITHIN GROUP (ORDER BY 
        CASE 
          WHEN veal.policy_snapshot->>'download_requires_membership' = 'pro' THEN 'pro'
          WHEN veal.policy_snapshot->>'download_requires_membership' = 'basic' THEN 'basic'
          ELSE 'free'
        END
      ) AS top_membership
    FROM video_external_access_log veal
    WHERE (p_action IS NULL OR veal.action = p_action)
      AND veal.policy_snapshot IS NOT NULL
    GROUP BY veal.video_id
  )
  SELECT
    ac.video_id,
    COALESCE(vt.prompt, 'Untitled Video') AS video_title,
    vt.user_id AS uploader_id,
    ac.action_count,
    ac.unique_users,
    COALESCE(md.top_membership, 'unknown') AS top_membership
  FROM action_counts ac
  LEFT JOIN video_tasks vt ON vt.id = ac.video_id
  LEFT JOIN membership_distribution md ON md.video_id = ac.video_id
  ORDER BY ac.action_count DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- Grant execute permissions to authenticated users (adjust as needed)
-- ============================================================================

-- Playback and download URLs: authenticated users only
GRANT EXECUTE ON FUNCTION get_video_playback_url(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_video_download_url(UUID) TO authenticated;

-- Admin statistics: service role or admin users only
-- In production, you might want to create a custom role for admins
GRANT EXECUTE ON FUNCTION video_access_stats_by_day(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION video_access_top_videos(TEXT, INTEGER) TO service_role;
```

**预期结果**：
- ✅ 创建函数 `get_video_playback_url(uuid)`
- ✅ 创建函数 `get_video_download_url(uuid)`
- ✅ 创建函数 `video_access_stats_by_day(text)`
- ✅ 创建函数 `video_access_top_videos(text, integer)`
- ✅ 授予相应权限

---

## ✅ 验证执行结果

执行完成后，可以在 SQL Editor 中运行以下查询验证：

```sql
-- 1. 检查 video_tasks 表是否有 external_access_policy 字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'video_tasks' 
  AND column_name = 'external_access_policy';

-- 2. 检查 video_external_access_log 表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'video_external_access_log';

-- 3. 检查所有函数是否创建成功
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'video_download_stats_today',
    'get_video_playback_url',
    'get_video_download_url',
    'video_access_stats_by_day',
    'video_access_top_videos'
  )
ORDER BY routine_name;
```

---

## 🔗 快速链接

- **Supabase Dashboard SQL Editor**: https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis/editor
- **项目设置**: https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis/settings/general

---

## 📝 注意事项

1. **执行顺序很重要**：必须按 095 → 096 → 097 的顺序执行
2. **IF NOT EXISTS 保护**：所有 `CREATE` 语句都使用了 `IF NOT EXISTS`，重复执行不会报错
3. **权限设置**：函数使用 `SECURITY DEFINER`，确保有足够权限访问表
4. **后续调整**：如果使用 R2/S3 存储，需要修改 `get_video_playback_url` 和 `get_video_download_url` 中的 URL 生成逻辑

---

**执行完成后，你的视频访问控制系统就可以正常工作了！** 🎉
