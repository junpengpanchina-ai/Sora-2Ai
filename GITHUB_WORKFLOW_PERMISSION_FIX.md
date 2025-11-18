# GitHub Actions 工作流权限问题解决方案

## 🔴 错误信息

```
! [remote rejected] main -> main (refusing to allow a Personal Access Token to create or update workflow `.github/workflows/ci.yml` without `workflow` scope)
```

## 📋 问题原因

推送 GitHub Actions 工作流文件（`.github/workflows/*.yml`）需要 Personal Access Token (PAT) 具有 `workflow` 权限范围。

## ✅ 解决方案

### 方案 1: 更新 Personal Access Token（推荐）

#### 步骤 1: 创建新的 Personal Access Token

1. 访问 [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. 点击 **Generate new token** > **Generate new token (classic)**
3. 填写以下信息：
   - **Note**: `Sora-2Ai Workflow Access`（或任何描述性名称）
   - **Expiration**: 选择过期时间（建议 90 天或更长）
   - **Scopes**: 勾选以下权限：
     - ✅ `repo`（完整仓库访问权限）
     - ✅ `workflow`（**必需**：更新 GitHub Actions 工作流）
4. 点击 **Generate token**
5. **重要**：立即复制生成的 token（只显示一次）

#### 步骤 2: 更新 Git 凭据

**方法 A: 使用 Git Credential Manager（推荐）**

```bash
# macOS
git credential-osxkeychain erase
host=github.com
protocol=https

# 然后推送时会提示输入用户名和新的 token
git push origin main
```

**方法 B: 在 URL 中包含 token**

```bash
# 更新 remote URL（将 YOUR_TOKEN 替换为你的新 token）
git remote set-url origin https://YOUR_TOKEN@github.com/junpengpanchina-ai/Sora-2Ai.git

# 推送
git push origin main
```

**方法 C: 使用 Git Credential Helper**

```bash
# 清除旧的凭据
git credential reject <<EOF
protocol=https
host=github.com
EOF

# 推送时会提示输入新的 token
git push origin main
```

### 方案 2: 使用 SSH（替代方案）

如果你更喜欢使用 SSH，可以切换到 SSH URL：

#### 步骤 1: 检查是否有 SSH 密钥

```bash
ls -la ~/.ssh/id_rsa.pub
```

如果没有，生成一个：

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

#### 步骤 2: 添加 SSH 密钥到 GitHub

1. 复制公钥：
```bash
cat ~/.ssh/id_rsa.pub
```

2. 访问 [GitHub Settings > SSH and GPG keys](https://github.com/settings/keys)
3. 点击 **New SSH key**
4. 粘贴公钥内容
5. 点击 **Add SSH key**

#### 步骤 3: 切换到 SSH URL

```bash
git remote set-url origin git@github.com:junpengpanchina-ai/Sora-2Ai.git
git push origin main
```

### 方案 3: 使用 GitHub CLI（gh）

如果你安装了 GitHub CLI：

```bash
# 登录
gh auth login

# 选择 GitHub.com
# 选择 HTTPS
# 选择使用浏览器登录或输入 token

# 然后正常推送
git push origin main
```

## 🔍 验证权限

推送成功后，验证工作流是否正常运行：

1. 访问你的 GitHub 仓库
2. 进入 **Actions** 标签页
3. 你应该能看到工作流正在运行或已完成

## 📝 快速解决步骤（推荐）

1. **创建新的 PAT**（包含 `workflow` 权限）
   - 访问：https://github.com/settings/tokens
   - 勾选 `repo` 和 `workflow` 权限
   - 复制生成的 token

2. **更新 Git 凭据**：
```bash
# 清除旧凭据
git credential-osxkeychain erase <<EOF
host=github.com
protocol=https
EOF

# 推送（会提示输入用户名和新 token）
git push origin main
```

3. **输入凭据**：
   - Username: 你的 GitHub 用户名
   - Password: 粘贴新的 Personal Access Token

## ⚠️ 安全提示

1. ✅ **永远不要**将 Personal Access Token 提交到代码仓库
2. ✅ 定期轮换 token（建议每 90 天）
3. ✅ 使用最小权限原则（只授予必要的权限）
4. ✅ 如果 token 泄露，立即撤销并创建新的

## 🎯 完成检查

- [ ] 创建了包含 `workflow` 权限的新 PAT
- [ ] 更新了 Git 凭据
- [ ] 成功推送了工作流文件
- [ ] 在 GitHub Actions 中验证工作流正常运行

## 🆘 仍然遇到问题？

如果上述方法都不行，可以尝试：

1. **检查仓库权限**：确保你有仓库的写入权限
2. **检查组织设置**：如果是组织仓库，检查组织是否限制了工作流权限
3. **联系仓库管理员**：请求他们为你添加必要的权限

