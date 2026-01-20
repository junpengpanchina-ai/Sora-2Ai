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
