# GitHub CLI 登录替代方案

## 🔴 问题

使用 `gh auth login` 浏览器登录时出现：
```
糟糕，我们什么也没找到。
请确保您正确输入了用户代码。
```

## ✅ 解决方案

### 方案 1: 使用 Token 方式登录（推荐）

1. **创建 Personal Access Token**:
   - 访问 https://github.com/settings/tokens
   - 点击 "Generate new token" > "Generate new token (classic)"
   - 填写信息：
     - **Note**: `GitHub CLI Access`
     - **Expiration**: 选择过期时间（建议 90 天或更长）
     - **Scopes**: 勾选：
       - ✅ `repo`（完整仓库访问权限）
       - ✅ `workflow`（更新 GitHub Actions 工作流）
   - 点击 "Generate token"
   - **重要**：立即复制生成的 token（只显示一次）

2. **使用 Token 登录 GitHub CLI**:
   ```bash
   gh auth login --with-token
   ```
   然后粘贴刚才复制的 token，按 Enter

3. **验证登录**:
   ```bash
   gh auth status
   ```

4. **推送代码**:
   ```bash
   git push origin main
   ```

### 方案 2: 直接使用 Git Push（不需要 GitHub CLI）

如果不想使用 GitHub CLI，可以直接推送：

1. **创建 Personal Access Token**（同上）

2. **清除旧的 Git 凭据**:
   ```bash
   git credential-osxkeychain erase <<EOF
   host=github.com
   protocol=https
   EOF
   ```

3. **推送代码**:
   ```bash
   git push origin main
   ```
   
   当提示输入时：
   - **Username**: 你的 GitHub 用户名
   - **Password**: 粘贴刚才创建的 Personal Access Token（不是 GitHub 密码）

### 方案 3: 使用 SSH（长期解决方案）

如果你有 SSH 密钥：

1. **检查 SSH 密钥**:
   ```bash
   ls -la ~/.ssh/id_rsa.pub
   ```

2. **如果没有，生成一个**:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

3. **添加 SSH 密钥到 GitHub**:
   - 复制公钥：`cat ~/.ssh/id_rsa.pub`
   - 访问 https://github.com/settings/keys
   - 点击 "New SSH key"
   - 粘贴公钥并保存

4. **切换到 SSH URL**:
   ```bash
   git remote set-url origin git@github.com:junpengpanchina-ai/Sora-2Ai.git
   ```

5. **推送**:
   ```bash
   git push origin main
   ```

## 🚀 快速操作（推荐方案 1）

最快的方法是使用 Token 登录：

```bash
# 1. 创建 token（在浏览器中）
# 访问：https://github.com/settings/tokens
# 创建新 token，勾选 repo 和 workflow 权限

# 2. 使用 token 登录
gh auth login --with-token
# 粘贴 token，按 Enter

# 3. 验证
gh auth status

# 4. 推送
git push origin main
```

## 📝 注意事项

- Personal Access Token 只显示一次，请妥善保存
- Token 有过期时间，过期后需要重新创建
- 如果 token 泄露，立即撤销并创建新的

