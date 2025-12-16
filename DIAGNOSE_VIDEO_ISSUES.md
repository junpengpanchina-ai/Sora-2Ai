# 视频问题诊断指南

## 🔍 问题 1: 确定是 Grsai API 的问题还是我们自身的问题？

### 检查步骤

#### 1. 查看浏览器控制台日志

打开浏览器开发者工具（F12），查看 Console 标签，寻找以下日志：

**成功的请求**：
```
[VideoPage] 📤 Starting video generation request: {...}
[VideoPage] 📥 Received response: {status: 200, ok: true}
[VideoPage] 📦 Response data: {success: true, task_id: "..."}
```

**我们自身的问题（客户端）**：
```
[VideoPage] ❌ Failed to generate video (client-side catch): ...
```

**服务器端的问题**：
```
[VideoPage] 📥 Received response: {status: 500, ok: false}
[VideoPage] 📦 Response data: {error: "...", details: "..."}
```

#### 2. 查看服务器端日志（Vercel）

1. 登录 Vercel Dashboard
2. 选择项目 → 进入 "Deployments" → 点击最新的部署
3. 查看 "Functions" 标签下的日志

**我们自身的问题（服务器端）**：
- `[video/generate]` 开头的错误日志
- `[Grsai API]` 开头的错误日志（如果是 API 调用问题）
- 错误信息包含 "Failed to create video task" 或 "Failed to call video generation API"

**Grsai API 的问题**：
- 错误信息包含 "sora generate 失败"
- HTTP 状态码：401, 403, 429, 500, 502, 503
- 错误信息包含 "upstream service rejected"

#### 3. 使用调试 API

访问 `/api/debug/test-grsai-api` 来测试 Grsai API 连接：

```bash
curl https://your-domain.com/api/debug/test-grsai-api
```

这会返回：
- API Key 是否正确配置
- API Host 是否正确
- 是否能成功连接到 Grsai API

#### 4. 常见错误分类

**我们自身的问题**：
- ❌ "Failed to create video task" → 数据库问题
- ❌ "Insufficient credits" → 积分系统问题
- ❌ "Invalid origin" → CSRF 保护问题
- ❌ "Unauthorized" → 认证问题

**Grsai API 的问题**：
- ✅ "sora generate 失败,请检查提示或图像参数" → Grsai API 拒绝请求
- ✅ "Failed to generate, system error please try again" → Grsai API 系统错误
- ✅ HTTP 401/403 → API Key 问题
- ✅ HTTP 429 → 请求频率过高
- ✅ HTTP 500/502/503 → Grsai API 服务不可用

## 🔍 问题 2: 视频模糊问题

### 可能的原因

1. **直接使用 Grsai API 的 URL（可能被压缩）**
   - 如果 `R2_AUTO_UPLOAD_VIDEOS=false`，视频直接从 Grsai API 获取
   - Grsai API 可能对视频进行了压缩以节省带宽

2. **浏览器播放时的质量问题**
   - 浏览器可能使用了较低的质量播放
   - 网络带宽限制

3. **视频本身就是低分辨率**
   - Grsai API 返回的视频可能本身就是低分辨率
   - Sora-2 模型可能生成的就是这个质量

### 检查步骤

#### 1. 检查视频 URL 来源

在浏览器控制台查看视频加载日志：
```
[VideoPage] 📹 Video loaded: {
  src: "https://...",
  videoWidth: 720,
  videoHeight: 1280,
  isFromR2: false,  // 如果为 false，说明使用的是原始 API URL
  isFromOriginalApi: true
}
```

#### 2. 检查视频分辨率

在浏览器中右键点击视频 → "检查元素" → 查看 `<video>` 元素的属性：
- `videoWidth`: 视频的实际宽度
- `videoHeight`: 视频的实际高度

如果分辨率很低（如 480x640），说明视频本身可能就是低分辨率。

#### 3. 启用 R2 自动上传（如果需要）

