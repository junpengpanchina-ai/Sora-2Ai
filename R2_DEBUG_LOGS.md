# R2 密钥调试 - 查看 Vercel Function Logs

## 🔍 如何查看 Vercel Function Logs

### 步骤 1: 访问 Vercel Dashboard

1. 访问 [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. 登录你的账号
3. 找到项目并点击进入

### 步骤 2: 查看部署

1. 点击 **Deployments** 标签
2. 找到最新的部署（应该是最上面的）
3. 点击部署卡片进入详情

### 步骤 3: 查看 Function Logs

1. 在部署详情页面，点击 **Functions** 标签
2. 找到 `/api/admin/r2/list` 函数
3. 如果还没有日志，先访问一次 `/admin` 页面触发请求
4. 然后刷新页面查看日志

## 📋 应该看到的日志

如果代码已正确部署，你应该看到类似这样的日志：

```
[R2] 初始化客户端: {
  accessKeyLength: 32,
  accessKeyPreview: '4d7b30dd...',
  originalSecretLength: 64,          ← 关键：应该是64
  originalSecretPreview: '9090b968...',
  validSecretLength: 32,              ← 关键：应该是32
  validSecretPreview: '9090b968...',
  accountId: '2776117bb412e09a1d30cbe886cd3935',
  bucket: 'sora2',
  endpoint: 'https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com'
}
[R2] 客户端创建成功，密钥长度: 32
```

## ⚠️ 如果看到这些，说明有问题

### 情况 1: originalSecretLength: 40

```
originalSecretLength: 40,    ← 错误！
```

**说明**：Vercel环境变量中的值可能是40字符，或者被某个地方修改了。

**解决方案**：
1. 检查 Vercel Dashboard → Settings → Environment Variables
2. 确认 `R2_SECRET_ACCESS_KEY` 是完整的64字符
3. 更新后重新部署

### 情况 2: validSecretLength: 40

```
originalSecretLength: 64,    ← 正确
validSecretLength: 40,       ← 错误！应该是32
```

**说明**：代码逻辑有问题（但我们已经修复了，所以不应该看到这个）。

**解决方案**：确认代码已部署。

### 情况 3: 没有看到日志

**说明**：可能代码还没有运行，或者日志被过滤了。

**解决方案**：
1. 确认部署已完成（状态是 Ready）
2. 访问 `/admin` 页面触发请求
3. 刷新 Function Logs 页面

## 🎯 请提供以下信息

如果问题仍然存在，请从 Vercel Function Logs 中复制以下内容：

1. **完整的 `[R2] 初始化客户端:` 日志**（包括所有字段）
2. **任何包含 "length" 或 "密钥" 的错误信息**
3. **部署时间**（确认是否是最新的）

这些信息将帮助我们确定问题所在。

