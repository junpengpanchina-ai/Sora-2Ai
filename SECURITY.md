# 安全配置说明

## 🔒 API Key 安全

### 重要提示

⚠️ **Grsai API Key 是钱包凭证，必须妥善保管！**

### 安全措施

1. ✅ **代码中已移除硬编码的 API Key**
   - 所有 API Key 必须通过环境变量配置
   - 如果未配置，应用会抛出错误提示

2. ✅ **所有 API 调用都在服务器端**
   - Grsai API 调用只在 Next.js API 路由中进行
   - 前端代码不会直接访问 Grsai API
   - API Key 不会暴露给浏览器

3. ✅ **环境变量文件已加入 .gitignore**
   - `.env.local` 和 `.env` 文件不会被提交到 Git
   - 确保不会意外泄露 API Key

### 配置步骤

1. 创建 `.env.local` 文件（如果不存在）
2. 添加以下配置：

```env
GRSAI_API_KEY=your_actual_api_key_here
GRSAI_HOST=https://grsai.dakka.com.cn
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **不要**将真实的 API Key 提交到 Git

### 验证安全性

#### ✅ 已实现的安全措施

- [x] API Key 不在代码中硬编码
- [x] API Key 只从环境变量读取
- [x] 所有 Grsai API 调用都在服务器端（API 路由）
- [x] 前端不直接访问 Grsai API
- [x] `.env.local` 已加入 `.gitignore`
- [x] 文档中移除了真实的 API Key

#### 🔍 代码结构验证

- `lib/grsai/client.ts` - 只在服务器端使用
- `app/api/video/*` - 所有 API 路由都在服务器端运行
- `app/video/page.tsx` - 前端页面，只调用自己的 API 路由

### 生产环境部署

在生产环境（如 Vercel）部署时：

1. 在部署平台的环境变量设置中添加：
   - `GRSAI_API_KEY` = 你的实际 API Key
   - `GRSAI_HOST` = `https://grsai.dakka.com.cn`（或海外地址）
   - `NEXT_PUBLIC_APP_URL` = 你的生产域名

2. **不要**在代码仓库中提交 `.env.local` 文件

3. 确保部署平台的环境变量设置是私密的

### 安全检查清单

在提交代码到 GitHub 前，请确认：

- [ ] `.env.local` 文件不在 Git 跟踪中
- [ ] 代码中没有硬编码的 API Key
- [ ] 文档中没有真实的 API Key
- [ ] `.gitignore` 包含 `.env*.local` 和 `.env`

### 如果 API Key 泄露了怎么办？

如果发现 API Key 可能已泄露：

1. **立即**在 Grsai 平台重新生成新的 API Key
2. 更新 `.env.local` 文件中的 API Key
3. 更新生产环境的环境变量
4. 检查是否有未授权的使用记录









