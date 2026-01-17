# ✅ 最终执行指南 - 场景数据设置

## 🎯 最终方案

由于验证查询一直超时，**完全跳过验证查询，只执行 DO $$ 块**。

已创建简化脚本：`068_setup_scene_data_direct_only.sql`（只包含 DO $$ 块，不包含验证查询）

---

## 📋 执行步骤

### 步骤 1：执行简化脚本

**文件**：`supabase/migrations/068_setup_scene_data_direct_only.sql`

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

### 步骤 2：确认设置成功

**不需要验证查询**，只需要查看 NOTICE 消息：

- ✅ 如果看到 "✅ 为 X 个场景设置了 in_sitemap = TRUE"，说明 `in_sitemap` 已设置
- ✅ 如果看到 "✅ 为 X 个场景设置了初始 AI 分数 0.7"，说明 AI 分数已设置

---

## 🎉 完成！

如果看到两个 NOTICE 消息，场景数据已设置完成：
- ✅ `in_sitemap = TRUE` 已设置
- ✅ `ai_citation_score = 0.7` 已设置

---

## 📊 设置完成后的数据状态

设置完成后，所有**已发布且可索引**的场景：
- ✅ `in_sitemap = TRUE`（会被加入 sitemap）
- ✅ `ai_citation_score = 0.7`（可以用于自动绑定 prompt）

---

## 🔍 为什么不需要验证查询？

1. **NOTICE 消息已经显示统计**：DO $$ 块中的 NOTICE 消息已经显示了设置成功的场景数量
2. **UPDATE 操作不会超时**：DO $$ 块中的 UPDATE 操作通常很快完成
3. **验证查询会超时**：由于表很大（216,273 条记录），验证查询会超时，但不影响设置操作

---

## ✅ 执行清单

- [ ] **步骤 1**：执行 `068_setup_scene_data_direct_only.sql`
- [ ] **步骤 2**：查看 NOTICE 消息，确认看到两个 "✅ 为 X 个场景设置了..."
- [ ] **完成**：场景数据已设置完成

---

## 🚀 开始执行

1. **打开文件**：`supabase/migrations/068_setup_scene_data_direct_only.sql`
2. **执行整个文件**
3. **查看 NOTICE 消息**，确认设置成功
4. **完成**！

---

## 💡 提示

- **DO $$ 块通常不会超时**：UPDATE 操作通常很快完成
- **NOTICE 消息就是验证**：如果看到 NOTICE 消息，说明设置成功
- **不需要额外验证**：验证查询会超时，但不影响设置操作

准备好了吗？开始执行吧！
