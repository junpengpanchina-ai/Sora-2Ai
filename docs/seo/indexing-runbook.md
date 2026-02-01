# Indexing Runbook（404/5xx 止血 → 验收 → 放量）

> 适用范围：sora2aivideos.com  
> 目标：确保 Googlebot 抓取时永不出现 5xx；404 可控；坏 URL 自动收敛；满足 Index Gate 放量门槛。  
> 原则：**隔离 > 自动化 > 扩容**（Prompt 永不参与 SEO）

---

## 0. 本次修复基线（已完成）

### A) Middleware 规范化重定向
- `/keywords/keywords-*`、`/keywords/keywords-keywords-*` → **308** → `/keywords/*`（canonical）
- `/use-cases/*-[0-9a-f]{10,}-*`（hex 异常） → **308** → `/use-cases/<first>`

### B) Keywords 页兜底
- bad slug → **308** 到 canonical
- DB 查不到 → `notFound()`（返回 404，禁止 throw 500）

### C) 加固：单测 + sitemap 门禁 + 坏 URL 计数
- **单测**：`npm run test:keyword-slug` 验证 `normalizeKeywordSlug` / `isBadKeywordSlug`
- **sitemap 门禁**：生成前 `assertNoBadKeywordSlugs`，`SITEMAP_STRICT_ASSERT=1` 时 fail
- **坏 URL 计数**：middleware 命中时上报 → `bad_url_daily_counts`，cron 每日汇总日志

### D) 复发源全断（规范化集中在 url/schema/text-recognition/内链/sitemap）
- `lib/utils/url.ts`：`getKeywordPageUrl / getKeywordPath` 输出前统一 normalize
- `lib/keywords/schema.ts`：normalizeSlug 先去重复前缀再加前缀
- `lib/keywords/text-recognition.ts`：extractPageSlug 输出规范化
- 内链 href：统一使用 `getKeywordPath()`
- `sitemap-long-tail`：过滤 bad slugs + 依赖 `getKeywordPageUrl`

---

## 1. 冒烟测试（上线后 0–2 小时）

### 1.1 抽样清单（建议每次部署都跑）
从历史 GSC 导出里抽样：
- 5xx URL 5 条（包含 `keywords-keywords-*` 与 `keywords-keywords-keywords-*`）
- 404 URL 5 条
- use-cases hex 异常 1 条

**验收标准：**
- 旧坏 URL 最终必须是：`308/301 → 200` 或 `308/301 → 404(notFound)`
- **绝不允许**：500 / 502 / 503 / 505 / 5xx

### 1.2 curl 快速验证命令
> 用 `-I` 看 header，重点看 `Location`、状态码链路

```bash
# 1) keywords 重复前缀
curl -I "https://sora2aivideos.com/keywords/keywords-xxx"

# 2) keywords 重复两次前缀
curl -I "https://sora2aivideos.com/keywords/keywords-keywords-xxx"

# 3) use-cases hex 异常
curl -I "https://sora2aivideos.com/use-cases/fitness-<hex>-xxx"
```

**期望：**
- 返回 `308` 并带 `Location: https://sora2aivideos.com/keywords/<cleaned>`
- 最终页 `200` 或 `404`（notFound）

---

## 2. 线上日志验证（上线后 0–24 小时）

### 2.1 监控目标

确认 Googlebot 访问旧坏 URL 时：
- 响应为 **308/404**（可接受）
- **0 个 5xx**

### 2.2 建议日志/指标（可选但强烈推荐）

统计请求路径命中次数（每日汇总）：
- `/keywords/keywords-`
- `/keywords/keywords-keywords-`
- `/use-cases/.*-[0-9a-f]{10,}-`

**期望趋势：**
- 部署后仍会有命中（历史爬虫缓存/旧链接）
- 但应持续下降，最终接近 0

---

## 3. GSC 验收（上线后 1–3 天，按趋势看）

> 注意：GSC 非实时，**看趋势**不看单日绝对值。

### 3.1 必看面板

GSC → Indexing → Pages：
- 服务器错误 (5xx)（P0）
- 未找到 (404)（P1）
- 已抓取 - 尚未编入索引 / 已发现 - 尚未编入索引（观察项）

