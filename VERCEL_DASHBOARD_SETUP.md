# Vercel Dashboard 设置步骤（截图指南）

## 🎯 目标

1. ✅ 设置支出管理预算警告
2. ✅ 查看使用情况
3. ✅ 配置构建机器

---

## 💰 第一步：设置支出管理

### 访问路径

1. 打开浏览器，访问：https://vercel.com/dashboard
2. 点击右上角你的**头像**
3. 在下拉菜单中选择 **Settings**
4. 在左侧菜单中找到 **Billing**
5. 点击 **Spend Management** 标签

### 设置步骤

#### 1. 启用支出管理
- 找到 "Spend Management" 开关
- 确保开关是**开启**状态（绿色）

#### 2. 设置预算警告
在 "Budget Alerts" 部分：

- **Warning Threshold（警告阈值）**：
  - 输入：`15`
  - 单位：USD
  - 说明：当月使用达到 $15 时发送邮件提醒

- **Limit Threshold（限制阈值）**：
  - 输入：`25`
  - 单位：USD
  - 说明：当月使用达到 $25 时发送紧急提醒

#### 3. 设置通知
在 "Notifications" 部分：

- ✅ **Daily Summary（每日摘要）**：启用
- ✅ **Budget Warning（预算警告）**：启用
- ✅ **Over Budget（超出预算）**：启用

#### 4. 设置通知邮箱
- 在 "Email Notifications" 中输入你的邮箱
- 确保邮箱地址正确

#### 5. 保存设置
- 点击页面底部的 **Save** 按钮
- 等待确认消息

---

## 📊 第二步：查看使用情况

### 访问路径

1. Vercel Dashboard → **Settings** → **Billing**
2. 点击 **Usage** 标签

### 查看的内容

#### 概览卡片
- **Current Period Usage（当前周期使用）**：
  - 显示本月已使用的金额
  - 显示剩余额度
  - 显示使用百分比

#### 使用情况图表
- **Build Minutes（构建时间）**：
  - 查看本月使用的构建时间
  - 查看每个项目的构建时间
  - 查看构建机器类型使用情况

- **Bandwidth（带宽）**：
  - 查看数据传输量（GB）
  - 查看 CDN 使用情况
  - 查看 API 请求量

- **Function Invocations（函数调用）**：
  - 查看 Serverless Functions 调用次数
  - 查看每个函数的调用情况

- **Storage（存储）**：
  - 查看 Edge Config 使用情况
  - 查看 Blob Storage 使用情况

#### 按项目查看
1. 滚动到 "Usage by Project" 部分
2. 点击项目名称查看详细使用情况
3. 识别哪个项目消耗最多资源

#### 导出数据
1. 点击页面右上角的 **Export** 按钮
2. 选择导出格式（CSV 或 JSON）
3. 选择时间范围
4. 点击 **Download** 下载

---

## 🔧 第三步：配置构建机器

### 访问路径

1. Vercel Dashboard → 选择你的项目
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Build & Deployment**
4. 滚动到 **Build Machine** 部分

### 配置建议

#### 构建机器类型
- **选择**：Standard（标准性能）
- **原因**：完全免费，包含在 $20 额度内
- **性能**：4 vCPUs, 8 GB 内存

#### On-Demand Concurrent Builds
- **选择**：Disabled（禁用）
- **原因**：如果启用，Standard 机器会按 $0.014/分钟收费
- **说明**：禁用后，Standard 构建完全免费

#### 保存设置
- 点击页面底部的 **Save** 按钮

---

## 📈 第四步：查看 Analytics

### 访问路径

1. Vercel Dashboard → 选择你的项目
2. 点击 **Analytics** 标签

### 查看的内容

#### Web Analytics
- **页面浏览量**：查看页面访问量
- **独立访客**：查看独立用户数
- **跳出率**：查看用户跳出率
- **平均会话时长**：查看用户停留时间

#### Speed Insights
- **Core Web Vitals**：查看页面性能指标
- **LCP（最大内容绘制）**：查看加载速度
- **FID（首次输入延迟）**：查看交互响应速度
- **CLS（累积布局偏移）**：查看视觉稳定性

---

## ✅ 完成检查清单

### 支出管理
- [ ] 访问 Settings → Billing → Spend Management
- [ ] 启用支出管理开关
- [ ] 设置预算警告：$15
- [ ] 设置预算限制：$25
- [ ] 设置通知邮箱
- [ ] 启用所有通知选项
- [ ] 保存设置

### 使用情况
- [ ] 访问 Settings → Billing → Usage
- [ ] 查看本月总使用量
- [ ] 查看剩余额度
- [ ] 查看构建时间使用情况
- [ ] 查看带宽使用情况
- [ ] 按项目查看详细使用情况

### 构建机器
- [ ] 访问 Project → Settings → Build & Deployment
- [ ] 选择 Standard 构建机器
- [ ] 禁用 On-Demand Concurrent Builds
- [ ] 保存设置

### Analytics
- [ ] 访问 Project → Analytics
- [ ] 查看 Web Analytics 数据
- [ ] 查看 Speed Insights 数据

---

## 🔗 快速链接

### 直接访问链接

- **支出管理**：https://vercel.com/dashboard/billing/spend-management
- **使用情况**：https://vercel.com/dashboard/billing/usage
- **构建机器配置**：https://vercel.com/dashboard/[你的项目名]/settings/build-and-deployment
- **Analytics**：https://vercel.com/dashboard/[你的项目名]/analytics

**注意**：将 `[你的项目名]` 替换为你的实际项目名称

---

## 💡 重要提示

### 支出管理
- ⚠️ **必须设置**：避免意外高额账单
- 📧 **检查邮箱**：确保通知邮箱正确
- 🔔 **及时响应**：收到警告后及时优化

### 使用情况
- 📅 **定期检查**：建议每周检查一次
- 💰 **保持在预算内**：尽量保持在 $20 额度内
- 🚀 **优化高消耗项目**：识别并优化资源消耗高的项目

### 构建机器
- ✅ **使用 Standard**：完全免费
- ❌ **禁用 On-Demand**：避免额外费用
- ⚡ **使用 Turbopack**：加速构建，减少构建时间

---

## 📞 需要帮助？

如果遇到问题：
1. 查看详细指南：`VERCEL_PRO_SETUP_GUIDE.md`
2. 查看快速指南：`QUICK_VERCEL_PRO_SETUP.md`
3. 查看 Vercel 文档：https://vercel.com/docs
4. 联系 Vercel 支持：Dashboard → Support Center

