-- 111_gsc_path_prefix_stats.sql
-- 自动统计 GSC URL 的路径前缀分布（Top 50）
-- 目的：不用猜路由，先看 GSC 那 1126 条 URL 都集中在哪些目录

-- 0) 站点前缀分布（Top 50）
with u as (
  select
    url,
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
    url,
    host,
    split_part(split_part(raw_path, '?', 1), '#', 1) as path,
    nullif(split_part(split_part(split_part(raw_path, '?', 1), '#', 1), '/', 2), '') as seg1,
    nullif(split_part(split_part(split_part(raw_path, '?', 1), '#', 1), '/', 3), '') as seg2,
    nullif(split_part(split_part(split_part(raw_path, '?', 1), '#', 1), '/', 4), '') as seg3
  from u
)
select
  seg1 as prefix,
  count(*) as cnt,
  count(*) filter (where seg2 is null) as no_slug_cnt,
  count(*) filter (where seg2 is not null) as has_slug_cnt,
  round(100.0 * count(*) / (select count(*) from p where host in ('sora2aivideos.com','www.sora2aivideos.com')), 2) as percentage
from p
where host in ('sora2aivideos.com','www.sora2aivideos.com')
group by seg1
order by cnt desc
limit 50;
