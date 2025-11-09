# Cloudflare R2 快速配置指南

## 🚀 快速开始

### ⚡ 超简单配置（仅展示图片）

**如果您只需要展示图片，不需要上传、删除等操作，配置非常简单：**

在项目根目录的 `.env.local` 文件中添加：

```env
# Cloudflare R2 配置（仅展示图片）
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

**就这么简单！** 不需要配置 API Token，不需要其他设置。

**使用示例：**
```tsx
import { getPublicUrl } from '@/lib/r2/client'

// 获取图片 URL
const imageUrl = getPublicUrl('images/hero.jpg')
// 在组件中使用
<img src={imageUrl} alt="Hero" />
```

📖 **详细使用说明请参考 `R2_SIMPLE_USAGE.md`**

---

### 1. 基本配置（仅读取访问）

如果需要访问公共文件，只需配置公共 URL：

在项目根目录的 `.env.local` 文件中添加：

```env
# Cloudflare R2 配置（基本）
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
R2_BUCKET_NAME=sora2
```

### 2. 完整配置（需要列出文件）

如果需要列出文件或生成预签名 URL，需要创建 API Token：

#### 2.1 在 Cloudflare Dashboard 创建 API Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **R2** > **Manage R2 API Tokens**
3. 点击 **Create API Token**
4. 配置：
   - **Token Name**: `Sora-2Ai Read Token`
   - **Permissions**: `Object Read`（只需要读取权限）
   - **TTL**: 留空（永久）或设置过期时间
5. 点击 **Create API Token**
6. **重要**: 立即复制以下信息（Secret Access Key 只显示一次）：
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID**（已提供：`2776117bb412e09a1d30cbe886cd3935`）

#### 2.2 配置环境变量

在 `.env.local` 文件中添加：

```env
# Cloudflare R2 配置（完整）
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=sora2
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

**替换占位符**：
- `your_access_key_id_here` → 替换为您的 Access Key ID
- `your_secret_access_key_here` → 替换为您的 Secret Access Key

**示例**：
```env
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=abc123def456ghi789
R2_SECRET_ACCESS_KEY=xyz789uvw456rst123abc456def789
R2_BUCKET_NAME=sora2
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

### 3. 验证配置

重启开发服务器后，R2 功能即可使用：

```bash
npm run dev
```

## 📝 使用示例

### 获取文件 URL

```typescript
// 方式 1: 使用 API
const response = await fetch('/api/storage/url?key=videos/video123.mp4')
const data = await response.json()
console.log('File URL:', data.url)

// 方式 2: 直接使用工具函数
import { getPublicUrl } from '@/lib/r2/client'
const url = getPublicUrl('videos/video123.mp4')
console.log('File URL:', url)

// 方式 3: 直接构建 URL（如果知道路径）
const url = 'https://pub-2868c824f92441499577980a0b61114c.r2.dev/videos/video123.mp4'
```

### 获取预签名 URL（需要认证配置）

```typescript
const response = await fetch('/api/storage/url?key=videos/video123.mp4&presigned=true&expiresIn=7200')
const data = await response.json()
console.log('Presigned URL:', data.url)
```

### 列出文件（需要认证配置）

```typescript
// 列出所有文件
const response = await fetch('/api/storage/list')
const data = await response.json()
console.log('Files:', data.files)

// 列出特定文件夹
const response = await fetch('/api/storage/list?prefix=videos/')
const data = await response.json()

// 获取单个文件 URL
const response = await fetch('/api/storage/list?key=videos/video123.mp4')
const data = await response.json()
```

### 在 React 组件中使用

```tsx
import { getPublicUrl } from '@/lib/r2/client'

function VideoPlayer({ videoKey }: { videoKey: string }) {
  const videoUrl = getPublicUrl(videoKey)
  
  return (
    <video src={videoUrl} controls className="w-full rounded-lg" />
  )
}
```

## 🔧 在视频生成流程中使用

如果视频已保存在 R2，直接使用 URL：

```typescript
import { getPublicUrl } from '@/lib/r2/client'

// 假设视频保存在 R2 的 videos 文件夹中
const videoKey = `videos/${taskId}.mp4`
const r2VideoUrl = getPublicUrl(videoKey)

// 更新数据库
await supabase
  .from('video_tasks')
  .update({ video_url: r2VideoUrl })
  .eq('id', taskId)
```

## ⚠️ 注意事项

1. **公共访问**: 确保您的 R2 存储桶已启用公共访问（如果需要通过 URL 直接访问）
2. **文件路径**: 文件 key 应该相对于存储桶根目录，例如 `videos/video123.mp4`
3. **安全性**: 不要将 R2 凭据提交到 Git，使用环境变量管理

## 🐛 常见问题

### Q: 无法访问文件，返回 404
A: 检查文件路径是否正确，确认 R2 存储桶已启用公共访问

### Q: 列出文件失败
A: 确认已配置 R2 API Token，检查 Access Key ID 和 Secret Access Key 正确

### Q: 如何找到 Account ID？
A: 在 Cloudflare Dashboard 的 R2 概览页面，Account ID 显示在页面顶部

## 📚 更多信息

详细配置说明请参考 `R2_SETUP.md`

