# R2 配置最终总结 - 新 Token

## 🎯 配置值（直接用于 Vercel）

```bash
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=wKxoT4Ug9tF7h6DAWerL4-cyMa_-GYAYAs9371GW
R2_SECRET_ACCESS_KEY=9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3
R2_BUCKET_NAME=sora2
R2_S3_ENDPOINT=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

## ✅ 关键点

1. **R2_ACCESS_KEY_ID** = **令牌值** (39字符)
   - 值：`wKxoT4Ug9tF7h6DAWerL4-cyMa_-GYAYAs9371GW`
   - **不要**使用"访问密钥 ID"（32字符的那个）

2. **R2_SECRET_ACCESS_KEY** = **机密访问密钥** (64字符)
   - 值：`9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3`
   - 代码会自动处理（转换为32字符或使用前32字符）

## 📋 配置步骤

1. Vercel → Settings → Environment Variables
2. 更新 `R2_ACCESS_KEY_ID` 和 `R2_SECRET_ACCESS_KEY`
3. **保存**
4. **重新部署**（重要！）
5. 测试连接

## 🔍 新 Token 格式

- Access Key ID: 39字符 ✅
- Secret Access Key: 64字符十六进制（代码会自动处理）

希望这次能成功！

