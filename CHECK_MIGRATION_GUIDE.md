# 检查迁移状态指南

## 🔍 快速检查

### 步骤 1：运行检查脚本

在 Supabase SQL Editor 中执行：

**文件**: `supabase/migrations/066_check_migration_status.sql`

这个脚本会检查：
- ✅ 表结构是否已创建
- ✅ 数据迁移情况
- ✅ Tier1 场景的 prompt 覆盖情况
- ✅ 绑定关系完整性
- ✅ 给出迁移建议

### 步骤 2：查看检查结果

脚本会输出多个查询结果，重点关注：

1. **表结构检查**：确认 `prompt_templates` 和 `scene_prompt_bindings` 表是否存在
2. **数据迁移检查**：对比 `prompt_library` 和 `prompt_templates` 的数据量
3. **未迁移数据检查**：查看还有多少 prompt 未迁移
4. **Tier1场景检查**：查看高分场景的 prompt 覆盖情况
5. **迁移建议汇总**：最后的 `DO` 块会给出明确的建议

---

## 📊 常见情况

### 情况 1：表结构未创建

**症状**：
- 检查结果显示 "❌ prompt_templates 表未创建"

**解决方案**：
- 执行迁移 `064_scene_prompt_architecture.sql`

### 情况 2：数据未完全迁移

**症状**：
- "未迁移的prompt数量" > 0

**解决方案**：
- 执行补充迁移脚本 `067_migrate_remaining_prompts.sql`

### 情况 3：Tier1 场景缺少 prompt

**症状**：
- "缺失Prompt的场景列表" 有结果

**解决方案**：
- 执行自动绑定脚本 `065_auto_bind_high_score_scenes.sql`
- 或手动为这些场景创建 prompt

### 情况 4：所有迁移已完成

**症状**：
- 所有检查都显示 ✅
- 迁移建议显示 "🎉 所有迁移已完成！"

**下一步**：
- 可以开始使用新架构
- 更新 Admin UI

---

## 🔧 补充迁移脚本

如果检查发现有未迁移的数据，可以使用：

**文件**: `supabase/migrations/067_migrate_remaining_prompts.sql`

这个脚本会：
- 自动识别未迁移的 prompt
- 批量迁移到 `prompt_templates`
- 输出迁移统计

---

## 📝 检查清单

运行检查脚本后，确认：

- [ ] 表结构已创建（prompt_templates, scene_prompt_bindings）
- [ ] use_cases 表的新字段已添加（tier, ai_citation_score 等）
- [ ] prompt_library 数据已迁移到 prompt_templates
- [ ] Tier1 高分场景都有 prompt
- [ ] 绑定关系已创建（如果使用 scene_prompt_bindings）

---

## 🎯 下一步

根据检查结果：

1. **如果表结构未创建** → 执行迁移 064
2. **如果数据未迁移** → 执行补充迁移 067
3. **如果场景缺 prompt** → 执行自动绑定 065
4. **如果全部完成** → 更新 Admin UI 和代码
