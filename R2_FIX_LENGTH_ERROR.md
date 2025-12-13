# R2 密钥长度错误修复（40字符期望32字符）

## 错误信息
```
Credential access key has length 40, should be 32
```

## 问题分析

这个错误表明：
- 当前 Secret Access Key 长度为 40 个字符
- 系统期望的长度是 32 个字符

这可能是因为：
1. **密钥格式不匹配**：Cloudflare R2 的 API Token 格式可能与标准 AWS S3 不同
2. **密钥转换错误**：64字符十六进制转换为Base64后可能格式不对
3. **使用了错误的密钥值**：可能不是直接从 Cloudflare Dashboard 复制的原始值

## 解决方案

### 方案 1：重新创建 API Token（推荐）

**最可靠的方法是重新创建 API Token，获取正确格式的密钥：**

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 进入 R2 → Manage R2 API Tokens

2. **删除旧的 Token**（如果记不住 Secret Access Key）

3. **创建新的 API Token**
   - 点击 "Create API Token"
   - 设置权限：Object Read & Write
   - 点击 "Create"

4. **立即复制密钥**
   - **Access Key ID**：通常是20个字符左右
   - **Secret Access Key**：直接复制完整字符串（**不要修改、不要转换**）

5. **在 Vercel 中配置**
   ```
   R2_ACCESS_KEY_ID=你复制的AccessKeyID（原样）
   R2_SECRET_ACCESS_KEY=你复制的SecretAccessKey（原样，不要转换）
   ```

### 方案 2：检查当前密钥格式

如果你已经有了 40 字符的 Secret Access Key：

1. **确认这是直接从 Cloudflare Dashboard 复制的原始值**
2. **不要进行任何转换**
3. **直接使用原始值配置环境变量**

### 方案 3：尝试使用原始64字符十六进制

如果你的 Secret Access Key 是 64 字符的十六进制格式：

**不要转换**，直接在 Vercel 中使用原始值：
```
R2_SECRET_ACCESS_KEY=0103444f705b358ee1d0b084bd9e9e354f240c55d465b5198de0fa423ff92be0
```

让系统使用原始格式，而不是转换为Base64。

## 当前配置检查清单

在 Vercel Environment Variables 中检查：

- [ ] `R2_ACCESS_KEY_ID` 已设置
- [ ] `R2_SECRET_ACCESS_KEY` 已设置
- [ ] 密钥值**完全按照 Dashboard 显示的格式**复制（没有修改、转换）
- [ ] 没有多余的空格或引号
- [ ] 值没有截断

## 配置示例

### 正确的配置方式

```bash
# ✅ 正确：直接使用 Dashboard 复制的值
R2_ACCESS_KEY_ID=R569lfn0GsLpC7Dmgh1nVq8HgQjbhJVGZRfpD19f
R2_SECRET_ACCESS_KEY=你从Dashboard直接复制的完整字符串

# ❌ 错误：添加了引号
R2_SECRET_ACCESS_KEY="你的密钥"

# ❌ 错误：有多余的空格
R2_SECRET_ACCESS_KEY= 你的密钥 

# ❌ 错误：进行了格式转换
# 不要手动转换 Base64 或十六进制
```

## 调试步骤

1. **检查 Vercel 环境变量**
   - 确保密钥完整
   - 确保格式正确

2. **查看服务器日志**
   - 在 Vercel 的 Function Logs 中查看详细错误
   - 代码会输出密钥长度信息

3. **重新部署**
   - 更新环境变量后必须重新部署
   - 环境变量更改不会立即生效

4. **测试连接**
   - 登录管理员后台
   - 进入"首页管理"
   - 点击"刷新列表"
   - 查看是否还有错误

## 如果问题仍然存在

如果重新创建 Token 后问题仍然存在：

1. **确认 Cloudflare R2 API Token 权限**
   - 需要 "Object Read" 权限（至少）
   - 如果上传文件，需要 "Object Read & Write"

2. **检查 Account ID**
   - 确保 `R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935` 正确

3. **检查存储桶名称**
   - 确保 `R2_BUCKET_NAME=sora2` 正确

4. **查看详细错误信息**
   - 在管理员后台的错误提示中查看
   - 在 Vercel Function Logs 中查看

## 重要提示

⚠️ **Secret Access Key 应该直接从 Cloudflare Dashboard 复制使用，不要进行任何格式转换。**

代码已经更新，会提供更详细的错误信息，帮助你诊断问题。如果密钥格式确实有问题，错误信息会明确提示。

