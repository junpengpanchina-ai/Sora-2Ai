# AI Gateway Demo

这是一个使用 Vercel AI SDK 和 AI Gateway 的演示项目。

## 已安装的依赖

- `ai` - Vercel AI SDK
- `dotenv` - 环境变量管理
- `tsx` - TypeScript 执行器
- `@types/node` - Node.js 类型定义

## 配置

### 1. 获取 API 密钥

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入 **AI Gateway** 设置页面
3. 在 **API Keys** 部分创建新的 API 密钥
4. 复制生成的 API 密钥

### 2. 配置环境变量

在 `demo` 目录下创建 `.env` 文件：

**方式一：使用模板文件**
```bash
cp .env.example .env
# 然后编辑 .env 文件，将 your_api_key_here 替换为你的真实 API 密钥
```

**方式二：手动创建**
在 `demo` 目录下创建 `.env` 文件，添加以下内容：

```env
AI_GATEWAY_API_KEY=your_api_key_here
```

**⚠️ 安全提示：**
- ✅ `.env` 文件已添加到 `.gitignore`，**不会被提交到 Git**
- ✅ `.env.example` 是模板文件，不包含真实密钥，可以安全提交
- ⚠️ **不要在代码或文档中暴露真实的 API 密钥**
- ⚠️ **在 Vercel 部署时，只通过环境变量设置 API 密钥，不要硬编码**

## ⚠️ 重要提示：信用卡验证

**在使用 AI Gateway 之前，必须在 Vercel 账户中添加有效的信用卡。**

即使使用免费额度，Vercel 也要求添加信用卡作为验证。如果未添加信用卡，运行脚本时会遇到以下错误：

```
GatewayInternalServerError: AI Gateway requires a valid credit card on file to service requests.
```

### 解决步骤：

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入 **AI Gateway** 设置页面
3. 点击 **Add Credit Card** 添加信用卡
4. 完成验证后即可使用 AI Gateway

或者直接访问：https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card

## 运行

执行以下命令运行脚本：

```bash
pnpm tsx gateway.ts
```

或者使用 npm：

```bash
npm run start
```

## 说明

脚本会通过 AI Gateway 调用 OpenAI GPT-4.1 模型，生成一个关于新节日的描述，并显示：
- 流式输出的文本内容
- Token 使用情况
- 完成原因

## Vercel 部署

在 Vercel 部署时，通过环境变量设置 API 密钥：

1. 在 Vercel 项目设置中，进入 **Settings** > **Environment Variables**
2. 添加环境变量：
   - **Name**: `AI_GATEWAY_API_KEY`
   - **Value**: 你的 AI Gateway API 密钥
3. 选择环境（Production、Preview、Development）
4. 保存并重新部署

**重要**：API 密钥只通过 Vercel 环境变量设置，不要硬编码在代码中。

## 故障排除

### 错误：GatewayInternalServerError (403)

如果遇到 `GatewayInternalServerError` 或 `customer_verification_required` 错误，说明需要在 Vercel 账户中添加信用卡。请按照上面的"重要提示"部分完成验证。

### 其他错误

- **API 密钥错误**：检查 `.env` 文件（本地）或 Vercel 环境变量（部署）中的 `AI_GATEWAY_API_KEY` 是否正确
- **网络错误**：确保网络连接正常，可以访问 `https://ai-gateway.vercel.sh`
- **模型不存在**：确认模型名称 `openai/gpt-4.1` 在 AI Gateway 中可用
