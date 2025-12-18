# 管理员后台点击无反应 - 排查指南

## ✅ 已验证正常的部分

1. **环境变量配置** ✓
   - `NEXT_PUBLIC_SUPABASE_URL` 已设置
   - `SUPABASE_SERVICE_ROLE_KEY` 已设置（格式正确）
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已设置

2. **数据库连接** ✓
   - 数据库连接正常
   - `use_cases` 表存在且结构正确

## 🔍 排查步骤

### 步骤 1: 检查浏览器控制台

1. 打开管理员后台页面
2. 按 `F12` 打开开发者工具
3. 切换到 **Console** 标签页
4. 点击"使用场景"菜单
5. 查看是否有：
   - ✅ 看到 `切换标签页: use-cases` 日志 → 点击事件正常
   - ❌ 看到红色错误信息 → 记录错误内容

### 步骤 2: 检查网络请求

1. 在开发者工具中切换到 **Network** 标签页
2. 点击"使用场景"菜单
3. 查找 `/api/admin/use-cases` 请求
4. 检查请求状态：
   - **200** = 成功
   - **401** = 未登录，需要重新登录
   - **500** = 服务器错误，查看响应内容

### 步骤 3: 检查 React 组件渲染

在浏览器控制台运行：

```javascript
// 检查当前 activeTab 状态
// 打开 React DevTools，查看 AdminClient 组件的 activeTab 值
```

### 步骤 4: 手动测试 API

在浏览器控制台运行：

```javascript
// 测试使用场景 API
fetch('/api/admin/use-cases')
  .then(r => r.json())
  .then(data => {
    console.log('API 响应:', data)
    if (data.error) {
      console.error('❌ API 错误:', data.error)
    } else {
      console.log('✅ API 正常，找到', data.useCases?.length || 0, '条记录')
    }
  })
  .catch(err => console.error('❌ 请求失败:', err))
```

### 步骤 5: 检查服务器是否运行

```bash
# 检查 Next.js 开发服务器是否运行
curl http://localhost:3000/api/debug/test-db-connection

# 如果返回 JSON，说明服务器正常
# 如果连接失败，需要启动服务器：
npm run dev
```

## 🐛 常见问题及解决方案

### 问题 1: 点击菜单没有反应

**可能原因：**
- JavaScript 错误阻止了事件处理
- React 状态更新失败
- 组件未正确渲染

**解决方案：**
1. 检查浏览器控制台是否有错误
2. 尝试刷新页面（`Cmd+R` 或 `Ctrl+R`）
3. 清除浏览器缓存后重试

### 问题 2: API 返回 401 错误

**原因：** 登录会话已过期

**解决方案：**
1. 访问 `/admin/login` 重新登录
2. 登录后重试

### 问题 3: API 返回 500 错误

**原因：** 服务器端错误

**解决方案：**
1. 查看服务器日志（终端输出）
2. 检查 `.env.local` 中的环境变量
3. 运行诊断脚本：`node scripts/test-use-cases-table.js`

### 问题 4: 页面显示空白

**原因：** 组件渲染错误

**解决方案：**
1. 检查浏览器控制台的错误信息
2. 尝试访问诊断页面：`/admin/debug`
3. 检查是否有 JavaScript 语法错误

## 🛠️ 快速修复命令

```bash
# 1. 重启开发服务器
# 按 Ctrl+C 停止服务器，然后：
npm run dev

# 2. 检查数据库连接
node scripts/test-use-cases-table.js

# 3. 检查构建是否有错误
npm run build

# 4. 清除 Next.js 缓存
rm -rf .next
npm run dev
```

## 📞 需要更多帮助？

如果以上步骤都无法解决问题，请提供：

1. **浏览器控制台的完整错误信息**（截图或复制文本）
2. **Network 标签页中的 API 请求详情**（状态码、响应内容）
3. **服务器终端的错误日志**（如果有）

这些信息可以帮助快速定位问题。
