-- 112_sitemap_health_check.sql
-- Sitemap 健康检查基础设施
-- 目标：防止"合法但为空"的 sitemap 再次发生

-- ============================================
-- 1. Sitemap 元数据表
-- ============================================
create table if not exists sitemap_chunks (
  name text primary key,              -- tier1-0, tier1-1, tier2-0, core ...
  tier int not null,                  -- 1 = Tier1, 2 = Tier2, 0 = Core
  url_count int not null default 0,
  data_source text not null,          -- 'rpc' / 'table' / 'static'
  last_checked_at timestamptz,
  updated_at timestamptz default now(),
  
  constraint valid_tier check (tier in (0, 1, 2))
);

comment on table sitemap_chunks is 'Sitemap chunk 元数据，用于健康检查';
comment on column sitemap_chunks.tier is '0=Core, 1=Tier1(高价值), 2=Tier2(扩容)';
comment on column sitemap_chunks.data_source is 'rpc=RPC函数, table=直接查表, static=静态';

-- ============================================
-- 2. 强约束：Tier1-0 永远不能为空
-- ============================================
-- 这是防止 2026-01-24 事故重演的核心保护
alter table sitemap_chunks
drop constraint if exists tier1_0_not_empty;

alter table sitemap_chunks
add constraint tier1_0_not_empty
check (
  not (tier = 1 and name = 'tier1-0' and url_count = 0)
);

comment on constraint tier1_0_not_empty on sitemap_chunks is 
  '防止 tier1-0 被写入 0 URL（2026-01-24 事故教训）';

-- ============================================
-- 3. 健康检查函数
-- ============================================
create or replace function check_sitemap_health()
returns table (
  chunk_name text,
  tier int,
  url_count int,
  status text,
  message text
)
language plpgsql
as $$
begin
  return query
  select
    sc.name as chunk_name,
    sc.tier,
    sc.url_count,
    case
      when sc.tier = 1 and sc.url_count = 0 then 'CRITICAL'
      when sc.tier = 0 and sc.url_count = 0 then 'ERROR'
      when sc.tier = 2 and sc.url_count = 0 then 'WARNING'
      when sc.url_count < 100 and sc.tier = 1 then 'WARNING'
      else 'OK'
    end as status,
    case
      when sc.tier = 1 and sc.url_count = 0 then '🚨 FATAL: Tier1 chunk 为空，Google 无法发现 URL'
      when sc.tier = 0 and sc.url_count = 0 then '❌ Core sitemap 为空，架构异常'
      when sc.tier = 2 and sc.url_count = 0 then '⚠️ Tier2 chunk 为空（可接受但需关注）'
      when sc.url_count < 100 and sc.tier = 1 then '⚠️ Tier1 URL 数量过少'
      else '✅ 正常'
    end as message
  from sitemap_chunks sc
  order by 
    case 
      when sc.tier = 1 and sc.url_count = 0 then 1
      when sc.tier = 0 and sc.url_count = 0 then 2
      when sc.tier = 2 and sc.url_count = 0 then 3
      else 4
    end,
    sc.tier,
    sc.name;
end;
$$;

comment on function check_sitemap_health() is '返回所有 sitemap chunk 的健康状态';

-- ============================================
-- 4. 快速检查：是否有 CRITICAL 问题
-- ============================================
create or replace function has_sitemap_critical_issues()
returns boolean
language sql
as $$
  select exists (
    select 1 from sitemap_chunks
    where tier = 1 and url_count = 0
  );
$$;

comment on function has_sitemap_critical_issues() is '快速检查是否有 Tier1 空 chunk（用于 CI/CD 阻断）';

-- ============================================
-- 5. 更新 chunk 元数据的函数
-- ============================================
create or replace function upsert_sitemap_chunk(
  p_name text,
  p_tier int,
  p_url_count int,
  p_data_source text default 'rpc'
)
returns void
language plpgsql
as $$
begin
  insert into sitemap_chunks (name, tier, url_count, data_source, last_checked_at, updated_at)
  values (p_name, p_tier, p_url_count, p_data_source, now(), now())
  on conflict (name) do update set
    url_count = excluded.url_count,
    data_source = excluded.data_source,
    last_checked_at = now(),
    updated_at = now();
end;
$$;

-- ============================================
-- 6. 初始化当前 chunk 数据
-- ============================================
-- 基于 2026-01-24 验证结果
select upsert_sitemap_chunk('tier1-0', 1, 1000, 'rpc');
select upsert_sitemap_chunk('core', 0, 276, 'static');

-- ============================================
-- 7. 定期健康检查视图
-- ============================================
create or replace view v_sitemap_health as
select * from check_sitemap_health();

comment on view v_sitemap_health is '当前 sitemap 健康状态（直接 select * from v_sitemap_health）';

-- ============================================
-- 使用示例
-- ============================================
-- 
-- 1. 查看所有 chunk 健康状态：
--    select * from v_sitemap_health;
--
-- 2. 检查是否有 CRITICAL 问题（用于 CI/CD）：
--    select has_sitemap_critical_issues();
--
-- 3. 更新 chunk 元数据：
--    select upsert_sitemap_chunk('tier1-0', 1, 1000, 'rpc');
--
-- 4. 直接查看空 chunk：
--    select * from sitemap_chunks where url_count = 0;
