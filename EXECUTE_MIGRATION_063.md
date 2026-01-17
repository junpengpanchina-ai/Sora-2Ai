# 执行迁移 063：重构 Prompt-Scene 关系

## 📋 迁移文件
- **文件路径**: `supabase/migrations/063_refactor_prompt_scene_relationship.sql`
- **目的**: 重构 Prompt 与 Scene 的关系，建立正确的层级结构

## ✅ 执行步骤

### 步骤 1: 打开 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录你的账号
3. 选择你的项目（Sora-2Ai）

### 步骤 2: 进入 SQL Editor

1. 在左侧菜单中找到 **SQL Editor**
2. 点击 **SQL Editor**
3. 点击 **New query**（新建查询）

### 步骤 3: 执行迁移 SQL

1. 打开项目文件：`supabase/migrations/063_refactor_prompt_scene_relationship.sql`
2. **复制全部 SQL 代码**（从第1行到第207行）
3. 粘贴到 Supabase SQL Editor 中
4. 点击 **Run** 按钮（或按 `Cmd+Enter` / `Ctrl+Enter`）

### 步骤 4: 验证迁移成功

执行后应该看到：
- ✅ "Success. No rows returned" 或类似成功消息
- ✅ 没有错误信息
- ✅ 在消息中看到 "Migration 063 completed" 的 NOTICE

---

## 🔍 验证查询

在 SQL Editor 中运行以下验证查询：

### 1. 检查新字段是否添加成功

```sql
-- 检查 prompt_library 表的新字段
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'prompt_library'
  AND column_name IN ('scene_id', 'role', 'model', 'version', 'is_indexable', 'is_in_sitemap')
ORDER BY column_name;
```

**预期结果**：应该返回 6 行，包含所有新字段。

### 2. 检查索引是否创建成功

```sql
-- 检查新创建的索引
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'prompt_library'
  AND indexname LIKE 'idx_prompt_library_%'
ORDER BY indexname;
```

**预期结果**：应该看到以下索引：
- `idx_prompt_library_model`
- `idx_prompt_library_role`
- `idx_prompt_library_scene_id`
- `idx_prompt_library_scene_role`
- `idx_prompt_library_scene_role_model`

### 3. 检查辅助函数是否创建成功

```sql
-- 检查辅助函数
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_scene_default_prompt', 'get_scene_prompts_by_role')
ORDER BY routine_name;
```

**预期结果**：应该返回 2 行，包含两个函数。

### 4. 检查数据迁移是否正确

```sql
-- 检查有多少 prompt 已关联到场景
SELECT 
  COUNT(*) as total_prompts,
  COUNT(scene_id) as prompts_with_scene,
  COUNT(*) - COUNT(scene_id) as prompts_without_scene
FROM prompt_library;
```

**预期结果**：
- `total_prompts`: 所有 prompt 的总数
- `prompts_with_scene`: 已关联场景的 prompt 数量（应该 > 0，如果之前有 featured_prompt_ids）
- `prompts_without_scene`: 未关联场景的 prompt 数量（可能 > 0，如果有遗留的独立 prompt）

### 5. 检查默认值是否正确设置

```sql
-- 检查所有 prompt 的默认值
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN role = 'default' THEN 1 END) as default_role,
  COUNT(CASE WHEN model = 'sora' THEN 1 END) as sora_model,
  COUNT(CASE WHEN version = 1 THEN 1 END) as version_1,
  COUNT(CASE WHEN is_indexable = FALSE THEN 1 END) as not_indexable,
  COUNT(CASE WHEN is_in_sitemap = FALSE THEN 1 END) as not_in_sitemap
FROM prompt_library;
```

**预期结果**：
- 所有 prompt 的 `role` 应该是 'default'（或已设置的其他值）
- 所有 prompt 的 `model` 应该是 'sora'（或已设置的其他值）
- 所有 prompt 的 `version` 应该是 1（或已设置的其他值）
- 所有 prompt 的 `is_indexable` 应该是 FALSE（除非手动设置为 TRUE）
- 所有 prompt 的 `is_in_sitemap` 应该是 FALSE（除非手动设置为 TRUE）

### 6. 测试辅助函数（可选）

```sql
-- 测试 get_scene_default_prompt 函数
-- 注意：需要替换 <scene_uuid> 为实际的 use case ID
SELECT * FROM get_scene_default_prompt('<scene_uuid>');

-- 测试 get_scene_prompts_by_role 函数
-- 注意：需要替换 <scene_uuid> 为实际的 use case ID
SELECT * FROM get_scene_prompts_by_role('<scene_uuid>');
```

---

## ⚠️ 注意事项

1. **数据迁移**：迁移会自动将 `use_cases.featured_prompt_ids` 中的 prompt 关联到对应的场景。如果某些 prompt 没有关联，它们会保持 `scene_id = NULL`。

2. **向后兼容**：迁移不会删除 `use_cases.featured_prompt_ids` 字段，所以现有代码仍然可以工作。但建议后续逐步迁移到使用 `scene_id`。

3. **默认值**：所有新字段都有默认值：
   - `role`: 'default'
   - `model`: 'sora'
   - `version`: 1
   - `is_indexable`: FALSE
   - `is_in_sitemap`: FALSE

4. **外键约束**：`scene_id` 有外键约束指向 `use_cases(id)`，如果删除场景，相关的 prompt 的 `scene_id` 会被设置为 NULL（ON DELETE SET NULL）。

---

## ✅ 迁移完成检查清单

- [ ] 迁移 SQL 执行成功，没有错误
- [ ] 新字段已添加到 `prompt_library` 表
- [ ] 索引已创建成功
- [ ] 辅助函数已创建成功
- [ ] 数据迁移完成（至少部分 prompt 已关联场景）
- [ ] 默认值设置正确

---

## 🎯 下一步

迁移完成后，你可以：

1. **在 Admin 界面测试**：
   - 访问 `/admin/prompts`
   - 创建或编辑一个 prompt
   - 验证新字段（scene_id, role, model, version）是否正常显示和保存

2. **验证 API**：
   - 测试创建 prompt 的 API，确保新字段可以正确保存
   - 测试更新 prompt 的 API，确保新字段可以正确更新

3. **检查现有数据**：
   - 在 Admin 界面查看现有 prompt，确认数据迁移是否正确

---

## 📝 回滚方案（如果需要）

如果需要回滚，可以执行以下 SQL：

```sql
-- 删除辅助函数
DROP FUNCTION IF EXISTS get_scene_prompts_by_role(UUID);
DROP FUNCTION IF EXISTS get_scene_default_prompt(UUID);

-- 删除索引
DROP INDEX IF EXISTS idx_prompt_library_scene_role_model;
DROP INDEX IF EXISTS idx_prompt_library_scene_role;
DROP INDEX IF EXISTS idx_prompt_library_model;
DROP INDEX IF EXISTS idx_prompt_library_role;
DROP INDEX IF EXISTS idx_prompt_library_scene_id;

-- 删除新字段（注意：这会删除数据）
ALTER TABLE prompt_library
  DROP COLUMN IF EXISTS is_in_sitemap,
  DROP COLUMN IF EXISTS is_indexable,
  DROP COLUMN IF EXISTS version,
  DROP COLUMN IF EXISTS model,
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS scene_id;
```

**⚠️ 警告**：回滚会删除所有新字段的数据，请谨慎操作！
