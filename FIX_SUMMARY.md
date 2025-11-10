# 修复总结

## ✅ 已修复的问题

### 1. icon.svg 500 错误
- **问题**: 路由文件导致 500 错误
- **修复**: 删除了 `app/icon.svg/route.ts`，现在使用 `public/icon.svg` 静态文件
- **状态**: ✅ 已修复

### 2. 视频轮询 API 端点错误
- **问题**: 使用了 `/v1/draw/result`（图片端点）而不是 `/v1/video/result`（视频端点）
- **修复**: 更新了 `lib/grsai/client.ts` 中的 `getTaskResult` 函数
- **状态**: ✅ 已修复

### 3. 轮询使用错误的任务ID
- **问题**: 前端使用内部任务ID（UUID），但API需要Grsai任务ID
- **修复**: API现在可以接受两种ID，自动识别并转换
- **状态**: ✅ 已修复

### 4. 任务失败时积分未返还
- **问题**: 任务失败或找不到时，积分没有自动返还
- **修复**: 添加了自动积分返还逻辑
- **状态**: ✅ 已修复

## 🔄 需要重启开发服务器

由于修改了核心文件，需要重启开发服务器：

```bash
# 停止当前服务器（如果还在运行）
npm run kill

# 重新启动
npm run dev
```

或者：

```bash
# 直接重启
npm run dev:kill
```

## 🧪 测试步骤

1. **重启开发服务器**
   ```bash
   npm run dev
   ```

2. **刷新浏览器页面**
   - 清除缓存（Cmd+Shift+R 或 Ctrl+Shift+R）
   - 检查 icon.svg 是否正常加载（不再有 500 错误）

3. **测试视频生成**
   - 访问 `/video` 页面
   - 填写提示词
   - 点击生成
   - 应该能看到进度更新

4. **检查积分**
   - 如果之前的任务失败，积分应该已自动返还
   - 刷新页面查看积分余额

## 📝 关键修改

### lib/grsai/client.ts
```typescript
// 修复前
const response = await fetch(`${GRSAI_HOST}/v1/draw/result`, {

// 修复后
const response = await fetch(`${GRSAI_HOST}/v1/video/result`, {
```

### app/api/video/result/[id]/route.ts
- 添加了 UUID 检测逻辑
- 自动查找 grsai_task_id
- 添加了自动积分返还

### app/icon.svg/route.ts
- 已删除，使用静态文件

## ⚠️ 如果仍然有问题

1. **检查环境变量**
   ```bash
   # 确保 .env.local 文件存在且包含：
   GRSAI_API_KEY=你的API密钥
   GRSAI_HOST=https://grsai.dakka.com.cn
   ```

2. **查看浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 和 Network 标签
   - 查看是否有错误信息

3. **查看服务器日志**
   - 检查终端中的错误信息
   - 查看 API 调用是否成功

4. **对比官网调用**
   - 如果官网能生成，对比参数格式
   - 检查是否有其他差异

## 🎯 预期结果

修复后应该：
- ✅ icon.svg 正常加载（无 500 错误）
- ✅ 视频生成任务能正常创建
- ✅ 轮询能正确获取任务状态和进度
- ✅ 任务失败时自动返还积分
- ✅ 任务成功时显示视频结果

