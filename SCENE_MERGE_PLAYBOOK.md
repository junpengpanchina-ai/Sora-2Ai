## Scene 合并 Playbook（use_cases → 主 Scene 收敛，AI Overview / SEO 稳定）

这份文档把你现在要做的事情整理成“可执行流程 + 可复制 SQL + 回滚方案”。

---

## 0. 背景：你现在要解决的是什么

你现在的规模是 **21 万+ use_cases**。其中很多只是同一业务意图的“近似句式改写”，如果让它们都成为可索引页面，会导致：

- **索引稀释**：同主题内容被拆散，Google/LLM 不知道引用哪一页
- **维护地狱**：内容更新要改 N 份
- **GEO/AI Overview 信任下降**：重复模板页更容易被降权

正确做法是：

- **Scene/Use Case** 是 SEO/GEO 第一公民（稳定语义锚点）
- 相似/重复的 use_cases **合并到主 Scene**
- 被合并页：**noindex + canonical + (可选) redirect 到 canonical**

---

## 1. 你库里 `use_cases` 的字段（已确认）

来自 `supabase/migrations/034_create_use_cases_table.sql` + `supabase/migrations/064_scene_prompt_architecture.sql`：

- **URL**：`slug` → 页面路径：`/use-cases/${slug}`
- **核心内容**：`title`, `h1`, `description`, `content`, `use_case_type`, `seo_keywords`, `is_published`
- **SEO/收敛控制**：`tier`, `in_sitemap`, `noindex`, `canonical_url`, `ai_citation_score`, `index_health_status`
- **时间字段**：`created_at`, `updated_at`

---

## 2. sitemap / loc 规则（已确认）

你已经有 Tier1 分片 sitemap 函数：`supabase/migrations/076_sitemap_tier1_fn.sql`

- **loc 拼接**：
  - `https://sora2aivideos.com/use-cases/` + `use_cases.slug`
- **筛选**：
  - `noindex = false AND in_sitemap = true`

这套规则是正确的：**Scene 页面进 sitemap；被合并页出 sitemap。**

---

## 3. 代码侧：合并页的 canonical/noindex/redirect（已接好）

文件：`app/use-cases/[slug]/page.tsx`

行为：

- **canonical_url → metadata canonical**
- **noindex=true → robots index=false（follow=true）**
- **canonical_url 与当前 URL 不同 → redirect(canonical_url)**  
  用途：把重复/近似句式页收敛到主 Scene（你要的“合并效果”）

> 备注：你可以按需选择“soft 合并只 canonical 不 redirect”，见下文可选项。

---

## 4. 执行流程（推荐顺序）

### Step A：先找候选（人工 review 一次）

执行：`supabase/migrations/078_find_similar_use_cases_trgm.sql`

你只需要改一处：

- `where slug = '...'`（主 Scene 的 slug）

输出字段：

- `title_sim` / `desc_sim`（pg_trgm similarity）
- `kw_overlap`（seo_keywords 重叠数）
- `merge_recommendation`：
  - `merge_direct`（≥ 0.85）
  - `merge_soft`（0.78–0.85）
  - `merge_as_faq`（0.70–0.78）
  - `keep`

依赖：

- `pg_trgm` 扩展（SQL 里有 `create extension if not exists pg_trgm;`）

### Step B：一键执行合并（写入 noindex / canonical / in_sitemap）

执行：`supabase/migrations/079_merge_use_cases_to_canonical.sql`

它会做：

- 主 Scene：
  - `tier=1`
  - `in_sitemap=true`
  - `noindex=false`
  - `canonical_url=null`
- 候选页（同 `use_case_type` 且相似度 >= 0.78）：
  - `noindex=true`
  - `in_sitemap=false`
  - `canonical_url='/use-cases/<target_slug>'`
  - `tier=3`
  - `index_health_status='merged'`

你会在 Supabase 输出里看到：

- `✅ merge_direct: X rows updated`
- `✅ merge_soft: Y rows updated`

### Step C：检查 sitemap 结果（可选）

你已有 sitemap 分片函数：

- `get_tier1_sitemap_count()`
- `get_tier1_sitemap_chunk(limit, offset)`

如果你想快速 sanity check：

```sql
select public.get_tier1_sitemap_count();
```

---

## 5. 阈值怎么调（实战建议）

默认（脚本内）：

- `merge_direct >= 0.85`
- `merge_soft >= 0.78`

经验规则：

- **≥ 0.85**：直接合并（noindex + redirect + canonical）
- **0.78–0.85**：soft 合并（推荐 noindex + canonical；是否 redirect 看你策略）
- **0.70–0.78**：不要单独成页；把内容吸收到主 Scene 的 Examples/FAQ
- **< 0.70**：保留为独立 Scene 或留待后续处理

---

## 6. “反向/批量”玩法：把一个 use_case_type 做成 10–50 个主 Scene

如果你要从 21 万里收敛出一批 Tier1 主 Scene，推荐：

1. 先在每个 `use_case_type` 里挑 10–50 个“质量高、稳定、可引用”的主 Scene
2. 给主 Scene：
   - `tier=1`
   - `in_sitemap=true`
   - `ai_citation_score`（后续会用于 prompt auto-bind）
3. 用脚本 079 批量合并其余近似句式页

---

## 7. 回滚方案（重要）

### 7.1 只回滚某个主 Scene 的合并

如果你想撤销某次合并（主 slug = `TARGET_SLUG`），可执行：

```sql
-- 把 canonical 指向该主 Scene 的页面恢复
update public.use_cases
set
  noindex = false,
  in_sitemap = false,
  canonical_url = null,
  index_health_status = 'unknown'
where canonical_url = ('/use-cases/' || 'TARGET_SLUG');
```

然后再按需要手工把其中一部分恢复进 sitemap：

```sql
update public.use_cases
set in_sitemap = true, tier = 1
where slug in ('...','...'); -- 你决定哪些要重新变成主 Scene
```

### 7.2 只取消 redirect（保留 canonical）

如果你发现 redirect 太激进，想保留 canonical 但不跳转：

- 在代码里（`app/use-cases/[slug]/page.tsx`）把 redirect 逻辑关掉/加开关即可

---

## 8. Scene 页面结构模板（AI Overview / LLM 最爱引用）

文件：`SCENE_PAGE_TEMPLATE_AI_OVERVIEW.md`

用法：

- 把模板内容作为 `use_cases.content`（Markdown）
- 把相似/被合并 use_cases 的要点吸收进：
  - `Common formats teams create`
  - `Examples`
  - `FAQ`

---

## 9. 运行构建

`npm run build` 已可通过（仍有少量 hook/img 的 warning，不影响 build）。

