# ✅ Tier 初始化与场景数据设置 - 执行清单

## 🎯 执行顺序（已确认）

1. ✅ **执行 069_initialize_scene_tiers.sql**（初始化 tier）
2. ✅ **验证：检查 Tier1 场景数是否 > 0**
3. ✅ **执行 068_setup_scene_data.sql**（设置 in_sitemap 和 AI 分数）

---

## 📋 详细步骤

### 步骤 1：初始化场景的 tier 值

**文件**：`supabase/migrations/069_initialize_scene_tiers.sql`

**操作**：
1. 在 Supabase SQL Editor 中打开文件
2. 执行整个文件（包括所有 DO $$ 块）
3. 查看执行结果

**预期输出**：
```
NOTICE: ✅ 为 X 个场景设置了 tier = 1
NOTICE: ✅ 为 X 个场景设置了 tier = 2
NOTICE: ✅ 为 X 个场景设置了 tier = 3
NOTICE: 
NOTICE: 📊 初始化结果统计：
NOTICE:   - Tier1 场景数: X
NOTICE:   - Tier2 场景数: X
NOTICE:   - Tier3 场景数: X
NOTICE:   - 仍有 NULL tier: 0
```

**✅ 验证查询**（脚本末尾会自动运行，或手动运行）：
```sql
SELECT 
  '初始化后状态' as check_type,
  COUNT(*) as "总场景数",
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数",
  COUNT(*) FILTER (WHERE tier = 2) as "Tier2场景数",
  COUNT(*) FILTER (WHERE tier = 3) as "Tier3场景数",
  COUNT(*) FILTER (WHERE tier IS NULL) as "tier仍为NULL",
  COUNT(*) FILTER (WHERE tier = 1 AND is_published = TRUE AND noindex = FALSE) as "Tier1且已发布且可索引"
FROM use_cases;
```

**✅ 成功标志**：
- `Tier1场景数` > 0
- `Tier1且已发布且可索引` > 0

---

### 步骤 2：验证 Tier1 场景数

**快速验证查询**：
```sql
SELECT 
  COUNT(*) as "总场景数",
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数",
  COUNT(*) FILTER (WHERE tier = 1 AND is_published = TRUE) as "Tier1且已发布"
FROM use_cases;
```

**✅ 必须满足**：
- `Tier1场景数` > 0

**❌ 如果不满足**：
- 检查步骤 1 的执行结果
- 检查是否有错误信息
- 确认场景是否符合设置条件（`is_published = TRUE` 且 `noindex = FALSE`）

---

### 步骤 3：设置场景数据（in_sitemap 和 AI 分数）

**文件**：`supabase/migrations/068_setup_scene_data.sql`

**操作**：
1. 在 Supabase SQL Editor 中打开文件
2. 执行整个文件（包括所有 DO $$ 块）
3. 查看执行结果

**预期输出**：
```
NOTICE: ✅ 为 X 个 Tier1 场景设置了 in_sitemap = TRUE
NOTICE: ✅ 为 X 个 Tier1 场景设置了初始 AI 分数 0.7
NOTICE: ✅ 为 X 个 Tier2 场景设置了初始 AI 分数 0.5
NOTICE: 
NOTICE: 📊 设置结果统计：
NOTICE:   - Tier1 场景总数: X
NOTICE:   - Tier1 且 in_sitemap = TRUE: X
NOTICE:   - AI分数 >= 0.65 的场景数: X
```

**✅ 验证查询**（脚本末尾会自动运行，或手动运行）：
```sql
SELECT 
  '场景数据设置结果' as check_type,
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景总数",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE) as "Tier1且in_sitemap=true",
  COUNT(*) FILTER (WHERE tier = 1 AND ai_citation_score >= 0.65) as "Tier1且AI分数>=0.65",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE AND ai_citation_score >= 0.65 AND noindex = FALSE) as "符合自动绑定条件的场景数"
FROM use_cases;
```

**✅ 成功标志**：
- `Tier1场景总数` > 0
- `Tier1且in_sitemap=true` > 0
- `Tier1且AI分数>=0.65` > 0
- `符合自动绑定条件的场景数` > 0

---

## 🔍 完整验证查询（所有步骤完成后）

执行完所有步骤后，运行这个查询验证最终状态：

```sql
SELECT 
  '最终状态汇总' as check_type,
  COUNT(*) as "总场景数",
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE) as "Tier1且in_sitemap=true",
  COUNT(*) FILTER (WHERE tier = 1 AND ai_citation_score >= 0.65) as "Tier1且AI分数>=0.65",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE AND ai_citation_score >= 0.65 AND noindex = FALSE) as "符合自动绑定条件",
  COUNT(*) FILTER (WHERE tier = 2) as "Tier2场景数",
  COUNT(*) FILTER (WHERE tier = 2 AND ai_citation_score >= 0.5) as "Tier2且AI分数>=0.5"
FROM use_cases;
```

**✅ 所有计数都应该 > 0**（除了可能为 0 的 Tier2 相关计数）

---

## ⚠️ 常见问题

### 问题 1：步骤 1 执行后 Tier1 场景数仍然是 0

**可能原因**：
- 所有场景都是 `is_published = FALSE` 或 `noindex = TRUE`
- 脚本执行失败但没有显示错误

**解决方案**：
```sql
-- 检查场景状态
SELECT 
  COUNT(*) FILTER (WHERE is_published = TRUE) as "已发布",
  COUNT(*) FILTER (WHERE is_published = FALSE) as "未发布",
  COUNT(*) FILTER (WHERE noindex = FALSE) as "可索引",
  COUNT(*) FILTER (WHERE noindex = TRUE) as "不可索引",
  COUNT(*) FILTER (WHERE is_published = TRUE AND noindex = FALSE) as "已发布且可索引"
FROM use_cases;

-- 如果"已发布且可索引" > 0，但 tier 仍未设置，可以手动设置
UPDATE use_cases
SET tier = 1
WHERE tier IS NULL
  AND is_published = TRUE
  AND noindex = FALSE
LIMIT 100;  -- 先测试前 100 个
```

### 问题 2：步骤 3 执行后数据没有更新

**可能原因**：
- Tier1 场景不存在
- 场景状态不符合条件

**解决方案**：
```sql
-- 检查 Tier1 场景的详细状态
SELECT 
  tier,
  is_published,
  noindex,
  in_sitemap,
  ai_citation_score,
  COUNT(*) as count
FROM use_cases
WHERE tier = 1
GROUP BY tier, is_published, noindex, in_sitemap, ai_citation_score
ORDER BY count DESC;
```

---

## ✅ 执行清单

- [ ] 步骤 1：执行 `069_initialize_scene_tiers.sql`
- [ ] 步骤 1 验证：检查 Tier1 场景数 > 0
- [ ] 步骤 2：执行 `068_setup_scene_data.sql`
- [ ] 步骤 2 验证：检查所有设置是否成功
- [ ] 最终验证：运行完整验证查询

---

## 🚀 开始执行

准备好后，按照步骤 1 → 步骤 2 → 步骤 3 的顺序执行。

每个步骤完成后运行验证查询，确保结果符合预期。

如有问题，请提供执行结果或错误信息。
