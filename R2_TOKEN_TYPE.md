# Cloudflare R2 API Token 类型说明

## 应该创建哪种类型的 API Token？

### ✅ 答案：创建 **账户 API 令牌**（Account API Token / R2 API Token）

对于 Cloudflare R2 存储访问，你应该创建 **账户级别的 R2 API Token**，而不是用户 API Token。

## 两种 Token 类型的区别

### 1. 账户 API 令牌（R2 API Token）✅ 推荐使用

**创建位置：**
- 在 **R2 Dashboard** 中创建
- 路径：R2 → Manage R2 API Tokens → Create API Token

**特点：**
- 专门用于 R2 存储访问
- 账户级别的权限
- 可以设置存储桶级别的权限
- 更安全，权限更精细
- 推荐用于生产环境

**权限范围：**
- 只能访问 R2 存储
- 可以设置 Object Read、Object Write、Object Admin 等权限
- 可以限制访问特定存储桶

### 2. 用户 API 令牌（User API Token）❌ 不推荐用于 R2

**创建位置：**
- 在 Cloudflare Dashboard 的 **My Profile** → **API Tokens** 中创建

**特点：**
- 用户级别的权限
- 权限范围更广（可能包括账户所有权限）
- 安全性较低
- 不推荐用于 R2 存储访问

**权限范围：**
- 可能包含账户的所有权限
- 权限控制不够精细
- 如果泄露，影响范围更大

## 创建 R2 API Token 的正确步骤

### 步骤 1：进入 R2 管理页面

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 在左侧菜单中点击 **R2**
3. 进入 R2 管理界面

### 步骤 2：创建 R2 API Token

1. 在 R2 页面，找到并点击 **Manage R2 API Tokens**
   - 通常在页面顶部或设置菜单中
   - 也可能显示为 "API Tokens" 或 "Create API Token"

2. 点击 **Create API Token** 按钮

3. 配置 Token：
   - **Token Name**: 输入名称，例如 `sora2ai-r2-token`
   - **Permissions**: 选择权限
     - **Object Read** - 仅读取权限（如果只需要列出和下载文件）
     - **Object Read & Write** - 读写权限（如果需要上传文件）✅ 推荐
     - **Object Admin** - 完全管理权限（如果需要删除文件等）
   - **TTL**: 
     - 留空 = 永久有效
     - 或设置过期时间（例如 90 天）

4. 点击 **Create API Token**

### 步骤 3：保存 Token 信息

**⚠️ 重要：Token 信息只显示一次，请立即保存！**

创建成功后，你会看到：
- **Access Key ID** - 复制此值
- **Secret Access Key** - 复制此值（**只显示一次！**）
- **Account ID** - 复制此值（如果需要）

### 步骤 4：在 Vercel 中配置

将复制的值配置到 Vercel 环境变量：

```
R2_ACCOUNT_ID=你的AccountID
R2_ACCESS_KEY_ID=你复制的AccessKeyID
R2_SECRET_ACCESS_KEY=你复制的SecretAccessKey（原样，不要转换）
R2_BUCKET_NAME=sora2
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

## 快速识别方法

### 如何确认你创建的是正确的 Token？

**正确的 R2 API Token：**
- ✅ 在 **R2 Dashboard** 中创建
- ✅ 可以设置 Object Read/Write 等 R2 特定权限
- ✅ Token 名称前可能显示 "R2" 标识
- ✅ 权限范围限制在 R2 存储

**错误的 User API Token：**
- ❌ 在 **My Profile** → **API Tokens** 中创建
- ❌ 权限范围很广（可能包括账户所有权限）
- ❌ 没有 R2 特定的权限选项

## 权限建议

### 生产环境推荐权限：

**Object Read & Write** - 读写权限
- 可以读取文件
- 可以上传文件
- 可以列出文件
- 不能删除文件（除非使用 Object Admin）

### 最小权限原则：

如果只需要读取文件，使用 **Object Read**
如果还需要上传文件，使用 **Object Read & Write**

## 常见问题

### Q: 我已经创建了 User API Token，可以用吗？

**A**: 虽然技术上可能可以使用，但**强烈不推荐**：
- User API Token 权限范围太广
- 如果泄露，风险更大
- 不符合最小权限原则
- 建议删除并创建专门的 R2 API Token

### Q: R2 API Token 和账户 API Token 有什么区别？

**A**: 在这个上下文中：
- **R2 API Token** = 账户级别的 R2 专用 Token（我们需要的）✅
- **User API Token** = 用户级别的通用 Token（不推荐）❌

### Q: 如何查看我创建的 Token 类型？

**A**: 
1. 查看创建位置：如果在 R2 Dashboard 中创建，就是 R2 API Token ✅
2. 查看权限范围：如果只能设置 R2 相关权限，就是 R2 API Token ✅
3. 查看 Token 列表：在 R2 → Manage R2 API Tokens 中看到的都是 R2 API Token ✅

## 总结

✅ **创建账户 API 令牌（R2 API Token）**
- 在 R2 Dashboard 中创建
- 设置 Object Read & Write 权限
- 仅用于 R2 存储访问
- 更安全、更精细

❌ **不要使用用户 API 令牌（User API Token）**
- 权限范围太广
- 安全性较低
- 不符合最佳实践

