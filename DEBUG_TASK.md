# 调试任务问题

## 🔍 诊断步骤

### 1. 检查任务状态

在浏览器控制台运行：

```javascript
// 替换为你的任务ID
const taskId = '3b6ff716-5dce-44a8-aaa3-074953f8efba'

fetch(`/api/debug/task/${taskId}`)
  .then(r => r.json())
  .then(data => {
    console.log('任务诊断结果:', data)
    if (data.success) {
      console.log('任务状态:', data.task.status)
      console.log('Grsai任务ID:', data.task.grsai_task_id)
      console.log('是否有Grsai任务ID:', data.diagnostics.hasGrsaiTaskId)
      console.log('是否可以返还积分:', data.diagnostics.canRefund)
    }
  })
```

### 2. 检查服务器日志

查看运行 `npm run dev` 的终端，应该能看到类似这样的日志：

```
[video/result] Fetching task result: { grsaiTaskId: '...', internalTaskId: '...' }
[video/result] Grsai API response: { code: ..., hasData: ... }
```

或者错误信息：

```
[video/result] Failed to fetch Grsai task result: { error: ..., message: ... }
```

### 3. 可能的问题

#### 问题1: Grsai任务ID为空
- **症状**: `grsai_task_id` 为 `null` 或空字符串
- **原因**: 任务创建时 Grsai API 没有返回任务ID
- **解决**: 检查任务创建时的API响应

#### 问题2: Grsai API端点错误
- **症状**: API返回404或500错误
- **原因**: 可能端点路径不对
- **解决**: 对比官网使用的端点

#### 问题3: API Key无效
- **症状**: API返回401或403错误
- **原因**: API Key配置错误或过期
- **解决**: 检查 `.env.local` 中的 `GRSAI_API_KEY`

#### 问题4: 网络问题
- **症状**: `ERR_CONNECTION_REFUSED` 或超时
- **原因**: 无法连接到 Grsai API
- **解决**: 检查网络连接和 `GRSAI_HOST` 配置

## 🛠️ 快速修复

### 如果任务卡住且积分未返还

在浏览器控制台运行：

```javascript
const taskId = '3b6ff716-5dce-44a8-aaa3-074953f8efba'

// 手动返还积分
fetch('/api/debug/refund-task', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ task_id: taskId })
})
.then(r => r.json())
.then(data => {
  console.log('返还结果:', data)
  if (data.success) {
    alert('✅ 积分已返还！')
    window.location.reload()
  }
})
```

## 📋 检查清单

- [ ] 任务在数据库中是否存在
- [ ] `grsai_task_id` 是否有值
- [ ] Grsai API 是否可访问
- [ ] API Key 是否正确配置
- [ ] 网络连接是否正常
- [ ] 服务器日志是否有错误信息

## 🧰 CLI 脚本：批量检查卡住的任务

我们增加了 `scripts/check-grsai-tasks.js`，可以直接从命令行批量查询 `video_tasks` 中仍在 `processing` 状态的任务，并调用 Grsai `/v1/draw/result` 查看真实状态。

**使用方式**

```bash
# 默认最多检查 20 条
node scripts/check-grsai-tasks.js

# 指定数量
node scripts/check-grsai-tasks.js 50
```

**依赖的环境变量**

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`（或 `SUPABASE_SERVICE_KEY`）
- `GRSAI_API_KEY`
- 可选：`GRSAI_HOST`，默认为 `https://grsai.dakka.com.cn`

脚本输出每条任务的 `id / progress / grsai_task_id`，并打印 Grsai 返回的 `code / status / progress / video_url` 或错误信息，方便快速定位是 Grsai 队列阻塞还是接口错误。

## 🔗 相关文件

- `app/api/video/result/[id]/route.ts` - 任务结果API
- `lib/grsai/client.ts` - Grsai API客户端
- `app/api/debug/task/[id]/route.ts` - 诊断API

