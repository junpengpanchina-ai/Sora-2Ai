# 新的 R2 API Token 配置值

## ✅ 完整的 Vercel 环境变量配置

根据你提供的新 Token 信息，以下是完整的配置：

### 在 Vercel Environment Variables 中添加/更新以下变量：

```bash
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=wKxoT4Ug9tF7h6DAWerL4-cyMa_-GYAYAs9371GW
R2_SECRET_ACCESS_KEY=9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3
R2_BUCKET_NAME=sora2
R2_S3_ENDPOINT=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

## 📋 配置值说明

| 环境变量 | 值 | 来源 | 长度 |
|---------|-----|------|------|
| `R2_ACCOUNT_ID` | `2776117bb412e09a1d30cbe886cd3935` | 已有配置 | 32字符 |
| `R2_ACCESS_KEY_ID` | `wKxoT4Ug9tF7h6DAWerL4-cyMa_-GYAYAs9371GW` | **令牌值** | 39字符 ✅ |
| `R2_SECRET_ACCESS_KEY` | `9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3` | **机密访问密钥** | 64字符 |
| `R2_BUCKET_NAME` | `sora2` | 已有配置 | - |
| `R2_S3_ENDPOINT` | `https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com` | 你提供的端点 | - |
| `R2_PUBLIC_URL` | `https://pub-2868c824f92441499577980a0b61114c.r2.dev` | 已有配置 | - |

## ⚠️ 重要提示

### 1. 使用"令牌值"作为 Access Key ID

**✅ 正确**：
```
R2_ACCESS_KEY_ID=wKxoT4Ug9tF7h6DAWerL4-cyMa_-GYAYAs9371GW
```
（使用"令牌值"，39字符）

**❌ 错误**：
```
R2_ACCESS_KEY_ID=4d7b30ddf64403fae2ddce70f3cb1a6a
```
（不要使用"访问密钥 ID"，32字符）

### 2. Secret Access Key 格式

新的 Secret Access Key 仍然是64字符十六进制：
- `9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3`
- 代码会自动转换为32字符或使用前32字符

## 🔧 在 Vercel 中配置步骤

### 步骤 1: 进入环境变量设置

1. 登录 Vercel Dashboard
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**

### 步骤 2: 更新/添加变量

逐个添加或更新以下变量：

#### 变量 1: R2_ACCOUNT_ID
- **Key**: `R2_ACCOUNT_ID`
- **Value**: `2776117bb412e09a1d30cbe886cd3935`
- **Environment**: All Environments

#### 变量 2: R2_ACCESS_KEY_ID
- **Key**: `R2_ACCESS_KEY_ID`
- **Value**: `wKxoT4Ug9tF7h6DAWerL4-cyMa_-GYAYAs9371GW`
- **Environment**: All Environments

#### 变量 3: R2_SECRET_ACCESS_KEY
- **Key**: `R2_SECRET_ACCESS_KEY`
- **Value**: `9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3`
- **Environment**: All Environments

#### 变量 4: R2_BUCKET_NAME
- **Key**: `R2_BUCKET_NAME`
- **Value**: `sora2`
- **Environment**: All Environments

#### 变量 5: R2_S3_ENDPOINT
- **Key**: `R2_S3_ENDPOINT`
- **Value**: `https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com`
- **Environment**: All Environments

#### 变量 6: R2_PUBLIC_URL
- **Key**: `R2_PUBLIC_URL`
- **Value**: `https://pub-2868c824f92441499577980a0b61114c.r2.dev`
- **Environment**: All Environments

### 步骤 3: 保存并重新部署

1. 点击 **Save** 保存所有变量
2. 进入 **Deployments** 标签
3. 找到最新的部署
4. 点击 **...** → **Redeploy**
5. 等待部署完成

## 📝 快速复制（一行一个）

如果需要快速复制，使用以下格式：

```
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=wKxoT4Ug9tF7h6DAWerL4-cyMa_-GYAYAs9371GW
R2_SECRET_ACCESS_KEY=9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3
R2_BUCKET_NAME=sora2
R2_S3_ENDPOINT=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

## ✅ 配置后验证

配置完成后：

1. **重新部署项目**
2. **测试连接**：
   - 登录管理员后台
   - 进入"首页管理"
   - 点击"刷新列表"
   - 应该能正常加载 R2 文件列表

3. **如果仍然失败**：
   - 查看 Vercel Function Logs
   - 搜索 `[R2]` 查看转换日志
   - 确认新 Token 的格式是否正确

## 🔍 新 Token 格式分析

- **Access Key ID**: 39字符（令牌值）
- **Secret Access Key**: 64字符十六进制

代码会自动处理64字符的 Secret Access Key，尝试：
1. 使用前32字符（优先）
2. 转换为Base64（43字符）

希望这次能成功！

