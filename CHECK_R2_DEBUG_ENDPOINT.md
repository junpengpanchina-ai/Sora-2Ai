# 检查R2调试端点

## 🔍 步骤

### 1. 等待Vercel部署完成

等待1-2分钟，确保最新代码已部署。

### 2. 访问调试端点

在浏览器中访问（需要先登录admin）：

```
https://sora2aivideos.com/api/admin/r2/debug
```

或者直接在浏览器控制台中运行：

```javascript
fetch('/api/admin/r2/debug')
  .then(r => r.json())
  .then(data => {
    console.log('=== R2配置调试信息 ===')
    console.log('密钥长度:', data.config.secretKeyLength)
    console.log('是否是64字符hex:', data.config.isHex64)
    console.log('分析信息:', data.analysis.message)
    console.log('完整信息:', JSON.stringify(data, null, 2))
  })
  .catch(err => {
    console.error('错误:', err)
  })
```

### 3. 查看返回的信息

重点关注：
- `config.secretKeyLength` - 应该是 64
- `config.isHex64` - 应该是 true
- `analysis.message` - 会告诉我们密钥的格式是否正确

## 📋 请告诉我你看到了什么

如果 `secretKeyLength` 是：
- **64** → 环境变量正确传递，问题可能在代码的其他地方
- **40** → 环境变量在某个地方被修改了，或者有缓存问题
- **32** → 环境变量被截断了