### 3.2 验证修复（推荐）

- 对 **服务器错误 (5xx)** 先点「验证修复」
- 再对 **未找到 (404)** 点「验证修复」

**通过判定：**
- 5xx 不再新增，验证能通过（通常需要 Google 再抽检一段时间）

### 3.3 URL 检查抽检（实时测试）

对每类抽 2–3 条旧坏 URL：
- `keywords-keywords-*`
- `keywords-keywords-keywords-*`
- use-cases hex 异常

观察：
- 是否显示「已重定向」
- 抓取是否成功
- 是否不再出现服务器错误

---

## 4. 放量门槛（Index Gate 决策）

> 放量只由 Index Gate 决定；趋势数据只做决策，不做页面。

### 4.1 允许放量（最低门槛）

满足以下两条即可进入「可控放量」：

1. **服务器错误 (5xx) 连续 3 天不再新增**（或新增≈0）
2. 抽样 URL 检查：旧坏 URL 全部是 `308/200/404(notFound)`，无任何 5xx

### 4.2 不允许放量（硬阻断）

出现任一情况：
- 仍有 5xx 新增
- middleware 重定向失效（坏 URL 直接 200/500）
- keywords 页仍可能 throw 500（notFound 未覆盖）

---

## 5. 复发预防（制度化回归）

### 5.1 sitemap 自检门禁（建议）

sitemap 生成时：
- 若 slug 仍以 `keywords-` 开头（或出现重复前缀），则：
  - 不输出该 URL
  - 记录日志/计数（用于监控）

### 5.2 内链统一入口（强制约束）

- 全站生成 keywords 链接统一使用 `getKeywordPath()` / `getKeywordPageUrl()`
- 禁止手拼 `/keywords/${slug}`

### 5.3 页面兜底永不回退

- DB 查不到：必须 `notFound()`
- bad slug：必须 canonical redirect（308/301）
- 禁止任何未捕获异常导致 5xx

---

## 6. 处理策略备忘（301 vs 308 vs 404 vs 410）

- **308/301**：旧坏 URL 有明确 canonical 目标（如重复前缀、结构性变更）
- **404(notFound)**：页面确实不存在且无需保留（可接受但会慢慢收敛）
- **410**：确认永久删除且不再回来（比长期 404 更「干净」）
- **5xx**：禁止出现（影响抓取与站点健康，必须 P0）

---

## 7. 附：抽样清单模板（每次部署填一次）

| 类型 | URL | 期望链路 | 实际结果 |
|------|-----|----------|----------|
| 5xx样本 | https://.../keywords/keywords-xxx | 308 → /keywords/xxx → 200/404 | |
| 5xx样本 | https://.../keywords/keywords-keywords-xxx | 308 → /keywords/xxx → 200/404 | |
| 404样本 | https://.../keywords/keywords-yyy | 308 → /keywords/yyy → 200/404 | |
| use-cases异常 | `.../use-cases/fitness-<hex>-zzz` | 308 → /use-cases/fitness → 200/404 | |

---

## 8. 责任与升级

- **P0**：任何 5xx 新增 → 立刻回滚/热修 middleware & page notFound
- **P1**：404 持续增加 → 排查 sitemap/内链/slug 生成器是否复发
- **P2**：已抓取/已发现未编入索引 → 内容质量与内链结构优化（不影响本 runbook 的稳定性目标）

---

---

## 9. 环境变量（坏 URL 计数）

| 变量 | 用途 |
|------|------|
| `INTERNAL_METRICS_SECRET` | 打点 API + cron 鉴权 |
| `INTERNAL_METRICS_ENDPOINT` | 打点 URL，如 `https://sora2aivideos.com/api/internal/bad-url-hit` |
| `CRON_SECRET` | （可选）Vercel cron 鉴权；外部 cron 需手动带 `?secret=xxx` 或 `Authorization: Bearer xxx` |
| `SITEMAP_STRICT_ASSERT` | （可选）`1` 时 sitemap 发现 bad slug 直接 fail build |

---

*最后更新：2026-02-01 | 关联：docs/决策卡_锁仓与增量投放.md*
