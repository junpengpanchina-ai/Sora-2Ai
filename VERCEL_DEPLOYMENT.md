# Vercel 部署指南

## ✅ 部署前检查清单

### 1. 构建测试
- [x] ✅ 本地构建成功 (`npm run build`)
- [x] ✅ 无编译错误
- [x] ✅ 所有类型检查通过

### 2. 代码准备
- [x] ✅ `.gitignore` 已配置（包含 `.env*.local`）
- [x] ✅ 代码已提交到 Git 仓库
- [x] ✅ Next.js 配置已优化

## 🚀 部署步骤

### 步骤 1: 连接 GitHub 仓库到 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New Project**
3. 选择你的 GitHub 仓库
4. 点击 **Import**

### 步骤 2: 配置项目设置

在 Vercel 项目设置中：

- **Framework Preset**: Next.js（自动检测）
- **Root Directory**: `./`（默认）
- **Build Command**: `npm run build`（默认）
- **Output Directory**: `.next`（默认）
- **Install Command**: `npm install`（默认）

### 步骤 3: 配置环境变量

在 Vercel 项目设置中，进入 **Settings** > **Environment Variables**，添加以下环境变量：

#### 🔴 必需的环境变量

```env
# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL=https://hgzpzsiafycwlqrkzbis.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnenB6c2lhZnljd2xxcmt6YmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTk4NzIsImV4cCI6MjA3ODE5NTg3Mn0.WdpkrSXVZVZ64bY8NXG6Bpf-w59i305F7agny6wuj_Q
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key

# Google OAuth（必需）
GOOGLE_CLIENT_ID=222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# 应用 URL（必需 - 部署后更新为实际域名）
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

#### 🟡 可选但推荐的环境变量

```env
# Grsai API（视频生成功能）
GRSAI_API_KEY=你的生产环境_API_Key
GRSAI_HOST=https://grsai.dakka.com.cn

# Stripe 支付（如果使用支付功能）
STRIPE_SECRET_KEY=你的_stripe_secret_key
STRIPE_WEBHOOK_SECRET=你的_stripe_webhook_secret
STRIPE_PUBLISHABLE_KEY=你的_stripe_publishable_key

# Cloudflare R2 存储（如果使用文件存储）
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=你的_r2_access_key
R2_SECRET_ACCESS_KEY=你的_r2_secret_key
R2_BUCKET_NAME=sora2
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
R2_S3_ENDPOINT=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
```

#### 📝 环境变量配置说明

1. **为每个环境变量选择环境**：
   - ✅ **Production**（生产环境）
   - ✅ **Preview**（预览环境）
   - ✅ **Development**（开发环境，可选）

2. **重要提示**：
   - `NEXT_PUBLIC_APP_URL` 在首次部署后需要更新为实际的 Vercel 域名
   - 如果使用自定义域名，也需要更新此变量

### 步骤 4: 配置 Google OAuth 重定向 URI

部署后，需要在 Google Cloud Console 中添加 Vercel 的重定向 URI：

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 **APIs & Services** > **Credentials**
3. 点击你的 OAuth 2.0 客户端 ID
4. 在 **Authorized redirect URIs** 中添加：
   ```
   https://your-project.vercel.app/api/auth/callback
   https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
   ```
5. 如果使用自定义域名，也要添加：
   ```
   https://your-custom-domain.com/api/auth/callback
   ```

### 步骤 5: 部署

1. 点击 **Deploy** 按钮
2. 等待构建完成
3. 检查构建日志是否有错误

### 步骤 6: 部署后配置

#### 6.1 更新应用 URL

部署成功后，更新 `NEXT_PUBLIC_APP_URL` 环境变量：

1. 在 Vercel Dashboard 中，进入 **Settings** > **Environment Variables**
2. 找到 `NEXT_PUBLIC_APP_URL`
3. 更新为实际的 Vercel 域名（例如：`https://your-project.vercel.app`）
4. 如果使用自定义域名，更新为自定义域名
5. 重新部署以应用更改

#### 6.2 配置 Stripe Webhook（如果使用支付）

1. 在 Stripe Dashboard 中，进入 **Developers** > **Webhooks**
2. 点击 **Add endpoint**
3. 输入 Webhook URL: `https://your-project.vercel.app/api/payment/webhook`
4. 选择要监听的事件（例如：`checkout.session.completed`, `payment_intent.succeeded`）
5. 复制 **Signing secret**，添加到 Vercel 环境变量 `STRIPE_WEBHOOK_SECRET`
6. 重新部署

#### 6.3 测试部署

访问你的 Vercel 域名，测试以下功能：

- [ ] 首页加载正常
- [ ] 用户登录功能
- [ ] Google OAuth 登录
- [ ] 视频生成功能（如果配置了 Grsai API）
- [ ] 支付功能（如果配置了 Stripe）
- [ ] 文件上传/存储（如果配置了 R2）

## 🔧 常见问题

### 问题 1: 构建失败

**解决方案**：
- 检查构建日志中的错误信息
- 确保所有必需的环境变量都已配置
- 检查 `package.json` 中的依赖是否正确

### 问题 2: 环境变量未生效

**解决方案**：
- 确保环境变量名称拼写正确
- 检查是否选择了正确的环境（Production/Preview/Development）
- 重新部署项目

### 问题 3: OAuth 登录失败

**解决方案**：
- 检查 Google OAuth 重定向 URI 是否已添加 Vercel 域名
- 确认 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 正确
- 检查 `NEXT_PUBLIC_APP_URL` 是否设置为正确的域名

### 问题 4: API 路由返回 500 错误

**解决方案**：
- 检查服务器端环境变量（不带 `NEXT_PUBLIC_` 前缀的变量）
- 查看 Vercel 函数日志
- 确认 Supabase Service Role Key 已配置

## 📊 监控和维护

### Vercel Analytics

项目已包含 `@vercel/analytics` 和 `@vercel/speed-insights`，部署后自动启用。

### 日志查看

在 Vercel Dashboard 中：
- **Deployments** > 选择部署 > **Functions** 查看函数日志
- **Analytics** 查看性能指标

## 🔐 安全建议

1. ✅ 不要在代码中硬编码敏感信息
2. ✅ 使用环境变量存储所有密钥
3. ✅ 定期轮换 API 密钥
4. ✅ 启用 Vercel 的访问控制（如果需要）
5. ✅ 配置自定义域名并启用 HTTPS（自动）

## 📝 部署清单总结

- [x] 代码已推送到 GitHub
- [ ] 在 Vercel 中创建项目
- [ ] 配置所有必需的环境变量
- [ ] 配置 Google OAuth 重定向 URI
- [ ] 首次部署
- [ ] 更新 `NEXT_PUBLIC_APP_URL` 为实际域名
- [ ] 配置 Stripe Webhook（如需要）
- [ ] 测试所有功能
- [ ] 配置自定义域名（可选）

## 🎉 完成！

部署成功后，你的应用将在 Vercel 上运行。记住：

1. 每次推送到主分支都会自动触发部署
2. Pull Request 会创建预览部署
3. 可以在 Vercel Dashboard 中管理所有部署

祝你部署顺利！🚀

