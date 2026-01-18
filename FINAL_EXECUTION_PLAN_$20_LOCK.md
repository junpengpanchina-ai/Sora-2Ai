## FINAL EXECUTION PLAN（$20 封顶 · Scene 合并 + GEO/SEO 封仓）

> 这份计划基于你现有仓库的**真实表结构/字段名/URL 规则**，并且直接复用你已经上线级可用的脚本与代码：
>
> - `supabase/migrations/076_sitemap_tier1_fn.sql`（Tier1 sitemap 分片，`loc=https://sora2aivideos.com/use-cases/${slug}`）
> - `supabase/migrations/078_find_similar_use_cases_trgm.sql`（找相似候选，pg_trgm，无 embedding）
> - `supabase/migrations/079_merge_use_cases_to_canonical.sql`（一键合并，已修复 CTE 作用域问题）
> - `app/use-cases/[slug]/page.tsx`（已支持：`noindex`/`canonical_url`/redirect 收敛）
>
> 你可以把这份文档当作“只执行一次，然后冻结 3–6 个月”的总指挥稿。

---

### 🎯 最终目标（不可更改）

- **把 21 万 use_cases → 收敛成 3k–5k 个“主 Scene 权威页”**
- 其余页面全部：
  - **不进 sitemap**（`in_sitemap=false`）
  - **canonical 指向主 Scene**（`canonical_url='/use-cases/<target_slug>'`）
  - **noindex**（`noindex=true`）
  - **必要时 redirect**（代码已支持：canonical_url 与当前不同 → redirect）
- 然后 **停止一切生成行为 3–6 个月**，只等信任/收录/AI 引用累积。

---

### 💰 预算总控（红线）

- **最大总消耗：$20**
- 只允许：
  - **2 次模型批处理（可选）**
  - **1 次校验/抽样（可选）**
- 完成后立刻设置 **Spend Limit = $20**（封仓）。

> 注意：本计划的 A/C/D 阶段全部是 SQL + 工程动作，**$0**。

---

### 🧱 你已经完成的（不再动）

以下内容 **一律不改、不重跑、不讨论**：

- ✅ `use_cases` 表结构 + SEO 字段（`tier/in_sitemap/noindex/canonical_url/ai_citation_score/...`）
- ✅ Tier1 sitemap 分片函数（`076`）
- ✅ canonical / noindex / redirect 逻辑（Next.js）
- ✅ Prompt 已退出 SEO（Prompt noindex + robots/sitemap 已处理）
- ✅ `use_cases.slug → /use-cases/{slug}` 稳定路径

---

## 🅰️ Phase A：Scene 合并执行（$0～$6）

### A1. 选“主 Scene”（人工一次性，**只做一次**）

**规则（严格）**

- **同一 `use_case_type` 内**挑“更像百科条目/知识节点”的页面
- 内容是通用解释（能回答：What / When / How / Examples），不是 one-off 句式改写
- `noindex=false AND canonical_url IS NULL`（未被合并/降权）

**目标规模**

- 每个 `use_case_type` 选 10–100 个（按该类型体量分配）
- 全站总量 **3k–5k** 个主 Scene

> 备注：你的 slugs 目前较长（含 hash / in- 从句链）属于“历史既定事实”。本计划不强制改 slug；只做 **canonical/noindex/sitemap 的收敛**。

---

### A2. 主 Scene 候选清单 SQL（$0，可直接跑）

✅ 目标：从现有 `use_cases` 中筛出“每个 use_case_type 的 Top N 候选”，最终合计约 3k–5k。

**字段完全贴合你库：**`slug/title/use_case_type/seo_keywords/content/is_published/noindex/canonical_url/created_at/updated_at`

把下面 SQL 直接在 Supabase SQL Editor 执行即可：

```sql
-- 主 Scene 候选清单（按 use_case_type 配额）
-- 依赖字段：use_cases.slug/title/content/use_case_type/seo_keywords/is_published/noindex/canonical_url/created_at/updated_at

WITH type_sizes AS (
  SELECT use_case_type, COUNT(*) AS n
  FROM public.use_cases
  WHERE is_published = true
  GROUP BY use_case_type
),
quotas AS (
  SELECT
    use_case_type,
    n,
    CASE
      WHEN n < 1000 THEN 10
      WHEN n BETWEEN 1000 AND 5000 THEN 20
      WHEN n BETWEEN 5000 AND 20000 THEN 50
      ELSE 100
    END AS quota
  FROM type_sizes
),
base AS (
  SELECT
    u.id,
    u.slug,
    u.title,
    u.use_case_type,
    u.created_at,
    u.updated_at,
    length(u.content) AS content_len,
    array_length(regexp_split_to_array(u.slug, '-'), 1) AS slug_tokens,
    array_length(u.seo_keywords, 1) AS kw_count
  FROM public.use_cases u
  WHERE
    u.is_published = true
    AND coalesce(u.noindex, false) = false
    AND u.canonical_url IS NULL
),
filtered AS (
  SELECT *
  FROM base
  WHERE
    -- 内容要能“解释”，但不走博客极长篇（可按你站的实际风格调整）
    content_len BETWEEN 1200 AND 8000

    -- 关键词宽度：3~8 个更像“可承载多个子场景”的母页
    AND coalesce(kw_count, 0) BETWEEN 3 AND 8

    -- 稳定性：至少存在 30 天；最近 14 天不频繁更新（避免“生成/改写波动期”）
    AND created_at < now() - interval '30 days'
    AND coalesce(updated_at, created_at) < now() - interval '14 days'

    -- ⚠️ 注意：如果你全库 slug 都很长，这条可能会筛掉太多。
    -- 建议先注释掉试跑，确认返回量是否在 3k–5k 区间，再决定是否启用。
    -- AND coalesce(slug_tokens, 999) <= 16
),
ranked AS (
  SELECT
    f.*,
    q.quota,
    row_number() OVER (
      PARTITION BY f.use_case_type
      ORDER BY
        f.created_at ASC,        -- 先发优势（更像“主节点”）
        f.content_len DESC       -- 信息承载力
    ) AS type_rank
  FROM filtered f
  JOIN quotas q USING (use_case_type)
)
SELECT *
FROM ranked
WHERE type_rank <= quota
ORDER BY use_case_type, type_rank;
```

