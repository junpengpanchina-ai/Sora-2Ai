-- 094_credit_reconciliation_daily.sql
-- Daily snapshot table for admin credit reconciliation (14d window locking)

create table if not exists public.credit_reconciliation_daily (
  date date primary key,

  total_users bigint not null default 0,
  users_with_wallet bigint not null default 0,

  mismatch_users bigint not null default 0,
  mismatch_gt_0_users bigint not null default 0,
  mismatch_sample_user_ids text not null default '',

  legacy_credits_write_events bigint, -- 可为 null（没 audit 时）
  check_recharge_manual_reconciles bigint not null default 0,

  wallet_total_sum bigint not null default 0,
  wallet_negative_users bigint not null default 0,

  ledger_events_24h bigint not null default 0,

  status text not null default 'WARN', -- OK/WARN/STOP
  note text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_credit_reconciliation_daily_status
on public.credit_reconciliation_daily(status);

create index if not exists idx_credit_reconciliation_daily_updated_at
on public.credit_reconciliation_daily(updated_at);

-- 通用 updated_at trigger
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_credit_reconciliation_daily_updated_at
  on public.credit_reconciliation_daily;

create trigger trg_credit_reconciliation_daily_updated_at
before update on public.credit_reconciliation_daily
for each row
execute function public.set_updated_at_timestamp();

