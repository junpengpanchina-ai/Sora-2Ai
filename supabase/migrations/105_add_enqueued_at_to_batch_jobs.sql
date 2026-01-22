-- Add enqueued_at field to batch_jobs for preventing duplicate enqueue
-- Migration: 105
-- Dependencies: 098_batch_jobs.sql

alter table batch_jobs
add column if not exists enqueued_at timestamptz;

create index if not exists idx_batch_jobs_enqueued_at
on batch_jobs(enqueued_at)
where enqueued_at is not null;
