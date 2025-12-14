# R2 管理员功能配置指南

## 🎯 配置目标

配置 R2 Access Key 以启用以下管理员功能：
- ✅ 在管理员后台列出 R2 文件
- ✅ 上传新文件到 R2
- ✅ 选择 R2 中的图片/视频用于首页配置

## 📋 步骤 1: 获取 R2 API Token

### 1.1 访问 Cloudflare Dashboard

1. 打开浏览器，访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登录您的 Cloudflare 账户

### 1.2 创建 R2 API Token

1. 在左侧导航栏，点击 **R2**
2. 点击页面右上角的 **Manage R2 API Tokens** 按钮
3. 点击 **Create API Token**
4. 填写表单：
   - **Token Name**: `Sora-2Ai Admin Token`（或您喜欢的名称）
   - **Permissions**: 选择 **Object Read & Write**（需要上传功能）
   - **TTL**: 留空（永久有效）或设置过期时间
5. 点击 **Create API Token**

### 1.3 保存 Token 信息

**⚠️ 重要警告**: Secret Access Key **只显示一次**，请立即复制保存！

创建成功后，您会看到：
- **Access Key ID**: 例如 `abc123def456ghi789...`（复制此值）
- **Secret Access Key**: 例如 `xyz789uvw456rst123...`（**立即复制保存！**）

**Account ID** 可以在 R2 概览页面找到，通常是页面顶部的一串字符。

## 📝 步骤 2: 添加到 .env.local

### 2.1 打开 .env.local 文件

在项目根目录找到 `.env.local` 文件，用文本编辑器打开。

### 2.2 添加以下配置

在文件末尾添加以下内容（替换为您的实际值）：

```env
# ============================================
# Cloudflare R2 配置（管理员功能）
# ============================================
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=你的_access_key_id_粘贴这里
R2_SECRET_ACCESS_KEY=你的_secret_access_key_粘贴这里
R2_BUCKET_NAME=sora2
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

### 2.3 替换占位符

将以下内容替换为您从 Cloudflare 获取的实际值：

- `你的_access_key_id_粘贴这里` → 替换为 **Access Key ID**
- `你的_secret_access_key_粘贴这里` → 替换为 **Secret Access Key**

**完整示例**（请使用您的实际值）：

```env
# Cloudflare R2 配置（管理员功能）
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
R2_SECRET_ACCESS_KEY=xyz789uvw456rst123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz
R2_BUCKET_NAME=sora2
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

## ✅ 步骤 3: 验证配置

### 3.1 检查配置格式

确保：
- ✅ 每行一个变量
- ✅ 没有多余的空格
- ✅ 值没有引号（除非值本身包含空格）
- ✅ 没有 `#` 注释在值后面

### 3.2 运行验证脚本

在项目根目录运行：

```bash
node scripts/check-r2-config.js
```

或者手动检查：

```bash
# 检查 R2 变量是否存在
grep -E "^R2_" .env.local

# 应该看到 5 行：
# R2_ACCOUNT_ID=...
# R2_ACCESS_KEY_ID=...
# R2_SECRET_ACCESS_KEY=...
# R2_BUCKET_NAME=...
# R2_PUBLIC_URL=...
```

### 3.3 重启开发服务器

配置完成后，**必须重启开发服务器**才能生效：

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

## 🧪 步骤 4: 测试功能

### 4.1 测试管理员后台

1. 访问 `/admin/login` 并登录管理员账户
2. 进入首页配置页面
3. 点击 **刷新列表** 按钮
4. 应该能看到 R2 中的图片和视频列表

### 4.2 测试上传功能

1. 在首页配置页面，点击 **上传** 按钮
2. 选择一个图片文件
3. 上传成功后，应该能看到新上传的文件

## ❌ 常见问题

### 问题 1: 仍然显示"未配置"警告

**解决方案**:
- 确认 `.env.local` 文件在项目根目录
- 确认变量名完全正确（区分大小写）
- 重启开发服务器
- 检查是否有语法错误（多余空格、引号等）

### 问题 2: 上传失败或列出文件失败

**解决方案**:
- 确认 API Token 权限是 **Object Read & Write**
- 确认 Access Key ID 和 Secret Access Key 正确
- 检查 Secret Access Key 是否完整（通常很长）

### 问题 3: Secret Access Key 丢失

**解决方案**:
- 如果丢失了 Secret Access Key，需要重新创建 API Token
- 在 Cloudflare Dashboard 中删除旧 Token，创建新 Token
- 更新 `.env.local` 中的值

## 🔒 安全提示

1. **不要提交 .env.local 到 Git**
   - 确保 `.env.local` 在 `.gitignore` 中
   - 这些密钥是敏感信息

2. **在生产环境使用环境变量**
   - 在 Vercel 等平台，通过 Dashboard 设置环境变量
   - 不要硬编码在代码中

3. **定期轮换密钥**
   - 建议每 3-6 个月更换一次 API Token
   - 更换后更新环境变量

## 📚 相关文档

- [R2_TOKEN_SETUP.md](./R2_TOKEN_SETUP.md) - 详细配置说明
- [R2_SIMPLE_USAGE.md](./R2_SIMPLE_USAGE.md) - 简单使用指南
- [VERCEL_R2_CONFIG_FIX.md](./VERCEL_R2_CONFIG_FIX.md) - Vercel 部署配置
