# 视频清晰度验证指南

## 📋 如何验证视频是否是最清晰的版本

### 方法 1: 检查服务器日志

在视频生成完成时，查看服务器日志，你会看到以下信息：

#### ✅ 成功上传到 R2（保持原始质量）
```
[R2] Video quality verification: {
  sourceUrl: '...',
  contentType: 'video/mp4',
  expectedSize: 'X.XX MB (XXXXX bytes)',
  actualSize: 'X.XX MB (XXXXX bytes)',
  sizeMatch: true,
  r2Key: 'videos/xxx.mp4'
}
[R2] ✅ Video size matches - original quality preserved
[R2] ✅ Video uploaded successfully to R2: { ... }
```

#### ⚠️ 大小不匹配（可能被压缩）
```
[R2] ⚠️ Video size mismatch - expected: XXXXX bytes, got: YYYYY bytes
[R2] This might indicate the video was compressed during download
```

#### ⚠️ 上传失败，使用原始 URL
```
[video/callback] ⚠️ Failed to upload video to R2, using original URL
```

### 方法 2: 使用 API 接口检查

创建一个 API 请求来检查视频质量信息：

```bash
# 替换 {task_id} 为实际的视频任务 ID
curl https://your-domain.com/api/video/check-quality/{task_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例：**

#### ✅ 视频已上传到 R2（推荐）
```json
{
  "success": true,
  "taskId": "xxx",
  "status": "succeeded",
  "video": {
    "url": "https://pub-xxx.r2.dev/videos/xxx.mp4",
    "source": "r2",
    "size": 5242880,
    "contentType": "video/mp4",
    "accessible": true
  },
  "qualityNotes": {
    "isFromR2": true,
    "isFromApi": false,
    "recommendation": "✅ Video is stored in R2 with original quality preserved"
  },
  "sizeInfo": {
    "bytes": 5242880,
    "mb": "5.00",
    "kb": "5120.00"
  }
}
```

#### ⚠️ 使用原始 API URL（可能不是最清晰的）
```json
{
  "success": true,
  "video": {
    "url": "https://api-example.com/video.mp4",
    "source": "api",
    "size": 3145728,
    "contentType": "video/mp4",
    "accessible": true
  },
  "qualityNotes": {
    "isFromR2": false,
    "isFromApi": true,
    "recommendation": "⚠️ Video is using original API URL. Consider re-uploading to R2 for better quality control."
  }
}
```

### 方法 3: 检查数据库

查看 `video_tasks` 表中的 `video_url` 字段：

- ✅ **R2 URL** (最清晰): `https://pub-xxx.r2.dev/videos/xxx.mp4`
- ⚠️ **API URL** (可能压缩): `https://api-example.com/video.mp4`

### 方法 4: 对比文件大小

1. **获取原始 API URL 的视频大小**：
   ```bash
   curl -I "原始API视频URL" | grep -i content-length
   ```

2. **获取 R2 URL 的视频大小**：
   ```bash
   curl -I "R2视频URL" | grep -i content-length
   ```

3. **对比**：如果大小一致或非常接近，说明保持了原始质量。

## 🔍 质量保证机制

我们的系统会：

1. **下载时**：
   - 使用 `Accept-Encoding: identity` 确保不压缩
   - 记录预期的文件大小
   - 对比实际下载的大小

2. **上传时**：
   - 保持原始视频质量
   - 在 R2 元数据中记录原始大小
   - 不进行任何转码或压缩

3. **验证**：
   - 日志中会显示大小匹配状态
   - 提供 API 接口检查质量信息
   - 如果上传失败，会回退到原始 URL

## ⚙️ 如果视频不是最清晰的

### 问题 1: 上传到 R2 失败

**原因**：
- R2 凭证未配置
- 网络问题
- R2 存储空间不足

**解决方案**：
1. 检查环境变量 `R2_ACCESS_KEY_ID` 和 `R2_SECRET_ACCESS_KEY`
2. 查看服务器日志中的错误信息
3. 检查 R2 存储桶配置

### 问题 2: 下载时被压缩

**原因**：
- API 服务器强制压缩
- 代理服务器压缩

**解决方案**：
- 系统已使用 `Accept-Encoding: identity` 避免压缩
- 如果仍被压缩，检查中间代理服务器配置

### 问题 3: 文件大小不匹配

如果日志显示大小不匹配：
1. 检查下载时的 HTTP 响应头
2. 验证 API 是否返回了完整的原始视频
3. 查看是否有中间代理进行了处理

## 📝 最佳实践

1. **始终检查日志**：生成视频后查看服务器日志
2. **使用 API 验证**：定期检查视频质量信息
3. **监控上传成功率**：确保大部分视频成功上传到 R2
4. **对比文件大小**：如果怀疑质量，对比不同视频的大小

## 🔗 相关 API

- `GET /api/video/check-quality/{task_id}` - 检查视频质量信息

## 💡 提示

- R2 URL 的视频通常质量更好且更稳定
- 如果看到 ⚠️ 警告，说明可能存在问题，需要检查
- 文件大小是判断质量的重要指标之一

