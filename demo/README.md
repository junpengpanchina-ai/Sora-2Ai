# AI Gateway Demo

这是一个使用 Vercel AI SDK 和 AI Gateway 的演示项目。

## 已安装的依赖

- `ai` - Vercel AI SDK
- `dotenv` - 环境变量管理
- `tsx` - TypeScript 执行器
- `@types/node` - Node.js 类型定义

## 配置

API 密钥已配置在 `.env` 文件中：
```
AI_GATEWAY_API_KEY=vck_5DNWB3TDf5UXiLhLbaeidjV4zTHaaucTmgxBEeKQsSu9vKQCob06UCzm
```

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
