-- 088_admin_lockdown_daily.sql
-- 14 天只观察不动 · 每日填报（Lockdown 监控）
-- 见 LOCKDOWN_14DAY_MONITORING.md

create table if not exists public.admin_lockdown_daily (
  id                bigserial primary key,
  date              date not null unique,
  phase             text not null default 'HOLD' check (phase in ('HOLD','EXPAND','STOP')),

  crawl_pages_per_day int not null default 0,
  crawl_trend        text not null default 'flat' check (crawl_trend in ('up','flat','down')),

  discovered_total  int not null default 0,
  discovered_trend  text not null default 'flat' check (discovered_trend in ('up','flat','down')),

  indexed_total     int not null default 0,
  indexed_trend     text not null default 'flat' check (indexed_trend in ('up','flat','down')),

  sitemap_status    text not null default 'success' check (sitemap_status in ('success','warning','error')),
  sitemap_submitted int,
  sitemap_discovered int,
  sitemap_indexed   int,

  sample_main_scene_ok   boolean not null default true,
  sample_merged_scene_ok boolean not null default true,

  note              text,
  created_at        timestamptz not null default now()
);

create index if not exists admin_lockdown_daily_date_idx on public.admin_lockdown_daily(date desc);

comment on table public.admin_lockdown_daily is 'Lockdown 14 天监控：每日 GSC 手填，用于 Admin 锁仓状态面板';
