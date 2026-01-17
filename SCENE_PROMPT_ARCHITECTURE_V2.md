# Scene ↔ Prompt 架构 V2（完整方案）

## 📋 核心原则

- **Scene (Use Case)** = 稳定语义锚点，内容与SEO的第一公民
- **Prompt** = 可迭代资产（版本化、可灰度、可回滚），内部资产不干扰SEO

---

## 🗄️ 数据库表设计

### 1. `use_cases` 表增强（已有表，添加字段）

```sql
-- 新增字段
ALTER TABLE use_cases
  ADD COLUMN tier SMALLINT DEFAULT 2,              -- 1/2/3
  ADD COLUMN in_sitemap BOOLEAN DEFAULT FALSE,
  ADD COLUMN noindex BOOLEAN DEFAULT FALSE,
  ADD COLUMN canonical_url TEXT,
  ADD COLUMN ai_citation_score NUMERIC(6,3) DEFAULT 0,
  ADD COLUMN index_health_status TEXT DEFAULT 'unknown';
```

**字段说明**：
- `tier`: Tier等级（1=核心/2=重要/3=一般）
- `in_sitemap`: 是否在sitemap中
- `noindex`: 是否禁止索引
- `ai_citation_score`: AI引用分数（0-1），用于数据驱动绑定
- `index_health_status`: 索引健康状态（ok/warn/bad/unknown）

### 2. `prompt_templates` 表（新表）

**核心特性**：
- ✅ 版本化（version + parent_id）
- ✅ 角色化（role: default/fast/high_quality/social/ads/compliance_safe）
- ✅ 模型化（model_id: sora/veo_fast/veo_pro/gemini等）
- ✅ 灰度发布（rollout_pct, weight）
- ✅ AB测试支持（weight, min_plan）

**关键约束**：
```sql
-- 每个 scene + model_id + role 只允许一个"published + active"
CREATE UNIQUE INDEX uniq_active_published
ON prompt_templates(scene_id, model_id, role)
WHERE status = 'active' AND is_published = TRUE;
```

### 3. `scene_prompt_bindings` 表（绑定表，可选但推荐）

**用途**：
- 数据驱动的自动绑定和排序
- 支持"推荐/默认"选择
- 跟踪成功率和质量分数

---

## 🎨 Admin UI 定位调整

### 路由结构

```
/admin/content/scenes          ← 场景管理（SEO/GEO 主战场）
/admin/prompts                 ← 提示词库（内部资产，noindex）
  ├─ Tab 1: Scene Prompts     ← 按场景管理
  ├─ Tab 2: Global Prompts    ← 全局模板
  └─ Tab 3: Prompt Experiments ← AB/灰度实验
```

### "不干扰 SEO" 硬规则

**Prompts 页面**：
- ✅ 永远 `noindex`（即使泄漏也不会被收录）
- ✅ 禁止生成 public 路由
- ✅ 禁止在 sitemap 暴露

**Next.js 实现**：
```typescript
// app/admin/layout.tsx 或中间件
export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}
```

---

## 🤖 自动绑定策略（数据驱动）

### 进入"自动绑定池"的 Scene 条件

```sql
WHERE tier = 1
  AND noindex = FALSE
  AND in_sitemap = TRUE
  AND ai_citation_score >= 0.65  -- 阈值可调
```

### 自动绑定策略

1. **确保存在 default 模板**（每个模型至少 1 个）
2. **确保存在 high_quality 模板**（Veo Pro / Sora 高端）
3. **若缺失**：从"行业模板库"克隆 → 生成新版本 → 绑定

### 执行脚本

**文件**: `supabase/migrations/065_auto_bind_high_score_scenes.sql`

**使用步骤**：
1. 先创建一个 seed prompt（全局模板或行业通用模板）
2. 修改脚本中的 `seed_prompt_id`
3. 运行脚本，自动为 Tier1 高分场景补齐缺失的 prompt

---

## 📊 辅助函数

### 1. `get_scene_default_prompt_v2(scene_uuid, model_name, role_name)`

获取场景的默认 prompt（按优先级和权重排序）

### 2. `find_scenes_missing_prompts(min_score, limit_count)`

找出 Tier1 高分但缺 prompt 的 scenes

---

## ✅ 执行顺序

### 第一步：执行结构迁移

1. 执行 `064_scene_prompt_architecture.sql`
   - 增强 `use_cases` 表
   - 创建 `prompt_templates` 表
   - 创建 `scene_prompt_bindings` 表
   - 迁移现有数据

### 第二步：准备 Seed Prompt

在 Admin 界面创建一个全局模板（`owner_scope = 'global'`），或选择一个现有的场景模板作为 seed。

### 第三步：执行自动绑定

1. 修改 `065_auto_bind_high_score_scenes.sql` 中的 `seed_prompt_id`
2. 运行脚本，自动为 Tier1 高分场景补齐 prompt

### 第四步：更新 Admin UI

按照新的路由结构调整 Admin 界面：
- `/admin/prompts` 改为 3 个 Tab
- 添加 noindex 设置

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

---

## 📝 注意事项

1. **数据迁移**：`064` 迁移会自动将 `prompt_library` 中已关联场景的数据迁移到 `prompt_templates`
2. **向后兼容**：保留 `prompt_library` 表，现有代码仍可工作
3. **逐步迁移**：建议先执行结构迁移，测试后再执行自动绑定脚本

---

## 🎯 完成清单

- [ ] 执行迁移 `064_scene_prompt_architecture.sql`
- [ ] 创建 seed prompt（全局模板）
- [ ] 执行自动绑定脚本 `065_auto_bind_high_score_scenes.sql`
- [ ] 更新 Admin UI（3个Tab结构）
- [ ] 添加 noindex 设置
- [ ] 验证数据迁移结果
