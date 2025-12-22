# Supabase Pro 计划功能设置指南

## 🎉 恭喜！已成功升级到 Pro 计划

现在需要配置和启用以下 Pro 计划功能：

---

## 🔧 必须配置的功能

### 1. 连接池（Connection Pooler）⭐⭐⭐

**重要性**：解决构建连接错误的关键功能

**作用**：
- 管理数据库连接，避免连接数耗尽
- 提高并发性能
- 减少连接错误

**配置步骤**：

1. **访问 Supabase Dashboard**
   - 进入：https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis/settings/database
   - 或：Dashboard → Project Settings → Database

2. **启用连接池**
   - 找到 **"Connection Pooling"** 或 **"Supavisor"** 部分
   - 点击 **"Enable Connection Pooling"**
   - 选择连接模式：
     - **Transaction Mode**（推荐）：适合大多数应用
     - **Session Mode**：适合需要会话级功能的场景

3. **获取连接字符串**
   - 复制新的连接字符串（包含 `-pooler` 后缀）
   - 格式：`postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

4. **更新环境变量（如果需要）**
   - 如果代码中直接使用数据库连接，更新连接字符串
   - 注意：大多数情况下，使用 Supabase Client 不需要修改

**验证**：
- 在 Dashboard 中查看连接池状态
- 运行 `npm run build` 测试，确认连接错误解决

---

### 2. 每日备份（Daily Backups）⭐⭐⭐

**重要性**：数据安全的关键功能

**作用**：
- 自动每日备份数据库
- 保留 7 天备份
- 可以随时恢复数据

**配置步骤**：

1. **访问 Dashboard**
   - 进入：https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis/settings/database
   - 或：Dashboard → Project Settings → Database

2. **检查备份状态**
   - 找到 **"Backups"** 部分
   - Pro 计划自动启用每日备份
   - 备份保留 7 天

3. **查看备份历史**
   - 在 **"Backups"** 页面查看备份列表
   - 可以下载或恢复备份

**注意**：
- Pro 计划自动启用，无需手动配置
- 备份在每天自动执行
- 保留最近 7 天的备份

---

### 3. 日志保留（Logs Retention）⭐⭐

**重要性**：问题排查和监控

**作用**：
- 保留 7 天的日志
- 方便问题排查
- 监控系统性能

**配置步骤**：

1. **访问 Dashboard**
   - 进入：https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis/logs
   - 或：Dashboard → Logs

2. **查看日志**
   - Pro 计划自动保留 7 天日志
   - 可以查看：
     - API 日志
     - 数据库日志
     - 认证日志
     - 存储日志

**注意**：
- Pro 计划自动启用，无需手动配置
- 日志自动保留 7 天

---

## 🚀 可选但推荐的功能

### 4. 使用量监控和提醒 ⭐⭐

**重要性**：避免意外超出配额

**配置步骤**：

1. **访问使用情况页面**
   - 进入：https://supabase.com/dashboard/org/afwecwqmahxrgmicbpem/usage?projectRef=hgzpzsiafycwlqrkzbis
   - 或：Dashboard → Usage

2. **设置使用量提醒**
   - 找到 **"Usage Alerts"** 或 **"Notifications"**
   - 设置提醒阈值：
     - 数据库大小：80%（6.4 GB）
     - 带宽：80%（200 GB）
     - 存储：80%（80 GB）

3. **配置通知方式**
   - 选择邮件通知
   - 设置提醒频率

---

### 5. 性能监控 ⭐

**重要性**：监控系统性能

**配置步骤**：

1. **访问 Dashboard**
   - 进入：https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis
   - 查看 **"Statistics"** 或 **"Metrics"**

2. **监控关键指标**
   - 数据库请求数
   - 响应时间
   - 错误率
   - 连接数

---

## 📋 配置检查清单

### 立即配置（必须）

- [ ] **启用连接池（Connection Pooler）**
  - 访问：Settings → Database → Connection Pooling
  - 启用 Transaction Mode
  - 验证连接字符串

- [ ] **验证每日备份**
  - 访问：Settings → Database → Backups
  - 确认备份已启用
  - 查看备份历史

- [ ] **验证日志保留**
  - 访问：Logs
  - 确认日志保留 7 天

### 推荐配置（可选）

- [ ] **设置使用量提醒**
  - 访问：Usage → Alerts
  - 设置提醒阈值
  - 配置通知方式

- [ ] **配置性能监控**
  - 访问：Dashboard → Statistics
  - 查看关键指标
  - 设置监控告警

---

## 🔍 验证升级成功

### 1. 检查计划状态

访问：https://supabase.com/dashboard/org/afwecwqmahxrgmicbpem/settings/billing

确认：
- ✅ 计划显示为 "Pro Plan"
- ✅ 配额已更新（数据库 8 GB，带宽 250 GB，连接 200）

### 2. 测试构建

运行构建命令，验证连接错误是否解决：

```bash
npm run build
```

预期结果：
- ✅ 不再出现 `ECONNRESET` 错误
- ✅ 构建成功完成
- ✅ 所有 706 个页面正常生成

### 3. 检查连接池

访问：https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis/settings/database

确认：
- ✅ 连接池已启用
- ✅ 连接字符串包含 `-pooler` 后缀

### 4. 检查备份

访问：https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis/settings/database

确认：
- ✅ 备份已启用
- ✅ 可以看到备份历史

---

## 🎯 优先级排序

### 高优先级（立即配置）

1. **连接池（Connection Pooler）** ⭐⭐⭐
   - 解决构建连接错误
   - 提高并发性能
   - 必须配置

2. **验证备份** ⭐⭐⭐
   - 数据安全
   - 自动启用，只需验证

### 中优先级（推荐配置）

3. **使用量提醒** ⭐⭐
   - 避免意外超出配额
   - 推荐配置

4. **性能监控** ⭐
   - 监控系统性能
   - 可选配置

---

## 🔗 快速访问链接

### 必须配置

- **连接池配置**：
  https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis/settings/database

- **备份验证**：
  https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis/settings/database

- **日志查看**：
  https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis/logs

### 推荐配置

- **使用量监控**：
  https://supabase.com/dashboard/org/afwecwqmahxrgmicbpem/usage?projectRef=hgzpzsiafycwlqrkzbis

- **性能监控**：
  https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis

---

## 📝 配置步骤总结

### 第一步：启用连接池（最重要）

1. 访问：Settings → Database → Connection Pooling
2. 启用 Transaction Mode
3. 复制新的连接字符串（如果需要）
4. 运行 `npm run build` 测试

### 第二步：验证备份和日志

1. 访问：Settings → Database → Backups
2. 确认备份已启用
3. 访问：Logs
4. 确认日志保留 7 天

### 第三步：设置使用量提醒（推荐）

1. 访问：Usage → Alerts
2. 设置提醒阈值（80%）
3. 配置邮件通知

---

## ✅ 完成后的验证

运行以下命令验证一切正常：

```bash
# 1. 测试构建（验证连接错误解决）
npm run build

# 2. 监控使用情况
npm run monitor:supabase
```

预期结果：
- ✅ 构建成功，无连接错误
- ✅ 使用情况正常
- ✅ 所有功能正常工作

---

## 🎉 完成！

配置完成后，你的 Supabase Pro 计划将：
- ✅ 连接池已启用，解决构建连接错误
- ✅ 每日备份已启用，数据安全有保障
- ✅ 日志保留 7 天，方便问题排查
- ✅ 使用量提醒已设置，避免意外超出配额

**现在可以享受 Pro 计划的所有功能了！** 🚀

