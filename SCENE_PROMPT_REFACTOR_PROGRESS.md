# 场景与提示词架构重构 - 执行进度

## ✅ 已完成

### 1. 架构文档
- [x] 创建 `SCENE_PROMPT_ARCHITECTURE.md` - 完整的架构原则和实施方案

### 2. 数据库重构
- [x] 创建迁移文件 `063_refactor_prompt_scene_relationship.sql`
  - 添加 `scene_id` 字段（关联场景）
  - 添加 `role` 字段（default/fast/high_quality等）
  - 添加 `model` 字段（sora/veo/gemini）
  - 添加 `version` 字段（版本管理）
  - 添加 `is_indexable` 和 `is_in_sitemap` 字段（SEO控制）
  - 创建索引优化查询
  - 创建辅助函数 `get_scene_default_prompt` 和 `get_scene_prompts_by_role`

### 3. SEO 层面修复
- [x] Prompt 页面添加 `robots: { index: false, follow: false }`
- [x] `robots.ts` 添加 `/prompts/` 到 disallow 列表
- [x] `sitemap-static.xml` 移除 prompt 页面生成逻辑
- [x] Prompt 页面 H1 修复：从直接显示 prompt 标题改为 "AI Video Generation Tools"，prompt 标题降级为 H2

### 4. 代码修改
- [x] `app/prompts/[slug]/page.tsx` - 添加 noindex，修复 H1
- [x] `app/robots.ts` - 禁止抓取 `/prompts/`
- [x] `app/sitemap-static.xml/route.ts` - 移除 prompt 页面

---

## 🚧 待完成

### 1. 数据库迁移执行
- [x] 创建迁移文件 `063_refactor_prompt_scene_relationship.sql`
- [x] 创建执行指南 `EXECUTE_MIGRATION_063.md`
- [x] 创建验证脚本 `063_verify_migration.sql`
- [x] ✅ **已完成**：在 Supabase 中执行迁移（优化版）
- [x] ✅ 验证结构迁移成功（6个字段已创建）
- [x] ✅ 索引和函数已创建
- [ ] ⏳ **可选**：执行数据迁移（featured_prompt_ids → scene_id）

### 2. UI 层面重构（重要但非紧急）

#### 2.1 Use Case 页面：显示"生成模式选择"
**文件**: `app/use-cases/[slug]/page.tsx` 和 `app/use-cases/UseCaseToolEmbed.tsx`

**当前实现**：
- 直接显示 prompt 输入框
- 从 use case 标题生成默认 prompt

**目标实现**：
```typescript
// 显示生成模式选择
<GenerationModeSelector
  useCaseId={useCase.id}
  modes={[
    { role: 'fast', label: 'Fast', description: 'Quick generation' },
    { role: 'high_quality', label: 'High Quality', description: 'Best visuals' },
    { role: 'social', label: 'Social Media', description: 'Platform optimized' },
  ]}
/>
```

**需要修改**：
1. 创建 `GenerationModeSelector` 组件
2. 从数据库获取场景的所有 prompts（按 role 分组）
3. 用户选择模式后，加载对应的 prompt
4. 显示 prompt 在折叠区块/代码块中（可选）

#### 2.2 Prompt 作为折叠内容
**在 Use Case 页面中**，prompt 应该：
- 放在 `<details>` 折叠区块
- 或者放在 `<pre>` 代码块中
- 添加 `data-noindex` 属性

**示例**：
```typescript
<details className="mt-4">
  <summary className="cursor-pointer text-sm text-gray-500">
    View Prompt Template (Technical)
  </summary>
  <pre className="mt-2 rounded bg-gray-100 p-4 text-xs" data-noindex>
    {prompt.template}
  </pre>
</details>
```

### 3. Admin 后台调整

#### 3.1 Prompt 管理界面更新
**文件**: `app/admin/prompts/AdminPromptsPage.tsx`

**需要添加**：
- Scene 关联选择器（必选）
- Role 选择器（default/fast/high_quality等）
- Model 选择器（sora/veo/gemini）
- Version 输入框
- 是否可索引开关（默认 false）

