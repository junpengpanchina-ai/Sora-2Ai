-- Batch jobs webhook + task retry fields
-- 迁移编号: 103
-- 依赖: 098_batch_jobs.sql, 048_add_credit_wallet_system.sql

-- 1) batch_jobs 增加 webhook 相关字段
alter table batch_jobs
  add column if not exists webhook_url text,
  add column if not exists webhook_status text check (webhook_status in ('pending', 'sent', 'failed', 'retrying')),
  add column if not exists webhook_last_error text,
  add column if not exists webhook_attempts int not null default 0,
  add column if not exists webhook_last_sent_at timestamptz;

-- 2) video_tasks 增加重试相关字段（或使用 metadata JSONB）
-- 方案 A：直接加字段（推荐，查询方便）
alter table video_tasks
  add column if not exists attempts int not null default 0,
  add column if not exists last_error text,
  add column if not exists next_retry_at timestamptz;

-- 方案 B：如果不想改表结构，可以用 metadata JSONB（已有的话）
-- 示例：metadata = '{"attempts": 1, "last_error": "...", "next_retry_at": "..."}'

-- 3) 索引优化
create index if not exists idx_batch_jobs_webhook_status
on batch_jobs(webhook_status)
where webhook_url is not null;

create index if not exists idx_video_tasks_retry
on video_tasks(next_retry_at)
where next_retry_at is not null and status in ('queued', 'failed');
