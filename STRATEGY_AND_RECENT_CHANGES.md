# 策略与两日调整汇总

> 本文档：**策略总览** + **两日调整动作** + **锁仓结论与后续节奏**（含唯一风险、该做/不要做、安全合并节奏）。执行细节见 `TONIGHT_LOCK_EXECUTION.md`，背景与流程见 `SCENE_MERGE_PLAYBOOK.md`。

---

## 一、策略总览

### 1.1 目标

- **use_cases 收敛**：相似页合并到主 Scene，主 Scene 3k–5k（或 5k–20k 目标区间）。
- **被合并页**：`noindex=true`、`in_sitemap=false`、`canonical_url='/use-cases/<主slug>'`、`tier=3`。
- **主 Scene**：`tier=1`、`in_sitemap=true`、`noindex=false`、`canonical_url=null`。

### 1.2 软合并 / 硬合并 分级

| 相似度 | 等级 | 数据层 | 跳转层 |
|--------|------|--------|--------|
| ≥ 0.85 | **merge_direct（硬）** | canonical + noindex + `index_health_status='merge_direct'` | 可写入 `redirect_map` → middleware 做 **308** |
| 0.78–0.85 | **merge_soft（软）** | canonical + noindex + `index_health_status='merge_soft'` | **不**写 `redirect_map` → 只 canonical，**不 308** |
| 0.70–0.78 | merge_as_faq | 建议吸收到主 Scene 的 FAQ/Examples | — |
| < 0.70 | keep | 保留独立或后续再处理 | — |

### 1.3 308/301 开关

- **跳转由 `redirect_map` 控制**：只对表中存在的 `from_path` 做 308。
- **081**：只把 `index_health_status='merge_direct'` 的 `use_cases` 写入 `redirect_map`；软合并不写 → 不跳。
- **middleware**：对 `/use-cases/*` 查 `redirect_map`，有则 308 到 `to_path`，无则放行。

### 1.4 Tier1 sitemap

- **条件**：`noindex=false` 且 `in_sitemap=true`。
- **lastmod**：`updated_at` → `created_at` → `now()`。
- **分片**：`/sitemaps/tier1-0.xml`、`/sitemaps/tier1-1.xml`、…（每片 5000）。
- **函数**：`get_tier1_sitemap_count()`、`get_tier1_sitemap_chunk(p_limit, p_offset)`。

### 1.5 验收（简短）

- `get_tier1_sitemap_count()` 在目标区间（如 5k–20k）。
- 主 Scene / 被合并 的字段符合上表。
- `/sitemap.xml`、`/sitemaps/tier1-0.xml` 可访问。
- 需 308 的旧址在 `redirect_map` 有 `from_path`。

---

## 二、两日调整动作汇总

以下为**近日两次会话**中完成的所有修改，按**模块**汇总。

### 2.1 081：redirect_map 只写「硬合并」

- **原来**：所有 `noindex=true` 且 `canonical_url` 非空的都写入 `redirect_map`。
- **调整**：增加 `and coalesce(uc.index_health_status,'') = 'merge_direct'`，只把硬合并页写入映射。
- **目的**：软合并只做 canonical，不做 308；跳转仅对 merge_direct 开放。
- **可选**：若希望软合并也 308，可删掉 081 中该过滤条件。

**文件**：`supabase/migrations/081_build_redirect_map_from_canonical.sql`

---

### 2.2 082：建 GIN 索引超时

- **现象**：`create extension pg_trgm` + 两个 `create index ... using gin (title/description gin_trgm_ops)` 在 Supabase 里报 **upstream timeout**。
- **调整**：
  1. 在 082 开头增加 `set local statement_timeout = '900s';`。
  2. 注释说明：若仍超时，可**拆开**在 SQL Editor 中先跑 `create extension if not exists pg_trgm;`，再分别跑两个 `create index if not exists ...`。
- **说明**：`create index if not exists` 已存在会跳过，拆开跑安全。

**文件**：`supabase/migrations/082_merge_prereq.sql`

---

### 2.3 086：get_tier1_sitemap_count 与 076 冲突

- **现象**：`cannot change return type of existing function`，076 为 `int`，086 改为 `bigint`，`create or replace` 不允许改返回类型。
- **调整**：在 086 中、`create or replace function get_tier1_sitemap_count()` 之前增加：
  ```sql
  drop function if exists public.get_tier1_sitemap_count();
  ```
