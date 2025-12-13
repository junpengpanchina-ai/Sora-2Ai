# 在 Vercel 中更新 R2 API Token 的快速指南

## 🚀 快速步骤

### 1. 获取新的 Token 值

从 Cloudflare Dashboard 复制：
- **令牌值 (Token Value)** → 用于 `R2_ACCESS_KEY_ID`
- **机密访问密钥 (Secret Access Key)** → 用于 `R2_SECRET_ACCESS_KEY`

### 2. 在 Vercel 中更新

1. 登录 Vercel Dashboard
2. 选择项目 → **Settings** → **Environment Variables**
3. 编辑 `R2_ACCESS_KEY_ID`，填入新的 **令牌值**
4. 编辑 `R2_SECRET_ACCESS_KEY`，填入新的 **机密访问密钥**
5. **保存**

### 3. 重新部署

**重要**：必须重新部署才能生效！

1. **Deployments** → 最新部署 → **...** → **Redeploy**

或者：

1. 推送任何代码到 GitHub（触发自动部署）

### 4. 验证

等待部署完成后：
1. 登录管理员后台
2. 进入"首页管理"
3. 点击"刷新列表"
4. 应该能正常加载

## ⚠️ 注意事项

- ✅ 直接使用原始值，不要修改
- ✅ 没有引号，没有多余空格
- ✅ 必须重新部署
- ❌ 不要转换格式

## 🔍 如果仍然失败

1. 查看 Vercel Function Logs
2. 检查是否有 `[R2]` 日志
3. 查看错误详情

