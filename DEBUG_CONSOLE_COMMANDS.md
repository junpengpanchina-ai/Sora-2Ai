# 控制台调试命令

## 🚀 快速一键诊断（推荐）

**复制以下命令到浏览器控制台，一键完成所有诊断：**

```javascript
(async()=>{const c=document.cookie.split(';').reduce((a,c)=>{const[k,v]=c.trim().split('=');a[k]=v;return a},{});const h=!!c['admin_session_token'];console.log('🔍 快速诊断结果:');console.log('1. Cookie:',h?'✅存在':'❌不存在');try{const r=await fetch('/api/auth/admin-refresh-session',{method:'POST'});const d=await r.json().catch(()=>({raw:await r.text()}));console.log('2. 会话刷新:',r.ok?'✅成功':'❌失败',{status:r.status,data:d});if(!r.ok)console.error('   错误详情:',d);}catch(e){console.error('2. 会话刷新:❌请求失败',e.message);}try{const t=await fetch(window.location.origin,{method:'HEAD'});console.log('3. 网络连接:',t.ok?'✅正常':'⚠️异常',t.status);}catch(e){console.error('3. 网络连接:❌失败',e.message);}console.log('4. 浏览器:',{online:navigator.onLine,cookieEnabled:navigator.cookieEnabled});const tid=localStorage.getItem('lastBatchTaskId');if(tid){console.log('5. 最近任务ID:',tid);try{const tr=await fetch(`/api/admin/batch-generation/status/${tid}`);const td=await tr.json();console.log('   任务状态:',td.status||'未知',td);}catch(e){console.warn('   获取任务状态失败:',e.message);}}else{console.log('5. 最近任务ID:无');}console.log('✅诊断完成');})();
```

## 快速诊断命令

在浏览器控制台中运行以下命令来诊断问题：

### 1. 快速检查会话刷新端点

```javascript
// 测试会话刷新端点
fetch('/api/auth/admin-refresh-session', { method: 'POST' })
  .then(async (r) => {
    const data = await r.json().catch(() => ({ raw: await r.text() }));
    console.log('状态:', r.status, r.statusText);
    console.log('响应:', data);
    return { status: r.status, data };
  })
  .catch(err => {
    console.error('请求失败:', err);
    return { error: err.message };
  });
```

### 2. 检查 Cookie

```javascript
// 检查管理员会话 Cookie
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=');
  acc[key] = value;
  return acc;
}, {});
console.log('admin_session_token:', cookies['admin_session_token'] ? '存在' : '不存在');
if (cookies['admin_session_token']) {
  const token = cookies['admin_session_token'];
  console.log('Token 长度:', token.length);
  console.log('Token 预览:', token.substring(0, 20) + '...');
}
```

### 3. 检查网络连接

```javascript
// 测试网络连接
Promise.all([
  fetch('/api/health').catch(() => ({ status: 'failed' })),
  fetch(window.location.origin, { method: 'HEAD' }).catch(() => ({ status: 'failed' }))
]).then(results => {
  console.log('网络测试结果:', results);
});
```

### 4. 检查批量生成任务状态

```javascript
// 检查最近的批量生成任务
const taskId = localStorage.getItem('lastBatchTaskId');
if (taskId) {
  console.log('最近的任务 ID:', taskId);
  fetch(`/api/admin/batch-generation/status/${taskId}`)
    .then(r => r.json())
    .then(data => {
      console.log('任务状态:', data);
    })
    .catch(err => console.error('获取任务状态失败:', err));
} else {
  console.log('没有找到最近的任务 ID');
}
```

### 5. 完整诊断脚本

运行完整的诊断脚本（从 `scripts/debug-admin-session.js` 文件）：

```javascript
// 复制 scripts/debug-admin-session.js 的全部内容到控制台执行
```

或者直接运行：

