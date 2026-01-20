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

