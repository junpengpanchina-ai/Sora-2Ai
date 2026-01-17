# 执行迁移 063（优化版）- 避免超时

## ⚠️ 问题说明

如果执行原始迁移脚本时遇到 "SQL query ran into an upstream timeout" 错误，这是因为数据迁移步骤（UPDATE）处理大量数据导致超时。

## ✅ 解决方案：分批执行

迁移已分为两个步骤：
1. **结构迁移**：添加字段、索引、函数（快速）
2. **数据迁移**：分批迁移现有数据（避免超时）

---

## 📋 执行步骤

### 步骤 1：执行结构迁移（必须）

1. **打开 Supabase Dashboard**
   - 访问 https://supabase.com/dashboard
   - 选择你的项目

2. **进入 SQL Editor**
   - 点击左侧菜单的 **SQL Editor**
   - 点击 **New query**

3. **执行优化版迁移**
   - 打开文件：`supabase/migrations/063_refactor_prompt_scene_relationship_optimized.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 **Run** 或按 `Cmd+Enter`

4. **验证结构迁移成功**
   - 应该看到 "✅ Migration 063 (优化版) completed" 的 NOTICE
   - 没有错误信息

### 步骤 2：验证字段已创建（可选但推荐）

运行快速检查：

```sql
-- 检查 scene_id 字段是否存在
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'prompt_library' 
        AND column_name = 'scene_id'
    ) THEN '✅ 字段已创建'
    ELSE '❌ 字段未创建'
  END as status;
```

### 步骤 3：执行数据迁移（如果有数据需要迁移）

**选项 A：自动分批迁移（推荐）**

1. 打开文件：`supabase/migrations/063_migrate_data_batch.sql`
2. 复制全部内容
3. 粘贴到 SQL Editor
4. 点击 **Run**

这个脚本会自动循环执行，直到所有数据迁移完成。

**选项 B：手动分批迁移**

如果选项 A 仍然超时，可以多次手动运行以下查询：

```sql
-- 每次运行这个查询，处理一批数据
WITH use_cases_batch AS (
  SELECT 
    uc.id as scene_id,
    uc.featured_prompt_ids
  FROM use_cases uc
  WHERE uc.featured_prompt_ids IS NOT NULL 
    AND array_length(uc.featured_prompt_ids, 1) > 0
    AND EXISTS (
      SELECT 1 
      FROM prompt_library p 
      WHERE p.id = ANY(uc.featured_prompt_ids)
        AND p.scene_id IS NULL
    )
  LIMIT 50  -- 每次处理 50 个 use cases
)
UPDATE prompt_library p
SET scene_id = uc_batch.scene_id
FROM use_cases_batch uc_batch
WHERE p.id = ANY(uc_batch.featured_prompt_ids)
  AND p.scene_id IS NULL;
```

重复运行，直到查询返回 "0 rows affected"。

### 步骤 4：验证数据迁移结果

运行验证查询：

```sql
-- 检查迁移统计
SELECT 
  COUNT(*) as total_prompts,
  COUNT(scene_id) as prompts_with_scene,
  COUNT(*) - COUNT(scene_id) as prompts_without_scene,
  (COUNT(scene_id)::float / NULLIF(COUNT(*), 0) * 100)::numeric(5,2) as migration_percentage
FROM prompt_library;
```

---

## 🔍 验证清单

执行完成后，验证以下内容：

- [ ] 结构迁移成功（字段已创建）
- [ ] 索引已创建（5个索引）
- [ ] 辅助函数已创建（2个函数）
- [ ] 数据迁移完成（至少部分 prompt 已关联场景）
- [ ] 默认值设置正确

---

## 🚨 如果仍然超时

如果结构迁移本身也超时，可以尝试：

### 方法 1：分别执行每个部分

将结构迁移脚本分成多个小部分，分别执行：

**Part 1: 添加字段**
```sql
ALTER TABLE prompt_library
  ADD COLUMN IF NOT EXISTS scene_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'sora',
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_indexable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_in_sitemap BOOLEAN DEFAULT FALSE;
```

**Part 2: 添加约束**
```sql
ALTER TABLE prompt_library
  ADD CONSTRAINT prompt_library_role_check CHECK (
    role IN ('default', 'fast', 'high_quality', 'long_form', 'ads', 'social', 'compliance_safe')
  ),
  ADD CONSTRAINT prompt_library_model_check CHECK (
    model IN ('sora', 'veo', 'gemini', 'universal')
  );
```

**Part 3: 创建索引**
```sql
CREATE INDEX IF NOT EXISTS idx_prompt_library_scene_id 
  ON prompt_library(scene_id) WHERE scene_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prompt_library_role ON prompt_library(role);
CREATE INDEX IF NOT EXISTS idx_prompt_library_model ON prompt_library(model);
CREATE INDEX IF NOT EXISTS idx_prompt_library_scene_role 
  ON prompt_library(scene_id, role) WHERE scene_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompt_library_scene_role_model 
  ON prompt_library(scene_id, role, model) WHERE scene_id IS NOT NULL;
```

**Part 4: 创建函数**（分别执行每个函数）

### 方法 2：直接连接数据库

如果 Supabase SQL Editor 超时限制太严格，可以直接连接数据库：

```bash
# 使用 psql 连接（需要数据库密码）
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
  -f supabase/migrations/063_refactor_prompt_scene_relationship_optimized.sql
```

---

## 📝 注意事项

1. **数据迁移是可选的**：如果暂时没有数据需要迁移，可以先只执行结构迁移。数据迁移可以稍后进行。

2. **默认值会自动设置**：新创建的字段都有默认值，所以即使不执行数据迁移，新字段也能正常工作。

3. **向后兼容**：迁移不会删除 `featured_prompt_ids` 字段，现有代码仍然可以工作。

---

## ✅ 成功标志

迁移成功后，你应该能够：

1. 在 Admin 界面看到新字段（scene_id, role, model 等）
2. 创建/编辑 prompt 时可以使用这些字段
3. 验证查询显示字段已创建
