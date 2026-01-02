# 自动同步 page_meta 机制

## 🎯 功能

当新增或更新 `use_cases` 记录时，自动创建/更新对应的 `page_meta` 记录，确保 `purchase_intent` 和 `layer` 字段自动设置。

---

## 📋 安装步骤

### 步骤 1：执行 SQL 创建触发器和函数

在 Supabase Dashboard SQL Editor 中执行：

```sql
-- 文件：database/migrations/create_auto_sync_page_meta.sql
```

这会创建：
- ✅ `calculate_purchase_intent()` 函数
- ✅ `calculate_layer()` 函数
- ✅ `sync_page_meta_from_use_case()` 函数
- ✅ `trigger_sync_page_meta_on_insert` 触发器（插入时自动同步）
- ✅ `trigger_sync_page_meta_on_update` 触发器（更新时自动同步）

---

## ✅ 工作原理

### 自动触发场景

1. **插入新 use_case**：
   ```sql
   INSERT INTO use_cases (id, use_case_type, is_published, page_slug)
   VALUES (gen_random_uuid(), 'product-demo-showcase', true, 'demo-slug');
   ```
   → 自动创建 `page_meta` 记录，`purchase_intent = 3`, `layer = 'conversion'`

2. **更新 use_case 的 use_case_type**：
   ```sql
   UPDATE use_cases 
   SET use_case_type = 'education-explainer'
   WHERE id = 'xxx';
   ```
   → 自动更新 `page_meta` 记录，`purchase_intent = 2`, `layer = 'conversion'`

3. **更新 use_case 的 is_published**：
   ```sql
   UPDATE use_cases 
   SET is_published = true
   WHERE id = 'xxx';
   ```
   → 自动更新 `page_meta` 记录的 `status = 'published'`

---

## 🔧 手动同步函数（可选）

### 同步单个 use_case

```sql
SELECT sync_single_page_meta('use_case_id_here');
```

### 批量同步所有 use_cases

```sql
SELECT * FROM sync_all_page_meta_from_use_cases();
```

---

## 📊 Purchase Intent 映射规则

| use_case_type | purchase_intent | layer |
|---------------|----------------|-------|
| `product-demo-showcase` | 3 | conversion |
| `advertising-promotion` | 3 | conversion |
| `education-explainer` | 2 | conversion |
| `ugc-creator-content` | 2 | conversion |
| `brand-storytelling` | 1 | asset |
| `social-media-content` | 0 | asset |

---

## ✅ 验证触发器

执行以下 SQL 检查触发器是否创建成功：

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%sync_page_meta%';
```

应该看到：
- `trigger_sync_page_meta_on_insert` (INSERT)
- `trigger_sync_page_meta_on_update` (UPDATE)

---

## 🧪 测试

### 测试 1：插入新记录

```sql
-- 插入测试记录
INSERT INTO use_cases (id, use_case_type, is_published, page_slug)
VALUES (gen_random_uuid(), 'product-demo-showcase', true, 'test-auto-sync');

-- 检查是否自动创建了 page_meta
SELECT * FROM page_meta 
WHERE page_id = (SELECT id FROM use_cases WHERE page_slug = 'test-auto-sync');
```

应该看到：
- `purchase_intent = 3`
- `layer = 'conversion'`
- `status = 'published'`

### 测试 2：更新记录

```sql
-- 更新 use_case_type
UPDATE use_cases 
SET use_case_type = 'education-explainer'
WHERE page_slug = 'test-auto-sync';

-- 检查 page_meta 是否自动更新
SELECT purchase_intent, layer 
FROM page_meta 
WHERE page_id = (SELECT id FROM use_cases WHERE page_slug = 'test-auto-sync');
```

应该看到：
- `purchase_intent = 2`
- `layer = 'conversion'`

---

## ⚠️ 注意事项

1. **性能**：触发器会在每次插入/更新时执行，对于大批量操作可能影响性能
2. **回滚**：如果 `use_cases` 插入失败，`page_meta` 也不会创建（事务一致性）
3. **手动覆盖**：如果需要手动修改 `page_meta`，触发器不会覆盖（只在特定字段更新时触发）

---

## 🔄 如果需要禁用触发器

```sql
-- 禁用插入触发器
ALTER TABLE use_cases DISABLE TRIGGER trigger_sync_page_meta_on_insert;

-- 禁用更新触发器
ALTER TABLE use_cases DISABLE TRIGGER trigger_sync_page_meta_on_update;

-- 重新启用
ALTER TABLE use_cases ENABLE TRIGGER trigger_sync_page_meta_on_insert;
ALTER TABLE use_cases ENABLE TRIGGER trigger_sync_page_meta_on_update;
```

---

## ✅ 总结

安装后，**所有新增的 `use_cases` 都会自动同步到 `page_meta`**，无需手动操作！

- ✅ 自动计算 `purchase_intent`
- ✅ 自动设置 `layer`
- ✅ 自动同步 `status`（根据 `is_published`）
- ✅ 自动同步 `page_slug`

**文件位置**：`database/migrations/create_auto_sync_page_meta.sql`

