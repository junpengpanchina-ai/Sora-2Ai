-- 110_apply_gsc_tags_to_pages.sql
-- Apply seo_gsc_urls.tag -> your content tables (safe bulk ops)
-- 
-- 使用步骤：
-- 1. 先执行 111_gsc_path_prefix_stats.sql 查看路径前缀分布
-- 2. 根据统计结果，确认需要启用的路径类型
-- 3. 取消注释对应的更新块（blog/templates/scenes/country 等）
-- 4. 确认表名和字段名匹配后执行

begin;

-- 1) 标准化解析：host/path/seg1/seg2/seg3
with gsc as (
  select
    id,
    url,
    tag,
    tag_reason,
    reason,
    http_status,
    word_count,
    lower(split_part(replace(replace(url,'https://',''),'http://',''), '/', 1)) as host,
    '/' || split_part(replace(replace(url,'https://',''),'http://',''), '/', 2)
      || case
        when position('/' in replace(replace(url,'https://',''),'http://','')) = 0 then ''
        else substring(replace(replace(url,'https://',''),'http://','') from position('/' in replace(replace(url,'https://',''),'http://','')))
      end as raw_path
  from seo_gsc_urls
),
p as (
  select
    *,
    split_part(split_part(raw_path, '?', 1), '#', 1) as path,
    nullif(split_part(split_part(split_part(raw_path, '?', 1), '#', 1), '/', 2), '') as seg1,
    nullif(split_part(split_part(split_part(raw_path, '?', 1), '#', 1), '/', 3), '') as seg2,
    nullif(split_part(split_part(split_part(raw_path, '?', 1), '#', 1), '/', 4), '') as seg3
  from gsc
  where host in ('sora2aivideos.com','www.sora2aivideos.com')
),

-- 2) 统一做一层"path_type + slug"映射（兼容 Next.js 常见结构）
-- 规则：
--  - /use-cases/{slug}              => type=use_cases, slug=seg2
--  - /blog/{slug}                   => type=blog, slug=seg2
--  - /templates/{slug}              => type=templates, slug=seg2
--  - /scenes/{slug}                 => type=scenes, slug=seg2
--  - /keywords/{slug}               => type=keywords, slug=seg2
--  - /industries/{slug}             => type=industries, slug=seg2
--  - /compare/{slug}                 => type=compare, slug=seg2
--  - /country/{cc}/{slug}           => type=country, country=seg2, slug=seg3
--  - /{cc}/{slug} (可选：语言前缀)   => type=locale_2seg, cc=seg1, slug=seg2（默认先不启用，避免误判）
mapped as (
  select
    *,
    case
      when seg1 in ('use-cases','usecases','use_case') then 'use_cases'
      when seg1 in ('blog','posts','articles') then 'blog'
      when seg1 in ('templates','template') then 'templates'
      when seg1 in ('scenes','scene') then 'scenes'
      when seg1 in ('keywords','keyword') then 'keywords'
      when seg1 in ('industries','industry') then 'industries'
      when seg1 in ('compare') then 'compare'
      when seg1 in ('country','countries') then 'country'
      else 'unknown'
    end as path_type,
    case
      when seg1 in ('country','countries') then lower(seg3)
      else lower(seg2)
    end as slug,
    case
      when seg1 in ('country','countries') then lower(seg2)
      else null
    end as country_code
  from p
)

-- 3) ✅ Apply to use_cases: /use-cases/{slug}
, uc as (
  select distinct slug, tag
  from mapped
  where path_type='use_cases' and slug is not null
)
update use_cases u
set
  noindex = true,
  in_sitemap = false,
  index_health_status = 'deleted',
  updated_at = now()
from uc
where lower(u.slug)=uc.slug and uc.tag='delete';

with uc as (
  select distinct slug, tag
  from mapped
  where path_type='use_cases' and slug is not null
)
update use_cases u
set
  index_health_status = 'needs_enhancement',
  updated_at = now()
from uc
where lower(u.slug)=uc.slug and uc.tag='enhance'
  and coalesce(u.index_health_status,'') <> 'deleted';

with uc as (
  select distinct slug, tag
  from mapped
  where path_type='use_cases' and slug is not null
)
update use_cases u
set
  index_health_status = 'keep_monitoring',
  updated_at = now()
from uc
where lower(u.slug)=uc.slug and uc.tag='keep'
  and coalesce(u.index_health_status,'') not in ('deleted','needs_enhancement');

