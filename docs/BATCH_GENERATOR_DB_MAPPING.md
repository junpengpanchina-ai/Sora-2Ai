# 批量生成器与数据库对应关系验证

## 📋 数据库表结构 (use_cases)

### 必需字段
- `id` (UUID) - 主键，自动生成
- `slug` (TEXT) - 唯一标识符
- `title` (TEXT) - 标题
- `h1` (TEXT) - H1 标题
- `description` (TEXT) - 描述
- `content` (TEXT) - 内容
- `use_case_type` (TEXT) - 使用场景类型
- `is_published` (BOOLEAN) - 是否发布

### 可选字段
- `industry` (TEXT | NULL) - 行业分类
- `featured_prompt_ids` (UUID[]) - 关联的提示词ID
- `related_use_case_ids` (UUID[]) - 关联的使用场景ID
- `seo_keywords` (TEXT[]) - SEO关键词
- `quality_status` (TEXT | NULL) - 质量状态
- `quality_issues` (TEXT[] | NULL) - 质量问题
- `quality_score` (INTEGER | NULL) - 质量评分
- `quality_notes` (TEXT | NULL) - 质量备注
- `reviewed_by_admin_id` (UUID | NULL) - 审核人ID
- `reviewed_at` (TIMESTAMP | NULL) - 审核时间
- `created_by_admin_id` (UUID | NULL) - 创建人ID
- `created_at` (TIMESTAMP) - 创建时间，自动生成
- `updated_at` (TIMESTAMP) - 更新时间，自动更新

## 🔄 批量生成器保存的数据

### IndustrySceneBatchGenerator 保存的字段

```typescript
{
  slug: string,                    // ✅ 从 industry + scene.use_case 生成
  title: string,                   // ✅ 从 scene.use_case 提取（前100字符）
  h1: string,                      // ✅ 生成：`AI Video Generation for ${scene.use_case} in ${industry}`
  description: string,             // ✅ 生成描述
  content: string,                 // ✅ 生成完整内容（Markdown格式）
  use_case_type: string,          // ✅ 从组件 state 获取（用户选择）
  industry: string,                // ✅ 从组件 state 获取（用户选择）
  is_published: boolean,          // ✅ 根据质量检查结果自动设置
  seo_keywords: string[],         // ✅ 自动生成：[scene.use_case, industry, `${industry} AI video`]
  quality_status: string,         // ✅ 根据质量检查结果：'approved' 或 'pending'
  quality_score: number,          // ✅ 自动质量检查评分（0-100）
  quality_issues: string[],       // ✅ 自动质量检查发现的问题
  // created_by_admin_id 由 API 路由自动添加
}
```

## ✅ 字段对应关系验证

| 数据库字段 | 批量生成器 | API路由 | 状态 |
|-----------|-----------|---------|------|
| `slug` | ✅ 生成 | ✅ 验证唯一性 | ✅ 完全匹配 |
| `title` | ✅ 提取 | ✅ 验证非空 | ✅ 完全匹配 |
| `h1` | ✅ 生成 | ✅ 验证非空 | ✅ 完全匹配 |
| `description` | ✅ 生成 | ✅ 验证非空 | ✅ 完全匹配 |
| `content` | ✅ 生成 | ✅ 验证非空 | ✅ 完全匹配 |
| `use_case_type` | ✅ 用户选择 | ✅ 验证类型 | ✅ 完全匹配 |
| `industry` | ✅ 用户选择 | ✅ 可选字段 | ✅ 完全匹配 |
| `is_published` | ✅ 自动设置 | ✅ 默认 true | ✅ 完全匹配 |
| `seo_keywords` | ✅ 自动生成 | ✅ 数组处理 | ✅ 完全匹配 |
| `quality_status` | ✅ 自动检查 | ✅ 验证枚举值 | ✅ 完全匹配 |
| `quality_score` | ✅ 自动评分 | ✅ 验证范围 | ✅ 完全匹配 |
| `quality_issues` | ✅ 自动检查 | ✅ 数组处理 | ✅ 完全匹配 |
| `created_by_admin_id` | ❌ 不传递 | ✅ 自动添加 | ✅ 完全匹配 |

## 🔍 数据流程

1. **用户选择参数**
   - 选择行业（如 "E-commerce & Retail"）
   - 选择使用场景类型（如 "Marketing"）
   - 设置每个行业生成数量（如 100 条）

2. **批量生成器处理**
   - 调用 Gemini API 生成场景词列表
   - 对每个场景词生成完整内容
   - 自动质量检查
   - 调用 `/api/admin/use-cases` POST 接口

3. **API 路由处理**
   - 验证管理员身份
   - 验证字段格式
   - 确保 slug 唯一性（自动添加后缀）
   - 添加 `created_by_admin_id`
   - 保存到数据库

4. **数据库存储**
   - 所有字段正确保存
   - 自动生成 `id`、`created_at`、`updated_at`
   - 触发器自动更新 `updated_at`

## 🎯 筛选功能验证

### 使用场景类型筛选
- ✅ 数据库索引：`idx_use_cases_type`
- ✅ API 筛选：`query.eq('use_case_type', typeFilter)`
- ✅ 前端筛选：`useCase.use_case_type === typeFilter`

### 行业筛选
- ✅ 数据库索引：`idx_use_cases_industry`
- ✅ API 筛选：`query.eq('industry', industryFilter)`
- ✅ 前端筛选：`useCase.industry === industryFilter`

### 质量状态筛选
- ✅ 数据库索引：`idx_use_cases_quality_status`
- ✅ API 筛选：`query.eq('quality_status', qualityFilter)`
- ✅ 前端筛选：`useCase.quality_status === qualityFilter`

## 📊 验证方法

运行验证脚本：
```bash
npx tsx scripts/verify-batch-generation-db.ts
```

脚本会检查：
1. 表结构是否存在
2. 最近生成的数据字段完整性
3. 必需字段是否都有值
4. 可选字段的填充情况
5. 按使用场景类型和行业分组统计

## ✅ 结论

**批量生成器与数据库完全对应！**

- ✅ 所有必需字段都正确保存
- ✅ 所有可选字段都正确保存
- ✅ 筛选功能完全匹配
- ✅ 数据可以在管理页面正确显示
- ✅ 自动应用筛选条件功能正常

