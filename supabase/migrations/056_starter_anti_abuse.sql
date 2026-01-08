-- Migration: 056_starter_anti_abuse.sql
-- Starter anti-abuse: device/IP tracking

-- 1) User devices
create table if not exists public.user_devices (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  first_ip text,
  last_ip text,
  first_seen timestamptz default now(),
  last_seen timestamptz default now(),
  unique(user_id, device_id)
);

-- 2) Starter purchase guards
create table if not exists public.starter_purchase_guards (
  id bigserial primary key,
  user_id uuid,
  device_id text,
  ip text,
  email text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_spg_ip_time on public.starter_purchase_guards (ip, created_at desc);
create index if not exists idx_spg_device_time on public.starter_purchase_guards (device_id, created_at desc);
create index if not exists idx_user_devices_device on public.user_devices(device_id);

