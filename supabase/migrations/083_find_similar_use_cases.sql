-- 083_find_similar_use_cases.sql
-- 用法：把 'TARGET_SLUG' 替换为你的主 Scene slug，用于审核/抽样

with target as (
  select
    slug as target_slug,
    title as target_title,
    description as target_desc,
    use_case_type as target_type
  from public.use_cases
  where slug = 'TARGET_SLUG'
  limit 1
)
select
  uc.id,
  uc.slug,
  uc.title,
  uc.use_case_type,
  similarity(uc.title, t.target_title) as title_sim,
  similarity(coalesce(uc.description,''), coalesce(t.target_desc,'')) as desc_sim,
  greatest(
    similarity(uc.title, t.target_title),
    similarity(coalesce(uc.description,''), coalesce(t.target_desc,''))
  ) as sim,
  case
    when greatest(
      similarity(uc.title, t.target_title),
      similarity(coalesce(uc.description,''), coalesce(t.target_desc,''))
    ) >= 0.85 then 'merge_direct'
    when greatest(
      similarity(uc.title, t.target_title),
      similarity(coalesce(uc.description,''), coalesce(t.target_desc,''))
    ) >= 0.78 then 'merge_soft'
    when greatest(
      similarity(uc.title, t.target_title),
      similarity(coalesce(uc.description,''), coalesce(t.target_desc,''))
    ) >= 0.70 then 'merge_as_faq'
    else 'keep'
  end as recommendation
from public.use_cases uc
cross join target t
where uc.slug <> t.target_slug
  and coalesce(uc.noindex, false) = false
  and uc.canonical_url is null
  and coalesce(uc.use_case_type, '') = coalesce(t.target_type, '')
order by sim desc
limit 500;
