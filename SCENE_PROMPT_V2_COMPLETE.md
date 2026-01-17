# ✅ Scene-Prompt 架构 V2 完整方案 - 已就绪

## 🎉 已完成的工作

### 1️⃣ 数据库表设计（含 version / role）

✅ **迁移文件已创建**：
- `064_scene_prompt_architecture.sql` - 完整表结构
- `065_auto_bind_high_score_scenes.sql` - 自动绑定脚本

✅ **表结构**：
- `use_cases` 表增强（添加 tier, in_sitemap, noindex, ai_citation_score 等）
- `prompt_templates` 表（版本化、角色化、模型化、支持灰度）
- `scene_prompt_bindings` 表（数据驱动绑定）

✅ **TypeScript 类型定义已更新**：
- `types/database.ts` 已添加新表和字段的类型定义

### 2️⃣ Admin「提示词库」的 UI 定位（彻底不干扰 SEO）

✅ **架构文档已创建**：
- `SCENE_PROMPT_ARCHITECTURE_V2.md` - 完整方案文档

✅ **路由结构建议**：
```
/admin/content/scenes          ← 场景管理（SEO/GEO 主战场）
/admin/prompts                 ← 提示词库（内部资产，noindex）
  ├─ Tab 1: Scene Prompts     ← 按场景管理
  ├─ Tab 2: Global Prompts    ← 全局模板
  └─ Tab 3: Prompt Experiments ← AB/灰度实验
```

✅ **"不干扰 SEO" 硬规则**：
- Prompts 页面永远 `noindex`
- 禁止生成 public 路由
- 禁止在 sitemap 暴露

### 3️⃣ Prompt 自动绑定到 AI_CITATION_SCORE 高的 Scene（数据驱动）

✅ **自动绑定脚本已创建**：
- `065_auto_bind_high_score_scenes.sql` - 完整自动绑定逻辑

✅ **绑定策略**：
- 自动识别 Tier1 高分场景（tier=1, ai_citation_score>=0.65）
- 自动补齐缺失的 default 和 high_quality prompt
- 支持从 seed prompt 克隆模板

---

## 📋 执行顺序

### 第一步：执行结构迁移（必须）

1. 在 Supabase SQL Editor 中执行：`064_scene_prompt_architecture.sql`
2. 验证新表和字段已创建
3. 检查数据迁移结果

**参考**：`EXECUTE_MIGRATION_064_065.md`

### 第二步：准备 Seed Prompt（用于自动绑定）

在 Admin 界面创建一个全局模板，或选择一个现有的 prompt 作为 seed。

### 第三步：执行自动绑定（可选）

1. 修改 `065_auto_bind_high_score_scenes.sql` 中的 seed_prompt_id
2. 执行脚本，自动为 Tier1 高分场景补齐 prompt

### 第四步：更新 Admin UI（后续）

按照新的路由结构调整 Admin 界面。

---

## 🔍 关键特性

### prompt_templates 表

- ✅ **版本化**：version + parent_id（支持回滚）
- ✅ **角色化**：role（default/fast/high_quality/social/ads/compliance_safe）
- ✅ **模型化**：model_id（sora/veo_fast/veo_pro/gemini等）
- ✅ **灰度发布**：rollout_pct, weight（支持AB测试）
- ✅ **唯一约束**：每个 scene + model_id + role 只允许一个 "published + active"

### scene_prompt_bindings 表

- ✅ **数据驱动**：success_rate, quality_score（自动维护）
- ✅ **排序支持**：priority（越小越靠前）
- ✅ **默认选择**：is_default（标记推荐模板）

### 自动绑定策略

- ✅ **智能识别**：自动找出 Tier1 高分但缺 prompt 的场景
- ✅ **批量补齐**：从 seed prompt 克隆模板
- ✅ **可重复执行**：自动跳过已存在的绑定

---

## 📊 验证查询

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

---

## 📁 文件清单

### 迁移文件
- ✅ `supabase/migrations/064_scene_prompt_architecture.sql` - 结构迁移
- ✅ `supabase/migrations/065_auto_bind_high_score_scenes.sql` - 自动绑定脚本

### 文档
- ✅ `SCENE_PROMPT_ARCHITECTURE_V2.md` - 完整架构文档
- ✅ `EXECUTE_MIGRATION_064_065.md` - 执行指南

### 代码
- ✅ `types/database.ts` - TypeScript 类型定义已更新

---

## 🎯 下一步行动

1. **立即执行**：在 Supabase 中运行迁移 064
2. **验证结果**：检查新表和字段
3. **准备 Seed**：创建或选择一个 seed prompt
4. **执行绑定**：运行迁移 065（可选）
5. **更新 UI**：按照新架构调整 Admin 界面

---

## ✅ 完成清单

- [x] 数据库表设计（含 version / role）
- [x] 迁移文件创建
- [x] TypeScript 类型定义更新
- [x] 自动绑定脚本创建
- [x] 架构文档创建
- [x] 执行指南创建
- [ ] ⏳ 执行迁移 064（待执行）
- [ ] ⏳ 执行迁移 065（可选，待执行）
- [ ] ⏳ 更新 Admin UI（后续步骤）

---

## 🚀 所有文件已就绪，可以直接上线！

所有代码、迁移文件、文档都已创建完成。按照 `EXECUTE_MIGRATION_064_065.md` 的步骤执行即可。
