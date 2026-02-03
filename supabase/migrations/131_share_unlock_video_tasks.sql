-- Share-to-unlock watermark: one-time no-watermark export per video after share intent
-- Rules: logged-in user, task owner, within 10 min of completion, max 3/day per user, 1 per video

ALTER TABLE video_tasks
  ADD COLUMN IF NOT EXISTS share_unlocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS share_unlocked_by UUID,
  ADD COLUMN IF NOT EXISTS share_unlock_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS share_unlock_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN video_tasks.share_unlocked_at IS 'When user claimed share-unlock (within 10 min of completed_at)';
COMMENT ON COLUMN video_tasks.share_unlocked_by IS 'user_id who claimed share-unlock';
COMMENT ON COLUMN video_tasks.share_unlock_used IS 'True after first no-watermark download via share unlock';
COMMENT ON COLUMN video_tasks.share_unlock_expires_at IS 'share_unlocked_at + 10 minutes';

CREATE INDEX IF NOT EXISTS idx_video_tasks_share_unlocked_by_at
  ON video_tasks(share_unlocked_by, share_unlocked_at)
  WHERE share_unlocked_at IS NOT NULL;