```javascript
(async function() {
  console.log('🔍 开始诊断...');
  
  // 1. 检查 Cookie
  const cookies = document.cookie.split(';').reduce((acc, c) => {
    const [k, v] = c.trim().split('=');
    acc[k] = v;
    return acc;
  }, {});
  const hasToken = !!cookies['admin_session_token'];
  console.log('1. Cookie:', hasToken ? '✅ 存在' : '❌ 不存在');
  
  // 2. 测试会话刷新
  try {
    const res = await fetch('/api/auth/admin-refresh-session', { method: 'POST' });
    const data = await res.json().catch(() => ({ raw: await res.text() }));
    console.log('2. 会话刷新:', res.ok ? '✅ 成功' : '❌ 失败', {
      status: res.status,
      data
    });
  } catch (err) {
    console.error('2. 会话刷新:', '❌ 请求失败', err.message);
  }
  
  // 3. 检查网络
  try {
    const test = await fetch(window.location.origin, { method: 'HEAD' });
    console.log('3. 网络连接:', test.ok ? '✅ 正常' : '⚠️ 异常', test.status);
  } catch (err) {
    console.error('3. 网络连接:', '❌ 失败', err.message);
  }
  
  console.log('✅ 诊断完成');
})();
```

### 6. 清除会话并重新登录

```javascript
// 清除 Cookie 并刷新页面
document.cookie = "admin_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
console.log('Cookie 已清除，3秒后刷新页面...');
setTimeout(() => window.location.reload(), 3000);
```

### 7. 监控会话刷新请求

```javascript
// 拦截并监控所有会话刷新请求
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0]?.includes('admin-refresh-session')) {
    console.log('🔄 会话刷新请求:', args);
    return originalFetch.apply(this, args)
      .then(res => {
        console.log('📥 会话刷新响应:', res.status, res.statusText);
        return res;
      })
      .catch(err => {
        console.error('❌ 会话刷新失败:', err);
        throw err;
      });
  }
  return originalFetch.apply(this, args);
};
console.log('✅ 已启用会话刷新监控');
```

### 8. 检查服务器日志

如果可能，检查服务器日志中的以下信息：

- `[admin-refresh-session] 延长会话失败:` - RPC 函数调用失败
- `[admin-refresh-session] 异常:` - 未捕获的异常
- `[admin-auth] validateAdminSession 异常:` - 会话验证失败

### 9. 常见问题排查

#### 问题 1: 500 错误 - 会话已过期

**症状**: 返回 500 错误，错误信息包含 "SESSION_EXPIRED"

**解决方案**:
```javascript
// 重新登录
window.location.href = '/admin/login';
```

#### 问题 2: 500 错误 - 数据库 RPC 函数失败

**症状**: 返回 500 错误，错误信息包含数据库相关错误

**可能原因**:
- RPC 函数 `admin_extend_session` 不存在
- 数据库连接问题
- 权限问题

**检查命令**:
```javascript
// 检查是否有其他端点可用
fetch('/api/auth/admin-login', { method: 'GET' })
  .then(r => console.log('登录端点状态:', r.status))
  .catch(err => console.error('登录端点不可用:', err));
```

#### 问题 3: 网络错误 (ERR_NETWORK_CHANGED)

**症状**: `Failed to fetch` 或 `ERR_NETWORK_CHANGED`

**解决方案**:
1. 检查网络连接
2. 检查是否有代理或防火墙阻止
3. 尝试刷新页面

```javascript
// 检查网络状态
console.log('在线状态:', navigator.onLine);
console.log('Cookie 启用:', navigator.cookieEnabled);
```

### 10. 批量生成失败诊断

```javascript
// 检查批量生成相关的错误
const errors = [];
const originalError = console.error;
console.error = function(...args) {
  if (args[0]?.includes('轮询') || args[0]?.includes('批量') || args[0]?.includes('生成')) {
    errors.push(args);
  }
  originalError.apply(console, args);
};

// 5秒后显示收集到的错误
setTimeout(() => {
  console.log('📊 收集到的批量生成相关错误:', errors);
}, 5000);
```

## 使用完整诊断脚本

最全面的诊断方法是使用 `scripts/debug-admin-session.js` 文件：

1. 打开浏览器控制台 (F12)
2. 复制 `scripts/debug-admin-session.js` 的全部内容
3. 粘贴到控制台并回车
4. 查看详细的诊断报告

脚本会检查：
- ✅ Cookie 状态
- ✅ 网络连接
- ✅ 会话刷新端点
- ✅ 浏览器环境
- ✅ 扩展程序干扰
- ✅ 存储状态

并生成详细的诊断报告和修复建议。

