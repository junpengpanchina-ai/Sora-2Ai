# 修复批量更新问题

## 🚨 发现的问题

脚本显示更新了 220,000 条，但实际只有约 1,000 条被正确更新。

## ✅ 解决方案

### 步骤 1：修复存储过程

在 Supabase Dashboard SQL Editor 中执行：

```sql
-- 文件：database/migrations/fix_batch_update_function.sql
```

这个修复版本添加了 `AND pm.purchase_intent = 0` 条件，确保只更新 intent=0 的记录。

### 步骤 2：重新运行脚本

```bash
npm run batch-update-intent-final
```

---

## 🔍 问题原因

之前的存储过程在 UPDATE 时没有检查 `purchase_intent = 0`，可能导致：
- 重复更新已更新的记录
- 更新了不应该更新的记录

修复后的版本在 UPDATE 的 WHERE 子句中添加了 `AND pm.purchase_intent = 0`，确保只更新未更新的记录。

---

## 📊 验证

修复后，检查结果：

```sql
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;
```

应该逐渐减少，直到为 0。

