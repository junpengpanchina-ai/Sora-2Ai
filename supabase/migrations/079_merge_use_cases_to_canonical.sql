-- 079_merge_use_cases_to_canonical.sql
-- 将相似 use_cases 合并到一个“主 Scene”：被合并页 noindex + 301/canonical + 出 sitemap
--
-- ✅ 依赖字段（你库里都有）：
-- use_cases.noindex / in_sitemap / canonical_url / tier / ai_citation_score
--
-- ✅ 配合代码侧：
-- `app/use-cases/[slug]/page.tsx` 已支持：
-- - noindex → robots.index=false
-- - canonical_url → metadata canonical
-- - canonical_url 且与当前不同 → redirect 到 canonical_url

create extension if not exists pg_trgm;

do $$
declare
  v_target_slug text := 'social-media-management-5b41dfd8a3-in-client-onboarding-ai-videos-are-used-for-welcoming-new-partner';
  v_target_path text := '/use-cases/' || v_target_slug;
  v_direct_threshold real := 0.85;
  v_soft_threshold real := 0.78;
  v_direct_count int := 0;
  v_soft_count int := 0;
begin
  -- 1) 确保主 Scene 为 Tier1 + 进 sitemap + 可索引
  update public.use_cases
  set
    tier = 1,
    in_sitemap = true,
    noindex = false,
    canonical_url = null
  where slug = v_target_slug;

  -- 2) merge_direct：noindex + 出 sitemap + canonical 指向主 Scene
  -- 注意：WITH 的作用域只在单条语句内，所以 direct/soft 需要分别写在各自的 UPDATE 里
  with target as (
    select
      slug,
      use_case_type,
      regexp_replace(lower(coalesce(title, '')), '[^a-z0-9]+', ' ', 'g') as t_title,
      regexp_replace(lower(coalesce(description, '')), '[^a-z0-9]+', ' ', 'g') as t_desc
    from public.use_cases
    where slug = v_target_slug
    limit 1
  ),
  scored as (
    select
      u.id,
      greatest(
        similarity(regexp_replace(lower(coalesce(u.title, '')), '[^a-z0-9]+', ' ', 'g'), t.t_title),
        similarity(regexp_replace(lower(coalesce(u.description, '')), '[^a-z0-9]+', ' ', 'g'), t.t_desc)
      ) as sim
    from public.use_cases u
    join target t on true
    where u.slug <> t.slug
      and u.is_published = true
      and coalesce(u.noindex, false) = false
      and coalesce(u.use_case_type, '') = coalesce(t.use_case_type, '')
  ),
  direct as (
    select id from scored where sim >= v_direct_threshold
  )
  update public.use_cases u
  set
    noindex = true,
    in_sitemap = false,
    canonical_url = v_target_path,
    tier = 3,
    index_health_status = 'merged'
  where u.id in (select id from direct);

  get diagnostics v_direct_count = row_count;
  raise notice '✅ merge_direct: % rows updated', v_direct_count;

  -- 3) merge_soft：同样 noindex + canonical（你也可以选择只 soft 做 canonical 不 redirect）
  with target as (
    select
      slug,
      use_case_type,
      regexp_replace(lower(coalesce(title, '')), '[^a-z0-9]+', ' ', 'g') as t_title,
      regexp_replace(lower(coalesce(description, '')), '[^a-z0-9]+', ' ', 'g') as t_desc
    from public.use_cases
    where slug = v_target_slug
    limit 1
  ),
  scored as (
    select
      u.id,
      greatest(
        similarity(regexp_replace(lower(coalesce(u.title, '')), '[^a-z0-9]+', ' ', 'g'), t.t_title),
        similarity(regexp_replace(lower(coalesce(u.description, '')), '[^a-z0-9]+', ' ', 'g'), t.t_desc)
      ) as sim
    from public.use_cases u
    join target t on true
    where u.slug <> t.slug
      and u.is_published = true
      and coalesce(u.noindex, false) = false
      and coalesce(u.use_case_type, '') = coalesce(t.use_case_type, '')
  ),
  soft as (
    select id from scored where sim >= v_soft_threshold and sim < v_direct_threshold
  )
  update public.use_cases u
  set
    noindex = true,
    in_sitemap = false,
    canonical_url = v_target_path,
    tier = 3,
    index_health_status = 'merged'
  where u.id in (select id from soft);

  get diagnostics v_soft_count = row_count;
  raise notice '✅ merge_soft: % rows updated', v_soft_count;

  raise notice '✅ done. target=%', v_target_path;
end $$;

