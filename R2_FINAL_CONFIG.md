# Cloudflare R2 最终配置值

## ✅ 正确的配置值（已确认）

根据你提供的 Cloudflare R2 API Token 信息，以下是**最终确认**的配置值：

### 环境变量配置

```bash
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=J8lziNGKBquRTcaapZSy1ClUxgpnjbBSUzQzy4wt
R2_SECRET_ACCESS_KEY=282788fb2875ab728cecdf2f1b81afafc1bf8442793bf260befa614aaad9f746
R2_BUCKET_NAME=sora2
R2_S3_ENDPOINT=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

---

## 📋 值说明

### 1. R2_ACCOUNT_ID
- **值**: `2776117bb412e09a1d30cbe886cd3935`
- **来源**: 从端点 URL 中提取
- **长度**: 32 字符

### 2. R2_ACCESS_KEY_ID ✅
- **值**: `J8lziNGKBquRTcaapZSy1ClUxgpnjbBSUzQzy4wt`
- **来源**: **"令牌值"** (Token Value)
- **长度**: 39 字符
- **⚠️ 重要**: 使用"令牌值"，**不要**使用"访问密钥 ID"（32字符的那个）

### 3. R2_SECRET_ACCESS_KEY ✅
- **值**: `282788fb2875ab728cecdf2f1b81afafc1bf8442793bf260befa614aaad9f746`
- **来源**: **"机密访问密钥"** (Secret Access Key)
- **长度**: 64 字符（十六进制格式）
- **⚠️ 重要**: 直接使用，不要转换

### 4. R2_S3_ENDPOINT
- **值**: `https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com`
- **来源**: 你提供的端点 URL

### 5. R2_BUCKET_NAME
- **值**: `sora2`
- **说明**: 你的存储桶名称

### 6. R2_PUBLIC_URL
- **值**: `https://pub-2868c824f92441499577980a0b61114c.r2.dev`
- **说明**: 公共访问 URL（已有配置）

---

## 🔧 在 Vercel 中配置步骤

### 步骤 1：进入环境变量设置
1. 登录 Vercel Dashboard
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**

### 步骤 2：添加环境变量
点击 **Add New**，逐个添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `R2_ACCOUNT_ID` | `2776117bb412e09a1d30cbe886cd3935` |
| `R2_ACCESS_KEY_ID` | `J8lziNGKBquRTcaapZSy1ClUxgpnjbBSUzQzy4wt` |
| `R2_SECRET_ACCESS_KEY` | `282788fb2875ab728cecdf2f1b81afafc1bf8442793bf260befa614aaad9f746` |
| `R2_BUCKET_NAME` | `sora2` |
| `R2_S3_ENDPOINT` | `https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | `https://pub-2868c824f92441499577980a0b61114c.r2.dev` |

### 步骤 3：保存并部署
1. 点击 **Save** 保存所有环境变量
2. **重要**: 进入 **Deployments** 页面
3. 点击最新部署右侧的 **...** 菜单
4. 选择 **Redeploy** 重新部署
5. 或者推送代码触发自动部署

---

## ⚠️ 关键注意事项

### 1. 使用"令牌值"而不是"访问密钥 ID"

**✅ 正确**:
```
R2_ACCESS_KEY_ID=J8lziNGKBquRTcaapZSy1ClUxgpnjbBSUzQzy4wt
```
（使用"令牌值"，39字符）

**❌ 错误**:
```
R2_ACCESS_KEY_ID=01110f3a41ac350fc8cd0bbd7bf34ecc
```
（不要使用"访问密钥 ID"，32字符）

### 2. Secret Access Key 直接使用

- **✅ 正确**: 直接使用 64 字符的十六进制字符串
- **❌ 错误**: 不要转换为 Base64 或其他格式

### 3. 确保值完整

- 复制时确保没有遗漏字符
- 没有多余的空格
- 没有引号

---

## ✅ 验证配置

配置完成后，按以下步骤验证：

1. **重新部署项目**
   - 在 Vercel 中触发重新部署

2. **测试连接**
   - 登录管理员后台
   - 进入"首页管理"
   - 点击"刷新列表"
   - 应该能正常加载 R2 文件列表

3. **检查错误**
   - 如果还有错误，查看管理员后台的错误提示
   - 查看 Vercel Function Logs 中的详细错误信息

---

## 📝 快速复制

如果需要快速复制所有值，可以使用项目根目录的 `R2_VERCEL_ENV.txt` 文件。

---

## 🎯 总结

- ✅ **R2_ACCESS_KEY_ID**: 使用"令牌值" `J8lziNGKBquRTcaapZSy1ClUxgpnjbBSUzQzy4wt`
- ✅ **R2_SECRET_ACCESS_KEY**: 使用"机密访问密钥" `282788fb2875ab728cecdf2f1b81afafc1bf8442793bf260befa614aaad9f746`
- ✅ **R2_ACCOUNT_ID**: `2776117bb412e09a1d30cbe886cd3935`
- ✅ **R2_S3_ENDPOINT**: `https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com`

配置完成后，重新部署即可！

