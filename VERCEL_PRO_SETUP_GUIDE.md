# Vercel Pro 功能设置指南

## 🚀 第一步：测试 Turbopack

### 测试开发服务器启动速度

```bash
# 使用 Turbopack（更快）
npm run dev:turbo

# 对比：普通模式
npm run dev
```

**预期效果**：
- Turbopack 启动时间：通常 < 3 秒
- 普通模式启动时间：通常 5-10 秒
- 热重载速度：Turbopack 明显更快

### 测试构建速度

```bash
# 使用 Turbopack 构建
npm run build
```

**预期效果**：
- 当前构建时间：7分19秒
- 使用 Turbopack 后：可能缩短到 3-4 分钟
- 提升：约 50% 的速度提升

---

## 💰 第二步：设置支出管理

### 访问支出管理页面

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击右上角头像 → **Settings**
3. 左侧菜单选择 **Billing**
4. 点击 **Spend Management** 标签

### 设置预算警告

1. **启用支出管理**：
   - 找到 "Spend Management" 开关
   - 确保已启用（默认应该已启用）

2. **设置预算警告**：
   - **预算警告阈值**：$15（75% 使用率）
   - **预算限制阈值**：$25（125% 使用率）
   - **通知邮箱**：你的邮箱地址

3. **设置通知频率**：
   - 每日摘要：启用
   - 预算警告：启用
   - 超出预算：启用

### 配置说明

- **预算警告**：当月使用达到 $15 时发送邮件提醒
- **预算限制**：当月使用达到 $25 时发送紧急提醒
- **自动通知**：接近或超出预算时自动发送通知

---

## 📊 第三步：查看使用情况

### 访问使用情况仪表板

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击右上角头像 → **Settings**
3. 左侧菜单选择 **Billing**
4. 点击 **Usage** 标签

### 查看的内容

#### 1. 使用情况概览
- **本月总使用**：显示当前月份的总使用量
- **剩余额度**：显示剩余的 $20 额度
- **使用趋势**：图表显示使用趋势

#### 2. 按资源类型查看

**构建时间（Build Minutes）**：
- 查看本月使用的构建时间
- 查看每个项目的构建时间
- 查看构建机器类型使用情况

**带宽（Bandwidth）**：
- 查看数据传输量
- 查看 CDN 使用情况
- 查看 API 请求量

**函数调用（Function Invocations）**：
- 查看 Serverless Functions 调用次数
- 查看每个函数的调用情况

**存储（Storage）**：
- 查看 Edge Config 使用情况
- 查看 Blob Storage 使用情况

#### 3. 按项目查看

- 点击项目名称查看详细使用情况
- 查看每个项目的资源消耗
- 识别高消耗项目

### 导出使用数据

1. 在使用情况页面，点击 **Export**
2. 选择导出格式（CSV 或 JSON）
3. 选择时间范围
4. 下载使用数据

---

## 🔧 第四步：优化配置

### 1. 构建机器配置

**访问**：Vercel Dashboard → Project → Settings → Build & Deployment

**建议配置**：
- **构建机器**：Standard（不启用 On-Demand Concurrent Builds）
- **原因**：完全免费，包含在 $20 额度内
- **如果构建时间很长**：考虑使用 Enhanced（$0.030/分钟）

### 2. 部署保护

**访问**：Vercel Dashboard → Project → Settings → Deployment Protection

**可选配置**：
- **密码保护**：保护预览部署
- **IP 白名单**：限制访问 IP
- **Vercel Authentication**：需要登录才能访问

### 3. 环境变量

**访问**：Vercel Dashboard → Project → Settings → Environment Variables

**检查**：
- 确保所有必需的环境变量已设置
- 区分 Production、Preview、Development 环境
- 使用敏感环境变量保护敏感信息

---

## 📈 第五步：监控和优化

### 定期检查（建议每周一次）

1. **查看使用情况**：
   - 访问 Billing → Usage
   - 检查各项资源使用情况
   - 识别异常使用

2. **检查构建时间**：
   - 查看最近的构建时间
   - 对比是否有所改善
   - 如果使用 Turbopack，应该看到明显提升

3. **优化建议**：
   - 如果构建时间仍然很长，考虑优化构建配置
   - 如果带宽使用很高，考虑启用 CDN 缓存
   - 如果函数调用很多，考虑优化函数逻辑

### 优化策略

#### 构建优化
- ✅ 使用 Turbopack（已配置）
- ✅ 优化依赖项
- ✅ 使用构建缓存
- ✅ 减少不必要的构建步骤

#### 成本优化
- ✅ 使用 Standard 构建机器（免费）
- ✅ 监控使用情况
- ✅ 设置预算警告
- ✅ 优化代码减少资源使用

---

## ✅ 检查清单

### 已完成 ✅
- [x] 启用 Turbopack（已配置）
- [x] 创建设置指南
- [x] 添加 dev:turbo 脚本

### 需要手动设置
- [ ] 在 Vercel Dashboard 设置支出管理
- [ ] 查看使用情况仪表板
- [ ] 设置预算警告（$15 和 $25）
- [ ] 测试 Turbopack 开发服务器
- [ ] 测试 Turbopack 构建速度

---

## 🔗 快速链接

- [Vercel Dashboard](https://vercel.com/dashboard)
- [支出管理设置](https://vercel.com/dashboard/billing/spend-management)
- [使用情况仪表板](https://vercel.com/dashboard/billing/usage)
- [构建机器配置](https://vercel.com/dashboard/[project]/settings/build-and-deployment)
- [Vercel Pro 计划详情](https://vercel.com/pricing)

---

## 💡 提示

1. **Turbopack 优势**：
   - 开发服务器启动更快
   - 热重载更快速
   - 构建时间缩短 50%+

2. **支出管理重要性**：
   - 避免意外高额账单
   - 及时了解使用情况
   - 优化资源使用

3. **定期监控**：
   - 建议每周检查一次使用情况
   - 如果接近限制，及时优化
   - 保持使用在预算范围内

