# 修复迁移触发器错误

## 问题

执行迁移时遇到错误：
```
ERROR: 42710: trigger "trigger_update_index_health_reports_updated_at" 
for relation "index_health_reports" already exists
```

## 原因

触发器已经存在，但迁移脚本尝试直接创建，导致冲突。

## 解决方案

已修复迁移脚本，添加了 `DROP TRIGGER IF EXISTS` 语句，使迁移可以安全地重复执行。

## 修复的文件

1. ✅ `./supabase/migrations/060_create_page_scores_table.sql`
2. ✅ `./supabase/migrations/061_create_tier1_internal_links_tables.sql`

## 重新执行迁移

### 方法 1: 在 Supabase Dashboard 执行（推荐）

1. 打开 Supabase Dashboard → SQL Editor
2. 复制修复后的迁移文件内容
3. 粘贴并执行

### 方法 2: 如果表已部分创建

如果表已经存在但触发器有问题，可以只执行触发器部分：

```sql
-- 修复 index_health_reports 触发器
DROP TRIGGER IF EXISTS trigger_update_index_health_reports_updated_at ON index_health_reports;
CREATE TRIGGER trigger_update_index_health_reports_updated_at
  BEFORE UPDATE ON index_health_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_index_health_reports_updated_at();

-- 修复 page_scores 触发器（如果 060 迁移已执行）
DROP TRIGGER IF EXISTS trigger_update_page_scores_updated_at ON page_scores;
CREATE TRIGGER trigger_update_page_scores_updated_at
  BEFORE UPDATE ON page_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_page_scores_updated_at();
```

## 验证

执行以下查询确认所有表都已创建：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'page_scores',
    'page_internal_links', 
    'index_health_reports', 
    'ai_serp_checks'
  )
ORDER BY table_name;
```

应该返回 4 行。

## 下一步

迁移成功后，继续执行：

```bash
npm run calculate:ai-scores:batch
npm run generate:tier1-links
npm run dev
```
