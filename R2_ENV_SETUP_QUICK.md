# R2 环境变量快速配置

## 问题
构建时出现警告：`[R2] Access Key ID 或 Secret Access Key 未配置`

## 解决方案

### 情况 1: 只需要读取公共图片（推荐）
如果只需要在首页显示图片，**不需要配置** R2 Access Key。代码已经优化，不会在构建时显示警告。

只需确保 `.env.local` 中有：
```env
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

### 情况 2: 需要管理员功能（列出文件、上传文件）
如果需要在管理员后台列出 R2 文件或上传文件，需要在 `.env.local` 中添加：

```env
# Cloudflare R2 配置
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=你的_access_key_id
R2_SECRET_ACCESS_KEY=你的_secret_access_key
R2_BUCKET_NAME=sora2
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

## 如何获取 R2 Access Key

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **R2** > **Manage R2 API Tokens**
3. 点击 **Create API Token**
4. 复制 **Access Key ID** 和 **Secret Access Key**

## 验证配置

运行以下命令检查配置：
```bash
# 检查环境变量是否配置
grep -E "^R2_" .env.local
```

## 注意

- 构建时的警告已优化，不会影响功能
- 如果只使用公共 URL，可以忽略这些警告
- 环境变量只在运行时使用，构建时不会执行初始化
