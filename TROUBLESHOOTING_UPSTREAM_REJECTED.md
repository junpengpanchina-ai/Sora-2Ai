# 上游服务拒绝访问 - 故障排除指南

## ❌ 错误信息

如果看到以下错误：
- "上游服务拒绝了请求"
- "Video generation failed because the upstream service rejected the request"
- "生成失败,系统错误,请重试"

## 🔍 可能的原因和解决方案

### 1. API Key 未配置或错误 ⚠️ 最常见

**检查**：
1. 确认 `.env.local` 文件存在
2. 确认 `GRSAI_API_KEY` 已配置
3. 确认 API Key 正确（没有多余的空格）

**解决方案**：

```env
# .env.local
GRSAI_API_KEY=your_actual_api_key_here
GRSAI_HOST=https://grsai.dakka.com.cn
```

**验证步骤**：
1. 检查服务器日志中是否有 "GRSAI_API_KEY 环境变量未配置" 的错误
2. 如果修改了 `.env.local`，**必须重启开发服务器**：
   ```bash
   # 停止服务器 (Ctrl+C)
   # 然后重新启动
   npm run dev
   ```

### 2. API Key 已过期或无效

**症状**：
- HTTP 401 或 403 错误
- "Unauthorized" 或 "Forbidden" 错误

**解决方案**：
1. 登录 [Grsai 控制台](https://grsai.com/)
2. 检查 API Key 是否有效
3. 如果无效，创建新的 API Key
4. 更新 `.env.local` 中的 `GRSAI_API_KEY`
5. **重启开发服务器**

### 3. API 服务暂时不可用

**症状**：
- HTTP 500, 502, 503 错误
- "系统错误" 或 "Service unavailable"

**解决方案**：
1. **等待几分钟后重试**
2. 检查 [Grsai 服务状态](https://grsai.com/)（如果有状态页面）
3. 查看服务器日志了解详细错误信息
4. 如果持续失败，联系 Grsai 技术支持

### 4. API 请求频率过高（限流）

**症状**：
- HTTP 429 错误
- "Too Many Requests" 或 "Rate limit exceeded"

**解决方案**：
1. **等待 1-5 分钟后重试**
2. 减少同时发起的请求数量
3. 检查是否有其他进程在使用同一个 API Key
4. 如果是生产环境，考虑升级 API 配额

### 5. 提示词内容被拒绝

**症状**：
- 错误信息包含 "input_moderation" 或 "output_moderation"
- "Prompt rejected" 或 "Content policy violation"

**解决方案**：
1. **修改提示词**，移除可能触发安全过滤的内容：
   - 暴力内容
   - 成人内容
   - 仇恨言论
   - 非法内容
   - 品牌、商标、名人等（可能触发版权保护）
2. 使用更中性的描述
3. 参考提示词示例，确保符合内容政策

### 6. 网络连接问题

**症状**：
- 连接超时
- "Network error" 或 "Connection failed"

**解决方案**：
1. 检查网络连接
2. 检查防火墙设置
3. 确认可以访问 `https://grsai.dakka.com.cn`
4. 如果在中国大陆，确保网络可以访问该域名
5. 尝试切换到海外 API 地址（如果可用）：
   ```env
   GRSAI_HOST=https://api.grsai.com
   ```

### 7. API 参数问题

**检查**：
- 提示词不为空
- 视频时长设置为 10 或 15 秒
- 宽高比设置为 9:16 或 16:9

**解决方案**：
- 确保所有必需参数都已提供
- 参考 API 文档检查参数格式

## 🛠️ 调试步骤

### 步骤 1: 检查环境变量

```bash
# 在项目根目录检查 .env.local
cat .env.local | grep GRSAI_API_KEY

# 应该看到：
# GRSAI_API_KEY=sk-xxxxx...
```

### 步骤 2: 检查服务器日志

查看开发服务器或生产环境的日志，查找：
- "GRSAI_API_KEY 环境变量未配置"
- "Grsai API 错误: 401"
- "Grsai API 错误: 403"
- 其他详细的错误信息

### 步骤 3: 测试 API 连接

可以使用 curl 测试 API（需要有效的 API Key）：

```bash
curl -X POST https://grsai.dakka.com.cn/v1/video/sora-video \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sora-2",
    "prompt": "A simple test video",
    "aspectRatio": "9:16",
    "duration": 10,
    "size": "small",
    "webHook": "-1"
  }'
```

### 步骤 4: 查看详细错误信息

在浏览器开发者工具的 Network 标签中：
1. 找到失败的 API 请求
2. 查看 Response 内容
3. 查找详细的错误信息

## ✅ 快速检查清单

在报告问题前，请确认：

- [ ] `.env.local` 文件中配置了 `GRSAI_API_KEY`
- [ ] API Key 是正确的（没有多余空格）
- [ ] 修改 `.env.local` 后已**重启开发服务器**
- [ ] 网络连接正常
- [ ] API Key 未过期
- [ ] 提示词不包含违规内容
- [ ] 查看服务器日志获取详细错误信息

## 🔗 获取帮助

如果以上步骤都无法解决问题：

1. **查看服务器日志**：获取详细的错误信息
2. **检查 Grsai 服务状态**：确认 API 服务是否正常
3. **联系技术支持**：提供以下信息：
   - 错误消息（完整）
   - 服务器日志
   - 使用的 API Key（只提供前几位，如 `sk-bd62...`）
   - 请求的参数（提示词、时长等）

## 📝 常见错误代码

| HTTP 状态码 | 含义 | 解决方案 |
|------------|------|---------|
| 401 | 未授权 | 检查 API Key 是否正确 |
| 403 | 禁止访问 | API Key 可能已过期或没有权限 |
| 429 | 请求过多 | 等待后重试，减少请求频率 |
| 500 | 服务器错误 | 等待后重试，可能是临时问题 |
| 502/503 | 服务不可用 | 等待后重试，服务可能正在维护 |

## 💡 预防措施

1. **定期检查 API Key 有效期**
2. **监控 API 使用量**，避免超限
3. **保存提示词示例**，避免内容违规
4. **设置错误告警**，及时发现 API 问题

