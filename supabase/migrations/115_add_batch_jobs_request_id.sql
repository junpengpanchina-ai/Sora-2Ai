-- Add request_id + source to batch_jobs for observability
-- Migration: 115
-- Safe: add columns if not exists

alter table batch_jobs
  add column if not exists request_id text,
  add column if not exists source text;

create index if not exists idx_batch_jobs_request_id
  on batch_jobs(request_id)
  where request_id is not null;

