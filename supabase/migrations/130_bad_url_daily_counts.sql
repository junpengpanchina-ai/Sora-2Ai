-- bad_url_daily_counts: 坏 URL 命中计数，用于监控 404/5xx 修复后收敛趋势
create table if not exists public.bad_url_daily_counts (
  day date not null,
  pattern text not null,
  hits bigint not null default 0,
  last_path text null,
  last_ua text null,
  updated_at timestamptz not null default now(),
  primary key (day, pattern)
);

create index if not exists bad_url_daily_counts_day_idx
on public.bad_url_daily_counts(day);

alter table public.bad_url_daily_counts disable row level security;

-- 原子自增 RPC
create or replace function public.rpc_bad_url_hit(
  p_day date,
  p_pattern text,
  p_last_path text default null,
  p_last_ua text default null
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.bad_url_daily_counts(day, pattern, hits, last_path, last_ua, updated_at)
  values (p_day, p_pattern, 1, p_last_path, p_last_ua, now())
  on conflict (day, pattern)
  do update set
    hits = public.bad_url_daily_counts.hits + 1,
    last_path = excluded.last_path,
    last_ua = excluded.last_ua,
    updated_at = now();
end;
$$;
