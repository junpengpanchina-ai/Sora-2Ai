# 1375 个重定向 URL 处理完成总结

## ✅ 已完成的工作

### 1. 数据库迁移：重定向命中量统计表

**文件**: `supabase/migrations/134_redirect_hit_daily_counts.sql`

- ✅ 创建 `redirect_hit_daily_counts` 表
- ✅ 记录每日 pattern hit 次数
- ✅ 作为 Index Gate 的证据链

**执行**:
```bash
# 在 Supabase 中执行迁移
supabase migration up 134
```

---

### 2. Middleware 重定向处理

**文件**: `middleware.ts`

- ✅ 添加 `/video?prompt=...` → `/video` (308) 重定向
- ✅ 使用 `reportBadUrlHit()` 记录命中
- ✅ 确保是单跳（最多 1 次 Location）
- ✅ 更新 matcher 配置，包含 `/video` 路径

**验收**:
```bash
# 测试重定向
curl -I "https://sora2aivideos.com/video?prompt=test"
# 应该返回 308 和 Location: /video
```

---

### 3. Sitemap 门禁增强

**文件**: `lib/seo/sitemapGuards.ts`

- ✅ 新增 `filterUrlsWithPromptParam()` 函数
- ✅ 新增 `assertNoRedirectPatterns()` 断言函数
- ✅ 确保所有 sitemap 不输出会重定向的 URL

**已更新**:
- ✅ `app/sitemap-static.xml/route.ts` - 添加断言

**待更新**（可选，因为其他 sitemap 不生成 /video URL）:
- `app/sitemap-use-cases.xml/route.ts`
- `app/sitemap-long-tail.xml/route.ts`
- `app/sitemap-core.xml/route.ts`

---

### 4. URL 分析脚本

**文件**: `scripts/analyze-redirect-urls.ts`

**用法**:
```bash
# 将 URL 列表保存到 urls.txt，然后运行：
tsx scripts/analyze-redirect-urls.ts < urls.txt

# 或输出 JSON 格式：
OUTPUT_JSON=1 tsx scripts/analyze-redirect-urls.ts < urls.txt
```

**功能**:
- ✅ 分析 URL pattern
- ✅ 统计去重结果
- ✅ 生成处理报告

---

### 5. 文档

**文件**: `docs/REDIRECT_URLS_PROCESSING.md`

- ✅ 完整的问题分析
- ✅ 处理方案说明
- ✅ 验收清单
- ✅ 排查指南

---

## 🎯 下一步操作

### 1. 执行数据库迁移

```bash
# 在 Supabase Dashboard 中执行，或使用 CLI：
supabase migration up 134
```

### 2. 验证 Middleware 重定向

```bash
# 抽样检查 10 条 URL
for url in $(head -10 urls.txt); do
  echo "Checking: $url"
  curl -I "$url" 2>&1 | grep -i "location:"
done
```

### 3. 验证 Sitemap 纯净度

```bash
# 检查所有 sitemap 不包含带 prompt 参数的 URL
curl -s https://sora2aivideos.com/sitemap-static.xml | grep -E "\?prompt="
# 应该返回空（无匹配）
```

### 4. 监控重定向命中量（3 天）

```sql
-- 查看今日重定向命中量
SELECT pattern, hits, sample_url
FROM redirect_hit_daily_counts
WHERE date = CURRENT_DATE
ORDER BY hits DESC;

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

---

## 📊 预期结果

### Pattern 统计（运行分析脚本后）

- **Pattern**: `video_prompt_param` - 1375 条
- **Canonical URL 数**: 1 条（`/video`）
- **去重率**: 99.93%

### 重定向行为

- **源 URL**: `https://sora2aivideos.com/video?prompt=...`
- **目标 URL**: `https://sora2aivideos.com/video`
- **状态码**: 308（永久重定向）
- **跳数**: 1 跳（单跳）

### Sitemap 行为

- ✅ 不包含任何带 `prompt` 参数的 URL
- ✅ 只输出最终 canonical 的 URL（`/video`）

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

## ✅ 验收清单

- [ ] 数据库迁移已执行（`redirect_hit_daily_counts` 表存在）
- [ ] Middleware 重定向测试通过（单跳 308）
- [ ] Sitemap 不包含带 prompt 参数的 URL
- [ ] 计数表开始记录数据（`redirect_hit_daily_counts`）
- [ ] 观察 3 天：pattern hit 趋势下降

---

## 📝 相关文件

- `supabase/migrations/134_redirect_hit_daily_counts.sql` - 计数表
- `middleware.ts` - 重定向逻辑
- `lib/seo/sitemapGuards.ts` - Sitemap 门禁
- `lib/seo/bad-url-report.ts` - 坏 URL 打点
- `app/sitemap-static.xml/route.ts` - Sitemap 生成（已更新）
- `scripts/analyze-redirect-urls.ts` - URL 分析脚本
- `docs/REDIRECT_URLS_PROCESSING.md` - 完整文档

---

## 🎯 最终目标

**让 Google 最终只看到 1 条 canonical（200），不要长期消耗在 3xx 链路上。**

通过以上措施：
1. ✅ Sitemap 不输出会重定向的 URL
2. ✅ Middleware 确保重定向是单跳且永久
3. ✅ 计数表监控重定向命中量，确保收敛
