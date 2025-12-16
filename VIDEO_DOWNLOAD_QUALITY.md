# 视频下载质量保证

## ✅ 原汁原味导出 - 无压缩保证

### 1. 存储阶段（上传到 R2）

**完全不压缩**：
- 从 API 下载原始视频时，使用 `Accept-Encoding: identity` 确保不压缩
- 直接将原始 buffer 上传到 R2，**不进行任何转码或压缩**
- 在 R2 元数据中保存原始文件大小信息

```typescript
// lib/r2/client.ts - uploadVideoFromUrl 函数
const videoResponse = await fetch(sourceUrl, {
  headers: {
    'Accept-Encoding': 'identity', // 不压缩
  },
})
const buffer = Buffer.from(videoBuffer) // 直接使用原始 buffer

const command = new PutObjectCommand({
  Body: buffer, // 原始 buffer，无压缩
  ContentType: contentType, // 保持原始 Content-Type
})
```

### 2. 下载阶段（从 R2 导出）

**完全原汁原味**：

#### 方式 1: 直接下载（推荐）

使用下载按钮，浏览器直接从 R2 URL 下载：

```html
<a 
  href="https://pub-xxx.r2.dev/videos/xxx.mp4" 
  download="video-xxx.mp4"
>
  Download Original Video
</a>
```

**特点**：
- ✅ 直接从 R2 CDN 下载，**不经过服务器**
- ✅ 浏览器直接获取原始文件
- ✅ **零压缩，零转码**
- ✅ 下载速度最快（CDN 加速）

#### 方式 2: 通过公共 URL 直接访问

R2 公共 URL 直接返回原始文件：

```
https://pub-xxx.r2.dev/videos/xxx.mp4
```

**特点**：
- ✅ Cloudflare R2 默认不压缩
- ✅ 直接返回存储的原始文件
- ✅ 无需额外配置

### 3. Cloudflare R2 特性

**R2 不进行自动压缩**：
- R2 是一个对象存储服务，**不提供自动视频压缩功能**
- 存储什么文件，就返回什么文件
- 不会像某些 CDN 那样自动压缩视频

**与某些 CDN 的区别**：
- ❌ 某些 CDN（如 Cloudflare Images）：提供自动压缩/转码
- ✅ Cloudflare R2：纯对象存储，**完全保持原始文件**

### 4. 验证下载质量

#### 方法 1: 检查文件大小

下载后对比文件大小：

```bash
# 获取原始文件大小（从服务器日志）
# 日志中会显示：
# expectedSize: "5.00 MB (5242880 bytes)"
# actualSize: "5.00 MB (5242880 bytes)"

# 下载后检查
ls -lh downloaded-video.mp4
# 应该与日志中的大小一致
```

#### 方法 2: 使用 API 检查

```bash
curl /api/video/check-quality/{task_id}
```

响应中的 `sizeInfo` 会显示原始文件大小，下载后对比即可。

#### 方法 3: 检查文件哈希（MD5）

如果 API 提供原始文件的 MD5，可以对比：

```bash
# 下载后
md5sum downloaded-video.mp4

# 对比原始文件的 MD5
# 如果一致，说明完全没有被修改或压缩
```

### 5. 技术保证

#### 上传阶段
```typescript
✅ 使用 Accept-Encoding: identity（不压缩）
✅ 直接使用 arrayBuffer() 获取原始二进制
✅ 直接上传 buffer，不经过任何处理
✅ 保存原始 Content-Type
```

#### 存储阶段
```typescript
✅ R2 PutObjectCommand 直接存储 buffer
✅ 无任何转码配置
✅ 元数据中保存原始大小
```

#### 下载阶段
```typescript
✅ 直接链接到 R2 公共 URL
✅ 浏览器直接下载，不经过服务器
✅ 使用 download 属性强制下载而非播放
```

### 6. 质量保证流程

```
API 原始视频
    ↓ (Accept-Encoding: identity)
下载原始二进制
    ↓ (直接 buffer)
上传到 R2（无压缩）
    ↓ (R2 存储原始文件)
R2 公共 URL
    ↓ (浏览器直接下载)
本地文件（100% 原始质量）
```

### 7. 如果怀疑被压缩

检查以下几点：

1. **检查服务器日志**：
   - 查看上传时的 `sizeMatch` 是否为 `true`
   - 查看是否有 "Video size mismatch" 警告

2. **对比文件大小**：
   - 下载的文件大小应该与日志中的 `actualSize` 完全一致

3. **检查下载方式**：
   - 确保使用下载按钮，而非右键"另存为视频"
   - 某些浏览器在"另存为视频"时可能会转码

4. **验证 R2 URL**：
   - 确保使用的是 R2 URL（`r2.dev` 域名）
   - 而不是通过代理或转码服务

### 8. 最佳实践

1. **始终使用下载按钮**：确保获取原始文件
2. **验证文件大小**：下载后对比日志中的大小
3. **使用 R2 URL**：R2 存储的视频质量最可靠
4. **查看日志**：生成视频时查看质量验证日志

### 9. 技术细节

- **R2 不支持视频转码**：R2 是纯对象存储，不像 Cloudflare Stream 那样提供转码
- **公共 URL 直接返回**：R2 公共 URL 直接返回存储的文件，无中间处理
- **CDN 加速但不压缩**：虽然经过 Cloudflare CDN，但只加速传输，不压缩内容

## 总结

✅ **完全保证**：从 R2 下载的视频是 100% 原始质量，无任何压缩或转码
✅ **技术验证**：通过文件大小对比可以验证
✅ **日志记录**：服务器日志会记录质量验证信息

**放心使用，原汁原味！** 🎬

