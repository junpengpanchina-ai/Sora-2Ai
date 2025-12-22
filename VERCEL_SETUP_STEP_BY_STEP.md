# Vercel Pro 功能设置 - 逐步指南

## 📊 当前状态

- ✅ **使用情况**: 已查看（$1.33 / $20，6.65%）
- ✅ **优先生产构建**: 已启用
- ⏳ **支出管理**: 待设置
- ⏳ **构建机器配置**: 待设置

---

## 💰 第一步：设置支出管理（Spend Management）

### 访问方法

**推荐方法（通过导航菜单）**：

1. **访问 Dashboard**
   - 打开：https://vercel.com/dashboard

2. **选择团队**
   - 点击左上角 "Select Team..."
   - 选择 `junpen` 团队

3. **访问设置**
   - 点击右上角你的**头像**（圆形图标）
   - 在下拉菜单中选择 **Settings**

4. **访问 Billing**
   - 在左侧菜单中找到 **Billing**
   - 点击 **Billing**

5. **访问 Spend Management**
   - 在 Billing 页面顶部，找到标签页
   - 点击 **Spend Management** 标签

### 设置步骤

#### 1. 启用支出管理
- 找到 "Spend Management" 开关
- 确保开关是**开启**状态（绿色）

#### 2. 设置预算警告
在 "Budget Alerts" 部分：

- **Warning Threshold（警告阈值）**：
  - 输入：`15`
  - 单位：USD
  - 说明：当月使用达到 $15 时发送邮件提醒（75% 使用率）

- **Limit Threshold（限制阈值）**：
  - 输入：`25`
  - 单位：USD
  - 说明：当月使用达到 $25 时发送紧急提醒（125% 使用率）

#### 3. 设置通知
在 "Notifications" 部分：

- ✅ **Daily Summary（每日摘要）**：启用
- ✅ **Budget Warning（预算警告）**：启用
- ✅ **Over Budget（超出预算）**：启用

#### 4. 设置通知邮箱
- 在 "Email Notifications" 中输入你的邮箱
- 确保邮箱地址正确：`junpengpanchina@gmail.com`

#### 5. 保存设置
- 点击页面底部的 **Save** 按钮
- 等待确认消息

### 设置完成后的效果

- ✅ 当月使用达到 $15 时，会收到邮件提醒
- ✅ 当月使用达到 $25 时，会收到紧急提醒
- ✅ 每天会收到使用情况摘要（如果启用）

---

## 🔧 第二步：配置构建机器（Build Machine）

### 访问方法

**直接访问**：
- https://vercel.com/dashboard/junpen/sora-2-ai/settings/build-and-deployment

**或通过导航**：
1. 访问：https://vercel.com/dashboard/junpen/sora-2-ai
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Build & Deployment**
4. 点击 **Build & Deployment**
5. 滚动到 **Build Machine** 部分

### 设置步骤

#### 1. 选择构建机器类型
- 找到 "Build Machine" 部分
- 选择 **Standard（标准性能）**
  - 4 vCPUs, 8 GB 内存
  - 完全免费，包含在 $20 额度内

#### 2. 配置 On-Demand Concurrent Builds
- 找到 "On-Demand Concurrent Builds" 选项
- 选择 **Disabled（禁用）**
  - 原因：如果启用，Standard 机器会按 $0.014/分钟收费
  - 禁用后，Standard 构建完全免费

#### 3. 保存设置
- 点击页面底部的 **Save** 按钮
- 等待确认消息

### 设置完成后的效果

- ✅ 使用 Standard 构建机器，完全免费
- ✅ 不启用 On-Demand，避免额外费用
- ✅ 构建时间包含在 $20 额度内

---

## 📋 设置检查清单

### 支出管理设置

- [ ] 访问 Dashboard → 头像 → Settings → Billing → Spend Management
- [ ] 启用支出管理开关
- [ ] 设置预算警告：$15
- [ ] 设置预算限制：$25
- [ ] 设置通知邮箱
- [ ] 启用所有通知选项
- [ ] 保存设置

### 构建机器配置

- [ ] 访问项目设置：https://vercel.com/dashboard/junpen/sora-2-ai/settings/build-and-deployment
- [ ] 找到 Build Machine 部分
- [ ] 选择 Standard（标准性能）
- [ ] 禁用 On-Demand Concurrent Builds
- [ ] 保存设置

---

## 🎯 设置后的预期效果

### 支出管理
- ✅ 当月使用达到 $15 时收到邮件提醒
- ✅ 当月使用达到 $25 时收到紧急提醒
- ✅ 每天收到使用情况摘要（如果启用）
- ✅ 避免意外高额账单

### 构建机器配置
- ✅ 使用 Standard 构建机器，完全免费
- ✅ 不启用 On-Demand，避免额外费用
- ✅ 构建时间包含在 $20 额度内
- ✅ 节省成本

---

## 💡 重要提示

### 支出管理
- ⚠️ **必须设置**：避免意外高额账单
- 📧 **检查邮箱**：确保通知邮箱正确
- 🔔 **及时响应**：收到警告后及时优化

### 构建机器配置
- ✅ **使用 Standard**：完全免费
- ❌ **禁用 On-Demand**：避免额外费用
- ⚡ **使用 Turbopack**：加速构建，减少构建时间

---

## 🔗 快速访问链接

### 支出管理
- 通过导航：Dashboard → 头像 → Settings → Billing → Spend Management
- 或尝试：https://vercel.com/dashboard/settings/billing/spend-management

### 构建机器配置
- 直接访问：https://vercel.com/dashboard/junpen/sora-2-ai/settings/build-and-deployment

---

## 📞 如果遇到问题

### 支出管理无法访问
1. 确保已选择正确的团队（`junpen`）
2. 尝试通过导航菜单访问
3. 如果仍然无法访问，联系 Vercel 支持

### 构建机器配置无法访问
1. 确认项目名称正确（`sora-2-ai`）
2. 确认你有项目访问权限
3. 尝试通过项目概览页面访问 Settings

---

**现在按照上面的步骤设置这两个功能吧！**

