# R2 密钥错误 - Vercel 部署检查清单

## 🔍 当前问题

错误信息：`Credential access key has length 40, should be 32`

**你的密钥**：`9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3`（64字符）

## ✅ 已修复的代码

1. ✅ `lib/r2/client.ts` - 修复了密钥处理逻辑（64字符 → 使用前32字符）
2. ✅ `app/api/admin/r2/upload/route.ts` - 修复了上传路由的密钥处理

## 📋 检查清单

### 1. 确认 Vercel 部署已完成

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 查看 **Deployments** 列表
4. 确认最新的部署状态是 **Ready**（绿色）
5. 确认部署时间是最新的（刚刚推送后）

### 2. 验证 Vercel 环境变量

在 Vercel Dashboard 中：

1. 进入项目 → **Settings** → **Environment Variables**
2. 确认以下变量存在且值正确：

```bash
R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935
R2_ACCESS_KEY_ID=4d7b30ddf64403fae2ddce70f3cb1a6a
R2_SECRET_ACCESS_KEY=9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3
R2_BUCKET_NAME=sora2
R2_S3_ENDPOINT=https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

**特别注意**：
- `R2_SECRET_ACCESS_KEY` 应该是完整的 **64字符**：`9090b9687c584ecfe296a6c106023a90d1abb91a1bd076a21c9c1af9b436a6f3`
- 不要截断或修改这个值
- 确保没有多余的空格或换行符

### 3. 强制重新部署（如果需要）

如果环境变量已更新，但部署还是旧的：

1. 在 Vercel Dashboard → **Deployments**
2. 点击最新部署旁边的 **"..."** 菜单
3. 选择 **Redeploy**
4. 或者，如果环境变量刚刚更新，可以：
   - 进入 **Settings** → **Environment Variables**
   - 点击 **"..."** → **Redeploy** 所有受影响的部署

### 4. 检查 Vercel Function Logs

部署完成后，查看日志：

1. 在 Vercel Dashboard → **Deployments** → 点击最新部署
2. 进入 **Functions** 标签
3. 找到 `/api/admin/r2/list` 函数
4. 查看日志，应该看到类似：

```
[R2] 初始化客户端: {
  accessKeyLength: 32,
  originalSecretLength: 64,
  validSecretLength: 32,
  ...
}
[R2] 客户端创建成功，密钥长度: 32
```

**如果看到 `validSecretLength: 40`**，说明代码还没有更新，需要重新部署。

**如果看到 `originalSecretLength: 40`**，说明 Vercel 环境变量中的密钥值不对。

### 5. 测试步骤

部署完成后：

1. 清除浏览器缓存（或使用无痕模式）
2. 访问 `https://sora2aivideos.com/admin`
3. 切换到 "首页管理" 标签
4. 尝试加载图片列表
5. 查看浏览器控制台和 Vercel Function Logs

## 🔧 如果问题仍然存在

### 方案 1: 手动触发重新部署

```bash
# 在本地做一个小的修改（比如添加一个空行），然后提交
git commit --allow-empty -m "触发重新部署以应用R2修复"
git push
```

### 方案 2: 检查代码版本

在 Vercel Function Logs 中查看是否有我们添加的日志：
- 应该看到 `[R2] 检测到64字符十六进制密钥，使用前32字符`
- 应该看到 `[R2] 初始化客户端:` 包含 `originalSecretLength: 64`

如果没有这些日志，说明代码还没有部署。

### 方案 3: 验证密钥值

在 Vercel Function Logs 中添加临时调试代码（不推荐，仅用于调试）：

```typescript
console.log('DEBUG R2_SECRET_ACCESS_KEY:', {
  value: process.env.R2_SECRET_ACCESS_KEY,
  length: process.env.R2_SECRET_ACCESS_KEY?.length,
  preview: process.env.R2_SECRET_ACCESS_KEY?.substring(0, 16),
})
```

## ⚠️ 常见问题

### Q: 为什么错误信息显示长度是40而不是64或32？

**A**: 这说明可能有旧的代码在运行，或者环境变量中的值被修改过。检查：
1. Vercel 环境变量中的 `R2_SECRET_ACCESS_KEY` 是否完整（应该是64字符）
2. 代码是否已部署（查看部署时间）

### Q: 环境变量已更新，但错误仍然存在？

**A**: 
1. 环境变量更新后，需要重新部署才能生效
2. 在 Vercel Dashboard → Environment Variables → 点击 "Redeploy"
3. 或者等待下一次自动部署

### Q: 如何确认代码已更新？

**A**: 查看 Vercel Function Logs，应该看到：
- `originalSecretLength: 64`（说明密钥是完整的64字符）
- `validSecretLength: 32`（说明转换逻辑正常工作）
- 不再出现 "length 40" 错误

## 📚 相关文档

- `R2_FIX_40_CHAR_ERROR.md` - 详细的修复说明
- `R2_NEW_TOKEN_CONFIG.md` - 最新Token配置
- `R2_VERCEL_ENV_NEW.txt` - Vercel环境变量配置

