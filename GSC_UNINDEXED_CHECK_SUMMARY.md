# GSC 未编入索引 URL 检查总结

**检查日期**: 2026-01-22  
**检查范围**: 未编入索引的 URL 和原因分析

---

## ✅ 已完成的工作

### 1. 创建检查脚本
- ✅ 创建了 `scripts/check-unindexed-urls.ts`
- ✅ 脚本可以：
  - 检查 noindex 设置
  - 检查 canonical 设置
  - 抽查页面内容质量
  - 统计问题分布

### 2. 抽查结果

**抽查了 10 个已发布页面**，发现：

| 检查项 | 结果 | 说明 |
|--------|------|------|
| H1 标签 | ✅ 100% 有 | 所有页面都有 H1 |
| 描述 | ✅ 100% 有 | 所有页面都有描述 |
| 内容长度 | ⚠️ 平均 600-700 词 | 建议 ≥800 词 |
| FAQ | ❌ 0% 有 | 所有页面都缺少 FAQ |
| Steps | ✅ 100% 有 | 所有页面都有步骤结构 |
| noindex | ✅ 0% 设置 | 没有阻止索引 |
| canonical | ✅ 100% 指向自己 | 没有重复内容问题 |
| in_sitemap | ⚠️ 需要验证 | 字段可能不准确 |

### 3. 发现的问题

#### ⚠️ 问题 1: robots.txt 指向错误的 sitemap

**发现**: 
- `app/robots.txt/route.ts` 指向 `/sitemap.xml`
- 应该指向 `/sitemap-index.xml`

**修复**: ✅ 已修复 `app/robots.txt/route.ts`

#### ⚠️ 问题 2: 内容偏短

**发现**: 抽查的页面平均 600-700 词，建议 ≥800 词

**影响**: 可能影响 Google 对页面质量的评估

**建议**: 
- 为重要页面（Tier 1）增加内容
- 添加 FAQ 部分（至少 3 个问题）

#### ⚠️ 问题 3: 缺少 FAQ

**发现**: 所有抽查的页面都缺少 FAQ

**影响**: FAQ 有助于提高页面质量和 SEO 排名

**建议**: 为重要页面添加 FAQ

---

## 📊 统计信息

**采样 1000 个页面**:
- ✅ 内容太短（<300词）: 0 (0.0%)
- ✅ 缺少 H1: 0 (0.0%)
- ✅ 缺少描述: 0 (0.0%)
- ✅ 设置了 noindex: 0 (0.0%)
- ✅ 设置了 canonical: 0 (0.0%)
- ⚠️ 不在 sitemap: 1000 (100.0%) - **需要验证**

**注意**: `in_sitemap` 字段的统计可能不准确，因为：
1. 这个字段可能没有被正确设置
2. Sitemap 生成逻辑可能不依赖这个字段

---

## 🔍 需要进一步检查

### 1. 检查 quality_status 分布

运行 SQL 查询：
```sql
SELECT 
  quality_status,
  COUNT(*) as count
FROM use_cases
WHERE is_published = true
GROUP BY quality_status
ORDER BY count DESC;
```

### 2. 检查 industry 字段

运行 SQL 查询：
```sql
SELECT 
  CASE 
    WHEN industry IS NULL THEN 'NULL'
    WHEN industry = '' THEN 'EMPTY'
    ELSE 'HAS_VALUE'
  END as industry_status,
  COUNT(*) as count
FROM use_cases
WHERE is_published = true
GROUP BY industry_status;
```

### 3. 验证 sitemap 实际包含的 URL

```bash
# 检查 sitemap-core.xml
curl -s https://sora2aivideos.com/sitemap-core.xml | grep -c "<url>"

# 检查 sitemap-tier1.xml
curl -s https://sora2aivideos.com/sitemap-tier1.xml | grep -c "<url>"
```

### 4. 在 GSC 中查看具体的未编入索引原因

根据您提供的 GSC 数据，有 **6 个未编入索引原因**。建议：
1. 在 GSC 中导出未编入索引的 URL 列表
2. 按原因分类统计
3. 针对每个原因制定修复策略

---

## 💡 建议的修复优先级

### 优先级 1: 修复 robots.txt ✅
- ✅ **已完成**: 修复 `app/robots.txt/route.ts`，指向 `/sitemap-index.xml`

### 优先级 2: 验证 sitemap 包含的页面
- ⏳ 检查 `quality_status` 分布
- ⏳ 检查 `industry` 字段分布
- ⏳ 验证 sitemap 实际包含的 URL 数量

### 优先级 3: 改善内容质量
- ⏳ 为重要页面添加 FAQ（至少 3 个）
- ⏳ 增加内容长度（目标 ≥800 词）

### 优先级 4: 在 GSC 中深入分析
- ⏳ 导出未编入索引的 URL 列表
- ⏳ 按原因分类统计
- ⏳ 针对每个原因制定修复策略

---

## 📋 相关文件

- 检查脚本: `scripts/check-unindexed-urls.ts`
- 详细分析: `UNINDEXED_URLS_ANALYSIS.md`
- Robots 配置: `app/robots.ts` 和 `app/robots.txt/route.ts`
- Sitemap 生成: `app/sitemap-core.xml/route.ts`

---

## 🎯 结论

1. ✅ **整体健康**: 抽查的页面都有 H1、描述和步骤结构
2. ⚠️ **需要改进**: 内容偏短，缺少 FAQ
3. ✅ **已修复**: robots.txt 指向正确的 sitemap
4. ⏳ **待验证**: sitemap 实际包含的页面数量

**下一步**: 在 GSC 中查看具体的未编入索引原因，并针对性地修复。

---

**报告生成时间**: 2026-01-22
