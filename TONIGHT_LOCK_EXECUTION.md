# 今晚关灯前可执行版本

> 照顺序跑即可。默认：`use_cases` 含 `slug, title, description, seo_keywords, use_case_type, tier, in_sitemap, noindex, canonical_url, updated_at, index_health_status`；站内路径 `/use-cases/${slug}`；`canonical_url` 存 `/use-cases/<slug>`。

---

## A) 301/308 映射（canonical → redirect，可选启用）

### A1. 建表 `redirect_map`

```sql
-- 080_redirect_map.sql
create table if not exists public.redirect_map (
  id         bigserial primary key,
  from_path  text not null unique,
  to_path    text not null,
  code       int  not null default 308,
  reason     text not null default 'merge',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists redirect_map_to_path_idx on public.redirect_map(to_path);
create index if not exists redirect_map_from_path_idx on public.redirect_map(from_path);

create or replace function public.tg_redirect_map_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists redirect_map_set_updated_at on public.redirect_map;
create trigger redirect_map_set_updated_at
  before update on public.redirect_map
  for each row execute procedure public.tg_redirect_map_updated_at();
```

或直接跑：`supabase/migrations/080_redirect_map.sql`。

---

### A2. 从 `use_cases.canonical_url` 生成映射（只给「硬合并」用）

规则：只把 `noindex=true` 且 `canonical_url` 非空 且 `index_health_status='merge_direct'` 的页面加入映射。  
若希望软合并也 308，可删掉 081 里对 `index_health_status` 的过滤。

```sql
-- 081_build_redirect_map_from_canonical.sql（在 084 合并跑完后执行）
```

或直接跑：`supabase/migrations/081_build_redirect_map_from_canonical.sql`。

---

### A3. 回滚（删除本次合并生成的映射）

```sql
-- 087_rollback_redirect_map.sql
delete from public.redirect_map
where reason in ('merge_direct','merged','merge','merge_soft');
```

或直接跑：`supabase/migrations/087_rollback_redirect_map.sql`。

---

## B) 批量合并（分级：软/硬 + 回滚）

### B1. 前置：pg_trgm + GIN 索引

```sql
-- 082_merge_prereq.sql
create extension if not exists pg_trgm;
create index if not exists use_cases_title_trgm_idx
  on public.use_cases using gin (title gin_trgm_ops);
create index if not exists use_cases_description_trgm_idx
  on public.use_cases using gin (description gin_trgm_ops);
```

或直接跑：`supabase/migrations/082_merge_prereq.sql`。

---

### B2. 找相似 use_cases（审核/抽样）

把 `TARGET_SLUG` 换成主 Scene 的 slug 后执行。完整 SQL 见：`supabase/migrations/083_find_similar_use_cases.sql`。

---

### B3. 一键合并函数（软/硬阈值、dry_run、回滚标记）

- **merge_direct（硬）**：sim ≥ direct_threshold → `noindex=true, in_sitemap=false, canonical_url=target, tier=3, index_health_status='merge_direct'`
- **merge_soft（软）**：sim ≥ soft 且 < direct → `index_health_status='merge_soft'`，其它同左
- **主 Scene**：`tier=1, in_sitemap=true, noindex=false, canonical_url=null, index_health_status='canonical'`

```sql
-- 084_merge_to_canonical_fn.sql
```

或直接跑：`supabase/migrations/084_merge_to_canonical_fn.sql`。

**先 dry_run 预览：**

```sql
select * from public.merge_use_cases_to_canonical(
  'TARGET_SLUG',
  0.78, 0.85, 20000, true, true
);
```

**确认后正式执行：**

```sql
select * from public.merge_use_cases_to_canonical(
  'TARGET_SLUG',
  0.78, 0.85, 20000, true, false
);
```

---

### B4. 回滚（只回滚某个 canonical 的合并）

把 `TARGET_SLUG` 换成主 Scene 的 slug：

```sql
-- 085_rollback_merge.sql（内有两处 TARGET_SLUG 需替换，或使用 do $$ 中的 v_slug）
```

或直接跑：`supabase/migrations/085_rollback_merge.sql`（修改其中的 `TARGET_SLUG` / `v_slug`）。

