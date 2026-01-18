## 你的 `use_cases` 实际字段（已确认）

来自 `034_create_use_cases_table.sql` + `064_scene_prompt_architecture.sql`：

- **核心内容**：`slug`, `title`, `h1`, `description`, `content`, `use_case_type`, `seo_keywords`, `is_published`, `updated_at`, `created_at`
- **Scene Tier/索引控制**：`tier`, `in_sitemap`, `noindex`, `canonical_url`, `ai_citation_score`, `index_health_status`

## 你当前的 URL / sitemap 规则（已确认）

`076_sitemap_tier1_fn.sql` 里已经是你要的拼接方式：

- **loc**：`https://sora2aivideos.com/use-cases/` + `use_cases.slug`
- **筛选**：`noindex=false AND in_sitemap=true`
- **排序**：`ai_citation_score desc, updated_at desc`

## ✅ 你现在要做的两件“可直接执行”的事

### 1) 找出“可合并候选”use_cases（无 embedding）

执行：`supabase/migrations/078_find_similar_use_cases_trgm.sql`

- **你只需要改一处**：文件里 `v_target_slug` / `where slug = '...'` 那一行的 slug
- 输出包含：
  - `title_sim`, `desc_sim`, `kw_overlap`
  - `merge_recommendation`：`merge_direct / merge_soft / merge_as_faq / keep`

> 如果提示 `pg_trgm` 不存在：Supabase Dashboard → Database → Extensions 启用 `pg_trgm`。

### 2) 一键合并（noindex + canonical + 出 sitemap + 代码侧自动 redirect）

执行：`supabase/migrations/079_merge_use_cases_to_canonical.sql`

它会：
- **把主 Scene** 设置为：`tier=1, in_sitemap=true, noindex=false`
- **把候选页**（同 `use_case_type` 且相似度 ≥ 0.78）设置为：
  - `noindex=true`
  - `in_sitemap=false`
  - `canonical_url='/use-cases/<target_slug>'`
  - `tier=3`
  - `index_health_status='merged'`

## ✅ 代码侧：已支持“被合并页 301/canonical”

`app/use-cases/[slug]/page.tsx` 已做了三件事：

- **canonical_url → metadata canonical**
- **noindex=true → robots index=false (follow=true)**
- **canonical_url 与当前不同 → redirect(canonical_url)**（用于把重复页收敛到主 Scene）

## 建议的执行顺序（最稳）

1. 先跑 `078_find_similar_use_cases_trgm.sql`，看看候选列表是否合理（阈值 0.65/0.70/0.78/0.85 可调）
2. 再跑 `079_merge_use_cases_to_canonical.sql` 做合并
3. 最后跑 `076` 的 sitemap 分片（你现在 sitemap 已经按 `in_sitemap/noindex` 控制了）

## Scene 页面结构模板（AI Overview 友好）

见 `SCENE_PAGE_TEMPLATE_AI_OVERVIEW.md`

