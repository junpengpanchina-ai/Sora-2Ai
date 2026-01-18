-- 085_rollback_merge.sql
-- 回滚某个主 Scene 的合并：把 canonical 指向该主的行恢复，主 Scene 保持 tier1
-- 使用：把下面两处 'TARGET_SLUG' 换成实际主 Scene 的 slug

do $$
declare
  v_slug text := 'TARGET_SLUG';  -- 改成你的主 Scene slug
  v_path text;
  v_n int;
begin
  v_path := '/use-cases/' || v_slug;

  -- 被合并页：清除 canonical、noindex、in_sitemap，tier 回 2
  update public.use_cases
  set noindex = false, in_sitemap = false, canonical_url = null,
      tier = 2, index_health_status = 'rollback', updated_at = now()
  where canonical_url = v_path;

  get diagnostics v_n = row_count;
  raise notice 'rollback merged: % rows', v_n;

  -- 主 Scene：保持 tier1
  update public.use_cases
  set tier = 1, in_sitemap = true, noindex = false, canonical_url = null,
      index_health_status = 'canonical', updated_at = now()
  where slug = v_slug;

  raise notice 'canonical kept: slug=%', v_slug;
end $$;