- **结果**：086 可重复执行，旧 int 版被替换为 bigint。

**文件**：`supabase/migrations/086_sitemap_tier1_fn.sql`

---

### 2.4 087：redirect_map 不存在时报错

- **现象**：直接跑 087 时，若 080 未执行、`redirect_map` 不存在，`delete from public.redirect_map` 报 `relation "public.redirect_map" does not exist`。
- **调整**：改为 `do $$ ... if exists (information_schema.tables 表存在) then delete ... end if; end $$;`，表不存在时**静默跳过**，不报错。

**文件**：`supabase/migrations/087_rollback_redirect_map.sql`

---

### 2.5 Sitemap 分片 URL：tier1/{i}.xml → tier1-{i}.xml

- **原来**：索引里分片为 `/sitemaps/tier1/0.xml`、`/sitemaps/tier1/1.xml`。
- **调整**：改为 `/sitemaps/tier1-0.xml`、`/sitemaps/tier1-1.xml`，与「今晚关灯前」约定一致。
- **涉及**：
  - `app/sitemap.xml/route.ts`：`/sitemaps/tier1/${i}.xml` → `/sitemaps/tier1-${i}.xml`，fallback 同。
  - 分片由 `app/sitemaps/[name]/route.ts` 提供，已支持 `tier1-{N}.xml`。

**文件**：`app/sitemap.xml/route.ts`

---

### 2.6 app/sitemaps/[name]：删除未使用的 getBaseUrl

- **现象**：`npm run build` 报 `'getBaseUrl' is defined but never used`（`@typescript-eslint/no-unused-vars`）。
- **调整**：`import { getBaseUrl, escapeXml }` → `import { escapeXml }`。
- **原因**：`loc` 来自 `get_tier1_sitemap_chunk`，已是完整 URL，无需 `getBaseUrl`。

**文件**：`app/sitemaps/[name]/route.ts`

---

### 2.7 「今晚关灯前」可执行清单

- **新增/重写**：`TONIGHT_LOCK_EXECUTION.md`，把 301/308 映射、批量合并（软/硬+回滚）、Tier1 sitemap、软硬开关、执行顺序、验收、文件一览，整理成一份**按顺序可跑**的说明。
- **A**：080 建表、081 生成映射（只硬合并）、087 回滚 redirect_map。
- **B**：082 前置、083 找相似、084 合并函数（dry_run/正式）、085 回滚某主 Scene 的合并。
- **C**：086 函数、sitemap 索引与分片 `tier1-{N}.xml`。
- **D**：软/硬合并与 308 开关策略说明。
- **E**：推荐执行顺序（080→082→086→084→dry_run/正式→081→部署，308 可延后）。
- **F**：成功验收。
- **文件一览**：含 087。

**文件**：`TONIGHT_LOCK_EXECUTION.md`

---

## 三、相关文档索引

| 文档 | 用途 |
|------|------|
| **STRATEGY_AND_RECENT_CHANGES.md**（本文） | 策略总览 + 两日调整 + 锁仓结论与后续节奏 |
| **TONIGHT_LOCK_EXECUTION.md** | 可复制执行清单（080–087、sitemap、middleware、顺序、验收） |
| **SCENE_MERGE_PLAYBOOK.md** | 背景、078/079 流程、阈值、回滚、页面模板 |
| **MERGE_USE_CASES_GUIDE.md** | 078/079 简明步骤、代码侧 canonical/redirect |
| **FINAL_EXECUTION_PLAN_$20_LOCK.md** | 预算封顶、Phase A/B/C/D、主 Scene 候选 SQL |
| **BUILD_REPORT.md** | `npm run build` 结果、ESLint 警告、路由概览 |
| **LOCKDOWN_14DAY_MONITORING.md** | 14 天只观察不动：监控清单、第 15 天阈值表、填表模板、面板字段映射 |
| **OWNER_BRIEF_LOCKDOWN.md** | Owner 决策交接 / 反误操作；最高优先级；仅 Owner 可解除 Lockdown |
| **OWNER_DECISION_CARD_A4.md** | 一页老板决策卡片，贴 Admin / Notion |

---

