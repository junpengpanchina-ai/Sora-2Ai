# 未编入索引 URL 分析报告

**检查日期**: 2026-01-22  
**检查脚本**: `scripts/check-unindexed-urls.ts`

---

## 📊 检查结果摘要

### 1. 抽查的 10 个页面特征

所有抽查的页面都显示以下特征：

| 特征 | 状态 | 说明 |
|------|------|------|
| **H1 标签** | ✅ 有 | 所有页面都有 H1 |
| **描述** | ✅ 有 | 所有页面都有描述 |
| **内容长度** | ⚠️ 偏短 | 平均 600-700 词（建议 ≥800 词） |
| **FAQ** | ❌ 无 | 所有页面都缺少 FAQ |
| **Steps** | ✅ 有 | 所有页面都有步骤结构 |
| **noindex** | ✅ 否 | 没有设置 noindex |
| **canonical** | ✅ 无 | 都指向自己（正确） |
| **in_sitemap** | ❌ 不在 | **所有页面都不在 sitemap** |

### 2. 关键发现

#### ⚠️ 问题 1: 页面不在 sitemap

**发现**: 抽查的 10 个页面都显示 `in_sitemap: ❌ 不在 sitemap`

**可能原因**:
1. 这些页面的 `quality_status` 不是 `'approved'`
2. 这些页面没有 `industry` 字段
3. 这些页面不符合 sitemap 的筛选条件

**Sitemap 筛选条件**（根据代码分析）:
- ✅ `is_published = true`
- ✅ `quality_status = 'approved'`
- ✅ `industry IS NOT NULL`（某些 sitemap 需要）
- ✅ `use_case_type` 在允许的列表中

**建议**: 检查这些页面的 `quality_status` 和 `industry` 字段

#### ⚠️ 问题 2: 内容偏短

**发现**: 抽查的页面平均 600-700 词，建议 ≥800 词

**影响**: 内容偏短可能影响 Google 对页面质量的评估

**建议**: 
- 对于重要页面（Tier 1），考虑增加内容
- 添加 FAQ 部分（至少 3 个问题）
- 添加更多示例和用例

#### ✅ 正常情况

1. **H1 和描述**: 所有页面都有，符合 SEO 要求
2. **Steps 结构**: 所有页面都有，有助于结构化内容
3. **noindex**: 没有设置，允许索引
4. **canonical**: 都指向自己，没有重复内容问题

---

## 🔍 详细分析

### 抽查的页面列表

1. **skincare-brands-f04025cea3-in-skincare-ai-videos-are-used-for-product-development-journey-insights-t**
   - 内容: 642 词
   - 类型: brand-storytelling
   - 行业: Skincare Brands
   - 问题: 内容偏短，缺少 FAQ，不在 sitemap

2. **skincare-brands-58fb82b7ae-in-skincare-ai-videos-are-used-for-product-innovation-announcements-typic**
   - 内容: 607 词
   - 类型: brand-storytelling
   - 行业: Skincare Brands
   - 问题: 内容偏短，缺少 FAQ，不在 sitemap

3. **beauty-brands-20b12ce0e8-in-beauty-brands-ai-videos-are-used-for-story-of-our-scent-videos-typical-a**
   - 内容: 719 词
   - 类型: brand-storytelling
   - 行业: Beauty Brands
   - 问题: 缺少 FAQ，不在 sitemap

（其他页面类似...）

### 统计信息

**采样 1000 个页面**:
- ⚠️ 内容太短（<300词）: 0 (0.0%) ✅
- ⚠️ 缺少 H1: 0 (0.0%) ✅
- ⚠️ 缺少描述: 0 (0.0%) ✅
- ⚠️ 设置了 noindex: 0 (0.0%) ✅
- ⚠️ 设置了 canonical: 0 (0.0%) ✅
- ⚠️ **不在 sitemap: 1000 (100.0%)** ⚠️

**注意**: 这个统计可能不准确，因为 `in_sitemap` 字段可能没有被正确设置或使用。

---

## 🔧 需要检查的项目

### 1. 检查 quality_status

运行以下 SQL 查询，检查有多少页面的 `quality_status` 不是 `'approved'`:

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

运行以下 SQL 查询，检查有多少页面没有 `industry`:

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

### 3. 检查 sitemap 实际包含的页面

检查各个 sitemap 文件实际包含的 URL 数量:

```bash
# 检查 sitemap-core.xml
curl -s https://sora2aivideos.com/sitemap-core.xml | grep -c "<url>"

# 检查 sitemap-tier1.xml
curl -s https://sora2aivideos.com/sitemap-tier1.xml | grep -c "<url>"
```

### 4. 检查 robots.txt

**当前状态**: robots.txt 指向 `/sitemap.xml`，但根据最佳实践，应该指向 `/sitemap-index.xml`

**建议**: 检查 `app/robots.ts` 文件，确认 sitemap 路径是否正确。

---

## 💡 建议的修复步骤

### 优先级 1: 确认 sitemap 包含的页面

1. **检查 quality_status**
   - 如果大量页面的 `quality_status` 不是 `'approved'`，需要更新
   - 或者调整 sitemap 筛选条件，允许 `quality_status IS NULL`

2. **检查 industry 字段**
   - 如果大量页面没有 `industry`，需要补充
   - 或者调整 sitemap 筛选条件，允许 `industry IS NULL`

### 优先级 2: 改善内容质量

1. **添加 FAQ**
   - 为重要页面（Tier 1）添加至少 3 个 FAQ
   - FAQ 有助于提高页面质量和 SEO 排名

2. **增加内容长度**
   - 目标: ≥800 词（特别是 Tier 1 页面）
   - 添加更多示例、用例和详细说明

### 优先级 3: 验证 robots.txt

确认 `app/robots.ts` 中的 sitemap 路径指向 `/sitemap-index.xml`（而不是 `/sitemap.xml`）

---

## 📋 下一步行动

1. ✅ **已完成**: 创建检查脚本
2. ✅ **已完成**: 抽查 10 个页面
3. ⏳ **待执行**: 检查 `quality_status` 分布
4. ⏳ **待执行**: 检查 `industry` 字段分布
5. ⏳ **待执行**: 验证 sitemap 实际包含的 URL
6. ⏳ **待执行**: 在 GSC 中查看具体的未编入索引原因

---

## 🔗 相关文件

- 检查脚本: `scripts/check-unindexed-urls.ts`
- Sitemap 生成: `app/sitemap-core.xml/route.ts`
- Robots 配置: `app/robots.ts`
- 页面渲染: `app/use-cases/[slug]/page.tsx`

---

**报告生成时间**: 2026-01-22  
**检查工具**: TypeScript 脚本 + Supabase 查询
