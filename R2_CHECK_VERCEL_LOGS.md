# 检查 Vercel Function Logs 确认问题

## 🔍 关键步骤

请按照以下步骤查看 Vercel Function Logs，这将帮助我们确定问题所在：

### 1. 访问 Vercel Dashboard

1. 打开 [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击 **Deployments** 标签

### 2. 查看最新部署

1. 找到最新的部署（最上面的）
2. **确认部署状态是 "Ready"（绿色）**
3. 点击部署进入详情页面

### 3. 查看 Function Logs

1. 在部署详情页面，点击 **Functions** 标签
2. **先访问一次 `/admin` 页面**（触发请求）
3. 然后回到 Vercel，刷新 Functions 页面
4. 找到 `/api/admin/r2/list` 函数
5. 查看日志输出

## 📋 应该看到的日志

如果代码已正确部署，你应该看到：

```
[R2] 初始化客户端: {
  accessKeyLength: 32,
  accessKeyPreview: '4d7b30dd...',
  originalSecretLength: 64,        ← 这里应该是64
  originalSecretPreview: '9090b968...',
  validSecretLength: 32,            ← 这里应该是32
  validSecretPreview: '9090b968...',
  ...
}
```

或者如果出错：

```
[R2] 客户端创建失败: {
  error: '...',
  originalSecretLength: 64,    ← 查看这个值
  validSecretLength: 32,       ← 查看这个值
  ...
}
```

## ⚠️ 重要：请告诉我你看到了什么

**请从 Vercel Function Logs 中复制以下信息：**

1. **`originalSecretLength` 的值是多少？**
   - 如果是 64 → 环境变量正确
   - 如果是 40 → 环境变量可能有问题或被修改了

2. **`validSecretLength` 的值是多少？**
   - 应该是 32
   - 如果是 40 → 代码逻辑有问题（但我们已经修复了）

3. **完整的错误信息是什么？**

4. **部署时间是什么时候？**
   - 确认是否是最新的部署

## 🎯 如果看不到这些日志

如果看不到 `[R2] 初始化客户端:` 日志：

1. **确认部署已完成**（状态是 Ready）
2. **访问 `/admin` 页面**，然后立即查看日志
3. **检查日志过滤器**，确保没有过滤掉这些日志

## 💡 快速检查方法

如果无法访问 Vercel Dashboard，可以在浏览器控制台中运行：

```javascript
fetch('/api/admin/r2/list?type=image&maxKeys=1')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

然后查看 Network 标签中的响应，看看返回的错误信息是什么。

