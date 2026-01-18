-- 078_find_similar_use_cases_trgm.sql
-- 找出“可以合并到某个主 Scene”的相似 use_cases（可直接执行）
--
-- ✅ 贴合你库里的字段名：
-- use_cases.slug / title / description / content / use_case_type / seo_keywords
-- use_cases.tier / noindex / in_sitemap / canonical_url / ai_citation_score
--
-- 使用 pg_trgm 的 similarity 做粗粒度相似检索（不需要 embedding）。
-- 如果提示 pg_trgm 不存在：在 Supabase Dashboard → Database → Extensions 启用 pg_trgm。

create extension if not exists pg_trgm;

-- 🔧 改这里：主 Scene 的 slug（你给的标准样本）
with target as (
  select
    id,
    slug,
    title,
    description,
    content,
    use_case_type,
    seo_keywords
  from public.use_cases
  where slug = 'social-media-management-5b41dfd8a3-in-client-onboarding-ai-videos-are-used-for-welcoming-new-partner'
  limit 1
),
norm as (
  select
    (select slug from target) as target_slug,
    -- 归一化文本：小写 + 去掉非字母数字
    (select regexp_replace(lower(coalesce(title, '')), '[^a-z0-9]+', ' ', 'g') from target) as t_title,
    (select regexp_replace(lower(coalesce(description, '')), '[^a-z0-9]+', ' ', 'g') from target) as t_desc,
    (select use_case_type from target) as t_type,
    (select seo_keywords from target) as t_keywords
),
candidates as (
  select
    u.id,
    u.slug,
    u.title,
    u.use_case_type,
    u.tier,
    u.noindex,
    u.in_sitemap,
    u.canonical_url,
    u.ai_citation_score,
    similarity(
      regexp_replace(lower(coalesce(u.title, '')), '[^a-z0-9]+', ' ', 'g'),
      n.t_title
    ) as title_sim,
    similarity(
      regexp_replace(lower(coalesce(u.description, '')), '[^a-z0-9]+', ' ', 'g'),
      n.t_desc
    ) as desc_sim,
    coalesce((
      select count(*) from (
        select lower(x) as kw from unnest(coalesce(u.seo_keywords, array[]::text[])) x
        intersect
        select lower(y) as kw from unnest(coalesce(n.t_keywords, array[]::text[])) y
      ) z
    ), 0) as kw_overlap
  from public.use_cases u
  cross join norm n
  where u.slug <> n.target_slug
    and u.is_published = true
    and coalesce(u.noindex, false) = false
    and coalesce(u.use_case_type, '') = coalesce(n.t_type, '')
)
select
  *,
  case
    when greatest(title_sim, desc_sim) >= 0.85 then 'merge_direct'
    when greatest(title_sim, desc_sim) >= 0.78 then 'merge_soft'
    when greatest(title_sim, desc_sim) >= 0.70 then 'merge_as_faq'
    else 'keep'
  end as merge_recommendation
from candidates
where
  title_sim >= 0.65
  or desc_sim >= 0.70
  or (title_sim >= 0.55 and kw_overlap >= 2)
order by
  greatest(title_sim, desc_sim) desc,
  ai_citation_score desc nulls last,
  id;

