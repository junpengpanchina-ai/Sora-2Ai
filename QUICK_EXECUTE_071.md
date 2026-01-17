# ⚡ 快速执行 071 修复脚本

## 🎯 执行步骤

### 步骤 1：执行 DO $$ 块

**文件**：`071_fix_tier_assignment_only.sql`（已创建，只包含 DO $$ 块）

**或者**：在 `071_fix_tier_assignment.sql` 中只选择第 25-60 行执行

**操作**：
1. 在 Supabase SQL Editor 中打开 `071_fix_tier_assignment_only.sql`
2. 执行整个文件
3. 查看执行结果中的 NOTICE 消息

---

### 步骤 2：查看 NOTICE 消息确认修复成功

**预期输出**：
```
NOTICE: ✅ 将 215697 个场景从 Tier2 调整为 Tier1
NOTICE: ✅ 将 576 个场景从 Tier2 调整为 Tier3
NOTICE: 
NOTICE: 📊 修复后统计：
NOTICE:   - Tier1 场景数: 215697
NOTICE:   - Tier2 场景数: 0
NOTICE:   - Tier3 场景数: 576
```

**✅ 成功标志**：
- 看到 "✅ 将 X 个场景从 Tier2 调整为 Tier1"（X 应该 > 0）
- Tier1 场景数 > 0

---

### 步骤 3：（可选）简单验证

如果修复成功，可以使用这个最简单的查询验证：

```sql
-- 只检查是否存在 Tier1 场景（最快，不会超时）
SELECT EXISTS(SELECT 1 FROM use_cases WHERE tier = 1 LIMIT 1) as "是否有Tier1场景";
```

**期望结果**：返回 `true`

---

### 步骤 4：继续执行脚本 068

如果修复成功（看到 NOTICE 消息），继续执行：

**文件**：`068_setup_scene_data.sql`

**这个脚本会**：
1. 为 Tier1 场景设置 `in_sitemap = TRUE`
2. 为 Tier1 场景设置初始 AI 分数 0.7
3. 为 Tier2 场景设置初始 AI 分数 0.5

---

## 📋 执行清单

- [ ] **步骤 1**：执行 `071_fix_tier_assignment_only.sql`（或只执行 DO $$ 块）
- [ ] **步骤 2**：查看 NOTICE 消息，确认看到 "✅ 将 X 个场景从 Tier2 调整为 Tier1"
- [ ] **步骤 3**：（可选）使用简单查询验证
- [ ] **步骤 4**：执行 `068_setup_scene_data.sql`

---

## 🚀 开始执行

1. **打开文件**：`supabase/migrations/071_fix_tier_assignment_only.sql`
2. **执行整个文件**
3. **查看 NOTICE 消息**，确认修复成功
4. **继续执行** `068_setup_scene_data.sql`

---

## 💡 提示

- **DO $$ 块通常不会超时**：UPDATE 操作通常很快完成
- **NOTICE 消息已经显示统计**：不需要额外的验证查询
- **如果看到成功消息**：可以直接继续执行脚本 068

准备好了吗？开始执行吧！
