# 🔍 调试 068_setup_scene_data.sql

## 问题诊断

从验证查询结果看，所有 Tier1 相关的计数都是 0，可能的原因：

1. **脚本还没有执行**：只执行了验证查询，没有执行 DO $$ 块
2. **没有 Tier1 场景**：数据库中可能没有 `tier = 1` 的场景
3. **条件不匹配**：场景存在但不符合设置条件（例如 `is_published = FALSE` 或 `noindex = TRUE`）

---

## 🔧 诊断步骤

### 步骤 1：运行诊断脚本

在 Supabase SQL Editor 中执行：
```sql
-- 文件: 068_diagnose_scene_data.sql
```

这个脚本会显示：
- use_cases 表的基本情况
- Tier1 场景的详细状态
- 符合设置条件的场景数量
- 示例场景数据

### 步骤 2：根据诊断结果采取行动

#### 情况 A：没有 Tier1 场景

如果诊断显示 `Tier1场景数 = 0`，需要先为场景设置 tier：

```sql
-- 示例：为一些场景设置 tier = 1
-- 请根据实际业务逻辑调整条件

UPDATE use_cases
SET tier = 1
WHERE is_published = TRUE
  AND noindex = FALSE
  AND (tier IS NULL OR tier = 0)
LIMIT 100;  -- 先设置前 100 个作为测试
```

#### 情况 B：有 Tier1 场景但条件不匹配

如果诊断显示有 Tier1 场景，但 `Tier1且已发布且noindex=false = 0`，说明场景不符合设置条件。

检查场景状态：
```sql
SELECT 
  tier,
  is_published,
  noindex,
  COUNT(*) as count
FROM use_cases
WHERE tier = 1
GROUP BY tier, is_published, noindex
ORDER BY count DESC;
```

如果需要，可以调整设置条件（修改脚本 068）。

#### 情况 C：脚本已执行但数据未更新

如果诊断显示有符合条件的场景，但 `in_sitemap` 和 `ai_citation_score` 仍未设置，可能是：

1. **脚本执行失败**：检查 Supabase 日志
2. **事务回滚**：检查是否有错误
3. **权限问题**：确认有 UPDATE 权限

---

## ✅ 正确执行脚本 068 的步骤

### 方法 1：执行完整脚本（推荐）

1. 在 Supabase SQL Editor 中打开 `068_setup_scene_data.sql`
2. **执行整个文件**（包括 DO $$ 块）
3. 查看执行结果，应该看到类似：
   ```
   NOTICE: ✅ 为 X 个 Tier1 场景设置了 in_sitemap = TRUE
   NOTICE: ✅ 为 X 个 Tier1 场景设置了初始 AI 分数 0.7
   ```
4. 然后运行验证查询（脚本末尾的 SELECT）

### 方法 2：分步执行

如果完整脚本执行有问题，可以分步执行：

```sql
-- 步骤 1：设置 in_sitemap
UPDATE use_cases
SET in_sitemap = TRUE
WHERE tier = 1
  AND is_published = TRUE
  AND noindex = FALSE
  AND (in_sitemap IS NULL OR in_sitemap = FALSE);

-- 步骤 2：设置 Tier1 的 AI 分数
UPDATE use_cases
SET ai_citation_score = 0.7
WHERE tier = 1
  AND is_published = TRUE
  AND noindex = FALSE
  AND in_sitemap = TRUE
  AND (ai_citation_score IS NULL OR ai_citation_score = 0);

-- 步骤 3：设置 Tier2 的 AI 分数
UPDATE use_cases
SET ai_citation_score = 0.5
WHERE tier = 2
  AND is_published = TRUE
  AND noindex = FALSE
  AND in_sitemap = TRUE
  AND (ai_citation_score IS NULL OR ai_citation_score = 0);
```

---

## 📊 验证设置结果

执行完脚本后，运行验证查询：

```sql
SELECT 
  '场景数据设置结果' as check_type,
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景总数",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE) as "Tier1且in_sitemap=true",
  COUNT(*) FILTER (WHERE tier = 1 AND ai_citation_score >= 0.65) as "Tier1且AI分数>=0.65",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE AND ai_citation_score >= 0.65 AND noindex = FALSE) as "符合自动绑定条件的场景数"
FROM use_cases;
```

期望结果：
- `Tier1场景总数` > 0
- `Tier1且in_sitemap=true` > 0
- `Tier1且AI分数>=0.65` > 0
- `符合自动绑定条件的场景数` > 0

---

## 🚨 常见问题

### Q1: 为什么所有计数都是 0？

**A**: 可能的原因：
1. 没有 Tier1 场景（需要先设置 tier）
2. Tier1 场景都不符合条件（is_published = FALSE 或 noindex = TRUE）
3. 脚本还没有执行（只执行了验证查询）

**解决方案**：运行诊断脚本 `068_diagnose_scene_data.sql` 找出原因。

### Q2: 如何为场景设置 tier？

**A**: 根据业务逻辑设置，例如：

```sql
-- 示例：为高质量场景设置 tier = 1
UPDATE use_cases
SET tier = 1
WHERE is_published = TRUE
  AND noindex = FALSE
  AND (quality_score >= 0.8 OR featured = TRUE)  -- 根据实际字段调整
LIMIT 100;
```

### Q3: 脚本执行后数据没有更新？

**A**: 检查：
1. 是否有错误信息（查看 Supabase 日志）
2. 是否有符合条件的场景（运行诊断脚本）
3. 是否有权限问题

---

## 📝 下一步

1. **运行诊断脚本**：`068_diagnose_scene_data.sql`
2. **根据诊断结果**：采取相应的行动
3. **执行设置脚本**：`068_setup_scene_data.sql`（完整执行）
4. **验证结果**：运行验证查询

如果诊断后仍有问题，请提供诊断脚本的输出结果，我可以帮你进一步分析。