**输出你会得到：**

- 每一行 = 一个“主 Scene 候选”
- 你只需要人工扫一眼（看 title/slug 是否“像知识节点”），然后进入 A3。

---

### A3. 找相似页（你已写好，$0）

执行：`supabase/migrations/078_find_similar_use_cases_trgm.sql`

你只需要改：

- `where slug = 'TARGET_SLUG'`（主 Scene slug）

重点只看四列：

- `title_sim`
- `desc_sim`
- `kw_overlap`
- `merge_recommendation`

---

### A4. 一键合并（核心动作，$0）

执行：`supabase/migrations/079_merge_use_cases_to_canonical.sql`

效果（与你库字段完全一致）：

- 主 Scene：
  - `tier=1`
  - `in_sitemap=true`
  - `noindex=false`
- 被合并页：
  - `noindex=true`
  - `in_sitemap=false`
  - `canonical_url='/use-cases/TARGET_SLUG'`
  - `tier=3`
  - `index_health_status='merged'`

> redirect 策略：代码侧已支持 canonical_url 与当前不同直接 redirect。  
> 如果你只想对 `merge_direct` redirect、对 `merge_soft` 只 canonical（不跳转），可以在代码里加开关（封仓后再说）。

---

## 🅱️ Phase B：AI_CITATION_SCORE 定型（$5～$8，可选）

目的：不是预测未来，而是给系统一个“**长期不改**”的排序标准，用于：

- Tier1 sitemap 排序
- Prompt auto-bind（只认这个分数）

**强约束：只跑一次，跑完冻结。**

### B1. 评分策略（建议“定死”，不再改）

你仓库里已存在 ai_citation_score 的一套迁移（`072/073/074`）。如果你想完全 $0，也可以只用规则/SQL 计算；如果要模型标注，就按下面最省钱版本：

- 抽样 50–100 个主 Scene（从 A1 选出的候选里抽）
- 让模型只输出 3 档：High / Medium / Low
- 写回：
  - High → `0.8`
  - Medium → `0.6`
  - Low → `0.3`

预算控制：Flash/轻量模型，**$5 左右**。

---

## 🅲 Phase C：Scene 页面结构（$0）

你已有模板：`SCENE_PAGE_TEMPLATE_AI_OVERVIEW.md`

原则（封仓版）：

- 第一屏 Answer-first（定义 + 列表 + 总结）
- 中段结构化（lists / steps / examples）
- 末尾 FAQ（AI Overview 最爱引用）
- 语气：非营销、非比较、非工具导向

✅ 重要：**不要再 A/B，不要再反复改措辞**。

---

## 🅳 Phase D：Sitemap / Canonical 封版（$0）

### D1. Tier1 sitemap 最终规则（唯一条件）

进入 sitemap 的唯一条件：

- `noindex = false`
- `in_sitemap = true`
- `tier = 1`

数量控制：

- 理想：**3k–5k**
- 极限：**10k（绝不超过）**

### D2. Canonical 策略（不再讨论）

- 被合并页：
  - `canonical_url = 主 Scene`
  - `noindex = true`
  - `in_sitemap = false`
- redirect：
  - **只用于 merge_direct（≥ 0.85）**（更稳）
  - soft merge 只 canonical（更保守）

> 当前代码是“只要 canonical_url 与当前不同就 redirect”。如果你要严格区分 direct/soft，可在后续小改（但不建议在封仓前反复动）。

---

## 🧊 Phase E：冻结（最重要，$0）

一旦完成 A +（可选）B + C + D：

### 禁止（90–180 天）

- ❌ 新 use_case 生成
- ❌ 新 prompt 批量生成（除非修 bug）
- ❌ sitemap 规则调整
- ❌ 反复重算/重跑合并
- ❌ “再跑一把看看”的冲动

### 只允许（每 2–4 周一次）

- 查看：
  - GSC Index coverage / 抓取情况
  - 是否开始被 AI Overview / ChatGPT / Gemini 引用
- **记录，不干预**

冻结期：**90–180 天**

---

## 📊 $20 消耗分布（上限）

| 项目 | 预算 |
|---|---:|
| Scene 相似性（SQL） | $0 |
| 合并执行 | $0 |
| AI_CITATION_SCORE 标注（可选） | $5–8 |
| 抽样校验/复跑（可选） | $2–3 |
| **总计** | **≤ $20** |

---

## ✅ 什么时候算“成功”

不是看短期流量，而是出现任一信号：

- GSC：sitemap URL 稳定被抓，索引波动下降
- AI 搜索（ChatGPT / Gemini / Google AI Overview）：开始引用你的 `/use-cases/...` 作为解释来源
- Index 不再上下剧烈波动

通常发生在 **60–120 天**。

---

## 🧠 封仓原则（最后一句）

你现在不是在“优化”，你是在“让系统变得值得被信任”。  
这一步，**少动比多动强**。

