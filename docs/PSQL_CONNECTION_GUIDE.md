# 使用 psql 直接连接执行批量更新

## 🎯 为什么使用 psql？

- ✅ **无超时限制**：Supabase Dashboard 有超时限制，psql 没有
- ✅ **可以长时间运行**：适合大批量更新
- ✅ **实时进度**：可以看到详细的执行日志
- ✅ **更稳定**：不受浏览器或网络影响

---

## 📋 步骤 1：获取连接信息

### 方法 1：从 Supabase Dashboard

1. 打开 Supabase Dashboard
2. 进入 **Settings** → **Database**
3. 找到 **Connection string** 或 **Connection pooling**
4. 复制连接信息

**格式**：
```
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

### 方法 2：从环境变量

如果你有 `.env.local` 文件，可以设置：
```env
SUPABASE_DB_HOST=db.xxx.supabase.co
SUPABASE_DB_PASSWORD=your_password
SUPABASE_DB_USER=postgres
SUPABASE_DB_NAME=postgres
```

---

## 🔧 步骤 2：安装 psql

### macOS

```bash
brew install postgresql
```

### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

### 使用 Docker（无需安装）

```bash
docker run -it --rm postgres psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

---

## 🚀 步骤 3：执行批量更新

### 方法 1：使用自动化脚本（推荐）

```bash
# 1. 给脚本添加执行权限
chmod +x scripts/run-batch-update-with-psql.sh

# 2. 运行脚本
bash scripts/run-batch-update-with-psql.sh
```

脚本会自动：
- ✅ 检查 psql 是否安装
- ✅ 测试数据库连接
- ✅ 执行批量更新
- ✅ 验证结果

### 方法 2：手动执行

#### 步骤 3.1：连接数据库

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

**示例**：
```bash
psql "postgresql://postgres:mypassword@db.abcdefgh.supabase.co:5432/postgres"
```

#### 步骤 3.2：执行 SQL 文件

在 psql 中执行：

```sql
-- 方法 1: 使用 \i 命令执行文件
\i database/migrations/batch_update_purchase_intent_ultra_safe.sql

-- 方法 2: 直接粘贴 SQL 内容
-- 复制 batch_update_purchase_intent_ultra_safe.sql 的内容并粘贴
```

#### 步骤 3.3：验证结果

```sql
-- 检查剩余数量
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

-- 查看分布
SELECT 
  purchase_intent,
  layer,
  COUNT(*) as count
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent > 0
GROUP BY purchase_intent, layer
ORDER BY purchase_intent DESC, layer;
```

#### 步骤 3.4：退出 psql

```sql
\q
```

---

## 🔍 方法 3：使用 Docker（无需安装 psql）

如果你不想安装 psql，可以使用 Docker：

```bash
# 1. 执行 SQL 文件
docker run -it --rm \
  -v "$(pwd):/workspace" \
  -w /workspace \
  postgres \
  psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f database/migrations/batch_update_purchase_intent_ultra_safe.sql
```

**或者交互式执行**：

```bash
docker run -it --rm \
  -v "$(pwd):/workspace" \
  -w /workspace \
  postgres \
  psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

然后在 psql 中执行：
```sql
\i database/migrations/batch_update_purchase_intent_ultra_safe.sql
```

---

## 📊 执行过程示例

```
🚀 开始批量更新 Purchase Intent（超安全模式）...
批次大小: 1000 条
延迟时间: 1.5 秒/批
预计时间: 约 5-6 分钟

第 10 批: 更新 1000 条，累计 10000 条
第 20 批: 更新 1000 条，累计 20000 条
第 30 批: 更新 1000 条，累计 30000 条
...
第 203 批: 更新 62 条，累计 203062 条
✅ 所有记录已更新完成！

🎉 批量更新完成！总共更新 203062 条记录，执行 203 批次
```

---

## ⚠️ 注意事项

1. **保持连接**：执行过程中不要关闭终端
2. **网络稳定**：确保网络连接稳定
3. **备份数据**：虽然这是更新操作，但建议先备份（可选）
4. **低峰期执行**：避免在高峰期执行，影响其他查询

---

## 🐛 常见问题

### 问题 1：连接被拒绝

**错误**：
```
psql: error: connection to server at "xxx" failed
```

**解决**：
- 检查主机地址是否正确
- 检查密码是否正确
- 检查防火墙设置
- 尝试使用 Connection pooling 地址

### 问题 2：认证失败

**错误**：
```
psql: error: password authentication failed
```

**解决**：
- 确认密码正确
- 检查用户权限
- 尝试重置数据库密码

### 问题 3：找不到文件

**错误**：
```
\i: database/migrations/...: No such file or directory
```

**解决**：
- 确认文件路径正确
- 使用绝对路径
- 或使用 Docker 挂载目录

---

## ✅ 总结

**最简单的方法**：
1. 使用自动化脚本：`bash scripts/run-batch-update-with-psql.sh`
2. 或手动连接：`psql "postgresql://..."` 然后执行 SQL 文件

**优点**：
- 无超时限制
- 可以长时间运行
- 可以看到实时进度

**预计时间**：5-10 分钟（203,062 条记录）

