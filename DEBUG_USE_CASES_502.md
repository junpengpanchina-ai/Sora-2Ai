# 21万场景词不显示/乱码问题诊断指南

## 问题描述
- 21万场景词不显示
- 控制台显示 502 Bad Gateway 错误
- 可能存在乱码问题

## 快速诊断

### 1. 使用控制台调试脚本

打开浏览器控制台（F12），复制并运行 `CONSOLE_USE_CASES_502_DEBUG.js` 文件中的全部内容。

这个脚本会自动：
- ✅ 检查页面编码设置
- ✅ 测试 `/api/use-cases` API 端点
- ✅ 检测响应编码和乱码问题
- ✅ 监控网络请求
- ✅ 检查页面状态

### 2. 手动测试

在控制台中运行：

```javascript
// 测试基础查询
testUseCasesAPI({ page: 1, limit: 24 })

// 测试多个场景
testUseCasesScenarios()

// 检查页面状态
checkUseCasesPage()

// 查看请求历史
getUseCasesRequests()
```

## 常见问题诊断

### 问题1: 502 Bad Gateway 错误

**原因：**
- 查询超时（20秒限制）
- 21万条数据查询太慢
- 数据库连接问题

**解决方案：**
1. 检查数据库索引是否优化
2. 减少查询数据量（使用 limit 和 offset）
3. 添加更多过滤条件（type, industry）
4. 考虑分页加载策略

### 问题2: 乱码问题

**原因：**
- API 响应头缺少 `charset=utf-8`
- 数据库字符集设置不正确
- 前端解析编码问题

**已修复：**
- ✅ API 路由现在明确设置 `Content-Type: application/json; charset=utf-8`
- ✅ 所有错误响应也包含正确的编码头

**检查方法：**
运行调试脚本，查看：
- Content-Type 是否包含 `charset=utf-8`
- 响应数据中的中文是否正常显示
- 是否有乱码字符

### 问题3: 数据不显示

**可能原因：**
1. API 返回空数组
2. 前端渲染逻辑问题
3. 数据过滤条件太严格

**诊断步骤：**
```javascript
// 1. 检查 API 返回
testUseCasesAPI({ page: 1, limit: 10 })

// 2. 检查页面元素
checkUseCasesPage()

// 3. 查看网络请求
getUseCasesRequests()
```

## 性能优化建议

对于 21 万条数据：

1. **数据库优化**
   - 确保 `use_cases` 表有适当的索引
   - 索引字段：`is_published`, `quality_status`, `use_case_type`, `industry`, `created_at`

2. **查询优化**
   - 使用分页（limit + offset）
   - 添加过滤条件减少查询范围
   - 考虑使用游标分页而不是偏移分页

3. **缓存策略**
   - 对总数（count）进行缓存
   - 对常用查询结果进行缓存

## 修复内容

### API 路由修复 (`app/api/use-cases/route.ts`)
- ✅ 所有成功响应添加 `Content-Type: application/json; charset=utf-8`
- ✅ 所有错误响应（502, 500）也添加正确的编码头

### 调试工具
- ✅ 创建了 `CONSOLE_USE_CASES_502_DEBUG.js` 诊断脚本
- ✅ 自动检测编码问题
- ✅ 自动检测 502 错误原因
- ✅ 提供详细的诊断信息

## 下一步

1. 运行调试脚本查看具体错误
2. 根据错误信息采取相应措施
3. 如果查询超时，考虑优化数据库查询或增加超时时间
4. 如果乱码，检查数据库字符集设置
