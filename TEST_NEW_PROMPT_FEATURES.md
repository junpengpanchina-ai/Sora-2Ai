# 测试新 Prompt 功能指南

## 🎯 测试目标

验证新的 `prompt_templates` 架构是否正常工作：
- ✅ 场景关联功能
- ✅ 角色选择（default/fast/high_quality等）
- ✅ 模型支持（sora/veo/gemini/universal）
- ✅ 版本管理
- ✅ SEO 控制（is_indexable, is_in_sitemap）

---

## 📋 测试步骤

### 1. 访问 Admin 界面

1. 访问 `/admin/login`
2. 登录管理员账号
3. 导航到 `/admin/prompts`

### 2. 创建新 Prompt

1. **填写基本信息**：
   - 标题：例如 "Professional Product Video"
   - 描述：简短描述
   - Prompt 正文：完整的提示词内容
   - 分类：选择 category
   - 标签：输入 tags（逗号分隔）

2. **填写新字段**（Scene/Prompt 关系部分）：
   - **关联场景 ID**：输入一个 use_case 的 UUID（可选）
   - **用途角色**：选择 `default` / `fast` / `high_quality` 等
   - **模型支持**：选择 `sora` / `veo` / `gemini` / `universal`
   - **版本号**：输入版本号（默认 1）
   - **是否可索引**：默认 false（Prompt 是内部资产）
   - **是否进 sitemap**：默认 false

3. **点击"创建提示词"**

4. **验证结果**：
   - ✅ 应该看到成功提示
   - ✅ 新 prompt 出现在列表中
   - ✅ 新字段值正确保存

### 3. 编辑 Prompt

1. 在列表中找到刚才创建的 prompt
2. 点击"编辑"
3. 修改新字段（例如：更改 role 或 model）
4. 点击"保存"
5. **验证结果**：
   - ✅ 应该看到更新成功提示
   - ✅ 字段值已更新

### 4. 查看 Prompt 列表

验证列表显示是否正常：
- ✅ Prompt 列表正常加载
- ✅ 筛选功能正常工作
- ✅ 搜索功能正常工作

### 5. 验证 SEO 控制

1. 创建一个 `is_indexable = false` 的 prompt
2. 检查 prompt 页面（如果存在）
3. **验证**：
   - ✅ Prompt 页面应该包含 `robots: noindex, nofollow`
   - ✅ Prompt 页面不在 sitemap 中

---

## 🔍 验证检查点

### 数据库验证

运行以下查询验证数据：

```sql
-- 检查最新创建的 prompt
SELECT 
  id,
  title,
  owner_scope,
  scene_id,
  model_id,
  role,
  version,
  is_indexable,
  is_in_sitemap,
  status,
  is_published
FROM prompt_templates
ORDER BY created_at DESC
LIMIT 5;
```

### API 验证

测试 API 端点：

```bash
# 获取 prompt 列表
curl http://localhost:3000/api/admin/prompts

# 创建新 prompt（带新字段）
curl -X POST http://localhost:3000/api/admin/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Prompt",
    "prompt": "Test content",
    "category": "nature",
    "sceneId": "...",
    "role": "default",
    "model": "sora",
    "version": 1,
    "isIndexable": false,
    "isInSitemap": false
  }'
```

---

## ⚠️ 常见问题

### 问题 1：创建失败

**可能原因**：
- scene_id 不存在或格式错误
- 字段验证失败

**解决方案**：
- 检查 scene_id 是否为有效的 UUID
- 查看浏览器控制台错误信息

### 问题 2：新字段不显示

**可能原因**：
- 代码未更新
- 浏览器缓存

**解决方案**：
- 刷新页面（硬刷新：Cmd+Shift+R）
- 检查是否已部署最新代码

### 问题 3：数据未保存

**可能原因**：
- API 未正确处理新字段
- 数据库约束冲突

**解决方案**：
- 查看 Network 标签页的请求/响应
- 检查数据库日志

---

## ✅ 测试检查清单

- [ ] 可以创建新的 prompt（包含新字段）
- [ ] 可以编辑现有的 prompt（修改新字段）
- [ ] 场景关联字段正常工作
- [ ] 角色选择功能正常
- [ ] 模型选择功能正常
- [ ] 版本号可以设置
- [ ] SEO 控制开关正常工作
- [ ] Prompt 列表正常显示
- [ ] 搜索和筛选功能正常
- [ ] 数据正确保存到数据库

---

## 🎯 测试完成后

如果所有测试通过，说明新架构已成功部署并正常工作！

下一步可以：
- 为实际场景创建 prompt
- 运行自动绑定脚本（如果已设置 AI 分数）
- 继续优化 Admin UI
