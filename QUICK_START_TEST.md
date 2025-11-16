# 快速开始 - 测试环境

## 🚀 快速配置测试环境

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 复制以下内容到 .env.local 文件

# Supabase 配置（如果已配置，请保留原有配置）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Grsai API 配置（测试环境）
GRSAI_API_KEY=sk-bd625bca604243989a7018a67614c889
GRSAI_HOST=https://grsai.dakka.com.cn
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. 安装依赖（如果还没安装）

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问测试页面

打开浏览器访问：`http://localhost:3000/video`

## ✅ 测试功能

1. 填写提示词（例如：`A cute cat playing on the grass`）
2. 选择视频参数（比例、时长、清晰度）
3. 点击"生成视频"
4. 等待任务完成
5. 查看生成的视频

## ⚠️ 上线前准备

**重要**：上线前必须替换为生产环境的 API Key！

1. 在部署平台（如 Vercel）的环境变量中设置生产 API Key
2. 不要将测试 API Key 用于生产环境
3. 确保生产环境的 API Key 安全保管

## 📚 相关文档

- [测试配置说明](./TEST_CONFIG.md)
- [Grsai API 配置](./GRSAI_SETUP.md)
- [安全配置说明](./SECURITY.md)







