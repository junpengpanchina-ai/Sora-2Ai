# Prompt 资产生产线（SEO Hard Isolation）执行报告

更新时间：2026-01-25  
仓库：`Sora-2Ai`

## 摘要（已完成）

- **SEO 安全隔离已落地**：Prompt 页面统一 `noindex, nofollow`，不进入 sitemap，不作为 SEO 内链节点，不输出会引导索引的结构化数据。
- **Prompt 生产线已落地**：支持 Admin 批量生成 Prompt（任务表 + 链式处理防超时 + 状态查询）。
- **数据/指标与 Gate 已落地**：Supabase Migration 118 新增分析表、视图、RPC，Admin 列表直接展示关键指标与 Gate 状态。
- **CI 守卫已落地**：一条可在 CI 执行的脚本 `check:prompt-guards`，用于防止 Prompt 资产误伤 SEO。
- **可构建可发布**：本地 `lint` 通过（仅 warnings），`build` 通过，`check:prompt-guards` 通过。

## ✅ 结论（非常重要）

**这条 Prompt 资产生产线已经“工程闭环且 SEO 安全”。**

- **SEO Hard Isolation**：Prompt 页面“可抓取但不可索引”（`noindex`，不是 `Disallow`），不进 sitemap，不输出会引导索引的结构化数据，内链显式降权，且 CI 有硬阻断。
- **可规模化的 Prompt Pipeline**：有任务表/状态机、链式处理防超时、失败不阻塞 + fallback、进度可观测、错误可追溯、指标/Gate/AB 可自动算。
- **防未来犯错**：CI 直接 fail（不是靠人记得）。

## 🚦下一步该干什么（以及哪些地方现在别动）

### Phase A（现在立刻能做，且安全）

目标：把 Prompt 当“产品成功率引擎”用（**不看 SEO**）。

- **建议做**
  - 小批量 batch generate（例如 1 个 industry × 1 个 scene × 2–10 条）
  - 观察产品指标：执行成功率、视频生成完成率、用户是否更快生成第一个视频
- **现在别动**
  - 不要去 GSC 里看 Prompt URL 的 impressions/clicks
  - 不要人为给 Prompt 增加内链曝光（Prompt 本来就不该有 SEO 信号）

### Phase B（7–14 天后）

目标：用数据筛 Prompt，而不是感觉。

- 让 A/B 自然跑，让 Gate 自然计算
- 只看 Admin 面板：`success_rate`、`ΔCR`、`ROI`（以及下面“选项 A”里定义的 LTV 指标）

### Phase C（真正升级 Scene 的时刻）

只在这时才触碰 SEO（不提前）。

建议触发条件：
- Prompt 自动进入 `SCENE_ELIGIBLE`
- `site_gate_status = GREEN`
- Top 1–5% 才进入 Scene/Use Case 抽象

## 选项 A（产品向）：真正会拉 LTV / 复购的 Prompt 指标体系

一句话总览：Prompt 影响 LTV 的核心不是“写得好不好”，而是它有没有缩短「用户 → 成功视频 → 再次使用」的路径。

### 一级指标（直接影响 LTV / 复购）✅ 必看

#### 1) Prompt → First Success Speed（首个成功速度）🔥

- **定义**：\(T\_{first\_success} = \min(video\_created\_at) - prompt\_used\_at\)
- **为什么影响 LTV**：第一次成功体验几乎决定复购；Prompt 的最大价值是“别让我卡住”。
- **建议阈值（按中位数）**
  - **Top Prompt**：< 60 秒
  - **可用**：60–180 秒
  - **应淘汰**：> 3 分钟（即使成功率高也会被用户感知为“难用”）

#### 2) Prompt Completion Rate（执行完成率）🔥

- **定义**：\(completion\_rate = 成功生成视频次数 / 使用 Prompt 次数\)
- **为什么影响 LTV**：用户最讨厌“点了→配了→等了→失败”；每次失败都会显著降低复购概率。
- **阈值（经验）**
  - **复购友好**：≥ 80%
  - **勉强可用**：65–80%
  - **必须处理**：< 65%

> 备注：Completion Rate 往往比 Success Rate 更重要（成功 ≠ 完成）。

#### 3) Prompt Reuse Rate（复用率）🔥

- **定义**：\(reuse\_rate = 使用同一 Prompt ≥2 次的用户 / 使用过 Prompt 的用户\)
- **为什么是“心跳指标”**：复用=把 Prompt 当工具而不是 Demo；复用一次常常对应更高复购概率。
- **阈值**
  - **黄金 Prompt**：≥ 30%
  - **可保留**：15–30%
  - **一次性 Prompt**：< 15%

#### 4) Prompt → Paid Conversion Lift（ΔCR）🔥

- **定义**：\(ΔCR = 付费率(使用 Prompt 用户) - 付费率(未使用 Prompt 用户)\)
- **正确理解**：不是“用了就付费”，而是 Prompt 是否降低了“犹豫成本”。
- **结论**：**ΔCR > 0** 才有资格谈 LTV；ΔCR ≤ 0 的 Prompt 即使用得多也可能是在浪费流量/时间。

