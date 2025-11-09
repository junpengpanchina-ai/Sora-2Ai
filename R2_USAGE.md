# Cloudflare R2 使用指南

## 🎯 快速配置

在 `.env.local` 文件中添加：

```env
# Cloudflare R2 配置
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
R2_BUCKET_NAME=sora2
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
```

**注意**: 如果只需要读取公共文件，只需要配置 `R2_PUBLIC_URL` 即可。

## 📝 使用方式

### 方式 1: 使用工具函数（推荐）

```typescript
import { getPublicUrl } from '@/lib/r2/client'

// 获取文件 URL
const videoUrl = getPublicUrl('videos/video123.mp4')
// 结果: https://pub-2868c824f92441499577980a0b61114c.r2.dev/videos/video123.mp4

// 在组件中使用
<video src={getPublicUrl('videos/video123.mp4')} controls />
```

### 方式 2: 使用 API

```typescript
// 获取文件 URL
const response = await fetch('/api/storage/url?key=videos/video123.mp4')
const { url } = await response.json()
console.log('File URL:', url)
```

### 方式 3: 直接构建 URL

```typescript
// 如果知道文件路径，可以直接构建
const fileKey = 'videos/video123.mp4'
const url = `https://pub-2868c824f92441499577980a0b61114c.r2.dev/${fileKey}`
```

## 🔧 在视频生成流程中使用

如果视频已保存在 R2，可以直接使用：

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

## 📋 R2 信息

- **公共开发 URL**: `https://pub-2868c824f92441499577980a0b61114c.r2.dev`
- **Account ID**: `2776117bb412e09a1d30cbe886cd3935`
- **Bucket Name**: `sora2`
- **目录 URI**: `https://catalog.cloudflarestorage.com/2776117bb412e09a1d30cbe886cd3935/sora2`

## 💡 使用示例

### 在 React 组件中

```tsx
import { getPublicUrl } from '@/lib/r2/client'

function VideoPlayer({ videoKey }: { videoKey: string }) {
  const videoUrl = getPublicUrl(videoKey)
  
  return (
    <video 
      src={videoUrl} 
      controls 
      className="w-full rounded-lg"
    >
      Your browser does not support video playback
    </video>
  )
}
```

### 在 API 路由中

```typescript
import { getPublicUrl } from '@/lib/r2/client'

// 在视频生成回调中
if (status === 'succeeded') {
  const r2VideoUrl = getPublicUrl(`videos/${taskId}.mp4`)
  // 使用 r2VideoUrl
}
```

## ⚠️ 注意事项

1. **文件路径**: 文件 key 应该相对于存储桶根目录
   - ✅ 正确: `videos/video123.mp4`
   - ❌ 错误: `/videos/video123.mp4` 或 `sora2/videos/video123.mp4`

2. **公共访问**: 确保 R2 存储桶已启用公共访问

3. **URL 格式**: 公共开发 URL 格式为 `https://pub-{id}.r2.dev/{fileKey}`

## 🚀 快速测试

```typescript
// 测试获取文件 URL
import { getPublicUrl } from '@/lib/r2/client'

const testUrl = getPublicUrl('test/video.mp4')
console.log('Test URL:', testUrl)
// 输出: https://pub-2868c824f92441499577980a0b61114c.r2.dev/test/video.mp4
```

