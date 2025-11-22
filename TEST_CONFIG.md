# 测试环境配置

## 测试 API Key

**测试用 API Key**（仅用于开发测试）：
```
sk-bd625bca604243989a7018a67614c889
```

⚠️ **注意**：这是测试用的 API Key，上线前需要替换为生产环境的 API Key。

## 快速配置

### 1. 创建 `.env.local` 文件

在项目根目录创建 `.env.local` 文件，添加以下内容：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Grsai API 配置（测试环境）
GRSAI_API_KEY=sk-bd625bca604243989a7018a67614c889
GRSAI_HOST=https://grsai.dakka.com.cn

# 应用 URL（用于 Webhook 回调）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问测试页面

打开浏览器访问：`http://localhost:3000/video`

## 上线前准备

⚠️ **重要**：上线前必须替换为生产环境的 API Key！

1. 在部署平台（如 Vercel）的环境变量设置中：
   - 将 `GRSAI_API_KEY` 替换为你的生产环境 API Key
   - 确保测试 API Key 不会被提交到生产环境

2. 更新 `.env.local` 文件：
   - 将测试 API Key 替换为生产环境 API Key
   - 或者创建 `.env.production` 文件用于生产环境

## 安全提示

- ✅ 测试 API Key 可以用于本地开发
- ⚠️ 不要将测试 API Key 提交到 Git
- ⚠️ 上线前必须使用生产环境的 API Key
- ✅ `.env.local` 文件已在 `.gitignore` 中，不会被提交









