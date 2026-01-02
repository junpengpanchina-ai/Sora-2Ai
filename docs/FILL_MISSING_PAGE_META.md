# 补充缺失的 page_meta 记录

## 🎯 问题

查询结果显示有 **8,180 条** `use_cases` 记录没有对应的 `page_meta` 记录。

**原因**：
- 这些记录是在创建触发器**之前**插入的
- 触发器只对**未来**的插入生效，不会自动处理历史数据

---

## ✅ 解决方案

### 方案 1：一次性插入（推荐，如果不超过 10,000 条）

**文件**：`database/migrations/fill_missing_page_meta.sql`

**执行步骤**：
1. 在 Supabase Dashboard SQL Editor 中执行整个文件
2. 等待执行完成
3. 检查 `missing_page_meta` 是否为 0

**优点**：
- 简单快速
- 一次性完成

**缺点**：
- 如果记录太多可能超时

---

### 方案 2：分批插入（如果方案 1 超时）

**文件**：`database/migrations/fill_missing_page_meta_batch.sql`

**执行步骤**：
1. 执行**方案 1**部分的 SQL（每次 2,000 条）
2. 执行后检查进度：
   ```sql
   SELECT 
     COUNT(DISTINCT uc.id) - COUNT(DISTINCT pm.page_id) as missing_page_meta
   FROM use_cases uc
   LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case';
   ```
3. 如果 `missing_page_meta > 0`，重复执行步骤 1
4. 预计需要执行 **5 次**（8,180 / 2,000 ≈ 5）

**优点**：
- 不会超时
- 可以随时检查进度

**缺点**：
- 需要手动重复执行

---

### 方案 3：自动化分批（如果方案 2 太慢）

**文件**：`database/migrations/fill_missing_page_meta_batch.sql`（方案 2 部分）

**执行步骤**：
1. 执行文件中的 `DO` 块部分
2. 脚本会自动循环处理，直到所有记录都创建完成

**优点**：
- 完全自动化
- 无需手动重复

**缺点**：
- 可能在 Dashboard 中超时
- 建议使用 `psql` 直接连接执行

---

## 📊 验证结果

执行完成后，运行以下 SQL 验证：

```sql
-- 检查是否还有缺失记录
SELECT 
  COUNT(DISTINCT uc.id) as total_use_cases,
  COUNT(DISTINCT pm.page_id) as total_page_meta,
  COUNT(DISTINCT uc.id) - COUNT(DISTINCT pm.page_id) as missing_page_meta
FROM use_cases uc
LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case';
```

**预期结果**：
- `missing_page_meta = 0`

---

## 🔍 查看新创建的记录统计

```sql
SELECT 
  purchase_intent,
  layer,
  status,
  COUNT(*) as count
FROM page_meta
WHERE page_type = 'use_case'
  AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY purchase_intent, layer, status
ORDER BY purchase_intent DESC, layer, status;
```

---

## ⚠️ 注意事项

1. **使用 `ON CONFLICT DO NOTHING`**：避免重复插入已存在的记录
2. **分批处理**：如果一次性插入可能超时，使用分批处理
3. **验证结果**：执行后务必验证 `missing_page_meta = 0`

---

## ✅ 完成后

一旦所有缺失记录都补充完成：
- ✅ 所有 `use_cases` 都有对应的 `page_meta` 记录
- ✅ 触发器会确保未来新增的记录自动同步
- ✅ 数据一致性得到保证

---

## 🎯 推荐执行顺序

1. **先尝试方案 1**（一次性插入）
   - 如果成功 → 完成 ✅
   - 如果超时 → 继续方案 2

2. **如果方案 1 超时，使用方案 2**（手动分批）
   - 每次执行 2,000 条
   - 重复执行直到 `missing_page_meta = 0`

3. **如果方案 2 太慢，使用方案 3**（自动化分批）
   - 使用 `psql` 直接连接执行
   - 避免 Dashboard 超时限制

