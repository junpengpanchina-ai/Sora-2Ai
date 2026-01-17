# ✅ 执行更新脚本 - 现在可以更新了

## 📊 检查结果

从快速检查的结果看：
- ✅ **有符合条件的记录**：所有 10 条记录都符合条件（`is_published = TRUE` 和 `noindex = FALSE`）
- ❌ **需要更新**：`in_sitemap` 都是 `false`，`ai_citation_score` 都是 `0.000`

**结论**：有需要更新的记录，可以执行设置脚本了！

---

## 🎯 执行步骤

### 步骤 1：执行设置脚本

**文件**：`068_setup_scene_data_simple.sql`（已优化，添加了排序）

**操作**：
1. 在 Supabase SQL Editor 中打开文件
2. 执行整个文件
3. 查看执行结果中的 NOTICE 消息

**预期输出**：
```
NOTICE: ✅ 为 1000 个场景设置了 in_sitemap = TRUE（前 1000 条）
NOTICE: ✅ 为 1000 个场景设置了初始 AI 分数 0.7（前 1000 条）
```

**✅ 成功标志**：
- 看到两个 NOTICE 消息
- 更新的场景数 > 0

---

### 步骤 2：验证更新结果

执行后，再次运行快速检查查询：

```sql
-- 快速检查：查看前 10 条符合条件的记录
SELECT 
  id,
  is_published,
  noindex,
  in_sitemap,
  ai_citation_score
FROM use_cases
WHERE is_published = TRUE
  AND noindex = FALSE
LIMIT 10;
```

**期望结果**：
- `in_sitemap` 应该是 `true`
- `ai_citation_score` 应该是 `0.7` 或更高

---

### 步骤 3：如果需要处理更多记录

如果前 1000 条处理成功，可以：

**选项 A：多次执行脚本**
- 再次执行 `068_setup_scene_data_simple.sql`
- 每次会处理下一批 1000 条记录
- 重复执行直到处理完所有记录

**选项 B：使用分批执行脚本**
- 执行 `068_setup_scene_data_batch.sql`
- 会自动循环处理所有记录
- 有进度提示

---

## 📋 执行清单

- [ ] **步骤 1**：执行 `068_setup_scene_data_simple.sql`
- [ ] **步骤 1 验证**：查看 NOTICE 消息，确认更新成功
- [ ] **步骤 2**：运行快速检查查询，验证更新结果
- [ ] **步骤 3**：（可选）如果需要处理更多记录，多次执行或使用分批脚本

---

## 🚀 开始执行

1. **打开文件**：`supabase/migrations/068_setup_scene_data_simple.sql`
2. **执行整个文件**
3. **查看 NOTICE 消息**，确认更新成功
4. **运行快速检查查询**，验证更新结果

---

## 💡 提示

- **脚本已优化**：添加了 `ORDER BY id`，确保每次执行处理相同的记录
- **可以多次执行**：如果有很多记录需要处理，可以多次执行脚本
- **分批执行**：如果有很多记录，也可以使用 `068_setup_scene_data_batch.sql` 自动处理所有记录

准备好了吗？现在可以执行更新脚本了！
