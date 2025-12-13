# 修复 theme_style 约束错误

## 🔍 问题

错误信息：
```
new row for relation "homepage_settings" violates check constraint "homepage_settings_theme_style_check"
```

**原因**：数据库中的 CHECK 约束没有包含 `'christmas'` 选项。

## ✅ 解决方案

### 方法 1: 在 Supabase SQL Editor 中执行（推荐）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入项目 → **SQL Editor**
3. 执行以下 SQL：

```sql
-- 删除旧约束
ALTER TABLE homepage_settings 
  DROP CONSTRAINT IF EXISTS homepage_settings_theme_style_check;

-- 添加新约束（包含 christmas）
ALTER TABLE homepage_settings 
  ADD CONSTRAINT homepage_settings_theme_style_check 
  CHECK (theme_style IN ('cosmic', 'minimal', 'modern', 'classic', 'christmas'));
```

### 方法 2: 使用迁移文件

已经创建了迁移文件：`supabase/migrations/030_fix_theme_style_constraint.sql`

如果使用 Supabase CLI，运行：

```bash
supabase db push
```

或者在 Supabase Dashboard 的 SQL Editor 中直接执行该文件的内容。

## 🧪 验证修复

执行修复后，验证约束是否正确：

```sql
-- 检查约束定义
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'homepage_settings'::regclass
  AND conname LIKE '%theme_style%';
```

应该看到约束包含 `'christmas'`。

## 📋 测试

修复后，再次尝试保存圣诞主题：

1. 进入管理后台 → "首页管理"
2. 选择 "Christmas（圣诞节风格）"
3. 点击"保存配置"
4. 应该成功保存，不再出现约束错误

