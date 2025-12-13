# R2 配置问题排查指南

## 常见问题

### 1. 获取不了图片列表

如果无法获取 R2 图片列表，请检查以下几个方面：

### 2. 环境变量配置错误

**最常见的问题：R2_SECRET_ACCESS_KEY 配置错误**

⚠️ **错误示例：**
```
R2_SECRET_ACCESS_KEY=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
```

✅ **正确配置：**
```
R2_SECRET_ACCESS_KEY=你的实际密钥字符串（通常是长字符串，不是URL）
```

**R2_SECRET_ACCESS_KEY 应该是一个密钥字符串，类似于：**
- `abc123def456ghi789...` （长字符串）
- **不是** `https://...` 这样的 URL

### 3. 必需的环境变量

确保在 Vercel 环境变量中设置了以下变量：

```bash
# R2 账户ID（通常是你的账户标识符）
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935

# R2 访问密钥ID（类似于用户名）
R2_ACCESS_KEY_ID=你的访问密钥ID

# R2 密钥（⚠️ 这是密钥字符串，不是URL！）
R2_SECRET_ACCESS_KEY=你的密钥字符串

# R2 存储桶名称
R2_BUCKET_NAME=sora2

# R2 公共URL（可选，有默认值）
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev

# R2 S3 端点（可选，有默认值）
R2_S3_ENDPOINT=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
```

### 4. 如何获取正确的 R2 凭证

1. **登录 Cloudflare Dashboard**
2. **进入 R2 管理页面**
3. **创建 API Token：**
   - 点击 "Manage R2 API Tokens"
   - 点击 "Create API token"
   - 选择权限（需要 Read、Write、Admin）
   - 复制 **Access Key ID** 和 **Secret Access Key**
   - ⚠️ Secret Access Key 只显示一次，请妥善保存

### 5. 在 Vercel 中配置环境变量

1. **进入 Vercel 项目设置**
2. **进入 Environment Variables**
3. **添加以下变量：**
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY` （⚠️ 确保是密钥字符串，不是URL）
   - `R2_BUCKET_NAME`
   - （可选）`R2_PUBLIC_URL`
   - （可选）`R2_S3_ENDPOINT`

4. **保存后重新部署项目**

### 6. 调试步骤

如果仍然无法获取图片，请按以下步骤排查：

1. **检查环境变量是否正确设置**
   - 在管理员后台的"图片配置"部分会显示错误信息
   - 查看浏览器控制台的错误日志

2. **检查 R2 凭证是否正确**
   - 确保 Access Key ID 和 Secret Access Key 匹配
   - 确保 Secret Access Key 不是 URL

3. **检查存储桶名称**
   - 确保 `R2_BUCKET_NAME` 与你的 R2 存储桶名称一致

4. **检查存储桶权限**
   - 确保 API Token 有读取权限
   - 确保存储桶是公开的或者 Token 有访问权限

5. **查看服务器日志**
   - 在 Vercel 的 Functions 日志中查看详细错误信息
   - 错误信息会显示具体的配置问题

### 7. 错误信息说明

如果看到以下错误信息：

- **"R2客户端未配置"**
  - 检查环境变量是否已设置
  - 确保已重新部署

- **"R2_SECRET_ACCESS_KEY 配置错误：这应该是一个密钥字符串，而不是URL"**
  - 你误将 URL 设置为 Secret Access Key
  - 需要改为正确的密钥字符串

- **"R2凭证无效"**
  - Access Key ID 或 Secret Access Key 不正确
  - 请重新创建 API Token

- **"R2存储桶不存在"**
  - 检查 `R2_BUCKET_NAME` 是否正确
  - 确保存储桶已创建

### 8. 测试 R2 连接

你可以通过以下方式测试 R2 连接：

1. **在管理员后台：**
   - 进入"首页管理"
   - 点击"刷新列表"
   - 查看错误提示

2. **使用测试 API：**
   - 访问 `/api/storage/test?action=list`
   - 查看返回的 JSON 响应

### 9. 临时解决方案

如果 R2 配置有问题，你可以：

1. **手动输入图片路径**
   - 在图片配置的输入框中直接输入完整的 URL
   - 例如：`https://pub-2868c824f92441499577980a0b61114c.r2.dev/images/hero.jpg`

2. **直接上传文件**
   - 使用"上传"按钮上传文件
   - 上传功能会自动使用正确的配置

## 需要帮助？

如果问题仍然存在，请检查：
1. Vercel 环境变量配置
2. Cloudflare R2 API Token 权限
3. 服务器日志中的详细错误信息

