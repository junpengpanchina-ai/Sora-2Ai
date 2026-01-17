# ⚡ 执行 068_setup_scene_data_direct.sql 指南

## 🎯 脚本说明

**文件**：`068_setup_scene_data_direct.sql`

**特点**：
- ✅ **不依赖 tier**：直接基于业务条件（`is_published`, `noindex`）设置数据
- ✅ **避免超时**：UPDATE 操作通常很快，不会超时
- ✅ **达到同样效果**：设置 `in_sitemap = TRUE` 和 AI 分数

---

## 📋 执行步骤

### 步骤 1：执行脚本

**文件**：`supabase/migrations/068_setup_scene_data_direct.sql`

**操作**：
1. 在 Supabase SQL Editor 中打开文件
2. 执行整个文件
3. 查看执行结果中的 NOTICE 消息

**预期输出**：
```
NOTICE: ✅ 为 X 个场景设置了 in_sitemap = TRUE
NOTICE: ✅ 为 X 个场景设置了初始 AI 分数 0.7
```

**✅ 成功标志**：
- 看到两个 NOTICE 消息
- 更新的场景数 > 0

---

### 步骤 2：验证结果

**快速验证查询**：
```sql
-- 检查是否有场景设置了 in_sitemap 和 AI 分数
SELECT 
  EXISTS(SELECT 1 FROM use_cases WHERE is_published = TRUE AND noindex = FALSE AND in_sitemap = TRUE LIMIT 1) as "是否有in_sitemap=true的场景",
  EXISTS(SELECT 1 FROM use_cases WHERE is_published = TRUE AND noindex = FALSE AND ai_citation_score >= 0.65 LIMIT 1) as "是否有AI分数>=0.65的场景";
```

**期望结果**：两个都返回 `true`

---

## 🎯 这个脚本做了什么？

### 1. 设置 in_sitemap = TRUE

为所有**已发布且可索引**的场景设置 `in_sitemap = TRUE`：
- 条件：`is_published = TRUE AND noindex = FALSE`
- 效果：这些场景会被加入 sitemap

### 2. 设置 AI 分数 0.7

为所有**已发布且可索引**的场景设置初始 AI 分数 0.7：
- 条件：`is_published = TRUE AND noindex = FALSE AND in_sitemap = TRUE`
- 效果：这些场景可以用于自动绑定 prompt

---

## ✅ 执行清单

- [ ] **步骤 1**：执行 `068_setup_scene_data_direct.sql`
- [ ] **步骤 1 验证**：查看 NOTICE 消息，确认更新成功
- [ ] **步骤 2**：（可选）使用快速验证查询确认结果
- [ ] **完成**：场景数据已设置完成

---

## 🚀 开始执行

1. **打开文件**：`supabase/migrations/068_setup_scene_data_direct.sql`
2. **执行整个文件**
3. **查看 NOTICE 消息**，确认设置成功
4. **完成**！

---

## 💡 优势

相比修复 tier 的方案：
- ✅ **更简单**：不需要先修复 tier
- ✅ **更快速**：UPDATE 操作通常很快
- ✅ **不超时**：避免了 COUNT 查询的超时问题
- ✅ **同样效果**：达到设置 in_sitemap 和 AI 分数的目标

---

## 📊 后续（可选）

如果以后需要修复 tier：
- 可以在低峰期分批修复
- 或者使用异步任务处理
- 不影响当前的数据设置

现在可以开始执行了！
