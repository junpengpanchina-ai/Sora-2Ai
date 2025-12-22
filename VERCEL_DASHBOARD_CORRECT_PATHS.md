# Vercel Dashboard 正确访问路径

## ⚠️ 问题

访问以下链接时出现 404 错误：
- https://vercel.com/dashboard/billing/spend-management
- https://vercel.com/dashboard/billing/usage
- https://vercel.com/dashboard/settings/notifications

## 🔍 原因

1. **需要先选择团队**：页面显示 "Select Team..."，需要先选择团队才能访问这些功能
2. **URL 路径可能不正确**：某些功能可能需要通过不同的路径访问

## ✅ 正确的访问方法

### 方法 1: 通过 Dashboard 导航（推荐）

#### 1. 支出管理（Spend Management）

**步骤**：
1. 访问：https://vercel.com/dashboard
2. 确保已选择正确的团队（点击 "Select Team..." 如果显示）
3. 点击右上角你的**头像**
4. 在下拉菜单中选择 **Settings**
5. 在左侧菜单中找到 **Billing**
6. 点击 **Spend Management** 标签

**或者直接访问**：
- https://vercel.com/dashboard/[你的团队名]/settings/billing/spend-management
- 将 `[你的团队名]` 替换为你的实际团队名称

#### 2. 使用情况（Usage）

**步骤**：
1. 访问：https://vercel.com/dashboard
2. 确保已选择正确的团队
3. 点击右上角你的**头像**
4. 选择 **Settings**
5. 在左侧菜单中找到 **Billing**
6. 点击 **Usage** 标签

**或者直接访问**：
- https://vercel.com/dashboard/[你的团队名]/settings/billing/usage

#### 3. 通知设置（Notifications）

**步骤**：
1. 访问：https://vercel.com/dashboard
2. 确保已选择正确的团队
3. 点击右上角你的**头像**
4. 选择 **Settings**
5. 在左侧菜单中找到 **Notifications**

**或者直接访问**：
- https://vercel.com/dashboard/[你的团队名]/settings/notifications

---

### 方法 2: 查找你的团队名称

**步骤**：
1. 访问：https://vercel.com/dashboard
2. 查看页面左上角，找到你的团队名称
3. 如果显示 "Select Team..."，点击它选择你的团队
4. 记下团队名称（通常是你的用户名或组织名）

**常见团队名称格式**：
- 个人账户：你的用户名（例如：`junpengpanchina`）
- 组织账户：组织名称

---

### 方法 3: 通过项目设置访问

#### 支出管理和使用情况

**步骤**：
1. 访问：https://vercel.com/dashboard
2. 选择你的项目（例如：`sora-2ai`）
3. 点击 **Settings** 标签
4. 在左侧菜单中找到 **Billing**（如果可见）
5. 或者点击右上角头像 → **Settings** → **Billing**

---

## 🔧 解决 404 错误的步骤

### 步骤 1: 确保已登录

1. 访问：https://vercel.com/dashboard
2. 确认你已登录（应该看到你的邮箱：junpengpanchina@gmail.com）

### 步骤 2: 选择团队

1. 如果页面显示 "Select Team..."，点击它
2. 选择你的团队（个人账户或组织账户）
3. 如果只有一个团队，它会自动选择

### 步骤 3: 通过导航菜单访问

1. 点击右上角你的**头像**
2. 选择 **Settings**
3. 在左侧菜单中找到相应的功能：
   - **Billing** → **Spend Management**
   - **Billing** → **Usage**
   - **Notifications**

---

## 📋 快速检查清单

### 支出管理（Spend Management）

- [ ] 访问 https://vercel.com/dashboard
- [ ] 选择正确的团队
- [ ] 点击头像 → Settings → Billing → Spend Management
- [ ] 如果还是 404，尝试：Settings → Billing → 查看是否有 Spend Management 选项

### 使用情况（Usage）

- [ ] 访问 https://vercel.com/dashboard
- [ ] 选择正确的团队
- [ ] 点击头像 → Settings → Billing → Usage
- [ ] 如果还是 404，尝试：Settings → Billing → 查看是否有 Usage 选项

### 通知设置（Notifications）

- [ ] 访问 https://vercel.com/dashboard
- [ ] 选择正确的团队
- [ ] 点击头像 → Settings → Notifications
- [ ] 如果还是 404，尝试：Settings → 查看是否有 Notifications 选项

---

## 💡 替代方案

### 如果上述方法都不行

1. **检查计划类型**：
   - 确认你确实是 Pro 计划
   - 某些功能可能只在特定计划中可用

2. **联系 Vercel 支持**：
   - 访问：https://vercel.com/support
   - 或通过 Dashboard → Support Center

3. **使用 Vercel CLI**：
   ```bash
   vercel billing
   ```

---

## 🔗 备用访问路径

### 个人账户
- 支出管理：https://vercel.com/dashboard/[你的用户名]/settings/billing/spend-management
- 使用情况：https://vercel.com/dashboard/[你的用户名]/settings/billing/usage
- 通知设置：https://vercel.com/dashboard/[你的用户名]/settings/notifications

### 组织账户
- 支出管理：https://vercel.com/dashboard/[组织名]/settings/billing/spend-management
- 使用情况：https://vercel.com/dashboard/[组织名]/settings/billing/usage
- 通知设置：https://vercel.com/dashboard/[组织名]/settings/notifications

---

## 📞 需要帮助？

如果仍然无法访问，可以：
1. 检查 Vercel 文档：https://vercel.com/docs
2. 联系 Vercel 支持：Dashboard → Support Center
3. 查看 Vercel 状态：https://vercel-status.com

