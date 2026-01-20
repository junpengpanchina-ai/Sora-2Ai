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