### 二级指标（决定“能不能规模化”）⚠️

#### 5) Prompt Variance（输出稳定性）

- **关注点**：同一 Prompt 多次生成，质量是否大起大落
- **结论**：稳定 > 惊艳；高 variance 适合 Experiment，不适合 Lock，也不适合升级 Scene。

#### 6) Cognitive Load（心智负担）

- **可量化信号（建议）**
  - 变量位数量（placeholders 数）
  - 用户修改 Prompt 的次数
  - Prompt 编辑停留时长
- **反直觉结论**：变量越多不一定越好；能用默认值跑通的 Prompt 往往更拉 LTV。

### 你现在可以直接加进 Dashboard 的 6 个 LTV 指标

| 指标 | 是否建议必做 | 备注 |
|---|---:|---|
| `T_first_success` | ✅ 必加 | 直接反映“是否卡住” |
| `completion_rate` | ✅ 必加 | 成功≠完成 |
| `reuse_rate` | ✅ 必加 | 复购心跳指标 |
| `ΔCR` | ✅ 必加 | 付费提升的必要条件 |
| `variance_score` | ⚠️ 可选 | 稳定性治理 |
| `cognitive_load` | ⚠️ 可选 | 心智负担治理 |

### 把指标翻译成动作（决策规则）

- **一个 Prompt 值不值得留下？**
  - `completion_rate ≥ 80%`
  - AND `reuse_rate ≥ 30%`
  - AND `T_first_success (median) < 60s`

- **一个 Prompt 值不值得升级 Scene？**
  - 满足“值得留下”的全部条件
  - AND `ΔCR > 0`
  - AND variance 可控

- **什么时候该批量再生成？**
  - 当你发现：`completion_rate` 高但 `reuse_rate` 低  
    说明 Prompt 能解决问题但不够通用 → 更像“该抽象 Scene 了”，而不是继续堆数量。

### 哪些指标可以放心忽略（常见噪音）

- Prompt 字数
- 文案“高级感”
- 行业覆盖数量（本身不等于价值）
- Prompt 被展示次数
- Prompt 自身 SEO 流量（Prompt 本就不该有 SEO 信号）

## 关键校验结果

### 1) Prompt 资产 CI 守卫

命令：

```bash
npm run check:prompt-guards
```

结果：通过（`ok: true`，`siteGateStatus: GREEN`）。

### 2) Lint / Build

```bash
npm run lint
npm run build
```

- `lint`：通过（有若干 warnings，不阻断）
- `build`：通过（生产构建成功）

## 已落地的 SEO Hard Isolation（Prompt 不纳入 Google 收录）

### Prompt 页面强制 noindex / nofollow

- `app/prompts/page.tsx`
- `app/prompts-en/page.tsx`
- `app/prompts/[slug]/page.tsx`

策略：允许爬虫访问页面以读取 `noindex`，但页面自身明确不参与收录与权重传递。

### robots / sitemap 对齐

- `app/robots.ts`
- `app/robots.txt/route.ts`

要点：
- 不再对 `/prompts/` 进行 `Disallow`（避免“爬不到 noindex”）
- `Sitemap:` 指向 `sitemap-index.xml`（与站点实际 sitemap 结构一致）

### 移除可能引导索引的结构化数据

- `app/layout.tsx`

要点：删除站点级 SearchAction（避免把 Prompt 搜索结果当作可索引入口）。

### 降低 Prompt 的内链曝光（不传递内链权重）

- `app/HomePageClient.tsx`：对 Prompt 入口做降权处理（如 `rel="nofollow"`/条件显示）
- `app/use-cases/UseCasesPageClient.tsx`
- `app/use-cases/[slug]/page.tsx`
- `app/keywords/[slug]/page.tsx`

## Prompt 生产线（批量生成）已落地

### 新增/更新的 Admin API

目录：`app/api/admin/prompt-templates/`

包含能力：
- **列表（分页/筛选/排序）**：用于 Admin 页面展示 Prompt Templates（含指标与 gate）
- **单条 patch/delete**：用于后续编辑、上下线、权重调控等
- **批量生成**：创建批任务
- **链式处理 process**：逐 cell 处理（industry × scene），避免单次超时
- **状态查询**：前端轮询进度

### 链式处理的鉴权说明

原因：链式 server-to-server `fetch` 不带浏览器 cookie，会导致 401。  
解决：`process` 支持 **管理员会话** 或 **内部 token**（`x-internal-token`）两种方式。

需要配置的环境变量：
- `PROMPT_GEN_INTERNAL_TOKEN`：用于服务端链式调用鉴权

生成方式（示例）：

```bash
python3 -c 'import secrets; print(secrets.token_urlsafe(32))'
```

## Supabase 数据层（Migration 118）

