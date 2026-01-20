-- Batch jobs table for AI video bulk generation

create table if not exists batch_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  status text not null check (status in (
    'queued', 'processing', 'partial', 'completed', 'failed'
  )),
  total_count int not null,
  success_count int not null default 0,
  failed_count int not null default 0,

  cost_per_video int not null,
  frozen_credits int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_batch_jobs_user_id
on batch_jobs(user_id);

create index if not exists idx_batch_jobs_status_created
on batch_jobs(status, created_at desc);

-- Link existing video_tasks to batch jobs (optional, safe if columns already exist)
alter table video_tasks
add column if not exists batch_job_id uuid references batch_jobs(id),
add column if not exists batch_index int;