---

## C) Tier1 sitemap 最终版（分片 + lastmod）

规则：只输出 `noindex=false` 且 `in_sitemap=true`；`lastmod` 用 `updated_at`（无则 `created_at` / `now()`）。

### C1. 数据库函数

```sql
-- 086_sitemap_tier1_fn.sql
-- get_tier1_sitemap_count()、get_tier1_sitemap_chunk(p_limit, p_offset)
```

或直接跑：`supabase/migrations/086_sitemap_tier1_fn.sql`。

---

### C2. Next.js

- **Sitemap 索引**：`app/sitemap.xml/route.ts`  
  - 分片 URL：`/sitemaps/tier1-0.xml`, `/sitemaps/tier1-1.xml`, …
- **分片**：`app/sitemaps/[name]/route.ts`  
  - 仅处理 `tier1-{N}.xml`，`get_tier1_sitemap_chunk` + `lastmod`。

---

## D) 软合并 / 硬合并 开关策略

- **软合并（0.78–0.85）**：只写 `canonical_url` + `noindex`，**不写 `redirect_map`** → 不 308/301，仅 canonical。
- **硬合并（≥0.85）**：写 `canonical_url` + `noindex`，并写入 `redirect_map`（通过 081）→ middleware 对 `from_path` 做 308。

**实现**：`middleware.ts` 对 `/use-cases/*` 查 `redirect_map`，有则 308，无则放行。  
不写 `redirect_map` = 只 canonical、不跳转；写 `redirect_map` = 跳转。

---

## E) 今晚执行顺序（最短路径）

1. **080**：建 `redirect_map`
2. **082**：pg_trgm + GIN
3. **086**：sitemap 函数
4. **084**：合并函数
5. 对选好的主 Scene（先 50 个）：
   - `merge_use_cases_to_canonical(..., dry_run := true)` 看 `merged_direct` / `merged_soft`
   - OK 再 `dry_run := false`
6. **081**：从 `use_cases` 生成 `redirect_map`（只硬合并；若只要软合并不跳，可**不做** 081）
7. 部署：sitemap 路由 + middleware（`sitemap.xml`、`sitemaps/[name]`、`middleware`）
8. （可选）若今晚不想开 308：可明天再启用 middleware 的 redirect_map 逻辑（已接好）。

---

## F) 成功验收

- `get_tier1_sitemap_count()` 落在 **5k–20k**（或你目标区间）
- `use_cases`：
  - **主 Scene**：`tier=1`, `in_sitemap=true`, `noindex=false`, `canonical_url=null`
  - **被合并**：`noindex=true`, `in_sitemap=false`, `canonical_url='/use-cases/<canonical>'`
- `/sitemap.xml` 可打开
- 至少一个分片可打开：`/sitemaps/tier1-0.xml`
- 需要 308 的旧址：在 `redirect_map` 有 `from_path`，访问会 308 到 `to_path`

---

## 文件一览

| 文件 | 作用 |
|------|------|
| `080_redirect_map.sql` | 建 `redirect_map` 表 |
| `081_build_redirect_map_from_canonical.sql` | 从 `use_cases` 生成 308 映射（仅 `merge_direct`） |
| `082_merge_prereq.sql` | pg_trgm + GIN |
| `083_find_similar_use_cases.sql` | 找相似候选（换 TARGET_SLUG） |
| `084_merge_to_canonical_fn.sql` | 合并函数（软/硬 + dry_run） |
| `085_rollback_merge.sql` | 回滚某主 Scene 的合并（换 TARGET_SLUG） |
| `086_sitemap_tier1_fn.sql` | Tier1 sitemap count + chunk（lastmod） |
| `087_rollback_redirect_map.sql` | 回滚 redirect_map（删 merge 相关 reason） |
| `app/sitemap.xml/route.ts` | 索引，分片链接 `/sitemaps/tier1-{N}.xml` |
| `app/sitemaps/[name]/route.ts` | 分片 `tier1-{N}.xml` |
| `middleware.ts` | 对 `/use-cases/*` 查 `redirect_map` 做 308 |
