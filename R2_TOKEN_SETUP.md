# Cloudflare R2 API Token 配置指南

## 📋 步骤 1: 在 Cloudflare Dashboard 创建 API Token

### 1.1 登录 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登录您的账户

### 1.2 进入 R2 管理页面

1. 在左侧导航栏，点击 **R2**
2. 选择您的存储桶 `sora2`（或创建新存储桶）

### 1.3 创建 API Token

1. 在 R2 页面，点击 **Manage R2 API Tokens**（通常在页面右上角或设置中）
2. 点击 **Create API Token** 按钮
3. 填写以下信息：
   - **Token Name**: `Sora-2Ai R2 Token`（或您喜欢的名称）
   - **Permissions**: 选择 **Object Read**（只需要读取权限）
     - 如果需要写入权限，选择 **Object Read & Write**
   - **TTL**: 
     - 留空 = 永久有效
     - 或设置过期时间（例如：30 天）
4. 点击 **Create API Token**

### 1.4 保存 Token 信息

**⚠️ 重要**: Token 信息只显示一次，请立即保存！

创建成功后，您会看到：
- **Access Key ID** - 复制此值
- **Secret Access Key** - 复制此值（只显示一次！）

**Account ID** 可以在 R2 概览页面找到，通常是页面顶部显示的一串字符。

## 📝 步骤 2: 配置环境变量

### 2.1 找到 `.env.local` 文件

在项目根目录找到 `.env.local` 文件（如果不存在，请创建它）。

### 2.2 添加 R2 配置

在 `.env.local` 文件中添加以下配置：

```env
# Cloudflare R2 配置
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=sora2
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

### 2.3 替换占位符

将以下值替换为您从 Cloudflare Dashboard 获取的实际值：

- `your_access_key_id_here` → 替换为您的 **Access Key ID**
- `your_secret_access_key_here` → 替换为您的 **Secret Access Key**

**示例**（请使用您的实际值）：

```env
# Cloudflare R2 配置
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=abc123def456ghi789
R2_SECRET_ACCESS_KEY=xyz789uvw456rst123abc456def789
R2_BUCKET_NAME=sora2
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

## ✅ 步骤 3: 验证配置

### 3.1 重启开发服务器

配置完成后，重启开发服务器：

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

### 3.2 测试配置

访问测试页面验证配置：

1. 打开浏览器访问：`http://localhost:3000/storage-test`
2. 点击 **List All Files** 按钮
3. 如果配置正确，应该能看到文件列表
4. 如果出现错误，检查控制台日志

### 3.3 使用 API 测试

```bash
# 测试列出文件
curl http://localhost:3000/api/storage/test?action=list

# 如果配置正确，应该返回文件列表
```

## 🔒 安全注意事项

### ⚠️ 重要提示

1. **不要提交到 Git**
   - 确保 `.env.local` 在 `.gitignore` 中
   - 不要将 Token 信息提交到代码仓库

2. **保护 Secret Access Key**
   - Secret Access Key 只显示一次
   - 如果丢失，需要重新创建 Token
   - 不要分享给他人

3. **使用最小权限原则**
   - 如果只需要读取文件，使用 **Object Read** 权限
   - 不需要写入权限时，不要授予写入权限

4. **定期轮换 Token**
   - 建议定期更换 API Token
   - 如果 Token 泄露，立即删除并创建新的

## 🐛 常见问题

### Q: 找不到 "Manage R2 API Tokens" 选项

**解决方案**：
1. 确保您有 R2 的访问权限
2. 尝试在 R2 概览页面查找
3. 或者访问：`https://dash.cloudflare.com/[your-account-id]/r2/api-tokens`

### Q: 创建 Token 后找不到 Secret Access Key

**解决方案**：
- Secret Access Key 只显示一次
- 如果丢失，需要删除旧 Token 并创建新的

### Q: 配置后仍然无法列出文件

**检查清单**：
1. ✅ 确认 `.env.local` 文件存在且配置正确
2. ✅ 确认已重启开发服务器
3. ✅ 检查 Access Key ID 和 Secret Access Key 是否正确
4. ✅ 确认 Account ID 正确
5. ✅ 检查 Token 权限是否包含 "Object Read"

### Q: 如何找到 Account ID？

**解决方案**：
- 在 R2 概览页面，Account ID 通常显示在页面顶部
- 或者在 API Token 创建页面可以看到
- 您的 Account ID 是：`2776117bb412e09a1d30cbe886cd3935`

## 📚 配置示例

### 完整配置示例

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudflare R2
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=your_actual_access_key_id
R2_SECRET_ACCESS_KEY=your_actual_secret_access_key
R2_BUCKET_NAME=sora2
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev

# Grsai API
GRSAI_API_KEY=your_grsai_api_key
GRSAI_API_URL=https://grsai.com/api/v1
```

## 🎯 快速检查清单

配置完成后，请确认：

- [ ] 已在 Cloudflare Dashboard 创建 API Token
- [ ] 已复制 Access Key ID 和 Secret Access Key
- [ ] 已在 `.env.local` 中添加所有 R2 配置
- [ ] 已替换所有占位符为实际值
- [ ] 已重启开发服务器
- [ ] 已测试访问 `/storage-test` 页面
- [ ] 已确认可以列出文件或获取文件 URL

## 📖 相关文档

- `R2_SETUP.md` - 详细配置指南
- `R2_QUICK_START.md` - 快速开始
- `R2_USAGE.md` - 使用指南
- `R2_TEST_GUIDE.md` - 测试指南

