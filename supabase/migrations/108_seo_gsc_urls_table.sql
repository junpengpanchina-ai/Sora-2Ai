-- 108_seo_gsc_urls_table.sql
-- GSC 未收录 URL 分类表
-- 用于存储从 Google Search Console 导出的未编入索引 URL，并自动打标签（delete/keep/enhance）

create table if not exists seo_gsc_urls (
  id bigserial primary key,
  url text not null unique,
  reason text,
  source text default 'gsc_export',
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  http_status int,
  canonical_url text,
  content_length int,
  word_count int,
  in_sitemap boolean,
  has_query_params boolean,
  tag text check (tag in ('delete','keep','enhance')) default null,
  tag_reason text,
  notes text
);

create index if not exists idx_seo_gsc_urls_tag on seo_gsc_urls(tag);
create index if not exists idx_seo_gsc_urls_reason on seo_gsc_urls(reason);
create index if not exists idx_seo_gsc_urls_url on seo_gsc_urls(url);
create index if not exists idx_seo_gsc_urls_http_status on seo_gsc_urls(http_status);

comment on table seo_gsc_urls is 'GSC 未收录 URL 分类表，用于自动打标签和处理';
comment on column seo_gsc_urls.url is '完整的 URL（从 GSC 导出）';
comment on column seo_gsc_urls.reason is 'GSC 报告的未编入索引原因';
comment on column seo_gsc_urls.tag is '自动标签：delete（该删）、keep（该留）、enhance（该增强）';
comment on column seo_gsc_urls.tag_reason is '标签原因说明';
comment on column seo_gsc_urls.http_status is 'HTTP 状态码（通过脚本抓取）';
comment on column seo_gsc_urls.canonical_url is '页面 canonical URL（通过脚本抓取）';
comment on column seo_gsc_urls.word_count is '页面字数（通过脚本抓取）';
