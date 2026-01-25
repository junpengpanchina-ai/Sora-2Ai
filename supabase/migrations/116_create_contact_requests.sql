-- Create contact_requests table for contact + enterprise leads
-- Migration: 116

create table if not exists contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  intent text null,
  name text not null,
  email text not null,
  company text not null,
  message text null,

  source_path text null,
  user_agent text null,
  ip text null,

  status text not null default 'new',
  meta jsonb null
);

create index if not exists idx_contact_requests_created_at
  on contact_requests(created_at desc);

create index if not exists idx_contact_requests_intent
  on contact_requests(intent)
  where intent is not null;

create index if not exists idx_contact_requests_status
  on contact_requests(status);

-- Keep updated_at fresh
create or replace function set_contact_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_contact_requests_updated_at on contact_requests;
create trigger trg_contact_requests_updated_at
before update on contact_requests
for each row execute function set_contact_requests_updated_at();

-- Enable RLS (service role bypasses; admin pages use service role)
alter table contact_requests enable row level security;

