# 执行迁移 064 & 065：Scene-Prompt 架构 V2

## 📋 迁移文件

1. **064_scene_prompt_architecture.sql** - 结构迁移（表结构 + 数据迁移）
2. **065_auto_bind_high_score_scenes.sql** - 自动绑定脚本（数据驱动）

---

## ✅ 执行步骤

### 步骤 1：执行结构迁移（必须）

1. **打开 Supabase Dashboard**
   - 访问 https://supabase.com/dashboard
   - 选择你的项目

2. **进入 SQL Editor**
   - 点击左侧菜单的 **SQL Editor**
   - 点击 **New query**

3. **执行迁移 064**
   - 打开文件：`supabase/migrations/064_scene_prompt_architecture.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 **Run** 或按 `Cmd+Enter`

4. **验证迁移成功**
   - 应该看到 "✅ Migration 064 completed" 的 NOTICE
   - 没有错误信息

### 步骤 2：验证新表已创建

运行以下查询验证：

```sql
-- 检查新表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('prompt_templates', 'scene_prompt_bindings')
ORDER BY table_name;

-- 检查 use_cases 表的新字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'use_cases'
  AND column_name IN ('tier', 'in_sitemap', 'noindex', 'ai_citation_score', 'index_health_status')
ORDER BY column_name;
```

### 步骤 3：准备 Seed Prompt（可选，用于自动绑定）

**选项 A：创建一个全局模板**

在 Admin 界面创建一个新的 prompt，设置 `owner_scope = 'global'`，作为模板。

**选项 B：使用现有的 prompt**

从现有的 `prompt_templates` 或 `prompt_library` 中选择一个作为 seed。

### 步骤 4：执行自动绑定脚本（可选）

1. **修改脚本中的 seed_prompt_id**

   打开 `supabase/migrations/065_auto_bind_high_score_scenes.sql`，找到：

   ```sql
   SELECT id INTO seed_prompt_id
   FROM prompt_templates
   WHERE owner_scope = 'global'
     OR (owner_scope = 'scene' AND scene_id IS NOT NULL)
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   或者手动设置：

   ```sql
   -- 在脚本开头添加
   seed_prompt_id := '你的-prompt-id-这里';
   ```

2. **执行脚本**

   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 **Run**

3. **查看结果**

   脚本会输出：
   - 为多少个场景创建了 default 模板
   - 为多少个场景创建了 high_quality 模板
   - 创建了多少个绑定关系

---

## 🔍 验证查询

### 检查 Tier1 高分场景的 prompt 覆盖情况

```sql
SELECT 
  s.slug,
  s.ai_citation_score,
  COUNT(DISTINCT p.id) FILTER (WHERE p.model_id = 'veo_fast' AND p.role = 'default') as has_default,
  COUNT(DISTINCT p.id) FILTER (WHERE p.model_id = 'veo_pro' AND p.role = 'high_quality') as has_high_quality
FROM use_cases s
LEFT JOIN prompt_templates p ON p.scene_id = s.id
  AND p.status = 'active' AND p.is_published = TRUE
WHERE s.tier = 1
  AND s.noindex = FALSE
  AND s.in_sitemap = TRUE
  AND s.ai_citation_score >= 0.65
GROUP BY s.id, s.slug, s.ai_citation_score
ORDER BY s.ai_citation_score DESC
LIMIT 20;
```

### 检查数据迁移结果

```sql
-- 检查从 prompt_library 迁移到 prompt_templates 的数据
SELECT 
  COUNT(*) as total_migrated,
  COUNT(DISTINCT scene_id) as scenes_with_prompts,
  COUNT(DISTINCT model_id) as unique_models,
  COUNT(DISTINCT role) as unique_roles
FROM prompt_templates
WHERE owner_scope = 'scene';
```

---

## 📊 迁移内容总结

### 迁移 064 完成的工作

- ✅ 增强 `use_cases` 表（添加 6 个新字段）
- ✅ 创建 `prompt_templates` 表（版本化、角色化、模型化）
- ✅ 创建 `scene_prompt_bindings` 表（数据驱动绑定）
- ✅ 迁移现有数据（从 `prompt_library` 到 `prompt_templates`）
- ✅ 创建辅助函数（`get_scene_default_prompt_v2`, `find_scenes_missing_prompts`）
- ✅ 创建索引和约束

### 迁移 065 完成的工作（可选）

- ✅ 自动为 Tier1 高分场景补齐 default prompt
- ✅ 自动为 Tier1 高分场景补齐 high_quality prompt
- ✅ 创建场景-提示词绑定关系

---

## ⚠️ 注意事项

1. **数据迁移**：迁移 064 会自动将 `prompt_library` 中已关联场景的数据迁移到 `prompt_templates`
2. **向后兼容**：保留 `prompt_library` 表，现有代码仍可工作
3. **唯一约束**：每个 scene + model_id + role 只允许一个 "published + active" 的 prompt
4. **自动绑定**：065 脚本可以多次运行，会自动跳过已存在的绑定

---

## 🎯 下一步

迁移完成后：

1. **更新 TypeScript 类型**（已完成）
2. **更新 Admin UI**（按新的路由结构）
3. **测试新功能**（创建/编辑 prompt_templates）
4. **验证自动绑定**（检查 Tier1 场景的 prompt 覆盖情况）

---

## 📝 执行清单

- [ ] 执行迁移 064（结构迁移）
- [ ] 验证新表和字段已创建
- [ ] 检查数据迁移结果
- [ ] 准备 seed prompt（用于自动绑定）
- [ ] 执行迁移 065（自动绑定，可选）
- [ ] 验证自动绑定结果
- [ ] 更新 Admin UI（后续步骤）
