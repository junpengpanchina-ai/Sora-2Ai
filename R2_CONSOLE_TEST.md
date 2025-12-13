# R2 配置 Console 测试工具

## 🚀 快速使用

### 方法1：在浏览器Console中测试（推荐）

1. **打开开发者工具**
   - 按 `F12` 或 `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - 或右键页面 → 选择"检查"

2. **进入Console标签**

3. **复制并运行以下代码**：

```javascript
(async function testR2ConfigInBrowser() {
  console.log('🔍 开始测试 R2 配置...\n');
  
  // 测试图片列表API
  console.log('1️⃣ 测试图片列表 API...');
  try {
    const imageResponse = await fetch('/api/admin/r2/list?type=image&maxKeys=10');
    const imageData = await imageResponse.json();
    
    console.log('  HTTP 状态码:', imageResponse.status);
    console.log('  响应数据:', imageData);
    
    if (imageResponse.ok && imageData.success) {
      console.log('  ✅ 图片列表API工作正常');
      console.log('  文件数量:', imageData.files?.length || 0);
    } else {
      console.error('  ❌ 图片列表API失败');
      console.error('  错误信息:', imageData.error || '未知错误');
      console.error('  详细信息:', imageData.details || '无');
      
      // 错误分析
      if (imageData.details) {
        const details = imageData.details;
        if (details.includes('length') && details.includes('32')) {
          console.error('\n  🔍 错误分析:');
          console.error('    - Secret Access Key 长度错误');
          console.error('    - AWS SDK 期望 32 字符');
          console.error('    - 当前可能是 64 字符十六进制');
          console.log('\n  💡 解决方案:');
          console.log('    1. 检查 Vercel 环境变量是否正确');
          console.log('    2. 确认已重新部署最新代码');
          console.log('    3. 查看 Vercel Function Logs');
        }
      }
    }
  } catch (error) {
    console.error('  ❌ 请求失败:', error);
  }
  
  // 测试视频列表API
  console.log('\n2️⃣ 测试视频列表 API...');
  try {
    const videoResponse = await fetch('/api/admin/r2/list?type=video&maxKeys=10');
    const videoData = await videoResponse.json();
    
    console.log('  HTTP 状态码:', videoResponse.status);
    console.log('  响应数据:', videoData);
    
    if (videoResponse.ok && videoData.success) {
      console.log('  ✅ 视频列表API工作正常');
    } else {
      console.error('  ❌ 视频列表API失败');
      console.error('  错误信息:', videoData.error || '未知错误');
    }
  } catch (error) {
    console.error('  ❌ 请求失败:', error);
  }
})();
```

4. **按 Enter 运行**

### 方法2：使用完整测试脚本

打开项目中的文件：
- `scripts/test-r2-browser-console.js`

复制整个文件内容到浏览器Console运行。

## 📊 测试结果解读

### ✅ 成功的情况

如果看到：
```
✅ 图片列表API工作正常
文件数量: X
```

说明R2配置正确，可以正常访问。

### ❌ 失败的情况

#### 1. 密钥长度错误

```
错误: Credential access key has length 64, should be 32
```

**分析**：
- Secret Access Key 是 64 字符十六进制
- AWS SDK 期望 32 字符
- 代码应该自动转换，但可能没有生效

**解决方案**：
1. 确认代码已部署最新版本
2. 查看 Vercel Function Logs
3. 如果仍然失败，可能需要使用不同的密钥格式

#### 2. 配置未找到

```
错误: R2客户端未配置
```

**分析**：
- 环境变量未设置或为空

**解决方案**：
1. 检查 Vercel 环境变量
2. 确保所有变量都已配置
3. 重新部署项目

#### 3. 凭证无效

```
错误: InvalidAccessKeyId 或 SignatureDoesNotMatch
```

**分析**：
- Access Key ID 或 Secret Access Key 不正确
- 密钥不匹配

**解决方案**：
1. 重新创建 Cloudflare R2 API Token
2. 确保正确复制密钥
3. 更新 Vercel 环境变量

## 🔍 查看详细日志

### 在 Vercel 中查看日志

1. 登录 Vercel Dashboard
2. 进入你的项目
3. 点击 **Functions** 标签
4. 找到 `/api/admin/r2/list` 函数
5. 点击查看日志
6. 搜索以下关键词：
   - `[R2]` - 查看转换日志
   - `已将64字符` - 确认转换是否执行
   - `客户端创建成功` - 确认是否成功

## 💡 快速诊断命令

在浏览器Console中运行以下命令来快速诊断：

```javascript
// 测试API端点
fetch('/api/admin/r2/list?type=image&maxKeys=1')
  .then(r => r.json())
  .then(d => console.log('结果:', d))
  .catch(e => console.error('错误:', e));
```

## 🛠️ 常见问题

### Q: 为什么还是64字符错误？

**A**: 可能的原因：
1. 代码还未部署到Vercel
2. 环境变量还未更新
3. 需要清除缓存并重新部署

### Q: 如何确认代码已部署？

**A**: 
1. 查看Vercel Deployment记录
2. 查看Function Logs中是否有 `[R2]` 开头的日志
3. 如果看到转换日志，说明代码已部署

### Q: 转换后还是失败怎么办？

**A**:
1. 查看Vercel日志确认转换是否执行
2. 检查转换后的长度（应该是43字符）
3. 如果Base64失败，代码会自动尝试使用前32字符
4. 如果所有方法都失败，可能需要联系Cloudflare支持

## 📝 注意事项

- 测试需要在已登录管理员后台的情况下进行
- 确保网络连接正常
- 如果看到 CORS 错误，检查API路由配置

