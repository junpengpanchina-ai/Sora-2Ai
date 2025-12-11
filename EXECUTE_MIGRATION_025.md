# 执行数据库迁移 025 - 添加官网风格选项

## 📋 迁移说明

此迁移将添加 `official`（官网风格）作为 `page_style` 字段的有效选项。

## 🚀 执行方式

### 方式 1：通过 Supabase Dashboard（推荐）

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 在左侧菜单中点击 **SQL Editor**
4. 点击 **New query** 按钮
5. 复制下面的 SQL 代码并粘贴到编辑器中
6. 点击 **Run** 按钮执行

### 方式 2：通过 Supabase CLI

如果你使用 Supabase CLI，可以运行：

```bash
supabase db push
```

或者直接执行 SQL：

```bash
supabase db execute -f supabase/migrations/025_add_official_page_style.sql
```

## 📝 SQL 代码

```sql
-- 025_add_official_page_style.sql
-- 添加官网风格选项到 page_style 字段

-- 更新约束以支持新的页面风格
ALTER TABLE long_tail_keywords
  DROP CONSTRAINT IF EXISTS long_tail_keywords_page_style_check;

ALTER TABLE long_tail_keywords
  ADD CONSTRAINT long_tail_keywords_page_style_check 
  CHECK (page_style IN ('default', 'christmas', 'official'));

-- 更新注释说明
COMMENT ON COLUMN long_tail_keywords.page_style IS '页面风格: default(默认风格), christmas(圣诞节风格，包含动态背景和背景音乐), official(官网风格)';
```

## ✅ 验证

执行成功后，你可以通过以下 SQL 验证：

```sql
-- 检查约束是否正确
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'long_tail_keywords'::regclass
  AND conname = 'long_tail_keywords_page_style_check';
```

应该看到约束包含 `('default', 'christmas', 'official')`。

## ⚠️ 注意事项

- 此迁移是安全的，不会影响现有数据
- 现有记录的 `page_style` 值（`default` 或 `christmas`）不会改变
- 迁移后，你可以在管理后台选择"官网风格"选项

## 📍 文件位置

迁移文件位于：`supabase/migrations/025_add_official_page_style.sql`
