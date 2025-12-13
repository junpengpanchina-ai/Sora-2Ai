# R2 两种 URL 的区别说明

## 🔍 两种不同的 URL

### 1. R2_S3_ENDPOINT（S3 API 端点）
```
https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
```

**用途**：
- ✅ 用于 **API 调用**（列出文件、上传文件、删除文件等）
- ✅ 需要 **认证**（使用 Access Key ID 和 Secret Access Key）
- ✅ 用于服务器端操作
- ✅ 与 AWS S3 API 兼容

**使用场景**：
- 列出 R2 中的文件
- 上传文件到 R2
- 生成预签名 URL
- 删除文件

### 2. R2_PUBLIC_URL（公共访问 URL）
```
https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

**用途**：
- ✅ 用于 **直接访问文件**（在浏览器中打开图片/视频）
- ✅ **不需要认证**（公共访问）
- ✅ 用于前端显示
- ✅ 直接在 `<img>` 或 `<video>` 标签中使用

**使用场景**：
- 在网页中显示图片：`<img src="https://pub-xxx.r2.dev/images/hero.jpg" />`
- 在网页中播放视频：`<video src="https://pub-xxx.r2.dev/videos/demo.mp4" />`
- 直接访问文件链接

## 📋 区别总结

| 特性 | R2_S3_ENDPOINT | R2_PUBLIC_URL |
|------|---------------|---------------|
| **URL格式** | `https://{account-id}.r2.cloudflarestorage.com` | `https://pub-{hash}.r2.dev` |
| **用途** | API 调用（认证） | 直接访问文件（公共） |
| **需要认证** | ✅ 是 | ❌ 否 |
| **使用位置** | 服务器端代码 | 前端 HTML/CSS |
| **示例** | 列出文件列表 | 显示图片 |

## 🔧 如何获取 R2_PUBLIC_URL

### 方法 1: 在 Cloudflare Dashboard 查看

1. 登录 Cloudflare Dashboard
2. 进入 **R2** → 选择你的存储桶（`sora2`）
3. 进入 **Settings** 或 **Public Access** 设置
4. 查找 **Public Domain** 或 **Custom Domain**
5. 应该能看到类似 `pub-2868c824f92441499577980a0b61114c.r2.dev` 的域名

### 方法 2: 检查存储桶设置

如果没有看到公共域名：

1. 在 R2 存储桶设置中，找到 **Public Access** 选项
2. 确保已启用公共访问
3. 如果未启用，需要启用并配置公共域名

### 方法 3: 使用 S3 端点（不推荐）

理论上可以使用 S3 端点作为公共 URL，但：
- ❌ 需要认证，不能直接在浏览器中访问
- ❌ 不符合最佳实践
- ❌ 可能无法正常工作

## ✅ 正确的配置

### 如果存储桶是公共的（有公共域名）：

```bash
R2_S3_ENDPOINT=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

### 如果存储桶不是公共的（没有公共域名）：

如果存储桶没有配置公共访问，可以：

**方案 1：启用公共访问并获取公共域名**
- 在 R2 Dashboard 中启用公共访问
- 获取或配置公共域名

**方案 2：使用预签名 URL（需要代码支持）**
- 使用 `R2_S3_ENDPOINT` 生成预签名 URL
- 代码需要使用 `getPresignedUrl` 函数

**方案 3：临时使用 S3 端点（不推荐）**
- 如果急需，可以临时使用 S3 端点
- 但可能无法正常工作

## 🔍 如何确认你的公共 URL

### 检查步骤：

1. **登录 Cloudflare Dashboard**
2. **进入 R2 → 选择 `sora2` 存储桶**
3. **查看 Settings 或 Public Access 设置**
4. **查找 "Public Domain" 或 "Custom Domain"**

如果你看到的公共域名是 `pub-2868c824f92441499577980a0b61114c.r2.dev`，那就使用这个。

如果看到不同的域名，使用你看到的那个。

## ⚠️ 重要提示

- `R2_S3_ENDPOINT` 和 `R2_PUBLIC_URL` **是不同的 URL**，有不同的用途
- 不能混用
- `R2_PUBLIC_URL` 必须是在 R2 Dashboard 中配置的公共域名
- 如果存储桶没有配置公共访问，`R2_PUBLIC_URL` 可能无法使用

## 💡 如果不知道公共 URL 是什么

1. **检查 R2 Dashboard** 中的存储桶设置
2. **或者询问我**，我可以帮你检查代码中是否有其他地方定义了公共 URL
3. **或者先使用 S3 端点**作为临时方案（可能无法正常工作）

