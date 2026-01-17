# 🔧 调整 Tier 设置策略

## 📊 当前状态

从执行结果看：
- ✅ **总场景数**：216,273
- ✅ **Tier2场景数**：216,273（所有场景）
- ❌ **Tier1场景数**：0
- ❌ **Tier1且已发布且可索引**：0

**问题原因**：所有场景的 `noindex = TRUE`，所以它们都被归类为 Tier2（根据脚本 069 的策略：`is_published = TRUE AND noindex = TRUE` → Tier2）。

---

## 🎯 解决方案

### 方案 A：调整 Tier 设置策略（推荐）

如果业务上允许，可以将已发布且 `noindex = TRUE` 的场景也设置为 Tier1。

**执行脚本**：
```sql
-- 将已发布且 noindex = TRUE 的场景设置为 Tier1
UPDATE use_cases
SET tier = 1
WHERE tier = 2
  AND is_published = TRUE
  AND noindex = TRUE;

-- 验证
SELECT 
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数",
  COUNT(*) FILTER (WHERE tier = 2) as "Tier2场景数"
FROM use_cases;
```

### 方案 B：先更新场景的 noindex 状态

如果业务上需要，可以先更新一些场景的 `noindex = FALSE`，然后再重新设置 tier。

**步骤**：
1. 选择一些高质量场景，设置 `noindex = FALSE`
2. 重新执行脚本 069（或手动更新 tier）

```sql
-- 示例：为一些场景设置 noindex = FALSE
UPDATE use_cases
SET noindex = FALSE
WHERE tier = 2
  AND is_published = TRUE
  AND (featured_prompt_ids IS NOT NULL OR quality_score >= 0.8)  -- 根据实际字段调整
LIMIT 1000;  -- 先测试前 1000 个

-- 然后重新设置 tier
UPDATE use_cases
SET tier = 1
WHERE tier = 2
  AND is_published = TRUE
  AND noindex = FALSE;
```

### 方案 C：不依赖 noindex 设置 Tier（最简单）

如果 `noindex` 不是区分 Tier 的关键因素，可以直接基于 `is_published` 设置 Tier。

**执行脚本**：
```sql
-- 将所有已发布的场景设置为 Tier1
UPDATE use_cases
SET tier = 1
WHERE tier = 2
  AND is_published = TRUE;

-- 验证
SELECT 
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数",
  COUNT(*) FILTER (WHERE tier = 2) as "Tier2场景数"
FROM use_cases;
```

---

## 🔍 先检查场景状态

在决定采用哪个方案之前，先运行诊断脚本：

**文件**：`070_check_scene_status.sql`

这个脚本会显示：
- 场景的发布和索引状态分布
- 当前 tier 分布
- Tier2 场景的详细状态

根据诊断结果，选择最适合的方案。

---

## ✅ 推荐执行步骤

### 1. 检查场景状态

执行：`070_check_scene_status.sql`

### 2. 根据结果选择方案

- **如果大部分场景都是 `noindex = TRUE`**：采用方案 A 或方案 C
- **如果需要区分可索引和不可索引**：采用方案 B

### 3. 执行调整

根据选择的方案执行相应的 SQL。

### 4. 验证结果

```sql
SELECT 
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数",
  COUNT(*) FILTER (WHERE tier = 1 AND is_published = TRUE) as "Tier1且已发布"
FROM use_cases;
```

### 5. 继续执行脚本 068

如果 Tier1 场景数 > 0，继续执行 `068_setup_scene_data.sql`。

---

## 💡 建议

根据你的业务需求：
- **如果所有已发布的场景都应该被处理**：使用方案 C（最简单）
- **如果需要区分可索引和不可索引**：使用方案 B
- **如果 noindex 不影响 tier 分类**：使用方案 A

先运行 `070_check_scene_status.sql` 查看详细状态，然后选择最适合的方案。
