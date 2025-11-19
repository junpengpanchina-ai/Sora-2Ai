# 快速推送代码指南

## 🚀 方法 1: 使用 GitHub CLI Token 登录（推荐）

### 步骤 1: 创建 Personal Access Token

1. 访问：https://github.com/settings/tokens
2. 点击 **"Generate new token"** > **"Generate new token (classic)"**
3. 填写：
   - **Note**: `GitHub CLI Access`
   - **Expiration**: 90 days（或更长）
   - **Scopes**: 勾选：
     - ✅ `repo`
     - ✅ `workflow`
4. 点击 **"Generate token"**
5. **复制 token**（只显示一次！）

### 步骤 2: 使用 Token 登录

在终端运行：

```bash
gh auth login --with-token
```

然后：
1. **粘贴刚才复制的 token**
2. **按 Enter**

### 步骤 3: 验证登录

```bash
gh auth status
```

应该显示：`✓ Logged in to github.com as <你的用户名>`

### 步骤 4: 推送代码

```bash
git push origin main
```

## 🚀 方法 2: 直接使用 Git Push（不需要 GitHub CLI）

### 步骤 1: 创建 Personal Access Token

同上（方法 1 的步骤 1）

### 步骤 2: 清除旧凭据

```bash
git credential-osxkeychain erase <<EOF
host=github.com
protocol=https
EOF
```

### 步骤 3: 推送代码

```bash
git push origin main
```

当提示输入时：
- **Username**: 你的 GitHub 用户名
- **Password**: 粘贴刚才创建的 **Personal Access Token**（不是 GitHub 密码）

## 📝 当前需要推送的提交

- `816c178` - Hide admin login link from public login page
- `66c0f9f` - Fix YAML syntax error in GitHub Actions workflows and hide admin login link

## ✅ 验证推送成功

推送成功后，应该看到：

```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
...
To https://github.com/junpengpanchina-ai/Sora-2Ai.git
   xxxxxxx..xxxxxxx  main -> main
```

## 🆘 如果遇到问题

1. **Token 无效**: 检查 token 是否过期，或重新创建
2. **权限不足**: 确保 token 有 `repo` 和 `workflow` 权限
3. **网络问题**: 检查网络连接，或稍后重试

