# 验证迁移 025 - 页面风格选项

## 🔍 验证方法

### 方法 1：使用验证脚本（推荐）

运行验证脚本：

```bash
npm run verify:page-style
```

或者直接运行：

```bash
node scripts/verify-page-style-migration.js
```

脚本会自动：
1. ✅ 检查数据库约束是否正确
2. ✅ 测试插入 `official` 页面风格
3. ✅ 验证所有支持的页面风格值（default, christmas, official）
4. ✅ 检查现有数据的页面风格分布
5. ✅ 清理测试数据

### 方法 2：手动 SQL 验证

在 Supabase SQL Editor 中执行以下查询：

#### 1. 检查约束定义

```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'long_tail_keywords'::regclass
  AND conname = 'long_tail_keywords_page_style_check';
```

**预期结果**：应该看到约束包含 `('default', 'christmas', 'official')`

#### 2. 测试插入 official 值

```sql
-- 创建一个测试记录
INSERT INTO long_tail_keywords (
  keyword,
  intent,
  page_slug,
  page_style,
  status
) VALUES (
  'test-official-style',
  'information',
  'test-official',
  'official',  -- 测试新值
  'draft'
)
ON CONFLICT (page_slug) DO UPDATE 
SET page_style = 'official';

-- 验证插入成功
SELECT id, keyword, page_style 
FROM long_tail_keywords 
WHERE keyword = 'test-official-style';
```

**预期结果**：应该成功插入，`page_style` 为 `'official'`

#### 3. 检查现有数据

```sql
-- 查看页面风格分布
SELECT 
  page_style,
  COUNT(*) as count
FROM long_tail_keywords
GROUP BY page_style
ORDER BY count DESC;
```

#### 4. 清理测试数据（可选）

```sql
DELETE FROM long_tail_keywords 
WHERE keyword = 'test-official-style';
```

### 方法 3：通过管理后台验证

1. 访问管理后台：`/admin`
2. 进入关键词管理页面
3. 创建或编辑一个关键词
4. 检查"页面风格"下拉框是否包含：
   - ✅ 默认风格 (Default)
   - ✅ 圣诞节风格 🎄 (Christmas)
   - ✅ 官网风格 🌐 (Official Website) ← 新增
5. 选择"官网风格"并保存
6. 验证保存成功

## ✅ 成功标志

迁移成功时，你应该能够：

- ✅ 在数据库中插入/更新 `page_style = 'official'` 的记录
- ✅ 在管理后台看到"官网风格"选项
- ✅ 选择"官网风格"后可以成功保存
- ✅ 约束检查包含三个值：`('default', 'christmas', 'official')`

## ❌ 如果验证失败

如果验证失败，可能的原因：

1. **迁移未执行**
   - 解决：执行 `supabase/migrations/025_add_official_page_style.sql`

2. **约束未更新**
   - 解决：检查 SQL 执行日志，确认约束已更新

3. **环境变量未配置**
   - 解决：确保 `.env.local` 包含正确的 Supabase 配置

## 📝 验证后

验证成功后，你可以：

1. 在管理后台使用新的"官网风格"选项
2. 为关键词页面应用官网风格
3. 在代码中使用 `page_style: 'official'`
