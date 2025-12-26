# 检查 API Key 配置

## ❌ 问题

无论是 SEO 助手还是 AI 助手，都出现同样的错误：**API 返回空 choices 数组**

这通常表示 **API Key 未配置或无效**。

## ✅ 快速检查

### 1. 检查环境变量

在 **Vercel Dashboard** 中：

1. 进入项目设置
2. 点击 **Environment Variables**
3. 查找 `GRSAI_API_KEY`
4. 确认：
   - ✅ 变量已存在
   - ✅ 值不为空
   - ✅ 已添加到所有环境（Production, Preview, Development）

### 2. 检查本地配置

在本地 `.env.local` 文件中：

```bash
GRSAI_API_KEY=your-api-key-here
```

**注意**：
- 不要有引号
- 不要有多余的空格
- 确保文件已保存

### 3. 验证 API Key 有效性

在浏览器 Console 中运行：

```javascript
async function testApiKey() {
  const apiKey = 'your-api-key' // 替换为实际的 API Key
  try {
    const res = await fetch('https://api.grsai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    const data = await res.json()
    console.log('API Key 测试:', {
      status: res.status,
      ok: res.ok,
      hasData: !!data.data,
      modelsCount: data.data?.length || 0,
    })
    if (!res.ok) {
      console.error('错误:', data)
    }
  } catch (error) {
    console.error('请求失败:', error)
  }
}

// 运行测试
testApiKey()
```

### 4. 运行诊断

在浏览器 Console 中运行（需要先加载函数）：

```javascript
await fullDiagnostics()
```

查看：
- `checks.geminiApi.apiKey.exists` - 应该为 `true`
- `checks.geminiApi.testCall.success` - 应该为 `true`

## 🔧 修复步骤

### 步骤 1: 获取 API Key

1. 登录 GRSAI 控制台
2. 进入 API Keys 页面
3. 创建新的 API Key 或复制现有的

### 步骤 2: 配置环境变量

**Vercel**：
1. 进入项目设置
2. 添加环境变量：`GRSAI_API_KEY`
3. 值：你的 API Key
4. 选择所有环境
5. 保存并重新部署

**本地开发**：
1. 在项目根目录创建/编辑 `.env.local`
2. 添加：`GRSAI_API_KEY=your-api-key`
3. 重启开发服务器

### 步骤 3: 验证配置

重新部署后，运行诊断：

```javascript
await fullDiagnostics()
```

应该看到：
- ✅ `apiKey.exists: true`
- ✅ `testCall.success: true`
- ✅ 可以成功创建会话和发送消息

## 🐛 常见问题

### 问题 1: API Key 已配置但仍报错

**可能原因**：
- API Key 已过期
- API Key 权限不足
- API Key 格式错误

**解决**：
1. 生成新的 API Key
2. 更新环境变量
3. 重新部署

### 问题 2: 本地正常，生产环境报错

**可能原因**：
- Vercel 环境变量未配置
- 环境变量未添加到 Production 环境

**解决**：
1. 检查 Vercel Dashboard 中的环境变量
2. 确保已添加到 Production 环境
3. 重新部署

### 问题 3: API 服务不可用

**可能原因**：
- `https://api.grsai.com` 服务暂时不可用
- 网络连接问题

**解决**：
1. 检查 API 服务状态
2. 联系 GRSAI 支持
3. 查看服务器日志获取详细错误

## 📋 检查清单

- [ ] `GRSAI_API_KEY` 环境变量已配置
- [ ] API Key 值不为空
- [ ] API Key 格式正确（通常以 `sk-` 开头）
- [ ] Vercel 环境变量已添加到所有环境
- [ ] 已重新部署应用
- [ ] 诊断代码显示 `apiKey.exists: true`
- [ ] API 连接测试成功

## 📞 获取帮助

如果问题仍然存在，请提供：
1. `await fullDiagnostics()` 的完整输出
2. Vercel Dashboard 中的环境变量配置截图（隐藏实际 Key）
3. 服务器日志中的错误信息

