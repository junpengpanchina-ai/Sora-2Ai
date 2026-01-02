# 智能批量更新方案

## 🎯 两种智能方案（无需手动操作）

### 方案 1：TypeScript 脚本（推荐，最简单）

**优点**：
- ✅ 无需密码，只需要 API Key
- ✅ 一次运行，自动完成
- ✅ 可以看到实时进度
- ✅ 自动验证结果

**执行**：
```bash
npm run batch-update-intent-smart
```

**前提条件**：
- `.env.local` 中有 `SUPABASE_SERVICE_ROLE_KEY`
- 已安装 `tsx`（已安装）

**预计时间**：10-15 分钟

---

### 方案 2：创建存储过程 + 调用（更高效）

**步骤 1**：创建存储过程

在 Supabase Dashboard SQL Editor 中执行：
```sql
-- 文件：database/migrations/create_batch_update_function.sql
```

**步骤 2**：调用存储过程

在 SQL Editor 中执行：
```sql
-- 重复执行，直到返回 0
SELECT batch_update_purchase_intent_single(1000);
```

**或者使用 TypeScript 脚本调用**：
```bash
npm run batch-update-intent
```

---

## 📊 方案对比

| 方案 | 需要密码 | 需要手动操作 | 预计时间 | 推荐度 |
|------|----------|--------------|----------|--------|
| TypeScript 脚本 | ❌ 不需要 | ❌ 不需要 | 10-15 分钟 | ⭐⭐⭐⭐⭐ |
| 存储过程 + RPC | ❌ 不需要 | ⚠️ 需要调用多次 | 10-15 分钟 | ⭐⭐⭐⭐ |
| psql 脚本 | ✅ 需要 | ❌ 不需要 | 5-10 分钟 | ⭐⭐⭐⭐ |
| Dashboard 手动 | ❌ 不需要 | ✅ 需要 102 次 | 15-20 分钟 | ⭐⭐ |

---

## 🚀 推荐：使用 TypeScript 脚本

**最简单的方法**：
```bash
npm run batch-update-intent-smart
```

**脚本会自动**：
1. 查询需要更新的记录
2. 批量更新
3. 显示进度
4. 验证结果

**无需任何手动操作！**

---

## 🔧 如果 TypeScript 脚本失败

### 检查环境变量

确保 `.env.local` 中有：
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 获取 Service Role Key

1. Supabase Dashboard → Settings → API
2. 找到 "service_role" key（注意：这是敏感信息，不要提交到 git）
3. 复制到 `.env.local`

---

## ✅ 总结

**最推荐**：`npm run batch-update-intent-smart`

- 一次运行
- 自动完成
- 无需密码
- 无需手动操作

