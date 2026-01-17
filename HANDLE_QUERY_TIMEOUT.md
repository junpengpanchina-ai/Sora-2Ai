# ⚡ 处理查询超时问题

## 🚨 问题

执行验证查询时遇到超时错误：
```
Error: SQL query ran into an upstream timeout
```

**原因**：`use_cases` 表有 216,273 条记录，全表扫描 COUNT 查询可能超时。

---

## ✅ 解决方案

### 方案 1：使用优化的验证查询（推荐）

**文件**：`071_verify_tier_fix_fast.sql`

这个脚本使用优化的查询：
- 只查询有 tier 的场景（利用索引）
- 使用子查询分批计算
- 避免全表扫描

**执行**：
```sql
-- 在 Supabase SQL Editor 中执行
-- 文件: 071_verify_tier_fix_fast.sql
```

### 方案 2：使用简化的验证查询

如果方案 1 仍然超时，使用这个最简单的查询：

```sql
-- 只检查 Tier1 场景是否存在（最快）
SELECT 
  EXISTS(SELECT 1 FROM use_cases WHERE tier = 1 LIMIT 1) as "是否有Tier1场景",
  (SELECT COUNT(*) FROM use_cases WHERE tier = 1 LIMIT 100) as "Tier1场景数（前100）";
```

### 方案 3：分批验证

如果表太大，可以分批验证：

```sql
-- 检查前 1000 个场景的 tier 分布
SELECT 
  tier,
  COUNT(*) as count
FROM use_cases
WHERE id IN (
  SELECT id FROM use_cases ORDER BY created_at DESC LIMIT 1000
)
GROUP BY tier
ORDER BY tier;
```

---

## 🎯 推荐执行步骤

### 步骤 1：执行修复脚本

**文件**：`071_fix_tier_assignment.sql`

**注意**：脚本中的验证查询已经优化，但如果仍然超时，可以：
1. 只执行 DO $$ 块（修复部分）
2. 跳过验证查询
3. 使用单独的快速验证脚本

### 步骤 2：使用快速验证脚本

**文件**：`071_verify_tier_fix_fast.sql`

这个脚本包含多个优化查询，从简单到复杂：
1. 快速检查：只检查是否存在 Tier1 场景
2. Tier 分布：检查各 tier 的数量
3. Tier1 关键指标：检查 Tier1 场景的关键条件

### 步骤 3：如果快速验证也超时

使用最简单的查询：

```sql
-- 最简单：只检查是否存在 Tier1 场景
SELECT EXISTS(SELECT 1 FROM use_cases WHERE tier = 1 LIMIT 1) as "是否有Tier1场景";
```

如果返回 `true`，说明修复成功，可以继续执行脚本 068。

---

## 📋 执行清单

- [ ] **步骤 1**：执行 `071_fix_tier_assignment.sql`（修复 Tier 分配）
  - 如果验证查询超时，可以跳过，只执行 DO $$ 块
- [ ] **步骤 2**：执行 `071_verify_tier_fix_fast.sql`（快速验证）
  - 如果仍然超时，使用最简单的查询
- [ ] **步骤 2 验证**：确认 Tier1 场景数 > 0
- [ ] **步骤 3**：执行 `068_setup_scene_data.sql`（设置 in_sitemap 和 AI 分数）

---

## 💡 提示

1. **DO $$ 块通常不会超时**：UPDATE 操作通常比 COUNT 查询快
2. **验证查询可以跳过**：如果修复脚本的 DO $$ 块执行成功，可以跳过验证查询
3. **使用索引**：确保 `tier` 字段有索引（迁移脚本应该已经创建了）

---

## 🔍 最简单的验证方法

如果所有验证查询都超时，使用这个方法：

```sql
-- 1. 检查修复是否执行（查看 NOTICE 消息）
-- 在 Supabase SQL Editor 中查看执行结果，应该看到：
-- NOTICE: ✅ 将 X 个场景从 Tier2 调整为 Tier1

-- 2. 最简单的验证
SELECT EXISTS(SELECT 1 FROM use_cases WHERE tier = 1 LIMIT 1) as "是否有Tier1场景";

-- 3. 如果返回 true，说明修复成功，可以继续执行脚本 068
```

---

## 🚀 继续执行

即使验证查询超时，如果修复脚本的 DO $$ 块执行成功（看到 NOTICE 消息），就可以继续执行 `068_setup_scene_data.sql`。

修复脚本应该已经将大部分场景从 Tier2 调整为 Tier1，可以继续下一步了！
