# Cloudflare R2 存储配置指南

本指南将帮助您配置 Cloudflare R2 对象存储服务，用于访问和调用存储的文件。

## 📋 前置要求

1. Cloudflare 账户
2. 已创建 R2 存储桶
3. R2 公共访问 URL（已提供）

## 🔧 配置步骤

### 1. 基本配置（仅读取访问）

如果只需要访问公共文件，只需配置公共 URL：

在 `.env.local` 文件中添加：

```env
# Cloudflare R2 配置（仅读取）
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
R2_BUCKET_NAME=sora2
```

### 2. 完整配置（需要列出文件或生成预签名 URL）

如果需要列出文件或生成预签名 URL，需要配置 API Token：

1. 在 Cloudflare Dashboard 中，进入 **R2** > **Manage R2 API Tokens**
2. 点击 **Create API Token**
3. 设置权限：
   - **Permissions**: Object Read（只需要读取权限）
   - **TTL**: 根据需要设置（或留空为永久）
4. 复制以下信息：
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID**（在 R2 概览页面可以找到）

在 `.env.local` 文件中添加：

```env
# Cloudflare R2 配置（完整）
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=sora2
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

### 3. 配置 R2 存储桶公共访问

如果您的存储桶需要公共访问：

1. 在 R2 Dashboard 中，进入您的存储桶
2. 进入 **Settings** > **Public Access**
3. 启用 **Public Access**

## 📚 API 使用示例

### 获取文件 URL

```typescript
// 获取公共 URL
const response = await fetch('/api/storage/url?key=videos/video123.mp4')
const data = await response.json()
console.log('File URL:', data.url)

// 获取预签名 URL（需要认证配置）
const response = await fetch('/api/storage/url?key=videos/video123.mp4&presigned=true&expiresIn=7200')
const data = await response.json()
console.log('Presigned URL:', data.url)
```

### 列出文件（需要认证配置）

```typescript
// 列出所有文件
const response = await fetch('/api/storage/list')
const data = await response.json()

// 列出特定文件夹的文件
const response = await fetch('/api/storage/list?prefix=videos/')
const data = await response.json()

// 获取单个文件 URL
const response = await fetch('/api/storage/list?key=videos/video123.mp4')
const data = await response.json()
```

### 直接使用公共 URL

```typescript
// 如果知道文件路径，可以直接构建 URL
const fileKey = 'videos/video123.mp4'
const publicUrl = `https://pub-2868c824f92441499577980a0b61114c.r2.dev/${fileKey}`

// 在视频标签中使用
<video src={publicUrl} controls />
```

## 🔒 安全建议

1. **不要将 R2 凭据提交到 Git**
   - 确保 `.env.local` 在 `.gitignore` 中
   - 使用环境变量管理服务（如 Vercel Environment Variables）

2. **使用预签名 URL 访问私有文件**
   - 对于敏感文件，使用预签名 URL 而不是公共 URL
   - 预签名 URL 有过期时间，更安全

## 🚀 在代码中使用

### 获取文件 URL 的工具函数

```typescript
import { getPublicUrl } from '@/lib/r2/client'

// 获取公共 URL
const videoUrl = getPublicUrl('videos/video123.mp4')
console.log(videoUrl) // https://pub-2868c824f92441499577980a0b61114c.r2.dev/videos/video123.mp4
```

### 在视频生成流程中使用

```typescript
// 如果视频已保存在 R2，直接使用 URL
const r2VideoUrl = getPublicUrl(`videos/${taskId}.mp4`)

// 更新数据库中的 video_url
await supabase
  .from('video_tasks')
  .update({ video_url: r2VideoUrl })
  .eq('id', taskId)
```

## 🐛 故障排除

### 问题：无法访问文件，返回 404

**解决方案**：
1. 确认文件路径（key）正确
2. 确认 R2 存储桶已启用公共访问
3. 检查文件是否存在于 R2 存储桶中

### 问题：列出文件失败

**解决方案**：
1. 确认已配置 R2 API Token
2. 检查 Access Key ID 和 Secret Access Key 正确
3. 确认 Account ID 正确

### 问题：预签名 URL 生成失败

**解决方案**：
1. 确认已配置 R2 API Token
2. 检查文件 key 是否正确
3. 确认存储桶名称正确

## 📖 相关文档

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [AWS S3 SDK 文档](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)

