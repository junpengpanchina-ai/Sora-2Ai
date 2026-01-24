-- 113_seo_index_health_dashboard.sql
-- SEO Index Health Dashboard 数据模型
-- 目标：不是"看数据"，而是第一时间发现：该不该停、该不该扩

-- ============================================
-- 1. 核心指标表：seo_daily_metrics
-- ============================================
create table if not exists seo_daily_metrics (
  date date primary key,

  -- Crawl Pipeline（来自 GSC API）
  discovered int default 0,           -- 已发现 URL
  crawled int default 0,              -- 已抓取 URL
  indexed int default 0,              -- 已编入索引

  -- Sitemap Health
  tier1_chunks int default 0,         -- Tier1 chunk 数量
  tier1_empty_chunks int default 0,   -- Tier1 空 chunk 数量（必须 = 0）
  tier1_total_urls int default 0,     -- Tier1 总 URL 数
  tier2_chunks int default 0,         -- Tier2 chunk 数量
  tier2_total_urls int default 0,     -- Tier2 总 URL 数
  core_urls int default 0,            -- Core sitemap URL 数

  -- Quality Indicators
  duplicate_urls int default 0,       -- 重复 URL 数
  soft_404_urls int default 0,        -- Soft 404 数
  canonical_mismatch int default 0,   -- Canonical 不匹配数

  -- Computed（由触发器自动计算）
  index_rate numeric(5,2),            -- indexed / crawled（核心指标）
  index_delta int,                    -- 相比前一天的 indexed 增量

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table seo_daily_metrics is 'SEO 每日指标，数据来源：GSC API + sitemap_health_check';
comment on column seo_daily_metrics.index_rate is '索引率 = indexed/crawled，<40% 禁止扩容';
comment on column seo_daily_metrics.tier1_empty_chunks is '必须 = 0，否则为 FATAL';

-- 索引
create index if not exists idx_seo_daily_metrics_date on seo_daily_metrics(date desc);

-- ============================================
-- 2. 告警表：seo_alerts
-- ============================================
create table if not exists seo_alerts (
  id bigserial primary key,
  level text not null check (level in ('info', 'warning', 'fatal')),
  type text not null,                 -- sitemap / index / quality / scaling
  message text not null,
  metric_name text,                   -- 触发的指标名
  metric_value numeric,               -- 触发时的值
  threshold numeric,                  -- 阈值
  resolved_at timestamptz,            -- 解决时间
  created_at timestamptz default now()
);

comment on table seo_alerts is 'SEO 告警记录，fatal 级别必须立即处理';

create index if not exists idx_seo_alerts_level on seo_alerts(level);
create index if not exists idx_seo_alerts_created on seo_alerts(created_at desc);

-- ============================================
-- 3. 自动计算 index_rate 和 index_delta
-- ============================================
create or replace function compute_seo_metrics()
returns trigger
language plpgsql
as $$
declare
  prev_indexed int;
begin
  -- 计算 index_rate
  if NEW.crawled > 0 then
    NEW.index_rate := round((NEW.indexed::numeric / NEW.crawled) * 100, 2);
  else
    NEW.index_rate := null;
  end if;

  -- 计算 index_delta（相比前一天）
  select indexed into prev_indexed
  from seo_daily_metrics
  where date = NEW.date - 1;

  if prev_indexed is not null then
    NEW.index_delta := NEW.indexed - prev_indexed;
  else
    NEW.index_delta := null;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_compute_seo_metrics on seo_daily_metrics;
create trigger trg_compute_seo_metrics
  before insert or update on seo_daily_metrics
  for each row execute function compute_seo_metrics();

-- ============================================
-- 4. 自动告警检测函数
-- ============================================
create or replace function check_seo_alerts(p_date date default current_date)
returns table (
  level text,
  type text,
  message text
)
language plpgsql
as $$
declare
  m seo_daily_metrics%rowtype;
  consecutive_zero_delta int;
begin
  select * into m from seo_daily_metrics where date = p_date;
  
  if not found then
    return;
  end if;

  -- FATAL: Tier1 空 chunk
  if m.tier1_empty_chunks > 0 then
    insert into seo_alerts (level, type, message, metric_name, metric_value)
    values ('fatal', 'sitemap', '🚨 Tier1 存在空 chunk，Google 无法发现 URL', 'tier1_empty_chunks', m.tier1_empty_chunks);
    
    return query select 'fatal'::text, 'sitemap'::text, '🚨 Tier1 存在空 chunk'::text;
  end if;

  -- FATAL: Index Rate < 40%
  if m.index_rate is not null and m.index_rate < 40 then
    insert into seo_alerts (level, type, message, metric_name, metric_value, threshold)
    values ('fatal', 'index', '🚨 Index Rate < 40%，禁止扩容', 'index_rate', m.index_rate, 40);
    
    return query select 'fatal'::text, 'index'::text, format('🚨 Index Rate = %.1f%% < 40%%', m.index_rate)::text;
  end if;

  -- WARNING: Index Rate < 50%
  if m.index_rate is not null and m.index_rate < 50 and m.index_rate >= 40 then
    insert into seo_alerts (level, type, message, metric_name, metric_value, threshold)
    values ('warning', 'index', '⚠️ Index Rate < 50%，观察中', 'index_rate', m.index_rate, 50);
    
    return query select 'warning'::text, 'index'::text, format('⚠️ Index Rate = %.1f%%', m.index_rate)::text;
  end if;

  -- WARNING: Duplicate > 20%
  if m.indexed > 0 and (m.duplicate_urls::numeric / m.indexed) > 0.2 then
    insert into seo_alerts (level, type, message, metric_name, metric_value)
    values ('warning', 'quality', '⚠️ Duplicate URLs > 20%', 'duplicate_rate', round((m.duplicate_urls::numeric / m.indexed) * 100, 2));
    
    return query select 'warning'::text, 'quality'::text, '⚠️ Duplicate URLs > 20%'::text;
  end if;

  -- WARNING: 连续 3 天 index_delta <= 0
  select count(*) into consecutive_zero_delta
  from seo_daily_metrics
  where date between p_date - 2 and p_date
    and coalesce(index_delta, 0) <= 0;

  if consecutive_zero_delta >= 3 then
    insert into seo_alerts (level, type, message, metric_name, metric_value)
    values ('warning', 'scaling', '⚠️ 连续 3 天 Indexed 未增长，暂停扩容', 'consecutive_zero_delta', consecutive_zero_delta);
    
    return query select 'warning'::text, 'scaling'::text, '⚠️ 连续 3 天 Indexed 未增长'::text;
  end if;

  return;
end;
$$;

-- ============================================
-- 5. Dashboard 视图
-- ============================================

-- 5.1 最新状态概览
create or replace view v_seo_dashboard_current as
select
  date,
  discovered,
  crawled,
  indexed,
  index_rate,
  index_delta,
  tier1_total_urls,
  tier1_empty_chunks,
  duplicate_urls,
  soft_404_urls,
  case
    when tier1_empty_chunks > 0 then '🚨 FATAL: Tier1 空 chunk'
    when index_rate < 40 then '🚨 FATAL: Index Rate < 40%'
    when index_rate < 50 then '⚠️ WARNING: Index Rate < 50%'
    when coalesce(index_delta, 0) <= 0 then '⚠️ WARNING: Indexed 未增长'
    else '✅ HEALTHY'
  end as status
from seo_daily_metrics
order by date desc
limit 1;

-- 5.2 趋势视图（最近 14 天）
create or replace view v_seo_trend_14d as
select
  date,
  discovered,
  crawled,
  indexed,
  index_rate,
  index_delta,
  tier1_total_urls + coalesce(tier2_total_urls, 0) + coalesce(core_urls, 0) as total_sitemap_urls,
  duplicate_urls,
  soft_404_urls
from seo_daily_metrics
where date >= current_date - 14
order by date desc;

-- 5.3 告警 Feed
create or replace view v_seo_alerts_recent as
select
  id,
  level,
  type,
  message,
  metric_name,
  metric_value,
  threshold,
  created_at,
  resolved_at,
  case when resolved_at is null then 'open' else 'resolved' end as status
from seo_alerts
order by created_at desc
limit 50;

-- 5.4 扩容决策视图（核心）
create or replace view v_seo_scaling_decision as
with recent as (
  select * from seo_daily_metrics
  where date >= current_date - 7
  order by date desc
),
stats as (
  select
    avg(index_rate) as avg_index_rate,
    min(index_rate) as min_index_rate,
    sum(case when coalesce(index_delta, 0) <= 0 then 1 else 0 end) as zero_delta_days,
    max(tier1_empty_chunks) as max_empty_chunks,
    max(duplicate_urls::numeric / nullif(indexed, 0)) as max_duplicate_rate
  from recent
)
select
  case
    when max_empty_chunks > 0 then 'BLOCKED'
    when min_index_rate < 40 then 'BLOCKED'
    when avg_index_rate < 50 then 'HOLD'
    when zero_delta_days >= 3 then 'HOLD'
    when max_duplicate_rate > 0.2 then 'HOLD'
    when avg_index_rate >= 70 then 'SAFE_TO_SCALE'
    else 'CAUTIOUS'
  end as decision,
  case
    when max_empty_chunks > 0 then '🚨 Tier1 存在空 chunk'
    when min_index_rate < 40 then '🚨 Index Rate 曾 < 40%'
    when avg_index_rate < 50 then '⚠️ 平均 Index Rate < 50%'
    when zero_delta_days >= 3 then '⚠️ 连续无增长天数过多'
    when max_duplicate_rate > 0.2 then '⚠️ Duplicate 过高'
    when avg_index_rate >= 70 then '✅ Index Rate 健康'
    else '⚠️ 需谨慎评估'
  end as reason,
  round(avg_index_rate, 1) as avg_index_rate_7d,
  min_index_rate as min_index_rate_7d,
  zero_delta_days as zero_delta_days_7d,
  round(max_duplicate_rate * 100, 1) as max_duplicate_rate_pct
from stats;

comment on view v_seo_scaling_decision is '扩容决策：BLOCKED/HOLD/CAUTIOUS/SAFE_TO_SCALE';

-- ============================================
-- 6. 便捷函数
-- ============================================

-- 6.1 记录每日指标
create or replace function upsert_seo_daily_metrics(
  p_date date,
  p_discovered int default null,
  p_crawled int default null,
  p_indexed int default null,
  p_tier1_chunks int default null,
  p_tier1_empty_chunks int default null,
  p_tier1_total_urls int default null,
  p_duplicate_urls int default null,
  p_soft_404_urls int default null
)
returns void
language plpgsql
as $$
begin
  insert into seo_daily_metrics (
    date, discovered, crawled, indexed,
    tier1_chunks, tier1_empty_chunks, tier1_total_urls,
    duplicate_urls, soft_404_urls
  )
  values (
    p_date,
    coalesce(p_discovered, 0),
    coalesce(p_crawled, 0),
    coalesce(p_indexed, 0),
    coalesce(p_tier1_chunks, 0),
    coalesce(p_tier1_empty_chunks, 0),
    coalesce(p_tier1_total_urls, 0),
    coalesce(p_duplicate_urls, 0),
    coalesce(p_soft_404_urls, 0)
  )
  on conflict (date) do update set
    discovered = coalesce(excluded.discovered, seo_daily_metrics.discovered),
    crawled = coalesce(excluded.crawled, seo_daily_metrics.crawled),
    indexed = coalesce(excluded.indexed, seo_daily_metrics.indexed),
    tier1_chunks = coalesce(excluded.tier1_chunks, seo_daily_metrics.tier1_chunks),
    tier1_empty_chunks = coalesce(excluded.tier1_empty_chunks, seo_daily_metrics.tier1_empty_chunks),
    tier1_total_urls = coalesce(excluded.tier1_total_urls, seo_daily_metrics.tier1_total_urls),
    duplicate_urls = coalesce(excluded.duplicate_urls, seo_daily_metrics.duplicate_urls),
    soft_404_urls = coalesce(excluded.soft_404_urls, seo_daily_metrics.soft_404_urls);
end;
$$;

-- 6.2 快速检查是否可以扩容
create or replace function can_scale_seo()
returns boolean
language sql
as $$
  select decision in ('SAFE_TO_SCALE', 'CAUTIOUS')
  from v_seo_scaling_decision;
$$;

-- ============================================
-- 使用示例
-- ============================================
--
-- 1. 查看当前状态：
--    select * from v_seo_dashboard_current;
--
-- 2. 查看 14 天趋势：
--    select * from v_seo_trend_14d;
--
-- 3. 查看是否可以扩容：
--    select * from v_seo_scaling_decision;
--    select can_scale_seo();
--
-- 4. 记录每日指标：
--    select upsert_seo_daily_metrics(
--      current_date,
--      p_discovered := 5000,
--      p_crawled := 4000,
--      p_indexed := 3000
--    );
--
-- 5. 检查并生成告警：
--    select * from check_seo_alerts(current_date);
--
-- 6. 查看最近告警：
--    select * from v_seo_alerts_recent;
