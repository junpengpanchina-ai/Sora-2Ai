# Supabase 使用情况监控指南

## 📊 如何监控 Supabase 使用情况

### 方法 1: 使用监控脚本（推荐）

运行监控脚本检查使用情况：

```bash
npm run monitor:supabase
```

脚本会检查：
- ✅ 数据库大小
- ✅ 各表大小
- ✅ 数据库连接数
- ✅ 存储使用情况
- ✅ 是否接近免费计划限制

### 方法 2: Supabase Dashboard（最准确）

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Usage**
4. 查看详细使用情况：
   - Database size
   - Bandwidth usage
   - Storage usage
   - API requests

### 方法 3: 检查错误日志

在应用日志中查找以下错误：

#### 1. 数据库大小限制
```
错误信息: "Database size limit exceeded"
或: "quota exceeded"
位置: Supabase Dashboard → Logs
```

#### 2. 带宽限制
```
错误信息: "Bandwidth limit exceeded"
或: "rate limit exceeded"
位置: API 请求响应
```

#### 3. 连接数限制
```
错误信息: "Too many connections"
或: "connection limit exceeded"
或: "FATAL: remaining connection slots are reserved"
位置: 数据库连接错误
```

#### 4. 性能下降
- API 响应时间明显变慢（> 2秒）
- 数据库查询超时
- 频繁的连接超时错误

## 🚨 何时需要升级到 Pro 计划

### 立即升级的情况：

1. **数据库大小 > 400 MB** (接近 500 MB 限制)
2. **带宽使用 > 4 GB/月** (接近 5 GB 限制)
3. **存储使用 > 800 MB** (接近 1 GB 限制)
4. **连接数 > 50** (接近 60 限制)
5. **出现上述任何错误信息**

### 考虑升级的情况：

1. **数据库大小 > 300 MB** (60% 使用率)
2. **带宽使用 > 3 GB/月** (60% 使用率)
3. **性能明显下降**
4. **需要更高 SLA 保证**
5. **需要每日备份**

## 📈 免费计划 vs Pro 计划对比

| 功能 | 免费计划 | Pro 计划 ($25/月) |
|------|---------|------------------|
| 数据库大小 | 500 MB | 8 GB |
| 带宽/月 | 5 GB | 50 GB |
| 存储 | 1 GB | 100 GB |
| 最大连接数 | 60 | 200 |
| SLA | 无 | 99.9% |
| 备份保留 | 1 天 | 7 天 |
| 支持 | 社区 | 优先支持 |

## 🔧 优化建议（避免升级）

在升级之前，可以尝试以下优化：

### 1. 优化数据库查询
- 添加索引
- 优化慢查询
- 使用分页
- 避免 N+1 查询

### 2. 减少数据库大小
- 清理旧数据
- 归档历史记录
- 压缩数据
- 删除未使用的表

### 3. 优化连接使用
- 使用连接池
- 及时关闭连接
- 避免长时间连接
- 使用事务模式连接池

### 4. 减少带宽使用
- 启用缓存
- 压缩响应
- 使用 CDN
- 优化 API 响应大小

## 📅 定期检查计划

建议每周运行一次监控脚本：

```bash
# 每周一运行
npm run monitor:supabase
```

或者在 Supabase Dashboard 设置使用量提醒。

## 🔗 相关链接

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase 定价](https://supabase.com/pricing)
- [Supabase 使用情况文档](https://supabase.com/docs/guides/platform/usage-based-billing)

