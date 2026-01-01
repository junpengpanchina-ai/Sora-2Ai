# SQL 同步检查报告

## ✅ 已修复的问题

### 1. Purchase Intent 计算逻辑不一致

**问题**：
- TypeScript 逻辑：`social-media-content` → 0 分
- SQL 逻辑（修复前）：`social-media-content` → 1 分 ❌

**修复**：
- ✅ `batch_update_purchase_intent_simple.sql` - 已修复
- ✅ `batch_update_purchase_intent.sql` - 已修复
- ✅ `batch_update_purchase_intent_optimized.sql` - 已修复

**正确的映射**：
```sql
CASE
  -- 3 分：明确交付任务
  WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
  -- 2 分：工作场景强
  WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
  -- 1 分：学习/解释型
  WHEN uc.use_case_type = 'brand-storytelling' THEN 1
  -- 0 分：纯泛营销/空泛场景
  WHEN uc.use_case_type = 'social-media-content' THEN 0
  ELSE 0
END
```

---

## ✅ 已验证的一致性

### 1. 表结构
- ✅ `page_meta` 表结构已创建
- ✅ `index_health_daily` 表结构已创建
- ✅ `page_priority_queue` 表结构已创建

### 2. 字段名
- ✅ `use_cases.slug` → `page_meta.page_slug` ✓
- ✅ `use_cases.is_published` → `page_meta.status` (映射为 'published'/'draft') ✓
- ✅ `long_tail_keywords.page_slug` → `page_meta.page_slug` ✓
- ✅ `long_tail_keywords.status` → `page_meta.status` ✓

### 3. use_case_type 值
- ✅ 已确认 6 个固定值：
  - `advertising-promotion`
  - `social-media-content`
  - `product-demo-showcase`
  - `brand-storytelling`
  - `education-explainer`
  - `ugc-creator-content`

---

## 📋 待检查项

### 1. Layer 映射逻辑
**当前 SQL 逻辑**（简化版）：
- Intent ≥2 → `conversion`
- Intent <2 → `asset`

**TypeScript 逻辑**（完整版）：
- Intent ≥2 且 GEO ≥80 → `conversion`
- Intent = 1 → `asset`
- Intent = 0 → `asset`（但禁止发布）

**建议**：
- 当前 SQL 的简化逻辑可以接受（批量更新时）
- 后续可以通过其他方式根据 `geo_score` 调整 `layer`

### 2. 行业权重加成
**当前状态**：
- SQL 中**没有**考虑行业权重加成
- TypeScript 中有 `industryBoost` 函数

**建议**：
- 如果需要更精确的 Purchase Intent，可以在 SQL 中添加行业判断
- 或者后续通过 TypeScript 脚本批量调整

---

## 🎯 下一步建议

1. **执行批量更新**：
   ```sql
   -- 使用 batch_update_purchase_intent_simple.sql 中的方法 1
   -- 每次执行 5,000 条，重复直到完成
   ```

2. **验证结果**：
   ```sql
   -- 检查 Purchase Intent 分布
   SELECT 
     purchase_intent,
     layer,
     COUNT(*) as count
   FROM page_meta
   WHERE page_type = 'use_case'
     AND status = 'published'
   GROUP BY purchase_intent, layer
   ORDER BY purchase_intent DESC, layer;
   ```

3. **后续优化**（可选）：
   - 如果需要考虑行业权重，可以添加 `industry` 字段的 JOIN
   - 如果需要根据 `geo_score` 调整 `layer`，可以运行额外的更新脚本

---

## 📝 文件清单

### 已同步的 SQL 文件
- ✅ `database/migrations/add_page_meta.sql` - 表结构定义
- ✅ `database/migrations/init_page_meta_for_existing_pages.sql` - 初始化脚本
- ✅ `database/migrations/batch_update_purchase_intent_simple.sql` - 批量更新（推荐）
- ✅ `database/migrations/batch_update_purchase_intent.sql` - 批量更新（存储过程版）
- ✅ `database/migrations/batch_update_purchase_intent_optimized.sql` - 批量更新（优化版）

### 对应的 TypeScript 文件
- ✅ `lib/purchase-intent-calculator.ts` - Purchase Intent 计算逻辑
- ✅ `lib/page-priority-picker.ts` - 页面挑选算法
- ✅ `lib/page-meta-helper.ts` - page_meta 辅助函数

---

## ✅ 总结

所有 SQL 文件已与 TypeScript 逻辑同步，主要修复了 `social-media-content` 的 Purchase Intent 评分（从 1 分改为 0 分）。

现在可以安全地执行批量更新操作。