**需要移除**：
- SEO 关键词字段
- sitemap 状态字段
- 公开 URL 字段

#### 3.2 Use Case 管理界面更新
**文件**: `app/admin/content/use-cases/AdminUseCasesManager.tsx`

**需要修改**：
- 移除或降权 `featured_prompt_ids` 字段（因为现在通过 `prompt_library.scene_id` 反向关联）
- 添加"查看关联 Prompts"功能（显示该场景的所有 prompts）

### 4. 类型定义更新

#### 4.1 更新 TypeScript 类型
**文件**: `types/database.ts`

**需要添加**：
```typescript
prompt_library: {
  Row: {
    // ... 现有字段
    scene_id: string | null
    role: 'default' | 'fast' | 'high_quality' | 'long_form' | 'ads' | 'social' | 'compliance_safe'
    model: 'sora' | 'veo' | 'gemini' | 'universal'
    version: number
    is_indexable: boolean
    is_in_sitemap: boolean
  }
}
```

### 5. API 更新

#### 5.1 创建获取场景 Prompts 的 API
**新文件**: `app/api/scenes/[id]/prompts/route.ts`

**功能**：
- 获取场景的所有 prompts（按 role 分组）
- 支持筛选 role 和 model
- 返回格式化的数据供前端使用

### 6. 验证和测试

#### 6.1 SEO 验证
- [ ] 检查所有 Use Case 页面，确保 prompt 不在 H1
- [ ] 检查 sitemap，确保没有 prompt URL
- [ ] 检查 robots.txt，确保禁止 prompt 路径
- [ ] 使用 Google Search Console 验证 noindex 生效

#### 6.2 功能验证
- [ ] 测试生成流程，确保用户看到的是"选择结果"
- [ ] 测试 Prompt 管理界面，确保新字段正常工作
- [ ] 测试场景关联，确保 prompts 正确关联到场景

---

## 📋 执行优先级

### P0（必须完成）
1. ✅ 数据库迁移文件创建
2. ⏳ 执行数据库迁移
3. ✅ SEO 层面修复（noindex, robots.txt, sitemap）

### P1（重要）
4. ⏳ 更新 TypeScript 类型定义
5. ⏳ Admin Prompt 管理界面更新
6. ⏳ 创建获取场景 Prompts 的 API

### P2（优化）
7. ⏳ Use Case 页面显示"生成模式选择"
8. ⏳ Prompt 作为折叠内容
9. ⏳ Use Case 管理界面更新

---

## 🎯 下一步行动

1. **立即执行**：在 Supabase 中运行迁移 `063_refactor_prompt_scene_relationship.sql`
2. **验证数据**：检查迁移后的数据是否正确
3. **更新类型**：更新 `types/database.ts` 以反映新的数据库结构
4. **更新 Admin**：修改 Prompt 管理界面，添加新字段
5. **创建 API**：创建获取场景 Prompts 的 API 端点
6. **UI 重构**：实现"生成模式选择"功能（可选，可以后续迭代）

---

## 📝 注意事项

1. **向后兼容**：迁移时保留 `featured_prompt_ids` 字段，直到确认新结构稳定
2. **数据迁移**：确保所有现有的 prompt 都正确关联到场景
3. **测试环境**：先在测试环境验证，再应用到生产环境
4. **监控**：迁移后监控数据库查询性能，确保索引正常工作

---

## 🔗 相关文件

- 架构文档: `SCENE_PROMPT_ARCHITECTURE.md`
- 数据库迁移: `supabase/migrations/063_refactor_prompt_scene_relationship.sql`
- Prompt 页面: `app/prompts/[slug]/page.tsx`
- Use Case 页面: `app/use-cases/[slug]/page.tsx`
- Use Case 工具组件: `app/use-cases/UseCaseToolEmbed.tsx`
- Admin Prompt 管理: `app/admin/prompts/AdminPromptsPage.tsx`
- Admin Use Case 管理: `app/admin/content/use-cases/AdminUseCasesManager.tsx`
- Robots: `app/robots.ts`
- Sitemap: `app/sitemap-static.xml/route.ts`
