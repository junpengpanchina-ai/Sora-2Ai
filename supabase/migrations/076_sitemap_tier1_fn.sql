-- 076_sitemap_tier1_fn.sql
-- 创建 Tier1 sitemap 分片查询函数（快、稳定）

create or replace function public.get_tier1_sitemap_chunk(p_limit int, p_offset int)
returns table (
  loc text,
  lastmod timestamptz
)
language sql
stable
as $$
  select
    ('https://sora2aivideos.com/use-cases/' || slug) as loc,
    coalesce(updated_at, created_at, now()) as lastmod
  from public.use_cases
  where noindex = false
    and in_sitemap = true
  order by ai_citation_score desc nulls last, updated_at desc nulls last, id
  limit p_limit offset p_offset;
$$;

create or replace function public.get_tier1_sitemap_count()
returns int
language sql
stable
as $$
  select count(*)::int
  from public.use_cases
  where noindex=false and in_sitemap=true;
$$;
