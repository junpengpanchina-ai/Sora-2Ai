# R2 存储测试指南

## 🧪 测试页面

访问 `/storage-test` 页面来测试 R2 存储功能。

## 📋 测试功能

### 1. 列出文件

测试列出 R2 存储桶中的文件：

- **列出所有文件**: 点击 "List All Files" 按钮
- **列出图片**: 点击 "List Images" 按钮（会列出 `images/` 文件夹下的文件）

### 2. 测试文件访问

1. 在输入框中输入文件 key（例如：`images/test.jpg`）
2. 点击以下按钮之一：
   - **Get Image URL**: 获取图片 URL 并预览
   - **Check File**: 检查文件是否存在
   - **Quick Test**: 快速生成 URL（使用工具函数）

### 3. 图片预览

如果文件存在且是图片，会在右侧显示预览。

## 🔧 API 测试

### 测试 API 端点

```bash
# 列出所有文件
curl http://localhost:3000/api/storage/test?action=list

# 列出特定文件夹
curl http://localhost:3000/api/storage/test?action=list&prefix=images/

# 检查文件是否存在
curl http://localhost:3000/api/storage/test?action=check&key=images/test.jpg

# 获取图片 URL
curl http://localhost:3000/api/storage/test?action=image&key=images/test.jpg
```

## 📝 使用示例

### 在代码中直接使用

```typescript
import { getPublicUrl } from '@/lib/r2/client'

// 获取图片 URL
const imageUrl = getPublicUrl('images/test.jpg')
// 结果: https://pub-2868c824f92441499577980a0b61114c.r2.dev/images/test.jpg

// 在组件中使用
<img src={imageUrl} alt="Test" />
```

### 在 React 组件中

```tsx
import { getPublicUrl } from '@/lib/r2/client'

function ImageDisplay({ imageKey }: { imageKey: string }) {
  const imageUrl = getPublicUrl(imageKey)
  
  return (
    <img 
      src={imageUrl} 
      alt="R2 Image"
      className="w-full rounded-lg"
      onError={(e) => {
        console.error('Failed to load image:', imageKey)
      }}
    />
  )
}
```

## ⚠️ 注意事项

1. **文件路径格式**: 
   - ✅ 正确: `images/test.jpg`
   - ❌ 错误: `/images/test.jpg` 或 `sora2/images/test.jpg`

2. **公共访问**: 确保 R2 存储桶已启用公共访问

3. **文件不存在**: 如果文件不存在，图片会加载失败，但 URL 格式是正确的

## 🐛 故障排除

### 问题：无法列出文件

**可能原因**：
- R2 API Token 未配置
- Access Key ID 或 Secret Access Key 错误

**解决方案**：
- 检查 `.env.local` 中的 R2 配置
- 如果只需要读取公共文件，可以不配置 API Token

### 问题：图片无法加载

**可能原因**：
- 文件不存在
- 文件路径错误
- R2 存储桶未启用公共访问

**解决方案**：
1. 检查文件是否存在于 R2 存储桶中
2. 确认文件路径（key）正确
3. 在 Cloudflare Dashboard 中启用存储桶的公共访问

## 📚 相关文档

- `R2_SETUP.md` - 详细配置指南
- `R2_QUICK_START.md` - 快速开始指南
- `R2_USAGE.md` - 使用指南

