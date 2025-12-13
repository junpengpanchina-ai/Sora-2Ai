# 修正 Vercel R2 环境变量配置

## ⚠️ 当前配置问题

你当前的配置：
```
R2_ACCESS_KEY_ID=2776117bb412e09a1d30cbe886cd3935  ❌ 这是 Account ID
R2_SECRET_ACCESS_KEY=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com  ❌ 这是 endpoint URL
```

**这些值不正确！** 需要从 Cloudflare Dashboard 创建 API Token 获取正确的值。

## ✅ 正确的配置应该是

```
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935  ✅ 正确（Account ID）
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxx  ✅ 从 API Token 获取（类似：abc123def456...）
R2_SECRET_ACCESS_KEY=yyyyyyyyyyyyyyyyyyyyyyyy  ✅ 从 API Token 获取（类似：xyz789uvw456...）
R2_BUCKET_NAME=sora2  ✅ 正确
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev  ✅ 正确
```

## 🔧 获取正确的 Access Key ID 和 Secret Access Key

### 步骤 1: 在 Cloudflare Dashboard 创建 API Token

1. **访问 Cloudflare Dashboard**
   - 打开 https://dash.cloudflare.com/
   - 登录你的账户

2. **进入 R2 管理页面**
   - 左侧菜单点击 **R2**
   - 选择存储桶 `sora2`

3. **创建 API Token**
   - 找到 **Manage R2 API Tokens**（通常在右上角或设置中）
   - 点击 **Create API Token** 按钮
   - 填写信息：
     - **Token Name**: `Sora-2Ai Vercel Token`
     - **Permissions**: 选择 **Object Read & Write**（需要上传功能）
     - **TTL**: 留空（永久有效）或设置过期时间
   - 点击 **Create API Token**

4. **立即复制 Token 信息** ⚠️ 重要：只显示一次！
   - **Access Key ID** - 复制这个值（类似：`abc123def456ghi789jkl012`）
   - **Secret Access Key** - 复制这个值（类似：`xyz789uvw456rst123abc456def789ghi012jkl345`）

### 步骤 2: 在 Vercel 中更新环境变量

1. **进入 Vercel Dashboard**
   - 访问 https://vercel.com/dashboard
   - 选择项目 `Sora-2Ai`
   - 进入 **Settings** > **Environment Variables**

2. **删除错误的配置**（如果已添加）
   - 找到 `R2_ACCESS_KEY_ID`，点击删除
   - 找到 `R2_SECRET_ACCESS_KEY`，点击删除

3. **添加正确的 5 个环境变量**

   #### 变量 1: R2_ACCOUNT_ID
   - **Name**: `R2_ACCOUNT_ID`
   - **Value**: `2776117bb412e09a1d30cbe886cd3935`
   - **Environment**: 全选（Production, Preview, Development）

   #### 变量 2: R2_ACCESS_KEY_ID
   - **Name**: `R2_ACCESS_KEY_ID`
   - **Value**: `粘贴从 Cloudflare 复制的 Access Key ID`
   - **Environment**: 全选

   #### 变量 3: R2_SECRET_ACCESS_KEY
   - **Name**: `R2_SECRET_ACCESS_KEY`
   - **Value**: `粘贴从 Cloudflare 复制的 Secret Access Key`
   - **Environment**: 全选

   #### 变量 4: R2_BUCKET_NAME
   - **Name**: `R2_BUCKET_NAME`
   - **Value**: `sora2`
   - **Environment**: 全选

   #### 变量 5: R2_PUBLIC_URL
   - **Name**: `R2_PUBLIC_URL`
   - **Value**: `https://pub-2868c824f92441499577980a0b61114c.r2.dev`
   - **Environment**: 全选

### 步骤 3: 重新部署

配置完成后，必须重新部署项目：

1. 在 Vercel Dashboard 点击 **Deployments**
2. 点击最新部署右侧的 **...** 菜单
3. 选择 **Redeploy**
4. 等待部署完成

## 📋 完整的 Vercel 环境变量清单

确保以下 5 个变量都已正确配置：

```
✅ R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
✅ R2_ACCESS_KEY_ID=从_Cloudflare_API_Token_获取的_Access_Key_ID
✅ R2_SECRET_ACCESS_KEY=从_Cloudflare_API_Token_获取的_Secret_Access_Key
✅ R2_BUCKET_NAME=sora2
✅ R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

## 🔍 如何区分这些值？

- **R2_ACCOUNT_ID**: 你的 Cloudflare 账户 ID（固定值：`2776117bb412e09a1d30cbe886cd3935`）
- **R2_ACCESS_KEY_ID**: 从 API Token 创建页面获取，通常是较短的字符串（类似：`abc123def456...`）
- **R2_SECRET_ACCESS_KEY**: 从 API Token 创建页面获取，通常是很长的字符串（类似：`xyz789uvw456rst123...`）
- **R2_PUBLIC_URL**: 你的 R2 公共访问 URL（固定值：`https://pub-2868c824f92441499577980a0b61114c.r2.dev`）

## ✅ 验证配置

配置完成后，测试步骤：

1. 重新部署项目
2. 访问管理员后台
3. 进入 **首页管理** 标签页
4. 点击 **刷新列表** 按钮
5. 如果能看到 R2 中的文件列表，说明配置成功 ✅

## 🆘 如果找不到 Manage R2 API Tokens？

1. 在 R2 概览页面查找
2. 或者直接访问：`https://dash.cloudflare.com/2776117bb412e09a1d30cbe886cd3935/r2/api-tokens`
3. 确保你有 R2 的访问权限

## ⚠️ 重要提示

- Secret Access Key **只显示一次**，如果丢失需要重新创建 Token
- 确保 Token 权限包含 **Object Read & Write**（上传需要写入权限）
- 配置后必须**重新部署**项目才能生效

