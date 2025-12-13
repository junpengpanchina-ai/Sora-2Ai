# R2 Access Key ID 配置错误修复

## 🔍 问题分析

从 Vercel Function Logs 可以看到：

```
[R2] 初始化客户端: {
  accessKeyLength: 40,           ← 问题在这里！
  accessKeyPreview: 'wKxoT4Ug...',
  validSecretLength: 32,         ← Secret Access Key 正确（32字符）
  ...
}
```

**错误原因**：
- `R2_ACCESS_KEY_ID` 的值是 40 字符：`wKxoT4Ug9tF7h6DAWerL4-cyMa_-GYAYAs9371GW`
- 但这是 **"令牌值"（Token）**，不是 **"访问密钥 ID"（Access Key ID）**
- 正确的 Access Key ID 应该是 32 字符：`4d7b30ddf64403fae2ddce70f3cb1a6a`

## ✅ 正确的配置

根据你之前提供的 R2 凭证信息：

| 环境变量 | 值 | 长度 | 说明 |
|---------|-----|------|------|
| `R2_ACCESS_KEY_ID` | `4d7b30ddf64403fae2ddce70f3cb1a6a` | 32字符 | 访问密钥 ID |
| `R2_SECRET_ACCESS_KEY` | `9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3` | 64字符 | 机密访问密钥（已正确处理） |
| `R2_ACCOUNT_ID` | `2776117bb412e09a1d30cbe886cd3935` | 32字符 | 账户 ID |

**注意**：`wKxoT4Ug9tF7h6DAWerL4-cyMa_-GYAYAs9371GW` 是"令牌值"，**不应该**用于 `R2_ACCESS_KEY_ID`。

## 🔧 修复步骤

### 1. 更新 Vercel 环境变量

1. 进入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目 → **Settings** → **Environment Variables**
3. 找到 `R2_ACCESS_KEY_ID`
4. 点击编辑或删除后重新创建
5. 将值更新为：`4d7b30ddf64403fae2ddce70f3cb1a6a`

### 2. 确认所有环境变量

确保以下变量都已正确配置：

```bash
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=4d7b30ddf64403fae2ddce70f3cb1a6a          ← 应该是32字符
R2_SECRET_ACCESS_KEY=9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3  ← 64字符
R2_BUCKET_NAME=sora2
R2_S3_ENDPOINT=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

### 3. 重新部署

环境变量更新后：

1. 在 Vercel Dashboard → **Environment Variables**
2. 找到更新后的变量，点击 **"..."** 菜单
3. 选择 **Redeploy**（如果有此选项）
4. 或者进入 **Deployments** → 最新部署 → **Redeploy**

### 4. 验证修复

部署完成后，查看 Vercel Function Logs，应该看到：

```
[R2] 初始化客户端: {
  accessKeyLength: 32,           ← 应该是32（而不是40）
  accessKeyPreview: '4d7b30dd...',
  validSecretLength: 32,
  ...
}
```

## 📋 快速检查清单

- [ ] `R2_ACCESS_KEY_ID` 的值是 `4d7b30ddf64403fae2ddce70f3cb1a6a`（32字符）
- [ ] `R2_SECRET_ACCESS_KEY` 的值是完整的 64 字符
- [ ] 环境变量已更新并重新部署
- [ ] Function Logs 显示 `accessKeyLength: 32`
- [ ] 不再出现 "Credential access key has length 40" 错误

## ⚠️ 常见错误

### ❌ 错误：使用"令牌值"作为 Access Key ID

```
R2_ACCESS_KEY_ID=wKxoT4Ug9tF7h6DAWerL4-cyMa_-GYAYAs9371GW  ← 错误！这是令牌值
```

### ✅ 正确：使用"访问密钥 ID"

```
R2_ACCESS_KEY_ID=4d7b30ddf64403fae2ddce70f3cb1a6a  ← 正确！32字符
```

