# Vercel 环境变量配置指南 - R2 图片素材管理

## 📋 说明

代码已经配置好，可以直接从环境变量读取 R2 配置。你只需要在 Vercel 环境变量中配置即可。

## 🔧 在 Vercel 中配置环境变量

### 步骤 1: 登录 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 登录你的账户
3. 选择你的项目 `Sora-2Ai`

### 步骤 2: 进入环境变量设置

1. 点击项目进入项目详情页
2. 点击顶部菜单 **Settings**
3. 在左侧菜单中找到 **Environment Variables**

### 步骤 3: 添加 R2 环境变量

点击 **Add New** 按钮，依次添加以下环境变量：

#### 1. R2 Account ID
- **Name**: `R2_ACCOUNT_ID`
- **Value**: `2776117bb412e09a1d30cbe886cd3935`
- **Environment**: 选择 `Production`, `Preview`, `Development`（全选）

#### 2. R2 Access Key ID
- **Name**: `R2_ACCESS_KEY_ID`
- **Value**: `你的_Access_Key_ID`（从 Cloudflare Dashboard 获取）
- **Environment**: 选择 `Production`, `Preview`, `Development`（全选）

#### 3. R2 Secret Access Key
- **Name**: `R2_SECRET_ACCESS_KEY`
- **Value**: `你的_Secret_Access_Key`（从 Cloudflare Dashboard 获取）
- **Environment**: 选择 `Production`, `Preview`, `Development`（全选）

#### 4. R2 Bucket Name
- **Name**: `R2_BUCKET_NAME`
- **Value**: `sora2`
- **Environment**: 选择 `Production`, `Preview`, `Development`（全选）

#### 5. R2 Public URL
- **Name**: `R2_PUBLIC_URL`
- **Value**: `https://pub-2868c824f92441499577980a0b61114c.r2.dev`
- **Environment**: 选择 `Production`, `Preview`, `Development`（全选）

### 步骤 4: 获取 R2 Access Key 和 Secret Key

如果你还没有 R2 API Token，需要先在 Cloudflare 创建：

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **R2** > 选择存储桶 `sora2`
3. 点击 **Manage R2 API Tokens**
4. 点击 **Create API Token**
5. 设置：
   - **Token Name**: `Sora-2Ai Vercel Token`
   - **Permissions**: `Object Read & Write`（需要上传功能）
   - **TTL**: 留空（永久有效）
6. 点击 **Create API Token**
7. **立即复制**：
   - **Access Key ID**
   - **Secret Access Key**（只显示一次！）

### 步骤 5: 重新部署

配置完环境变量后，需要重新部署项目：

1. 在 Vercel Dashboard 中，点击 **Deployments**
2. 点击最新的部署记录右侧的 **...** 菜单
3. 选择 **Redeploy**
4. 或者推送代码触发自动部署

## ✅ 配置完成后

配置完成后，你可以：

1. **访问管理员后台**
   - 登录管理员账户
   - 进入 **首页管理** 标签页

2. **选择图片/视频**
   - 点击下拉菜单，从 R2 文件列表中选择
   - 支持图片和视频筛选

3. **上传新素材**
   - 点击"上传新图片/视频"按钮
   - 选择文件后自动上传到 R2
   - 上传成功后自动填充路径

## 🔍 验证配置

### 方法 1: 在 Vercel 中查看环境变量

1. 进入 **Settings** > **Environment Variables**
2. 确认所有 5 个 R2 环境变量都已添加
3. 确认每个变量都选择了正确的环境（Production/Preview/Development）

### 方法 2: 在代码中测试

部署后，访问管理员后台：
1. 登录管理员账户
2. 进入 **首页管理** 标签页
3. 点击 **刷新列表** 按钮
4. 如果能看到 R2 中的文件列表，说明配置成功

## 📝 环境变量清单

确保以下环境变量都已配置：

```
✅ R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
✅ R2_ACCESS_KEY_ID=你的_Access_Key_ID
✅ R2_SECRET_ACCESS_KEY=你的_Secret_Access_Key
✅ R2_BUCKET_NAME=sora2
✅ R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

## 🐛 常见问题

### Q: 配置后仍然无法列出文件？

**检查清单**：
1. ✅ 确认所有环境变量都已添加到 Vercel
2. ✅ 确认已重新部署项目
3. ✅ 确认 Access Key ID 和 Secret Access Key 正确
4. ✅ 确认 R2 API Token 权限包含 "Object Read & Write"
5. ✅ 检查浏览器控制台是否有错误信息

### Q: 上传文件失败？

**检查清单**：
1. ✅ 确认 R2 API Token 权限包含 "Object Write"
2. ✅ 确认 R2_SECRET_ACCESS_KEY 正确
3. ✅ 检查文件大小是否超过限制
4. ✅ 检查文件类型是否支持（图片：jpg/png/gif/webp，视频：mp4/webm/mov）

### Q: 本地开发需要配置吗？

**可选**：
- 如果只在 Vercel 上使用，本地 `.env.local` 可以不配置
- 如果需要本地测试，可以在 `.env.local` 中添加相同的配置

## 📚 相关代码位置

代码已经配置好，相关文件：

- `lib/r2/client.ts` - R2 客户端，自动从环境变量读取配置
- `app/api/admin/r2/list/route.ts` - 列出 R2 文件（管理员专用）
- `app/api/admin/r2/upload/route.ts` - 上传文件到 R2（管理员专用）
- `app/admin/AdminHomepageManager.tsx` - 管理界面，支持选择和上传

## 🎯 快速配置步骤总结

1. ✅ 在 Cloudflare 创建 R2 API Token（获取 Access Key ID 和 Secret Access Key）
2. ✅ 在 Vercel 环境变量中添加 5 个 R2 配置
3. ✅ 重新部署项目
4. ✅ 在管理员后台测试选择和上传功能

完成！现在你可以在管理员后台直接选择 R2 中的图片和视频，也可以上传新素材了。

