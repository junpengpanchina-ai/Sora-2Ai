-- 075_set_tier1_in_sitemap.sql
-- 根据 AI 引用分数设置 Tier1 sitemap 标记（Top 5k~20k）

-- 先重置所有 in_sitemap
update public.use_cases
set in_sitemap = false
where true;

-- 设置 Top 20k（可根据需要调整为 5k/10k）
update public.use_cases
set in_sitemap = true
where id in (
  select id
  from public.use_cases
  where noindex = false
    and tier = 1
  order by ai_citation_score desc nulls last, updated_at desc nulls last
  limit 20000
);