文件：
- `supabase/migrations/118_prompt_templates_analytics_and_generation.sql`

内容概览：
- tables：`site_gate_status`、`prompt_template_events`、`prompt_generation_tasks`、`app_metrics_daily`
- views：`v_prompt_template_daily_metrics`、`v_prompt_template_7d_roi`、`v_prompt_template_ab`、`v_prompt_template_gate`、`v_prompt_templates_admin_list`
- rpc：`rpc_get_prompt_templates_admin_page`

迁移执行（示例，按你项目实际方式）：

```bash
# 方式 A：Supabase CLI
supabase db push

# 方式 B：Dashboard 里运行迁移 SQL
# 直接粘贴/执行 118 文件内容
```

## LTV 指标（30d）自动计算（Migration 119）

文件：
- `supabase/migrations/119_prompt_templates_ltv_metrics_30d.sql`

新增对象：
- `v_prompt_template_user_first_success_30d`：用户级首个成功耗时（用于算 median）
- `v_prompt_template_ltv_30d`：30 天窗口的 4 个 LTV 指标汇总（含 completion/reuse/ΔCR/首个成功耗时）
- 扩展 `v_prompt_templates_admin_list`：把 30d LTV 列直接拼到 Admin 列表（不破坏现有用法）
- 更新 `rpc_get_prompt_templates_admin_page`：允许按 30d LTV 列排序（例如 `delta_cr_30d`、`reuse_rate_30d`）

Admin 可直接用的 4 个核心列：
- `completion_rate_30d`
- `reuse_rate_30d`
- `delta_cr_30d`
- `t_first_success_median_sec_30d`

## 付费口径对齐（Migration 121）

文件：
- `supabase/migrations/121_paid_logic_from_revenue_cents.sql`

内容：
- 将 7d/30d 的 “paid users” 口径统一为 **`revenue_cents > 0`**（并兼容 `event_type='paid'` 的写法）
- 目的：不强依赖前端必须发 `paid` 事件，ΔCR/ROI/LTV 依然稳定可算

## LTV Gate（红/黄/绿）一眼决策（Migration 122）

文件：
- `supabase/migrations/122_prompt_template_ltv_gate.sql`

新增对象：
- `v_prompt_template_ltv_gate`：基于 4 个 LTV 指标输出 `ltv_gate_color`（`RED`/`YELLOW`/`GREEN`）
- `v_prompt_templates_admin_list`：追加 `ltv_gate_color` 字段（Admin 列表接口不变）

## 埋点规范与事实表扩展（Migration 120）

文件：
- `supabase/migrations/120_prompt_template_events_schema_and_event_types.sql`

新增/变更：
- `prompt_template_events.request_id`：幂等 key（可选但强烈建议）
- `prompt_template_events.props (jsonb)`：统一 payload
- 扩展 `event_type` 白名单：新增 `variant_shown / variant_generate / favorite / reuse`（不影响现有 7d/30d 指标计算）

文档：
- `docs/PROMPT_EVENT_TAXONOMY.md`

## Admin UI 已接入

已更新的 tabs：
- `app/admin/prompts/tabs/ScenePromptsTab.tsx`
  - 新增“批量自动生成”面板
  - 展示关键指标（exec_7d/sr_7d/ΔCR_7d/ROI_7d）与 `gate_pass`、AB 数据充分性
- `app/admin/prompts/tabs/GlobalPromptsTab.tsx`
- `app/admin/prompts/tabs/PromptExperimentsTab.tsx`

## 仓库卫生修复（重要）

### 1) 不要把 `.env.local` 提交进 git

已新增：
- `/.env.example`（可安全提交的模板）

建议：
- 在 Vercel / 服务器环境变量里配置真实值
- 本地使用 `.env.local`，但不要提交

### 2) 不要追踪 `.next/`

`.next/` 是构建产物，应该始终被 `.gitignore` 忽略，并且不应出现在 git diff 中。

## 上线/验收清单（建议）

- [ ] Supabase Migration 118 已执行成功（表/视图/RPC 可用）
- [ ] Vercel 环境变量已配置：`PROMPT_GEN_INTERNAL_TOKEN`、Supabase keys、`NEXT_PUBLIC_APP_URL` 等
- [ ] `npm run check:prompt-guards` 在 CI 中启用（阻断误改）
- [ ] 打开 `/prompts`、`/prompts-en`，确认响应头/页面 meta 中含 `noindex,nofollow`
- [ ] Admin `/admin/prompts` 页面可正常加载新列表与指标
- [ ] 执行一次小规模 batch generate（1 个 industry × 1 个 scene × 2 条），确认任务进度与落库正常

## 风险提示（必须看）

如果你的仓库历史中曾提交过真实密钥（例如 `.env.local` 被追踪过），请务必：
- **轮换/重置**相关密钥（Supabase service role、Stripe secret、OAuth secret 等）
- 检查 CI logs / 部署环境中是否暴露过

