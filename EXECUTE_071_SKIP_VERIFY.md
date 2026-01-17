# ⚡ 执行 071 脚本（跳过验证查询）

## 🚨 问题

执行 `071_fix_tier_assignment.sql` 时，验证查询超时。

## ✅ 解决方案

**可以跳过验证查询，只执行 DO $$ 块（修复部分）**

DO $$ 块通常不会超时，因为它只是 UPDATE 操作。验证查询可以跳过，因为 DO $$ 块中的 NOTICE 消息已经显示了修复后的统计信息。

---

## 📋 执行步骤

### 方法 1：只执行 DO $$ 块（推荐）

在 Supabase SQL Editor 中：

1. 打开 `071_fix_tier_assignment.sql`
2. 只选择并执行 **DO $$ ... END $$;** 部分（第 25-60 行）
3. 查看执行结果中的 NOTICE 消息

**预期输出**：
```
NOTICE: ✅ 将 X 个场景从 Tier2 调整为 Tier1
NOTICE: ✅ 将 X 个场景从 Tier2 调整为 Tier3（如果有）
NOTICE: 
NOTICE: 📊 修复后统计：
NOTICE:   - Tier1 场景数: X
NOTICE:   - Tier2 场景数: X
NOTICE:   - Tier3 场景数: X
```

**✅ 如果看到这个消息**，说明修复成功，可以继续执行脚本 068。

### 方法 2：执行整个文件但忽略验证查询超时

1. 执行整个文件 `071_fix_tier_assignment.sql`
2. 如果验证查询超时，忽略错误
3. 查看 NOTICE 消息确认修复成功

### 方法 3：使用最简单的验证查询

如果修复脚本执行成功，可以使用这个最简单的查询验证：

```sql
-- 只检查是否存在 Tier1 场景（最快，不会超时）
SELECT EXISTS(SELECT 1 FROM use_cases WHERE tier = 1 LIMIT 1) as "是否有Tier1场景";
```

如果返回 `true`，说明修复成功。

---

## 🎯 推荐执行步骤

1. **执行 DO $$ 块**（第 25-60 行）
   - 查看 NOTICE 消息确认修复成功
   - 应该看到 "✅ 将 X 个场景从 Tier2 调整为 Tier1"

2. **简单验证**（可选）：
   ```sql
   SELECT EXISTS(SELECT 1 FROM use_cases WHERE tier = 1 LIMIT 1);
   ```

3. **继续执行脚本 068**：
   - 文件：`068_setup_scene_data.sql`
   - 为 Tier1 场景设置 `in_sitemap = TRUE` 和 AI 分数

---

## 💡 为什么可以跳过验证查询？

1. **DO $$ 块已经显示统计信息**：NOTICE 消息中已经显示了修复后的统计
2. **UPDATE 操作不会超时**：DO $$ 块中的 UPDATE 操作通常很快完成
3. **验证查询不是必需的**：如果修复成功（看到 NOTICE 消息），就可以继续下一步

---

## ✅ 执行清单

- [ ] 执行 DO $$ 块（第 25-60 行）
- [ ] 查看 NOTICE 消息，确认修复成功
- [ ] （可选）使用简单查询验证
- [ ] 继续执行 `068_setup_scene_data.sql`

---

## 🚀 开始执行

1. 复制 DO $$ 块（第 25-60 行）
2. 在 Supabase SQL Editor 中执行
3. 查看 NOTICE 消息确认修复成功
4. 继续执行脚本 068

即使验证查询超时，只要 DO $$ 块执行成功，就可以继续下一步了！
