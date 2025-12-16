# 诊断"上游服务拒绝访问"错误

## 当前错误信息

```
Video generation failed because the upstream service rejected the request.
Details: Failed to generate, system error please try again
```

## 🔍 诊断步骤

### 步骤 1: 测试 API 连接

访问调试端点测试 API 连接：

```bash
GET /api/debug/test-grsai-api
```

**或者直接在浏览器访问**：
```
https://your-domain.com/api/debug/test-grsai-api
```

这个端点会：
- ✅ 检查 API Key 是否配置
- ✅ 测试 API 连接
- ✅ 返回详细的诊断信息

### 步骤 2: 查看服务器日志

查看服务器日志（开发服务器终端或生产环境日志），查找以下信息：

```
[Grsai API] Creating video task: { ... }
[Grsai API] Request failed: { ... }
[Grsai API] Parsed error response: { ... }
[video/generate] Video generation failed: { ... }
```

这些日志会显示：
- HTTP 状态码（401/403/500 等）
- API 返回的详细错误信息
- 请求参数
- API Key 是否配置

### 步骤 3: 检查常见问题

#### 问题 1: API Key 配置问题

**检查**：
```bash
# 在服务器环境中检查
echo $GRSAI_API_KEY

# 或者在代码中添加临时日志
console.log('API Key configured:', !!process.env.GRSAI_API_KEY)
```

**解决方案**：
1. 确认 `.env.local`（开发）或 Vercel 环境变量（生产）中已设置 `GRSAI_API_KEY`
2. 确认 API Key 正确（没有多余空格）
3. **重启服务器**（修改环境变量后必须重启）

#### 问题 2: API Key 已过期或无效

**症状**：
- 错误信息包含 "401" 或 "403"
- 日志显示 "Unauthorized" 或 "Forbidden"

**解决方案**：
1. 登录 [Grsai 控制台](https://grsai.com/)
2. 检查 API Key 状态
3. 如果无效，创建新的 API Key
4. 更新环境变量并重启服务器

#### 问题 3: API 服务暂时不可用

**症状**：
- 错误信息包含 "system error"
- HTTP 500/502/503 状态码

**解决方案**：
1. **等待几分钟后重试**
2. 检查是否有其他请求成功（可能是临时问题）
3. 如果持续失败，联系 Grsai 技术支持

#### 问题 4: 提示词内容被拒绝

**症状**：
- 错误信息包含 "input_moderation" 或 "output_moderation"
- 特定的提示词总是失败

**解决方案**：
1. 尝试更简单的提示词，例如："A cat playing in the garden"
2. 移除可能触发安全过滤的内容：
   - 暴力、成人内容
   - 品牌、商标、名人
   - 敏感词汇

## 📊 查看详细日志

### 在开发环境：

查看终端输出，会显示：
```
[Grsai API] Creating video task: {
  host: 'https://grsai.dakka.com.cn',
  model: 'sora-2',
  ...
}
[Grsai API] Request failed: {
  status: 500,
  errorText: '...',
  ...
}
```

### 在生产环境（Vercel）：

1. 进入 Vercel Dashboard
2. 选择你的项目
3. 进入 **Deployments** > 最新部署 > **Functions** 标签
4. 查看函数日志，查找 `[Grsai API]` 或 `[video/generate]` 开头的日志

## 🛠️ 快速诊断命令

### 测试 API 连接：

```bash
# 在浏览器中访问
https://your-domain.com/api/debug/test-grsai-api
```

### 检查环境变量（本地）：

```bash
# 检查 .env.local 文件
cat .env.local | grep GRSAI
```

## 💡 常见错误代码对照

| 错误信息关键词 | 可能原因 | 解决方案 |
|--------------|---------|---------|
| "401" / "Unauthorized" | API Key 无效 | 检查并更新 GRSAI_API_KEY |
| "403" / "Forbidden" | API Key 无权限 | 检查 API Key 权限设置 |
| "429" / "Rate limit" | 请求过多 | 等待后重试 |
| "500" / "system error" | 服务端错误 | 等待后重试，如持续失败联系支持 |
| "input_moderation" | 提示词违规 | 修改提示词内容 |
| "output_moderation" | 生成内容违规 | 使用更安全的提示词 |

## ✅ 检查清单

在报告问题前，请确认：

- [ ] API Key 已配置（`.env.local` 或 Vercel 环境变量）
- [ ] 修改环境变量后已**重启服务器**
- [ ] 查看服务器日志获取详细错误信息
- [ ] 尝试测试端点 `/api/debug/test-grsai-api`
- [ ] 尝试更简单的提示词测试
- [ ] 检查 API Key 是否有效（未过期）

## 📞 获取帮助

如果以上步骤都无法解决问题，请提供：

1. **服务器日志**（包含 `[Grsai API]` 的完整日志）
2. **测试端点结果**（`/api/debug/test-grsai-api` 的响应）
3. **错误发生的提示词**
4. **环境**（开发/生产）
5. **API Key 前缀**（如 `sk-87f8668...`，不要提供完整密钥）