-- 4) ✅ 可选：Apply to blog_posts
--    路径 /blog/{slug}
--    表名：blog_posts，字段：slug
--    （默认注释掉，避免误更新）
--    注意：blog_posts 表可能没有 noindex/in_sitemap/index_health_status 字段
--    如果表结构不同，需要根据实际字段调整
/*
with b as (
  select distinct slug, tag
  from mapped
  where path_type='blog' and slug is not null
)
update blog_posts p
set
  is_published = (b.tag<>'delete'),  -- 删除：取消发布
  updated_at = now()
from b
where lower(p.slug)=b.slug;
-- 如果 blog_posts 表有 noindex/in_sitemap/index_health_status 字段，可以这样：
-- set
--   noindex = (b.tag='delete'),
--   in_sitemap = (b.tag<>'delete'),
--   index_health_status = case
--     when b.tag='delete' then 'deleted'
--     when b.tag='enhance' then 'needs_enhancement'
--     else 'keep_monitoring'
--   end,
--   updated_at = now()
*/

-- 5) ✅ 可选：keywords / long_tail_keywords
--    路径 /keywords/{slug}
--    注意：long_tail_keywords 表的字段是 page_slug（不是 slug）
--    且 page_slug 可能包含 'keywords-' 前缀，需要处理
/*
with k as (
  select distinct slug, tag
  from mapped
  where path_type='keywords' and slug is not null
)
update long_tail_keywords k2
set
  status = case
    when k.tag='delete' then 'draft'  -- 删除：改为 draft
    else k2.status  -- 其他情况保持原状态
  end,
  updated_at = now()
from k
where (
  -- 匹配方式1：page_slug 直接等于 slug（如果 page_slug 没有 keywords- 前缀）
  lower(k2.page_slug) = k.slug
  -- 匹配方式2：page_slug 等于 'keywords-' + slug（如果 page_slug 有 keywords- 前缀）
  OR lower(k2.page_slug) = 'keywords-' || k.slug
  -- 匹配方式3：page_slug 去掉 'keywords-' 前缀后等于 slug
  OR lower(replace(k2.page_slug, 'keywords-', '')) = k.slug
)
and k.tag='delete';
-- 注意：long_tail_keywords 表可能没有 noindex/in_sitemap/index_health_status 字段
-- 如果表结构不同，需要根据实际字段调整
*/

-- 6) ✅ 可选：industries
--    假设路径 /industries/{slug}
/*
with i as (
  select distinct slug, tag
  from mapped
  where path_type='industries' and slug is not null
)
update industries ind
set
  noindex = (i.tag='delete'),
  in_sitemap = (i.tag<>'delete'),
  index_health_status = case
    when i.tag='delete' then 'deleted'
    when i.tag='enhance' then 'needs_enhancement'
    else 'keep_monitoring'
  end,
  updated_at = now()
from i
where lower(ind.slug)=i.slug;
*/

-- 7) ✅ 可选：compare pages
--    假设路径 /compare/{slug}
/*
with comp as (
  select distinct slug, tag
  from mapped
  where path_type='compare' and slug is not null
)
update compare_pages cp
set
  noindex = (comp.tag='delete'),
  in_sitemap = (comp.tag<>'delete'),
  index_health_status = case
    when comp.tag='delete' then 'deleted'
    when comp.tag='enhance' then 'needs_enhancement'
    else 'keep_monitoring'
  end,
  updated_at = now()
from comp
where lower(cp.slug)=comp.slug;
*/

-- 8) ✅ 可选：country pages（两级：/country/{cc}/{slug} 或 /{cc}/{slug}）
--    这里演示 /country/{cc}/{slug}：path_type=country, slug_l1=cc, slug_l2=slug
/*
with c as (
  select distinct country_code, slug, tag
  from mapped
  where path_type='country' and country_code is not null and slug is not null
)
update country_pages cp
set
  noindex = (c.tag='delete'),
  in_sitemap = (c.tag<>'delete'),
  index_health_status = case
    when c.tag='delete' then 'deleted'
    when c.tag='enhance' then 'needs_enhancement'
    else 'keep_monitoring'
  end,
  updated_at = now()
from c
where lower(cp.country_code)=c.country_code
  and lower(cp.slug)=c.slug;
*/

commit;

-- ✅ 9) 事后校验：看 use_cases 被标记了多少
-- （按需执行）
-- select index_health_status, count(*) from use_cases group by 1 order by 2 desc;