## 四、迁移与代码文件一览（080–087 + 应用）

| 文件 | 作用 |
|------|------|
| `080_redirect_map.sql` | 建 `redirect_map` 表 |
| `081_build_redirect_map_from_canonical.sql` | 从 use_cases 生成 308 映射（**仅 merge_direct**） |
| `082_merge_prereq.sql` | pg_trgm + GIN 索引（**+statement_timeout=900s，可拆开跑**） |
| `083_find_similar_use_cases.sql` | 找相似候选（换 TARGET_SLUG） |
| `084_merge_to_canonical_fn.sql` | 合并函数（软/硬 + dry_run） |
| `085_rollback_merge.sql` | 回滚某主 Scene 的合并 |
| `086_sitemap_tier1_fn.sql` | Tier1 sitemap count + chunk（**先 DROP 再建 count**） |
| `087_rollback_redirect_map.sql` | 回滚 redirect_map（**表不存在则静默跳过**） |
| `app/sitemap.xml/route.ts` | 索引，分片链接 **/sitemaps/tier1-{N}.xml** |
| `app/sitemaps/[name]/route.ts` | 分片 tier1-{N}.xml（**已删 getBaseUrl**） |
| `middleware.ts` | 对 /use-cases/* 查 redirect_map 做 308 |

---

## 五、锁仓结论与后续节奏

> 以下为评审结论：**可锁仓、可静置、可交接**。唯一需要盯住的是**合并节奏**。

### 5.1 结论先行

- **系统状态**：✅ 可锁仓、可静置、可等待 Google 消化。
- **架构**：正确；**风险**：可控；**方向**：无错误。
- **策略与预算**：不需要再加新策略、不需要再动预算。
- **停手 2–4 周**：不会伤害项目，而是**最优解**。

### 5.2 关键设计确认（均已认可）

- **软/硬合并分级**（§1.2）：merge_direct→308，merge_soft→只 canonical 不跳转，merge_as_faq→吸收；非一刀切 301，跳转可逆、可控、可延后；`redirect_map` 作为跳转白名单。→ 可沿用 3–5 年。
- **sitemap**（§1.4）：信号收敛而非强制删页；不删 URL、不一夜 noindex 全站、不 sitemap 暴降；让 Google 自己看懂谁重要。→ 可持续。
- **redirect_map + middleware**：DB 为事实源、代码为执行器；087 表不存在静默跳过、081 只写 merge_direct、middleware 只查表→308 无业务逻辑。→ 规模 >10 万 URL 时尤其重要。

### 5.3 ⚠️ 唯一风险：合并节奏 vs Google 消化速度

**不是技术问题，是节奏问题。**

- **能力**：1–2 天内把 21 万 → 5k Tier1 在技术上可行。
- **建议**：**不要一次性**把 21 万全部“标记完成”。

**安全节奏（推荐）**：

| 步骤 | 动作 |
|------|------|
| 第一批 | 每个 `use_case_type` 只挑 **5–10 个**主 Scene，跑合并脚本 |
| 等待 | **7–14 天** |
| 观察 | Search Console：**已发现网页、已编入索引、抓取统计、sitemap 读取成功率** |
| 下一批 | 再扩 5–10 个主 Scene / type，重复 |

**原因**：Google 对**结构性大规模调整**有 trust ramp；当前阶段是在**建立信任**，不是拼速度。

### 5.4 状态判断

> “现在不是扩展期，是稳定期。”

平台型 SEO / GEO 的分水岭：多数会选择继续造词、烧模型、加页面；这里选择**收敛、固化、等待**。→ 正确，且属少数派。

### 5.5 未来 1–2 周：该做的 / 不要做的

| ✅ 该做的 | ❌ 不要做的 |
|----------|-------------|
| 冻结新 use_cases 生成 | 新模型 |
| 只跑已写好的合并脚本 | 新 prompt 体系 |
| 不改阈值、不改规则 | 新 sitemap 结构 |
| 只看 4 个指标：**已发现网页数、已编入索引数、sitemap 读取成功率、抓取频率**（非排名） | 新 URL 模板 |

### 5.6 一句评价

> 当前这套：不像独立站、不像内容农场，像**可被 AI 引用的知识系统**——而这正是 Google AI Overview / LLM 引用在找的形态。
