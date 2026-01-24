-- 109_auto_label_gsc_urls.sql
-- 自动标签 SQL：基于 reason + URL 形态打第一版标签（不依赖抓取）

-- 第一步：标记 URL 特征
update seo_gsc_urls
set
  has_query_params = position('?' in url) > 0,
  last_seen_at = now()
where has_query_params is null;

-- 第二步：基于 reason + URL 形态打标签（第一版，能覆盖 70% 决策）
update seo_gsc_urls
set
  tag = case
    -- 该删：参数页/明显非内容页/软404一类 + query 参数
    when position('?' in url) > 0 then 'delete'
    when lower(reason) like '%soft 404%' then 'delete'
    when lower(reason) like '%not found%' then 'delete'
    when lower(reason) like '%404%' then 'delete'
    when lower(reason) like '%blocked%' then 'delete'
    when lower(reason) like '%robots%' then 'delete'
    
    -- 该增强：重复/规范化/被选了其他canonical
    when lower(reason) like '%duplicate%' then 'enhance'
    when lower(reason) like '%canonical%' then 'enhance'
    when lower(reason) like '%alternate page%' then 'enhance'
    when lower(reason) like '%alternative page%' then 'enhance'
    
    -- 该留：发现/抓取但未编入（正常流程）
    when lower(reason) like '%discovered%' then 'keep'
    when lower(reason) like '%crawled%' then 'keep'
    when lower(reason) like '%found%' then 'keep'
    
    -- 默认：增强（保守策略）
    else 'enhance'
  end,
  tag_reason = case
    when position('?' in url) > 0 then 'has_query_params'
    when lower(reason) like '%soft 404%' then 'soft_404'
    when lower(reason) like '%not found%' then 'not_found'
    when lower(reason) like '%404%' then 'http_404'
    when lower(reason) like '%blocked%' then 'blocked_by_robots'
    when lower(reason) like '%robots%' then 'blocked_by_robots'
    when lower(reason) like '%duplicate%' then 'duplicate_or_canonical'
    when lower(reason) like '%canonical%' then 'duplicate_or_canonical'
    when lower(reason) like '%alternate page%' then 'duplicate_or_canonical'
    when lower(reason) like '%alternative page%' then 'duplicate_or_canonical'
    when lower(reason) like '%discovered%' then 'discovered_not_indexed'
    when lower(reason) like '%crawled%' then 'crawled_not_indexed'
    when lower(reason) like '%found%' then 'found_not_indexed'
    else 'default_enhance'
  end,
  last_seen_at = now()
where tag is null;

-- 第三步：基于 HTTP 状态码纠偏（如果有数据）
update seo_gsc_urls
set
  tag = case
    when http_status = 404 or http_status = 410 then 'delete'
    when http_status >= 500 then 'keep'  -- 服务器错误，可能是临时问题
    else tag  -- 保持原标签
  end,
  tag_reason = case
    when http_status = 404 then 'http_404'
    when http_status = 410 then 'http_410'
    when http_status >= 500 then 'server_error_retry'
    else tag_reason
  end,
  last_seen_at = now()
where http_status is not null
  and (
    (http_status in (404, 410) and tag != 'delete')
    or (http_status >= 500 and tag != 'keep')
  );

-- 第四步：基于内容长度纠偏（如果有数据）
update seo_gsc_urls
set
  tag = case
    when word_count is not null and word_count < 120 then 'delete'
    when word_count is not null and word_count < 250 then 'enhance'
    else tag
  end,
  tag_reason = case
    when word_count is not null and word_count < 120 then 'too_thin'
    when word_count is not null and word_count < 250 then 'thin_need_enhance'
    else tag_reason
  end,
  last_seen_at = now()
where word_count is not null
  and http_status = 200
  and (
    (word_count < 120 and tag != 'delete')
    or (word_count < 250 and word_count >= 120 and tag != 'enhance')
  );

-- 第五步：基于 canonical 纠偏（如果有数据）
update seo_gsc_urls
set
  tag = 'enhance',
  tag_reason = 'canonical_points_elsewhere',
  last_seen_at = now()
where canonical_url is not null
  and canonical_url != ''
  and canonical_url != url
  and tag != 'enhance';

-- 统计标签分布
select 
  tag,
  count(*) as count,
  round(100.0 * count(*) / (select count(*) from seo_gsc_urls), 2) as percentage
from seo_gsc_urls
group by tag
order by count desc;
