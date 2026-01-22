-- Add poll tracking fields to video_tasks for production-grade polling
-- Migration: 107
-- Dependencies: 003_create_video_tasks_table.sql

-- 轮询次数和退避策略字段
alter table video_tasks
  add column if not exists poll_count int not null default 0,
  add column if not exists last_poll_at timestamptz,
  add column if not exists failure_type text;  -- 失败类型枚举：model_error / param_error / timeout / network / unknown

-- 失败类型枚举约束（可选，如果不想用 check，可以去掉）
-- alter table video_tasks
--   add constraint video_tasks_failure_type_check
--   check (failure_type is null or failure_type in ('model_error', 'param_error', 'timeout', 'network', 'unknown'));

-- 索引：用于查询需要轮询的任务（poll_count < max_poll）
create index if not exists idx_video_tasks_poll_tracking
on video_tasks(batch_job_id, status, poll_count, last_poll_at)
where status = 'processing' and grsai_task_id is not null;
