# 重新创建 Cloudflare R2 API Token 指南

## 📋 步骤 1: 登录 Cloudflare Dashboard

1. 访问 [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. 使用你的 Cloudflare 账户登录

## 📋 步骤 2: 进入 R2 管理页面

1. 在左侧导航菜单中，点击 **R2**
2. 进入 R2 管理界面

## 📋 步骤 3: 删除旧的 API Token（可选）

如果要删除旧的 Token：

1. 在 R2 页面，找到 **Manage R2 API Tokens** 或 **API Tokens**
2. 找到你要删除的 Token（根据名称识别）
3. 点击 Token 右侧的 **...** 菜单
4. 选择 **Delete** 或 **删除**
5. 确认删除

**注意**：如果记不住 Secret Access Key，建议删除旧 Token 以确保安全。

## 📋 步骤 4: 创建新的 R2 API Token

### 4.1 进入创建页面

1. 在 R2 页面，找到并点击 **Manage R2 API Tokens**
   - 通常在页面顶部
   - 或在设置菜单中
   - 也可能显示为 "API Tokens"

2. 点击 **Create API Token** 按钮

### 4.2 配置 Token 信息

填写以下信息：

**Token Name（令牌名称）**：
- 输入一个描述性名称，例如：`sora2ai-production-token`
- 或：`sora2ai-r2-token-2024`

**Permissions（权限）**：
- 选择 **Object Read & Write** ✅ **推荐**
  - 这个权限允许：
    - 读取文件（列出文件、下载文件）
    - 写入文件（上传文件）
    - 删除文件

**或者** 如果只需要读取：
- 选择 **Object Read**
  - 只能读取和列出文件
  - 不能上传或删除

**TTL（生存时间）**：
- 留空 = 永久有效 ✅ **推荐**
- 或设置过期时间（例如：90天）

### 4.3 创建 Token

1. 点击 **Create API Token** 按钮
2. **⚠️ 重要**：Token 信息会立即显示

## 📋 步骤 5: 立即保存 Token 信息

**⚠️ 非常重要**：Secret Access Key 只显示一次，请立即复制并保存！

创建成功后，你会看到：

```
令牌值 (Token Value):
J8lziNGKBquRTcaapZSy1ClUxgpnjbBSUzQzy4wt
（或类似的值）

访问密钥 ID (Access Key ID):
01110f3a41ac350fc8cd0bbd7bf34ecc
（或类似的值）

机密访问密钥 (Secret Access Key):
282788fb2875ab728cecdf2f1b81afafc1bf8442793bf260befa614aaad9f746
（或类似的值，⚠️ 只显示一次！）
```

### 需要保存的值：

1. **令牌值 (Token Value)** - 作为 `R2_ACCESS_KEY_ID`
2. **机密访问密钥 (Secret Access Key)** - 作为 `R2_SECRET_ACCESS_KEY`
3. **端点 URL** - 通常显示在页面上

## 📋 步骤 6: 更新 Vercel 环境变量

### 6.1 登录 Vercel Dashboard

1. 访问 [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. 登录你的账户

### 6.2 进入环境变量设置

1. 选择你的项目
2. 进入 **Settings** → **Environment Variables**

### 6.3 更新环境变量

更新以下变量：

#### 1. R2_ACCESS_KEY_ID
- 点击 `R2_ACCESS_KEY_ID` 的编辑按钮
- 将值更新为：**令牌值 (Token Value)**
- 点击 **Save**

#### 2. R2_SECRET_ACCESS_KEY
- 点击 `R2_SECRET_ACCESS_KEY` 的编辑按钮
- 将值更新为：**机密访问密钥 (Secret Access Key)**
- 点击 **Save**

#### 3. 确认其他变量

确保以下变量也正确：
- `R2_ACCOUNT_ID` = `2776117bb412e09a1d30cbe886cd3935`
- `R2_BUCKET_NAME` = `sora2`
- `R2_S3_ENDPOINT` = `https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com`
- `R2_PUBLIC_URL` = `https://pub-2868c824f92441499577980a0b61114c.r2.dev`

### 6.4 重新部署

**重要**：更新环境变量后必须重新部署！

1. 在 Vercel Dashboard 中，进入 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **...** 菜单
4. 选择 **Redeploy**
5. 确认重新部署

或者：
- 推送任何代码更改到 GitHub（会触发自动部署）

## 📋 步骤 7: 验证配置

### 7.1 等待部署完成

- 等待 Vercel 部署完成（通常1-2分钟）

### 7.2 测试连接

1. 登录管理员后台
2. 进入"首页管理"
3. 点击"刷新列表"
4. 应该能正常加载 R2 文件列表

### 7.3 如果仍然失败

1. 查看 Vercel Function Logs
2. 检查是否有 `[R2]` 开头的日志
3. 查看错误信息
4. 确认新 Token 的 Secret Access Key 格式

## 📋 完整的配置值格式

更新后的配置应该是：

```bash
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=<新的令牌值>
R2_SECRET_ACCESS_KEY=<新的机密访问密钥>
R2_BUCKET_NAME=sora2
R2_S3_ENDPOINT=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

## ⚠️ 重要提示

1. **Secret Access Key 只显示一次**
   - 如果忘记保存，需要删除 Token 并重新创建

2. **使用正确的值**
   - `R2_ACCESS_KEY_ID` = **令牌值** (Token Value)
   - `R2_SECRET_ACCESS_KEY` = **机密访问密钥** (Secret Access Key)

3. **不要转换或修改**
   - 直接使用从 Dashboard 复制的原始值
   - 不要添加引号或空格

4. **重新部署**
   - 更新环境变量后必须重新部署才能生效

## 📝 检查清单

- [ ] 已在 Cloudflare Dashboard 创建新的 R2 API Token
- [ ] 已保存 Token Value 和 Secret Access Key
- [ ] 已在 Vercel 中更新 `R2_ACCESS_KEY_ID`
- [ ] 已在 Vercel 中更新 `R2_SECRET_ACCESS_KEY`
- [ ] 已在 Vercel 中重新部署项目
- [ ] 已测试 R2 连接是否正常

## 🆘 如果仍然有问题

如果重新创建 Token 后仍然失败：

1. **检查新 Token 的格式**
   - Secret Access Key 的长度
   - 是否是64字符十六进制
   - 或者其他格式

2. **查看 Vercel 日志**
   - 确认环境变量是否正确读取
   - 查看详细的错误信息

3. **联系 Cloudflare 支持**
   - 如果格式仍然不匹配，可能需要询问 Cloudflare
   - 确认 R2 API Token 的正确格式

