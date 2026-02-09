# 1375 个重定向 URL 处理方案

## 📋 问题概述

发现 1375 个会自动重定向的 URL，这些 URL 会消耗 Google 的 crawl budget。

**目标**：让 Google 最终只看到 1 条 canonical（200），不要长期消耗在 3xx 链路上。

---

## 🔍 URL 来源分析

**结论**：**A) 站内自己生成出来的坏链接**

**证据**：
- 所有 URL 都是 `/video?prompt=...` 格式
- prompt 参数都是 "Create a professional ..." 开头
- 统一的格式表明来自站内工具（use-case 页面或某个生成器）

---

## ✅ 处理方案（三段式）

### A) 分类结果

这 1375 条属于 **第 1 类：结构性坏 URL**

- **Pattern**: `video_prompt_param`
- **原因**: prompt 参数不参与 SEO，应该被规范化
- **处理**: 统一 **308 → canonical**（去掉 prompt 参数）

---

### B) 已实施的 3 项措施

#### ✅ 1. Sitemap 门禁（最关键的"止血"）

**文件**: `lib/seo/sitemapGuards.ts`

- ✅ 新增 `filterUrlsWithPromptParam()` 函数
- ✅ 新增 `assertNoRedirectPatterns()` 断言函数
- ✅ 所有 sitemap 生成函数必须使用这些过滤器

**验收标准**：
- sitemap 里 **只输出最终 canonical 的 URL**
- 所有带 `prompt` 参数的 URL **一律不输出**

#### ✅ 2. Middleware 单跳重定向（确保永久）

**文件**: `middleware.ts`

- ✅ 添加 `/video?prompt=...` → `/video` (308) 重定向
- ✅ 使用 `reportBadUrlHit()` 记录命中
- ✅ 确保是单跳（最多 1 次 Location）

**验收标准**：
- `curl -I "https://sora2aivideos.com/video?prompt=xxx"` 最多返回 1 次 Location
- 重定向状态码是 308（永久重定向）

#### ✅ 3. 重定向命中量统计表

**文件**: `supabase/migrations/134_redirect_hit_daily_counts.sql`

- ✅ 创建 `redirect_hit_daily_counts` 表
- ✅ 记录每日 pattern hit 次数
- ✅ 作为 Index Gate 的证据链

**验收标准**：
- 趋势下降到接近 0
- 作为 Index Gate 的证据链

---

## 📊 Pattern 统计

运行分析脚本：

```bash
# 将 URL 列表保存到 urls.txt，然后运行：
tsx scripts/analyze-redirect-urls.ts < urls.txt
```

**预期结果**：
- Pattern: `video_prompt_param` - 1375 条
- Canonical URL 数: 1 条（`/video`）
- 去重率: 99.93%

---

## 🎯 验收清单

### 1. Sitemap 纯净度 ✅

```bash
# 检查所有 sitemap 不包含带 prompt 参数的 URL
curl -s https://sora2aivideos.com/sitemap.xml | grep -E "\?prompt="
# 应该返回空（无匹配）
```

### 2. 重定向单跳 ✅

```bash
# 抽样检查 30 条
for url in $(head -30 urls.txt); do
  echo "Checking: $url"
  curl -I "$url" 2>&1 | grep -i "location:"
done
# 每个 URL 最多返回 1 次 Location
```

### 3. 计数表监控 ✅

```sql
-- 查看今日重定向命中量
SELECT pattern, hits, sample_url
FROM redirect_hit_daily_counts
WHERE date = CURRENT_DATE
ORDER BY hits DESC;
```

### 4. 趋势观察（3 天）✅

```sql
-- 查看过去 7 天的趋势
SELECT 
  date,
  pattern,
  hits,
  LAG(hits) OVER (PARTITION BY pattern ORDER BY date) as prev_hits
FROM redirect_hit_daily_counts
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC, pattern;
```

**验收标准**：
- `video_prompt_param` 的 hits 必须下降
- 如果 hits 不下降，说明还有复发源（内链 / sitemap / 生成器）

---

## 🚨 如果 hits 不下降怎么办？

### 排查复发源

1. **检查内链**
   ```bash
   # 搜索代码库中生成 /video?prompt= 的地方
   grep -r "/video?prompt=" app/ components/
   ```

2. **检查 sitemap 生成器**
   ```bash
   # 确保所有 sitemap 路由都使用了 filterUrlsWithPromptParam()
   grep -r "sitemap" app/ | grep -E "route\.ts|\.xml"
   ```

3. **检查外部链接**
   - Google Search Console → 链接 → 外部链接
   - 查找指向 `/video?prompt=` 的外部链接

---

## 📝 相关文件

- `middleware.ts` - 重定向逻辑
- `lib/seo/sitemapGuards.ts` - Sitemap 门禁
- `lib/seo/bad-url-report.ts` - 坏 URL 打点
- `supabase/migrations/134_redirect_hit_daily_counts.sql` - 计数表
- `scripts/analyze-redirect-urls.ts` - URL 分析脚本

---

## 🎯 最终目标

**让 Google 最终只看到 1 条 canonical（200），不要长期消耗在 3xx 链路上。**

通过以上措施：
1. ✅ Sitemap 不输出会重定向的 URL
2. ✅ Middleware 确保重定向是单跳且永久
3. ✅ 计数表监控重定向命中量，确保收敛
