# 如何获取 R2 加密钥匙（Secret Access Key）

## 方法一：在 Cloudflare Dashboard 中创建新的 API Token（推荐）

### 步骤 1：登录 Cloudflare Dashboard
1. 访问 [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. 使用你的 Cloudflare 账户登录

### 步骤 2：进入 R2 管理页面
1. 在左侧菜单中找到 **R2** 选项（如果没有，可能需要先启用 R2）
2. 点击进入 R2 管理界面

### 步骤 3：创建 API Token
1. 在 R2 页面顶部或侧边栏中，找到 **Manage R2 API Tokens** 或 **API Tokens** 选项
2. 点击 **Create API token** 按钮

### 步骤 4：配置 Token 权限
1. **Token name（令牌名称）**：输入一个描述性名称，例如 `sora2ai-production`
2. **Permissions（权限）**：选择你需要的权限
   - **Object Read & Write**（对象读写）- 用于上传和下载文件
   - **Object Read**（对象只读）- 如果只需要读取
   - **Object Admin**（对象管理员）- 如果需要完全控制
3. **TTL（生存时间）**：可以设置为永不过期，或者设置过期时间
4. **Allow List Operations**：建议勾选，用于列出文件
5. 点击 **Create API Token** 按钮

### 步骤 5：复制凭证
创建成功后，会显示两个值：

⚠️ **重要提示：Secret Access Key 只显示一次，请立即复制并妥善保存！**

```
Access Key ID: abc123def456...
Secret Access Key: xyz789uvw456...（这是一个长字符串，不是URL！）
```

**请确保复制完整的 Secret Access Key**（它通常是一个很长的字符串）

### 步骤 6：保存凭证到 Vercel
将这两个值分别保存到 Vercel 环境变量：

1. 登录 Vercel Dashboard
2. 进入你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量：

```
R2_ACCESS_KEY_ID=你的AccessKeyID
R2_SECRET_ACCESS_KEY=你的SecretAccessKey（完整的长字符串）
```

5. 点击 **Save**
6. **重要：重新部署项目以使环境变量生效**

---

## 方法二：查看现有 API Token

如果你已经有 API Token，但忘记了 Secret Access Key：

⚠️ **注意：Cloudflare 出于安全考虑，不会显示已创建 Token 的 Secret Access Key**

如果忘记了 Secret Access Key，你需要：
1. 删除旧的 API Token
2. 创建新的 API Token
3. 保存新的 Secret Access Key

### 查看现有 Token 的方法：
1. 进入 **R2** → **Manage R2 API Tokens**
2. 你会看到 Token 列表（只能看到 Access Key ID，看不到 Secret）
3. 如果需要 Secret，必须创建新 Token

---

## 完整的 R2 配置清单

在 Vercel 中需要配置以下环境变量：

```bash
# R2 账户 ID（在 Cloudflare Dashboard 的 R2 页面可以找到）
R2_ACCOUNT_ID=你的账户ID（例如：2776117bb412e09a1d30cbe886cd3935）

# R2 访问密钥 ID（从 API Token 创建时获得）
R2_ACCESS_KEY_ID=你的AccessKeyID

# R2 密钥（从 API Token 创建时获得，⚠️ 是字符串，不是URL！）
R2_SECRET_ACCESS_KEY=你的SecretAccessKey

# R2 存储桶名称
R2_BUCKET_NAME=sora2（或你的存储桶名称）

# R2 公共 URL（可选，用于公开访问文件）
# 在 R2 存储桶设置中可以找到 Public Domain
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# R2 S3 端点（可选，通常自动生成）
R2_S3_ENDPOINT=https://你的账户ID.r2.cloudflarestorage.com
```

---

## 如何找到 R2 Account ID

1. 在 Cloudflare Dashboard 中进入 **R2**
2. 点击任意存储桶
3. 在存储桶设置或概览页面可以找到 **Account ID**
4. 或者在 API Token 创建页面也能看到 Account ID

---

## 常见错误

### ❌ 错误示例：
```
R2_SECRET_ACCESS_KEY=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
```
这是错误的！Secret Access Key 应该是密钥字符串，不是 URL。

### ✅ 正确示例：
```
R2_SECRET_ACCESS_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567
```
这是一个长字符串，通常包含字母、数字和特殊字符。

---

## 安全建议

1. **不要将 Secret Access Key 提交到 Git 仓库**
2. **只在 Vercel 环境变量中存储**
3. **如果 Token 泄露，立即删除并创建新 Token**
4. **为不同环境（开发、生产）使用不同的 Token**
5. **定期轮换 API Token（建议每 90 天）**

---

## 验证配置是否正确

配置完成后，你可以通过以下方式验证：

1. **在管理员后台测试：**
   - 登录管理员后台
   - 进入"首页管理"
   - 点击"刷新列表"
   - 如果能正常加载文件列表，说明配置正确

2. **查看 Vercel 日志：**
   - 如果配置错误，会在函数日志中看到明确的错误信息
   - 错误信息会提示具体是哪个环境变量有问题

---

## 需要帮助？

如果遇到问题：
1. 检查 Secret Access Key 是否完整（复制时不要遗漏字符）
2. 确保在 Vercel 中保存后重新部署
3. 检查 API Token 的权限是否足够
4. 查看 `R2_TROUBLESHOOTING.md` 获取更多故障排除信息

