-- Enterprise API keys and usage tracking

create table if not exists enterprise_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  api_key text not null unique,
  name text,
  is_active boolean not null default true,
  rate_limit_per_min int not null default 60,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create index if not exists idx_enterprise_api_keys_user_id
on enterprise_api_keys(user_id);

create table if not exists enterprise_api_usage (
  id bigint generated always as identity primary key,
  api_key_id uuid references enterprise_api_keys(id) on delete set null,
  endpoint text,
  created_at timestamptz not null default now()
);

create index if not exists idx_enterprise_api_usage_key_created
on enterprise_api_usage(api_key_id, created_at desc);

