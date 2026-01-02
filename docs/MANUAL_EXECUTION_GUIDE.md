# 手动分段执行指南（解决超时问题）

## 🎯 问题

即使使用自动循环的 DO 块，Supabase Dashboard 仍然超时。

## ✅ 解决方案：手动分段执行

每次执行更新 2,000 条，手动重复执行直到完成。

---

## 📋 执行步骤

### 步骤 1：执行第一次更新

1. 打开 Supabase Dashboard → SQL Editor
2. 复制 `database/migrations/batch_update_purchase_intent_manual.sql` 的内容
3. 执行
4. 查看结果（应该显示 "UPDATE 2000" 或更少）

### 步骤 2：检查进度

执行这个查询：

```sql
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;
```

### 步骤 3：重复执行

- 如果 `remaining > 0`，**再次执行**步骤 1 的 SQL
- 重复直到 `remaining = 0`

---

## 📊 预计执行次数

- 总记录：203,062 条
- 每批：2,000 条
- 预计次数：**约 102 次**

虽然次数多，但：
- ✅ 每次执行很快（几秒钟）
- ✅ 不会超时
- ✅ 可以随时中断和继续
- ✅ 完全可控

---

## ⚡ 快速执行技巧

### 技巧 1：使用快捷键

- Mac: `Cmd+Enter` 执行
- Windows: `Ctrl+Enter` 执行

### 技巧 2：批量执行

可以连续执行多次，每次执行后立即按快捷键再次执行。

### 技巧 3：减小批次（如果还是慢）

如果 2,000 条还是慢，可以改为 1,000 条：

```sql
LIMIT 1000  -- 改为 1000
```

---

## 🔍 验证最终结果

所有记录更新完成后，执行：

```sql
-- 查看最终分布
SELECT 
  purchase_intent,
  layer,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent > 0
GROUP BY purchase_intent, layer
ORDER BY purchase_intent DESC, layer;

-- 确认没有遗漏
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;
```

`remaining` 应该为 0。

---

## 🎯 推荐方案对比

| 方案 | 批次大小 | 执行次数 | 超时风险 | 推荐度 |
|------|----------|----------|----------|--------|
| 手动分段 | 2,000 | ~102 次 | 无 | ⭐⭐⭐⭐⭐ |
| Dashboard 自动 | 500 | ~406 次 | 高 | ⭐⭐ |
| psql 自动 | 1,000 | ~203 次 | 无 | ⭐⭐⭐⭐ |

---

## ✅ 总结

**虽然需要执行多次，但这是最可靠的方法**：
- ✅ 不会超时
- ✅ 可以随时中断和继续
- ✅ 每次执行很快
- ✅ 完全可控

**执行流程**：
1. 执行 SQL → 查看结果
2. 检查剩余数量
3. 重复执行，直到完成

**预计总时间**：15-20 分钟（102 次 × 10-15 秒/次）

