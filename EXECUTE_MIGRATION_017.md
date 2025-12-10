# 执行数据库迁移 017：清理 page_slug 文件扩展名

## 📋 迁移脚本功能

1. **清理所有 `page_slug` 中的文件扩展名**（`.xml`、`.html`、`.htm`、`.json`、`.txt`）
2. **处理重复的 `page_slug`**（自动添加数字后缀，如 `-1`、`-2`）
3. **更新 `updated_at` 时间戳**

## 🚀 执行步骤

### 步骤 1: 访问 Supabase Dashboard

1. 打开浏览器，访问：https://supabase.com/dashboard
2. 登录你的账号
3. 选择你的项目（Sora AI Platform）

### 步骤 2: 进入 SQL Editor

1. 在左侧菜单中找到 **SQL Editor**
2. 点击 **SQL Editor**
3. 点击 **New query**（新建查询）按钮

### 步骤 3: 复制并执行迁移脚本

1. 打开项目文件：`supabase/migrations/017_clean_page_slug_extensions.sql`
2. **复制全部 SQL 代码**（见下方）
3. 粘贴到 Supabase SQL Editor 中
4. 点击 **Run** 按钮（或按 `Cmd+Enter` / `Ctrl+Enter`）

### 步骤 4: 验证执行结果

执行后应该看到：
- ✅ "Success. No rows returned" 或类似成功消息
- ✅ 没有错误信息

### 步骤 5: 验证数据（可选）

执行以下 SQL 查询，确认没有包含文件扩展名的记录：

```sql
-- 检查是否还有包含文件扩展名的 page_slug（应该返回空）
SELECT id, page_slug 
FROM long_tail_keywords 
WHERE page_slug ~* '\.(xml|html|htm|json|txt)$';
```

如果返回空结果，说明迁移成功！

## 📝 迁移脚本内容

```sql
-- 017_clean_page_slug_extensions.sql
-- 清理 long_tail_keywords 表中 page_slug 字段的文件扩展名（如 .xml, .html 等）

-- 更新所有包含文件扩展名的 page_slug
-- 移除常见的文件扩展名：.xml, .html, .htm, .json, .txt
UPDATE long_tail_keywords
SET 
  page_slug = REGEXP_REPLACE(
    page_slug,
    '\.(xml|html|htm|json|txt)$',
    '',
    'i'
  ),
  updated_at = NOW()
WHERE 
  page_slug ~* '\.(xml|html|htm|json|txt)$';

-- 如果更新后出现重复的 page_slug，需要手动处理
-- 这里我们添加一个临时后缀来避免唯一性冲突
DO $$
DECLARE
  duplicate_record RECORD;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  -- 查找重复的 page_slug
  FOR duplicate_record IN
    SELECT page_slug, COUNT(*) as cnt
    FROM long_tail_keywords
    GROUP BY page_slug
    HAVING COUNT(*) > 1
  LOOP
    -- 为重复的记录添加数字后缀
    counter := 1;
    FOR duplicate_record IN
      SELECT id, page_slug
      FROM long_tail_keywords
      WHERE page_slug = duplicate_record.page_slug
      ORDER BY created_at
      OFFSET 1  -- 跳过第一条，保留原始的
    LOOP
      new_slug := duplicate_record.page_slug || '-' || counter;
      
      -- 确保新 slug 也是唯一的
      WHILE EXISTS (SELECT 1 FROM long_tail_keywords WHERE page_slug = new_slug) LOOP
        counter := counter + 1;
        new_slug := duplicate_record.page_slug || '-' || counter;
      END LOOP;
      
      UPDATE long_tail_keywords
      SET 
        page_slug = new_slug,
        updated_at = NOW()
      WHERE id = duplicate_record.id;
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- 验证：显示所有仍包含文件扩展名的记录（应该为空）
-- SELECT id, page_slug 
-- FROM long_tail_keywords 
-- WHERE page_slug ~* '\.(xml|html|htm|json|txt)$';
```

## ⚠️ 重要提示

1. **执行前建议备份数据库**（可选但推荐）
   - 在 Supabase Dashboard 中，进入 **Settings** > **Database** > **Backups**
   - 可以创建手动备份

2. **该迁移会修改现有数据**，执行后无法撤销

3. **如果数据库中没有包含文件扩展名的 `page_slug`**，迁移不会影响任何数据

4. **执行后，所有 `page_slug` 字段将不包含文件扩展名**，与代码逻辑一致

## ✅ 执行后验证

执行迁移后，可以：

1. **在 Supabase Dashboard 中查看数据**：
   - 进入 **Table Editor**
   - 选择 `long_tail_keywords` 表
   - 查看 `page_slug` 列，应该都不包含文件扩展名

2. **测试页面访问**：
   - 访问关键词页面：`https://sora2aivideos.com/keywords/{slug}`
   - 应该能正常显示 HTML 页面

3. **测试 XML 访问**：
   - 访问 XML 格式：`https://sora2aivideos.com/keywords/{slug}?format=xml`
   - 应该能正常返回 XML 内容

## 🐛 如果遇到错误

### 错误 1: "relation 'long_tail_keywords' does not exist"
- **原因**: `long_tail_keywords` 表还没有创建
- **解决**: 先执行 `supabase/migrations/013_create_long_tail_keywords.sql`

### 错误 2: "permission denied"
- **原因**: 权限不足
- **解决**: 确保使用正确的 Supabase 项目，检查 API 密钥

### 错误 3: "duplicate key value violates unique constraint"
- **原因**: 清理后出现重复的 `page_slug`
- **解决**: 迁移脚本会自动处理，如果仍有问题，需要手动检查

## 📚 相关文件

- `supabase/migrations/017_clean_page_slug_extensions.sql` - 迁移文件
- `supabase/migrations/013_create_long_tail_keywords.sql` - 长尾关键词表创建脚本

