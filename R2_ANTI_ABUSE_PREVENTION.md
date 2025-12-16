# R2 防恶意访问优化

## ⚠️ 关于"恶意访问"的担心

如果担心 R2 下载视频时被识别为恶意访问，我们已经做了以下优化：

## ✅ 已实施的优化

### 1. 使用真实的浏览器请求头

**之前的配置**（可能被识别为机器人）：
```typescript
headers: {
  'User-Agent': 'Sora2Ai/1.0',  // 明显的机器人标识
}
```

**优化后的配置**（看起来像正常浏览器）：
```typescript
headers: {
  'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
  'Accept-Encoding': 'identity',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://sora2aivideos.com/',
  'Sec-Fetch-Dest': 'video',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'cross-site',
}
```

### 2. 为什么要这样配置？

- ✅ **真实的 User-Agent**：使用 Chrome 浏览器的真实 User-Agent
- ✅ **完整的浏览器请求头**：包含 Accept、Accept-Language、Referer 等
- ✅ **Sec-Fetch-* 头部**：现代浏览器自动添加的安全头部
- ✅ **Referer 头部**：表明请求来源

这样配置后，下载请求看起来就像是从你的网站正常浏览器的视频播放请求。

## 🔍 如何确认不是 R2 的问题

### 检查 1: 查看服务器日志

在服务器日志中查找 `[R2]` 开头的日志：

```bash
# 成功的下载
[R2] Downloading original video from: ...
[R2] ✅ Video size matches - original quality preserved
[R2] ✅ Video uploaded successfully to R2

# 失败的下载（如果有）
[R2] ❌ Failed to download video: { status: 403, ... }
```

### 检查 2: 错误信息判断

- **R2 下载失败**：错误信息会包含 `[R2]` 前缀和下载相关的错误
- **Grsai API 失败**：错误信息会显示 "sora generate 失败" 或 API 相关错误

### 检查 3: 错误发生的阶段

- **在生成阶段失败**（创建任务时）：这是 Grsai API 的问题，不是 R2
- **在下载上传阶段失败**（视频生成成功后）：这可能是 R2 下载源视频的问题

## 📊 当前错误分析

根据你看到的错误信息：
```
"sora generate 失败,请检查提示或图像参数"
```

**这不是 R2 的问题**，这是：
- ❌ Grsai API 在生成视频时失败
- ✅ R2 还没有开始工作（因为视频还没生成成功）
- ✅ 错误发生在 API 调用阶段，不是下载阶段

## 🔧 如果确实是 R2 被阻止

如果将来遇到 R2 下载被阻止的情况（403/429 错误），可以考虑：

### 方案 1: 延迟下载
```typescript
// 等待一段时间后再下载，避免立即下载被识别为自动化
await new Promise(resolve => setTimeout(resolve, 5000))
```

### 方案 2: 使用代理
如果源服务器阻止直接下载，可能需要通过代理。

### 方案 3: 分批下载
如果大量下载，可以添加延迟和重试机制。

## 🛡️ 当前保护措施

1. **真实的浏览器请求头** ✅
2. **详细的错误日志** ✅（方便诊断）
3. **错误时自动回退到原始 URL** ✅（不影响功能）
4. **默认不自动上传** ✅（减少 R2 使用，降低被标记风险）

## 💡 建议

**当前的错误与 R2 无关**，因为：
- 错误发生在视频生成阶段（Grsai API）
- R2 只在视频生成成功后才会下载
- 错误信息明确指向 Grsai API 的生成失败

**如果将来需要启用自动上传到 R2**：
- 当前的浏览器请求头配置已经足够
- 如果仍有问题，可以考虑添加延迟和重试机制

