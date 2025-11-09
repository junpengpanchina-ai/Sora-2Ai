# Grsai API 配置说明

## 环境变量配置

在 `.env.local` 文件中添加以下环境变量：

```env
# Grsai API 配置（必需）
# 测试环境 API Key（仅用于开发测试）
GRSAI_API_KEY=sk-bd625bca604243989a7018a67614c889

# 生产环境：请从 https://grsai.com/ 获取你的生产 API Key
# GRSAI_API_KEY=your_production_api_key_here

# Grsai API 主机地址（可选，默认使用国内直连）
GRSAI_HOST=https://grsai.dakka.com.cn

# 应用 URL（用于 Webhook 回调）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **注意**：当前配置的是测试用 API Key，上线前需要替换为生产环境的 API Key。

### 环境变量说明

- **GRSAI_API_KEY** (必需): Grsai API 密钥
  - **测试环境**: 当前使用测试 API Key: `sk-bd625bca604243989a7018a67614c889`
  - **生产环境**: 上线前请从 [https://grsai.com/](https://grsai.com/) 获取你的生产 API Key
  - **重要**: 这是钱包凭证，请妥善保管，不要提交到 GitHub
- **GRSAI_HOST** (可选): Grsai API 主机地址
  - 国内直连: `https://grsai.dakka.com.cn`（默认，推荐）
  - 海外: `https://api.grsai.com`
- **NEXT_PUBLIC_APP_URL** (可选): 应用的基础 URL，用于生成 Webhook 回调地址
  - 开发环境: `http://localhost:3000`
  - 生产环境: 你的实际域名

### 安全提示

⚠️ **重要**: 
- API Key 是钱包凭证，必须通过环境变量配置
- 不要将 API Key 硬编码在代码中
- 不要将 `.env.local` 文件提交到 Git
- 确保 `.gitignore` 包含 `.env*.local` 和 `.env`

## 数据库迁移

执行以下 SQL 迁移文件来创建 `video_tasks` 表：

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New query**
5. 打开项目文件：`supabase/migrations/003_create_video_tasks_table.sql`
6. 复制全部 SQL 代码并粘贴到 SQL Editor
7. 点击 **Run** 执行

## API 接口说明

### 1. 创建视频生成任务

**POST** `/api/video/generate`

请求体：
```json
{
  "prompt": "A cute cat playing on the grass",
  "url": "https://example.com/image.png",  // 可选
  "aspectRatio": "9:16",  // 可选: "9:16" | "16:9"
  "duration": "10",  // 可选: "10" | "15"
  "size": "small",  // 可选: "small" | "large"
  "useWebhook": false  // 可选: 是否使用 Webhook 回调
}
```

响应：
```json
{
  "success": true,
  "task": {
    "id": "task-uuid",
    "grsai_task_id": "grsai-task-id",
    "status": "pending",
    "progress": 0
  }
}
```

### 2. Webhook 回调接口

**POST** `/api/video/callback`

此接口由 Grsai API 自动调用，用于接收任务进度和结果更新。

### 3. 获取任务结果

**GET** `/api/video/result/[id]`

获取指定任务的详细信息和结果。

### 4. 获取任务列表

**GET** `/api/video/tasks?status=pending&limit=20&offset=0`

获取当前用户的任务列表。

查询参数：
- `status`: 可选，过滤状态（pending, processing, succeeded, failed）
- `limit`: 可选，每页数量（默认 20）
- `offset`: 可选，偏移量（默认 0）

## 使用方式

### 方式 1: 使用 Webhook 回调（推荐）

1. 在创建任务时设置 `useWebhook: true`
2. Grsai API 会通过 Webhook 自动推送任务进度和结果
3. 任务状态会实时更新到数据库

### 方式 2: 使用轮询

1. 在创建任务时设置 `useWebhook: false` 或不设置
2. 前端会自动轮询任务状态（每 3 秒）
3. 或手动调用 `/api/video/result/[id]` 获取最新状态

## 价格说明

- **积分消耗**: 1600/次
- **价格**: ￥0.08~￥0.16/次
- **说明**: OpenAI 最新发布的 Sora 模型 2.0，价格可能会有变动

## 注意事项

1. 视频 URL 有效期为 2 小时，请及时下载
2. 生成失败时会返还积分
3. 支持无水印视频生成
4. 任务状态包括：pending（等待中）、processing（处理中）、succeeded（成功）、failed（失败）

