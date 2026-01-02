# 检查遗漏记录

## 🔍 使用 SQL 直接检查

在 Supabase Dashboard SQL Editor 中执行 `database/migrations/check_missing_records.sql`，它会检查：

1. **总览统计**：总发布数、Intent > 0、Intent = 0
2. **应该更新但没更新的记录**：有 use_cases 但 intent=0（非 social-media-content）
3. **异常记录**：没有 use_cases 但 intent > 0
4. **需要更新的记录总数**

---

## 📊 预期结果

如果所有记录都正确：
- "应该更新但没更新" = 0
- "异常记录" = 0

如果有遗漏：
- "应该更新但没更新" > 0（这些需要更新）
- "异常记录" > 0（这些需要检查）

---

## ✅ 执行步骤

1. 在 Dashboard SQL Editor 中执行 `check_missing_records.sql`
2. 查看结果
3. 如果有遗漏，使用批量更新 SQL 更新它们

