# 🔧 修复 Tier 分配并继续执行

## 📊 诊断结果

从 `070_check_scene_status.sql` 的执行结果看：
- ✅ **Tier2场景数**：216,273
- ✅ **已发布**：215,697
- ✅ **noindex=false**：216,273（**所有场景都是可索引的**）

**问题发现**：所有 Tier2 场景都是 `noindex = FALSE`，但按策略应该设置为 Tier1！

根据脚本 069 的策略：
- **Tier1**：`is_published = TRUE AND noindex = FALSE`
- **Tier2**：`is_published = TRUE AND noindex = TRUE`

所以这些场景应该被设置为 Tier1，而不是 Tier2。

---

## ✅ 解决方案

### 步骤 1：修复 Tier 分配

**执行脚本**：`071_fix_tier_assignment.sql`

这个脚本会：
1. 将 `tier = 2 AND is_published = TRUE AND noindex = FALSE` 的场景调整为 Tier1
2. 将 `tier = 2 AND is_published = FALSE` 的场景调整为 Tier3
3. 保持 `tier = 2 AND is_published = TRUE AND noindex = TRUE` 的场景为 Tier2

**预期结果**：
```
NOTICE: ✅ 将 X 个场景从 Tier2 调整为 Tier1
NOTICE: 📊 修复后统计：
NOTICE:   - Tier1 场景数: X（应该是 215,697 左右）
NOTICE:   - Tier2 场景数: X（应该是 0）
NOTICE:   - Tier3 场景数: X（应该是 576 左右）
```

### 步骤 2：验证修复结果

运行验证查询（脚本末尾的 SELECT），应该看到：
- `Tier1场景数` > 0（应该是 215,697 左右）
- `Tier1且已发布且可索引` > 0

### 步骤 3：继续执行脚本 068

如果 Tier1 场景数 > 0，继续执行：
- **文件**：`068_setup_scene_data.sql`

这个脚本会：
1. 为 Tier1 场景设置 `in_sitemap = TRUE`
2. 为 Tier1 场景设置初始 AI 分数 0.7
3. 为 Tier2 场景设置初始 AI 分数 0.5（虽然现在可能没有 Tier2）

---

## 📋 完整执行清单

- [ ] **步骤 1**：执行 `071_fix_tier_assignment.sql`（修复 Tier 分配）
- [ ] **步骤 1 验证**：检查 Tier1 场景数是否 > 0
- [ ] **步骤 2**：执行 `068_setup_scene_data.sql`（设置 in_sitemap 和 AI 分数）
- [ ] **步骤 2 验证**：检查所有设置是否成功

---

## 🔍 验证查询

### 修复后验证

```sql
SELECT 
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数",
  COUNT(*) FILTER (WHERE tier = 1 AND is_published = TRUE AND noindex = FALSE) as "Tier1且已发布且可索引"
FROM use_cases;
```

**期望结果**：
- `Tier1场景数` ≈ 215,697
- `Tier1且已发布且可索引` ≈ 215,697

### 最终验证（步骤 2 后）

```sql
SELECT 
  '最终状态' as check_type,
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景总数",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE) as "Tier1且in_sitemap=true",
  COUNT(*) FILTER (WHERE tier = 1 AND ai_citation_score >= 0.65) as "Tier1且AI分数>=0.65",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE AND ai_citation_score >= 0.65 AND noindex = FALSE) as "符合自动绑定条件"
FROM use_cases;
```

**期望结果**：所有计数都应该 > 0

---

## 🚀 开始执行

1. **执行脚本 071**：`071_fix_tier_assignment.sql`
2. **验证结果**：检查 Tier1 场景数是否 > 0
3. **执行脚本 068**：`068_setup_scene_data.sql`
4. **验证最终结果**：检查所有设置是否成功

执行完这两步，场景数据初始化就完成了！
