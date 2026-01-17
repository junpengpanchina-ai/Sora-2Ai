# 🎯 执行 Tier 初始化指南

## 问题诊断

从查询结果看：
- ✅ **总场景数**：16,273
- ❌ **Tier1场景数**：0
- ❌ **Tier1且已发布**：0

**问题原因**：所有场景的 `tier` 都是 NULL 或 0，所以脚本 068 无法工作（它的条件是 `WHERE tier = 1`）。

---

## ✅ 解决方案

### 步骤 1：初始化场景的 tier 值

执行脚本：`069_initialize_scene_tiers.sql`

这个脚本会：
1. 检查当前状态
2. 为场景设置初始 tier：
   - **Tier1**：已发布且可索引的场景（`is_published = TRUE` 且 `noindex = FALSE`）
   - **Tier2**：已发布但不可索引的场景（`is_published = TRUE` 且 `noindex = TRUE`）
   - **Tier3**：未发布的场景（`is_published = FALSE`）

### 步骤 2：执行设置脚本

初始化 tier 后，执行：`068_setup_scene_data.sql`

这个脚本会：
1. 为 Tier1 场景设置 `in_sitemap = TRUE`
2. 为 Tier1 场景设置初始 AI 分数 0.7
3. 为 Tier2 场景设置初始 AI 分数 0.5

---

## 📋 执行顺序

### 1️⃣ 执行 Tier 初始化（必须先执行）

```sql
-- 文件: 069_initialize_scene_tiers.sql
-- 在 Supabase SQL Editor 中执行整个文件
```

**预期结果**：
```
NOTICE: ✅ 为 X 个场景设置了 tier = 1
NOTICE: ✅ 为 X 个场景设置了 tier = 2
NOTICE: ✅ 为 X 个场景设置了 tier = 3
NOTICE: 📊 初始化结果统计：
NOTICE:   - Tier1 场景数: X
NOTICE:   - Tier2 场景数: X
NOTICE:   - Tier3 场景数: X
```

### 2️⃣ 验证 Tier 初始化结果

运行验证查询（脚本末尾的 SELECT），应该看到：
- `Tier1场景数` > 0
- `Tier1且已发布且可索引` > 0

### 3️⃣ 执行场景数据设置

```sql
-- 文件: 068_setup_scene_data.sql
-- 在 Supabase SQL Editor 中执行整个文件
```

**预期结果**：
```
NOTICE: ✅ 为 X 个 Tier1 场景设置了 in_sitemap = TRUE
NOTICE: ✅ 为 X 个 Tier1 场景设置了初始 AI 分数 0.7
NOTICE: ✅ 为 X 个 Tier2 场景设置了初始 AI 分数 0.5
```

### 4️⃣ 验证最终结果

运行验证查询（脚本 068 末尾的 SELECT），应该看到：
- `Tier1场景总数` > 0
- `Tier1且in_sitemap=true` > 0
- `Tier1且AI分数>=0.65` > 0
- `符合自动绑定条件的场景数` > 0

---

## 🔧 自定义 Tier 设置策略

如果默认的 tier 设置策略（基于 `is_published` 和 `noindex`）不符合你的业务逻辑，可以修改脚本 069。

### 示例：基于其他字段设置 Tier

```sql
-- 示例 1：基于 featured_prompt_ids 设置 Tier1
UPDATE use_cases
SET tier = 1
WHERE tier IS NULL
  AND is_published = TRUE
  AND noindex = FALSE
  AND featured_prompt_ids IS NOT NULL
  AND array_length(featured_prompt_ids, 1) > 0;

-- 示例 2：基于特定 industry 设置 Tier1
UPDATE use_cases
SET tier = 1
WHERE tier IS NULL
  AND is_published = TRUE
  AND noindex = FALSE
  AND industry IN ('technology', 'marketing', 'education');  -- 根据实际调整

-- 示例 3：基于 quality_score 设置 Tier1
UPDATE use_cases
SET tier = 1
WHERE tier IS NULL
  AND is_published = TRUE
  AND noindex = FALSE
  AND quality_score >= 0.8;  -- 如果有这个字段
```

---

## ⚠️ 注意事项

1. **执行顺序很重要**：必须先执行 069（初始化 tier），再执行 068（设置 in_sitemap 和 AI 分数）

2. **可以分批执行**：如果场景数量很大，可以分批设置：
   ```sql
   -- 先设置前 1000 个作为测试
   UPDATE use_cases
   SET tier = 1
   WHERE tier IS NULL
     AND is_published = TRUE
     AND noindex = FALSE
   LIMIT 1000;
   ```

3. **可以调整策略**：根据实际业务需求调整 tier 设置条件

4. **可以手动调整**：设置完成后，可以在 Admin 界面手动调整特定场景的 tier

---

## 📊 执行后验证

执行完两个脚本后，运行这个查询验证最终状态：

```sql
SELECT 
  '最终状态' as check_type,
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE) as "Tier1且in_sitemap=true",
  COUNT(*) FILTER (WHERE tier = 1 AND ai_citation_score >= 0.65) as "Tier1且AI分数>=0.65",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE AND ai_citation_score >= 0.65 AND noindex = FALSE) as "符合自动绑定条件"
FROM use_cases;
```

期望结果：所有计数都应该 > 0

---

## 🚀 开始执行

1. **执行脚本 069**：`069_initialize_scene_tiers.sql`
2. **验证结果**：检查 Tier1 场景数是否 > 0
3. **执行脚本 068**：`068_setup_scene_data.sql`
4. **验证最终结果**：检查所有设置是否成功

如果执行过程中遇到问题，请提供错误信息或查询结果，我可以帮你进一步分析。
