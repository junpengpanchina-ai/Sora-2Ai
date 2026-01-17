# ⚡ 快速执行指南

## 🎯 执行顺序（3 步）

```
步骤 1 → 验证 → 步骤 2 → 验证 → 完成 ✅
```

---

## 📋 步骤 1：初始化 Tier

**文件**：`supabase/migrations/069_initialize_scene_tiers.sql`

**执行**：在 Supabase SQL Editor 中执行整个文件

**验证**：查看结果中的 `Tier1场景数` 应该 > 0

```sql
-- 快速验证（脚本末尾会自动运行）
SELECT COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数" FROM use_cases;
```

✅ **成功标志**：`Tier1场景数 > 0`

---

## 📋 步骤 2：设置场景数据

**文件**：`supabase/migrations/068_setup_scene_data.sql`

**执行**：在 Supabase SQL Editor 中执行整个文件

**验证**：查看结果，所有计数应该 > 0

```sql
-- 快速验证（脚本末尾会自动运行）
SELECT 
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE) as "Tier1且in_sitemap=true",
  COUNT(*) FILTER (WHERE tier = 1 AND ai_citation_score >= 0.65) as "Tier1且AI分数>=0.65"
FROM use_cases;
```

✅ **成功标志**：所有计数都 > 0

---

## 🎉 完成！

执行完两个脚本后，场景数据已初始化完成：
- ✅ 所有场景都有 tier 值
- ✅ Tier1 场景已设置 `in_sitemap = TRUE`
- ✅ Tier1/Tier2 场景已设置 AI 分数
- ✅ 符合自动绑定条件的场景已准备好

---

## 📚 详细文档

如果需要更详细的说明、故障排除或自定义设置，请参考：
- `EXECUTE_TIER_SETUP_CHECKLIST.md` - 详细执行清单
- `EXECUTE_TIER_INITIALIZATION.md` - 完整执行指南
