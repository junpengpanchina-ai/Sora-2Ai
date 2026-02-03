# 模版调试 Console 使用指南

## 概述

模版调试 Console 是一个内置的调试工具，用于实时监控和排查模版推荐 API 的调用情况。当遇到"涉及模版都有问题"时，可以使用此工具快速定位问题。

## 如何启用

在视频生成页面（`/video`）的 URL 后添加查询参数 `template_debug=1`：

```
https://sora2aivideos.com/video?template_debug=1
```

或者本地开发环境：

```
http://localhost:3000/video?template_debug=1
```

## 功能说明

### 1. 自动记录

每次点击 **"Load a best template"** 按钮时，Console 会自动记录：
- 请求时间戳
- 请求的 role（ads/social/long_form/default）
- locale（当前固定为 en）
- HTTP 状态码
- 请求是否成功
- 错误信息（如果有）

### 2. 批量测试

点击 **"Test 推荐 API (all roles)"** 按钮，会自动测试所有 4 个 role：
- `default`
- `long_form`
- `ads`
- `social`

测试结果会按顺序显示在 Console 中。

### 3. 日志查看

- Console 显示最近 20 条记录
- 成功请求显示为绿色，失败请求显示为红色
- 每条记录包含完整的时间戳和错误信息

### 4. 清除日志

点击 **"Clear"** 按钮可以清空当前日志记录。

## 常见问题排查

### 问题：404 Not Found

**现象：**
```
GET recommend?role=long_form → 404
No recommended templates found
```

**原因：**
数据库中不存在满足以下条件的模版：
- `owner_scope = 'global'`
- `status = 'active'`
- `is_published = true`
- `ltv_gate_color = 'GREEN'`（如果没有 GREEN，会回退到 YELLOW）
- `role = 'long_form'`（或对应的 role）
- `locale = 'en'`（或对应的 locale）

**解决方案：**
1. 检查数据库 `prompt_templates` 表是否有符合条件的记录
2. 检查 `v_prompt_templates_admin_list` 视图是否正确
3. 确认模版的 `gate_status` 是否为 GREEN 或 YELLOW
4. 确认模版已发布（`is_published = true`）

### 问题：500 Internal Server Error

**现象：**
```
GET recommend?role=default → 500
Failed to recommend template
```

**原因：**
- 数据库查询出错
- 视图 `v_prompt_templates_admin_list` 不存在或有问题
- 数据库连接问题

**解决方案：**
1. 检查服务器日志
2. 验证数据库迁移是否完整执行
3. 检查 Supabase 连接配置

### 问题：Network Error

**现象：**
```
GET recommend?role=ads → 0
Network or parse error
```

**原因：**
- 网络连接问题
- API 路由不存在
- CORS 问题

**解决方案：**
1. 检查网络连接
2. 确认 `/api/prompt-templates/recommend` 路由存在
3. 检查浏览器控制台的网络请求详情

## 日志格式说明

每条日志记录包含以下信息：

```
[时间] GET recommend?role=[role] → [状态码] [错误信息]
```

**示例：**

```
14:23:45.123 GET recommend?role=default → 200
14:23:46.456 GET recommend?role=long_form → 404 No recommended templates found
14:23:47.789 GET recommend?role=ads → 500 Failed to recommend template
```

## 技术实现

### 状态管理

- `templateConsoleLog`: 存储日志记录的数组
- `showTemplateConsole`: 控制 Console 面板的展开/收起
- `showTemplateDebug`: 根据 URL 参数决定是否显示调试面板

### API 调用

所有推荐 API 调用都会通过 `applyRecommendedTemplate()` 函数，该函数会：
1. 发送请求到 `/api/prompt-templates/recommend`
2. 记录请求和响应到 `templateConsoleLog`
3. 更新 UI 状态

### 批量测试

`testAllRecommendRoles()` 函数会：
1. 遍历所有 role（default, long_form, ads, social）
2. 依次调用推荐 API
3. 记录每条请求的结果

## 相关文件

- `/app/video/VideoPageClient.tsx` - 前端实现
- `/app/api/prompt-templates/recommend/route.ts` - API 路由
- `/supabase/migrations/118_prompt_templates_analytics_and_generation.sql` - 数据库视图定义

## 注意事项

1. 调试面板仅在添加 `?template_debug=1` 参数时显示，不会影响正常用户
2. 日志记录最多保留 20 条，超出部分会被自动移除
3. 刷新页面会清空日志记录
4. 建议在生产环境排查问题时使用，排查完成后移除参数

## 下一步

如果发现模版数据缺失：
1. 检查 Admin 后台的模版管理页面
2. 确认模版的 gate_status 和发布状态
3. 必要时创建新的模版或更新现有模版的状态
