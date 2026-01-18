-- 086_sitemap_tier1_fn.sql
-- Tier1 sitemap 最终版：分片 + lastmod
-- 条件：noindex=false AND in_sitemap=true；排序：updated_at desc, slug
-- 076 已定义 get_tier1_sitemap_count 为 int，此处改为 bigint，需先 drop 再建。

drop function if exists public.get_tier1_sitemap_count();

create or replace function public.get_tier1_sitemap_count()
returns bigint language sql stable as $$
  select count(*)::bigint
  from public.use_cases
  where coalesce(noindex, false) = false
    and in_sitemap = true;
$$;

create or replace function public.get_tier1_sitemap_chunk(p_limit int, p_offset int)
returns table(loc text, lastmod timestamptz)
language sql stable as $$
  select
    ('https://sora2aivideos.com/use-cases/' || slug) as loc,
    coalesce(updated_at, created_at, now()) as lastmod
  from public.use_cases
  where coalesce(noindex, false) = false
    and in_sitemap = true
  order by updated_at desc nulls last, slug asc
  limit p_limit offset p_offset;
$$;
