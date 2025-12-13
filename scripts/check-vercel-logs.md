# 如何查看 Vercel 日志来诊断 R2 问题

## 🔍 查看 Vercel Function Logs

### 步骤：

1. **登录 Vercel Dashboard**
   - 访问 https://vercel.com/dashboard
   - 登录你的账户

2. **进入项目**
   - 找到你的项目（sora2ai）
   - 点击进入

3. **查看 Functions**
   - 点击顶部菜单的 **Functions** 标签
   - 或者点击 **Deployments** → 选择最新的部署 → **Functions** tab

4. **查看具体函数日志**
   - 找到 `/api/admin/r2/list` 函数
   - 点击查看日志

5. **搜索关键日志**
   - 搜索：`[R2]`
   - 搜索：`64字符`
   - 搜索：`客户端创建`
   - 搜索：`前32字符`

## 📋 应该看到的日志

如果代码正常工作，应该看到类似这样的日志：

```
[R2] 初始化客户端: {
  accessKeyLength: 39,
  originalSecretLength: 64,
  convertedSecretLength: 32,
  wasConverted: true
}
[R2] 客户端创建成功 (使用前32字符（优先）)
```

或者如果转换失败：

```
[R2] 使用前32字符（优先）失败: Credential access key has length 32, should be 32
[R2] 使用Base64转换后失败: ...
```

## 🔴 如果没有看到这些日志

说明：
- 代码可能未部署
- 或者初始化逻辑未执行
- 或者日志级别设置问题

## 📸 截图给我看

请截图 Vercel Function Logs 给我，我可以帮你分析。

