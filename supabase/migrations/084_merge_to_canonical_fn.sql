-- 084_merge_to_canonical_fn.sql
-- 一键合并函数：支持软/硬阈值、dry_run 预览、回滚标记
-- merge_direct: sim>=direct_threshold → noindex, canonical, index_health_status='merge_direct'
-- merge_soft:   sim>=soft_threshold 且 <direct → noindex, canonical, index_health_status='merge_soft'

create or replace function public.merge_use_cases_to_canonical(
  p_target_slug text,
  p_soft_threshold real default 0.78,
  p_direct_threshold real default 0.85,
  p_limit int default 20000,
  p_same_type_only boolean default true,
  p_dry_run boolean default false
)
returns table(merged_direct int, merged_soft int, target_path text)
language plpgsql as $$
declare
  v_target record;
  v_target_path text;
  v_direct int := 0;
  v_soft int := 0;
begin
  select slug, title, description, use_case_type
  into v_target
  from public.use_cases
  where slug = p_target_slug
  limit 1;

  if v_target.slug is null then
    raise exception 'Target slug not found: %', p_target_slug;
  end if;

  v_target_path := '/use-cases/' || v_target.slug;

  -- 1) 主 Scene 设为主页（除非 dry_run）
  if not p_dry_run then
    update public.use_cases
    set tier = 1, in_sitemap = true, noindex = false, canonical_url = null,
        index_health_status = 'canonical', updated_at = now()
    where slug = v_target.slug;
  end if;

  -- 2) 统计 direct / soft 数量
  with candidates as (
    select
      uc.slug,
      greatest(
        similarity(coalesce(uc.title,''), coalesce(v_target.title,'')),
        similarity(coalesce(uc.description,''), coalesce(v_target.description,''))
      ) as sim
    from public.use_cases uc
    where uc.slug <> v_target.slug
      and coalesce(uc.noindex, false) = false
      and uc.canonical_url is null
      and (not p_same_type_only or coalesce(uc.use_case_type,'') = coalesce(v_target.use_case_type,''))
    order by 2 desc nulls last
    limit p_limit
  ),
  direct as (select slug from candidates where sim >= p_direct_threshold),
  soft as (select slug from candidates where sim >= p_soft_threshold and sim < p_direct_threshold)
  select (select count(*)::int from direct), (select count(*)::int from soft)
  into v_direct, v_soft;

  if p_dry_run then
    merged_direct := v_direct;
    merged_soft := v_soft;
    target_path := v_target_path;
    return next;
    return;
  end if;

  -- 3) 硬合并
  update public.use_cases uc
  set noindex = true, in_sitemap = false, canonical_url = v_target_path,
      tier = 3, index_health_status = 'merge_direct', updated_at = now()
  where uc.slug in (
    with c as (
      select uc2.slug,
        greatest(
          similarity(coalesce(uc2.title,''), coalesce(v_target.title,'')),
          similarity(coalesce(uc2.description,''), coalesce(v_target.description,''))
        ) as sim
      from public.use_cases uc2
      where uc2.slug <> v_target.slug
        and coalesce(uc2.noindex, false) = false
        and uc2.canonical_url is null
        and (not p_same_type_only or coalesce(uc2.use_case_type,'') = coalesce(v_target.use_case_type,''))
      order by 2 desc nulls last
      limit p_limit
    )
    select c.slug from c where c.sim >= p_direct_threshold
  );

  -- 4) 软合并
  update public.use_cases uc
  set noindex = true, in_sitemap = false, canonical_url = v_target_path,
      tier = 3, index_health_status = 'merge_soft', updated_at = now()
  where uc.slug in (
    with c as (
      select uc2.slug,
        greatest(
          similarity(coalesce(uc2.title,''), coalesce(v_target.title,'')),
          similarity(coalesce(uc2.description,''), coalesce(v_target.description,''))
        ) as sim
      from public.use_cases uc2
      where uc2.slug <> v_target.slug
        and coalesce(uc2.noindex, false) = false
        and uc2.canonical_url is null
        and (not p_same_type_only or coalesce(uc2.use_case_type,'') = coalesce(v_target.use_case_type,''))
      order by 2 desc nulls last
      limit p_limit
    )
    select c.slug from c where c.sim >= p_soft_threshold and c.sim < p_direct_threshold
  );

  merged_direct := v_direct;
  merged_soft := v_soft;
  target_path := v_target_path;
  return next;
end $$;

comment on function public.merge_use_cases_to_canonical is '按相似度将 use_cases 合并到主 Scene；dry_run=true 只预览不写入';
