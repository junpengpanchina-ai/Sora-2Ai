# GSC URL 自动标签工具 - 工程验收 Checklist

> **目标**：确保脚本运行后，数据完整、标签准确、可直接用于批量处理  
> **使用时机**：脚本运行完成后，执行 SQL 前

---

## ✅ 验收 Checklist（5 条 SQL）

### 1. 数据完整性检查

```sql
-- 检查总记录数
SELECT count(*) FROM seo_gsc_urls;
```

**预期**：应与 CSV 文件中的 URL 数量一致（或略少，因为可能跳过非允许域名）

---

### 2. 标签分布检查

```sql
-- 检查标签分布
SELECT tag, count(*) 
FROM seo_gsc_urls 
GROUP BY tag 
ORDER BY count DESC;
```

**预期**：
- 所有记录都有标签（tag 不为 NULL）
- 分布合理：
  - `keep`: 通常最多（60-70%）
  - `enhance`: 次之（20-30%）
  - `delete`: 最少（10-20%）

---

### 3. 抓取成功率检查

```sql
-- 检查抓取失败的数量
SELECT count(*) 
FROM seo_gsc_urls 
WHERE http_status IS NULL;
```

**预期**：
- 失败率 < 10%（正常）
- 失败率 10-20%（可接受，可能是限流）
- 失败率 > 20%（需要检查网络/限流设置）

---

### 4. Canonical 检查

```sql
-- 检查 canonical 指向其他页面的数量
SELECT count(*) 
FROM seo_gsc_urls 
WHERE canonical_url IS NOT NULL 
  AND canonical_url <> '' 
  AND canonical_url <> url;
```

**预期**：
- 有 canonical 重定向的记录应被标记为 `enhance` 或 `keep`
- 检查是否有误判

---

### 5. 最近处理记录检查

```sql
-- 查看最近处理的 20 条记录
SELECT url, reason, http_status, word_count, tag, tag_reason, notes
FROM seo_gsc_urls 
ORDER BY last_seen_at DESC 
LIMIT 20;
```

**预期**：
- 所有字段都有值（或合理的 NULL）
- `tag` 和 `tag_reason` 匹配
- `notes` 字段包含有用的信息（如 skipped_non_host、fetch_blocked 等）

---

## 🔍 详细检查项

### 检查 1：非允许域名是否被跳过

```sql
-- 检查被跳过的非允许域名
SELECT 
  url,
  notes,
  tag,
  tag_reason
FROM seo_gsc_urls
WHERE notes LIKE '%skipped_non_host%'
LIMIT 20;
```

**预期**：
- 所有非允许域名的 URL 都被标记为 `skipped_non_host`
- 这些记录不应影响后续处理

---

### 检查 2：限流/429 错误处理

```sql
-- 检查限流错误
SELECT 
  url,
  http_status,
  notes,
  tag,
  tag_reason
FROM seo_gsc_urls
WHERE notes LIKE '%rate_limited%' OR http_status IN (429, 403)
LIMIT 20;
```

**预期**：
- 429/403 错误应被记录在 `notes` 中
- 这些记录可能需要手动重试

---

### 检查 3：内容过薄页面识别

```sql
-- 检查内容过薄的页面
SELECT 
  url,
  word_count,
  tag,
  tag_reason
FROM seo_gsc_urls
WHERE word_count IS NOT NULL
  AND word_count < 250
ORDER BY word_count ASC
LIMIT 50;
```

**预期**：
- `word_count < 120` → `tag = 'delete'`
- `word_count 120-250` → `tag = 'enhance'`

---

### 检查 4：Canonical 分类准确性

```sql
-- 检查 canonical 指向站内的记录
SELECT 
  url,
  canonical_url,
  tag,
  tag_reason,
  notes
FROM seo_gsc_urls
WHERE canonical_url IS NOT NULL
  AND canonical_url != ''
  AND canonical_url != url
  AND tag = 'enhance'
LIMIT 20;
```

**预期**：
- Canonical 指向站内其他页 → `tag = 'enhance'`, `tag_reason = 'canonical_points_elsewhere_internal'`
- Canonical 指向外站 → `tag = 'keep'`, `tag_reason = 'canonical_points_external'`, `notes` 包含外站 URL

---

### 检查 5：use_cases 表匹配检查

```sql
-- 检查可以匹配到 use_cases 表的 URL
WITH gsc AS (
  SELECT
    url,
    tag,
    regexp_replace(url, '.*/use-cases/([^/?#]+).*', '\1') AS slug
  FROM seo_gsc_urls
  WHERE url LIKE '%/use-cases/%'
)
SELECT 
  gsc.slug,
  gsc.url,
  gsc.tag,
  CASE 
    WHEN uc.id IS NOT NULL THEN 'MATCHED'
    ELSE 'NOT_FOUND'
  END as match_status
FROM gsc
LEFT JOIN use_cases uc ON uc.slug = gsc.slug
ORDER BY match_status, gsc.tag
LIMIT 50;
```

**预期**：
- 大部分 `/use-cases/` 路径的 URL 应该能匹配到 `use_cases` 表
- 如果 `NOT_FOUND` 过多，可能需要检查 slug 提取逻辑

---

## 🚨 问题排查

### 问题 1：大量记录 tag 为 NULL

**可能原因**：
- 分类逻辑未执行
- 数据导入不完整

**解决方案**：
```sql
-- 手动执行分类 SQL
-- 执行 supabase/migrations/109_auto_label_gsc_urls.sql
```

---

### 问题 2：抓取失败率过高

**可能原因**：
- 并发数过高
- 限流设置过严
- 网络问题

**解决方案**：
```bash
# 降低并发数
CONCURRENCY=10 RATE_LIMIT_MS=200 node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql
```

---

### 问题 3：Canonical 分类不准确

**可能原因**：
- 域名判断逻辑问题
- URL 格式不一致

**解决方案**：
```sql
-- 手动检查并修正
SELECT url, canonical_url, tag, tag_reason
FROM seo_gsc_urls
WHERE canonical_url IS NOT NULL
  AND canonical_url != url
  AND tag != 'enhance'
  AND tag != 'keep'
LIMIT 20;
```

---

## 📊 验收标准

### ✅ 通过标准

- [ ] 总记录数 = CSV 文件 URL 数量（或略少，因为跳过非允许域名）
- [ ] 所有记录都有标签（tag 不为 NULL）
- [ ] 标签分布合理（keep 60-70%, enhance 20-30%, delete 10-20%）
- [ ] 抓取失败率 < 20%
- [ ] Canonical 分类准确（站内 → enhance, 外站 → keep）
- [ ] 最近处理记录字段完整

### ⚠️ 需要关注

- [ ] 抓取失败率 10-20%（可能需要重试）
- [ ] 大量记录 tag 为 NULL（需要执行分类 SQL）
- [ ] Canonical 分类不准确（需要手动检查）

### ❌ 不通过

- [ ] 抓取失败率 > 30%
- [ ] 大量记录 tag 为 NULL 且无法修复
- [ ] 数据不完整（字段大量缺失）

---

## 🎯 下一步

验收通过后：

1. ✅ **批量处理 use_cases**：执行批量更新 SQL
2. ✅ **监控效果**：持续监控 GSC 健康指标
3. ✅ **增强内容**：使用 Tier Page 模板 V2 增强页面

---

**相关文档**：
- [完整使用指南](./GSC_AUTO_LABELING_COMPLETE_GUIDE.md)
- [批量处理 use_cases](./GSC_AUTO_LABELING_COMPLETE_GUIDE.md#批量处理-use_cases)