在 `.env.local` 或 Vercel 环境变量中设置：
```env
R2_AUTO_UPLOAD_VIDEOS=true
```

这会：
- 下载原始视频（使用 `Accept-Encoding: identity` 避免压缩）
- 上传到 R2
- 使用 R2 URL 代替原始 API URL

**注意**：这会增加 R2 存储成本。

#### 4. 直接下载视频检查质量

点击视频下方的 "Download Original Video" 按钮，下载视频文件，然后在本地播放器查看：
- 文件大小（MB）
- 分辨率
- 比特率

如果下载的视频也很模糊，说明原始视频就是低分辨率。

#### 5. 检查 R2 视频质量

如果视频在 R2 中，访问 `/api/video/check-quality/[task_id]` 查看质量信息：
```bash
curl https://your-domain.com/api/video/check-quality/[task_id]
```

这会返回：
- 原始文件大小
- 上传后的文件大小
- 文件大小是否匹配（如果不匹配，说明下载时被压缩了）

## 🔍 问题 3: 乱码问题

### 可能的原因

1. **URL 参数编码/解码错误**
   - 双重编码或双重解码
   - 编码方式不匹配

2. **字符编码问题**
   - 数据库字符集问题
   - API 响应编码问题

### 检查步骤

#### 1. 检查 URL 参数

在浏览器地址栏查看 URL：
```
/video?prompt=%E4%B8%AD%E6%96%87%E6%8F%90%E7%A4%BA%E8%AF%8D
```

如果看到类似 `%E4%B8%AD...` 的编码，这是正常的 URL 编码。

#### 2. 检查控制台日志

查看 `[VideoPage]` 日志，确认 prompt 是否正确：
```javascript
[VideoPage] 📤 Starting video generation request: {
  prompt: "中文提示词"  // 应该显示正确的中文，不是乱码
}
```

#### 3. 检查数据库

如果 prompt 在数据库中也显示为乱码，可能是数据库字符集问题。

#### 4. 检查编码处理

在代码中搜索 `encodeURIComponent` 和 `decodeURIComponent`：
- 所有发送到 URL 的参数应该使用 `encodeURIComponent`
- Next.js 的 `useSearchParams().get()` 会自动解码，不需要再调用 `decodeURIComponent`

## 🛠️ 快速诊断命令

### 1. 检查视频生成是否成功

```bash
# 查看最新的视频任务
curl https://your-domain.com/api/video/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 检查 Grsai API 连接

```bash
# 测试 API 连接
curl https://your-domain.com/api/debug/test-grsai-api
```

### 3. 检查视频质量

```bash
# 替换 [task_id] 为实际的任务 ID
curl https://your-domain.com/api/video/check-quality/[task_id]
```

## 📋 问题报告清单

如果问题仍然存在，收集以下信息：

- [ ] 浏览器控制台的完整日志（包括 `[VideoPage]` 和 `[Grsai API]` 日志）
- [ ] 服务器端日志（Vercel Functions 日志）
- [ ] 视频 URL（是否来自 R2 还是原始 API）
- [ ] 视频分辨率（`videoWidth` x `videoHeight`）
- [ ] 错误截图
- [ ] 复现步骤

## 💡 常见解决方案

### 问题：视频模糊

**方案 1**: 启用 R2 自动上传（推荐，但会增加存储成本）
```env
R2_AUTO_UPLOAD_VIDEOS=true
```

**方案 2**: 使用下载按钮下载原始视频，可能比浏览器播放更清晰

**方案 3**: 如果视频本身就是低分辨率，这是 Grsai API 的限制，无法通过我们解决

### 问题：乱码

**方案 1**: 清理浏览器缓存和 cookies，重新登录

**方案 2**: 检查 `.env.local` 中的字符编码设置

**方案 3**: 如果是数据库问题，检查数据库字符集

### 问题：生成失败

**方案 1**: 检查 Grsai API Key 是否正确配置

**方案 2**: 检查积分是否充足

**方案 3**: 检查 prompt 是否符合要求（不能包含敏感内容）

