# R2 存储管理指南

## 🎯 存储优化策略

为了避免 R2 存储空间爆炸，我们提供了多种存储管理方案。

## 📋 方案 1: 按需上传（推荐，默认）

**默认配置：不自动上传到 R2**

### 优点：
- ✅ **节省存储空间**：只存储用户真正需要的视频
- ✅ **降低成本**：减少 R2 存储费用
- ✅ **灵活性强**：用户需要时再上传

### 配置：
```env
# .env.local
# 不设置或设置为 false = 不自动上传（推荐）
R2_AUTO_UPLOAD_VIDEOS=false
```

### 工作原理：
- 视频生成后，使用原始 API URL
- 当用户点击下载时，可以选择上传到 R2（按需）
- 或者用户始终使用原始 API URL

## 📋 方案 2: 自动上传 + 自动清理

**如果你需要所有视频都在 R2 中，但想定期清理旧视频**

### 配置：
```env
# .env.local
R2_AUTO_UPLOAD_VIDEOS=true
R2_CLEANUP_DAYS_OLD=30  # 可选：30天后自动清理（需要配置清理任务）
```

### 自动清理 API：
```bash
# 删除 30 天前的视频（测试运行，不实际删除）
POST /api/admin/r2/cleanup
{
  "daysOld": 30,
  "dryRun": true,
  "maxFiles": 100
}

# 实际删除
POST /api/admin/r2/cleanup
{
  "daysOld": 30,
  "dryRun": false,
  "maxFiles": 100
}
```

## 📋 方案 3: 手动管理

**完全手动控制，只在需要时上传**

1. 保持 `R2_AUTO_UPLOAD_VIDEOS=false`
2. 在用户界面添加"上传到 R2"按钮（可选实现）
3. 管理员可以手动清理不需要的视频

## 💰 存储成本估算

### 假设：
- 每个视频平均大小：5 MB
- 每天生成 100 个视频
- 30 天保留期

### 计算：
```
每天存储：100 个 × 5 MB = 500 MB
30 天总存储：500 MB × 30 = 15 GB
```

### Cloudflare R2 定价（2024）：
- **存储费用**：$0.015/GB/月
- **15 GB 成本**：15 × $0.015 = **$0.225/月** ≈ **$2.7/年**

### 如果永久存储：
```
1 年：500 MB × 365 = 182.5 GB ≈ **$33/年**
```

## 🛠️ 清理旧视频

### 方法 1: 使用 API（推荐）

```bash
# 1. 先测试运行（查看哪些文件会被删除）
curl -X POST https://your-domain.com/api/admin/r2/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daysOld": 30,
    "dryRun": true,
    "maxFiles": 100
  }'

# 2. 实际删除
curl -X POST https://your-domain.com/api/admin/r2/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daysOld": 30,
    "dryRun": false,
    "maxFiles": 100
  }'
```

### 方法 2: 设置定时任务（Cron Job）

在你的服务器或使用 Vercel Cron：

```typescript
// vercel.json 或 cron job
{
  "crons": [{
    "path": "/api/admin/r2/cleanup",
    "schedule": "0 2 * * *"  // 每天凌晨 2 点运行
  }]
}
```

API 调用：
```typescript
// app/api/admin/r2/cleanup/route.ts
// 需要添加认证 token 验证
```

## 📊 监控存储使用

### 查看 R2 存储桶使用情况：

1. 登录 Cloudflare Dashboard
2. 进入 R2 > 你的存储桶
3. 查看"Usage"部分

### 使用代码检查：

```bash
# 列出所有视频文件
GET /api/admin/r2/list?prefix=videos/

# 查看存储使用情况（需要在 R2 Dashboard）
```

## ⚙️ 配置建议

### 小型项目（< 100 视频/天）：
```env
R2_AUTO_UPLOAD_VIDEOS=false  # 按需上传
```

### 中型项目（100-1000 视频/天）：
```env
R2_AUTO_UPLOAD_VIDEOS=true
# 设置自动清理：30 天
# 预计存储：15 GB
# 成本：~$0.225/月
```

### 大型项目（> 1000 视频/天）：
```env
R2_AUTO_UPLOAD_VIDEOS=false  # 或按需
# 考虑：
# 1. 只存储热门/重要视频
# 2. 更短的保留期（7-14 天）
# 3. 使用外部存储或 CDN
```

## 🔧 实现按需上传（未来功能）

可以添加一个"保存到 R2"按钮：

```typescript
// 当用户点击"保存到 R2"时
const handleSaveToR2 = async () => {
  const response = await fetch(`/api/video/upload-to-r2/${taskId}`, {
    method: 'POST',
  })
  // 上传后更新 video_url 为 R2 URL
}
```

## 📝 最佳实践

1. **默认使用按需上传**：`R2_AUTO_UPLOAD_VIDEOS=false`
2. **定期清理**：设置自动清理任务（30 天）
3. **监控使用**：定期查看 R2 Dashboard
4. **设置预算告警**：在 Cloudflare 设置预算限制
5. **考虑压缩**：如果需要长期存储，可以考虑压缩（但会损失质量）

## 🚨 注意事项

1. **删除不可恢复**：R2 删除操作是永久的，确保备份重要视频
2. **API URL 可能过期**：原始 API URL 可能有有效期，考虑在过期前上传到 R2
3. **清理前备份**：清理前建议先测试运行（dryRun=true）

## 📞 相关 API

- `POST /api/admin/r2/cleanup` - 清理旧视频
- `GET /api/admin/r2/list` - 列出 R2 文件
- `POST /api/video/upload-to-r2/{id}` - 按需上传视频（待实现）

