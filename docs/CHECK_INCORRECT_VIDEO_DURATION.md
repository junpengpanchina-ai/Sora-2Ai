# 检查并标记错误视频时长内容

## 问题说明

我们的平台只支持 **10 秒** 或 **15 秒** 的视频，但生成的内容中可能错误地提到了"2分钟"、"1分钟"等时长。

## 脚本功能

`scripts/check-incorrect-video-duration.js` 脚本可以：

1. **检查所有使用场景内容**，查找包含错误时长的记录
2. **显示问题列表**，包括：
   - 使用场景的 slug 和标题
   - 发现的错误时长（如"2分钟"）
   - 涉及哪些字段（title、description、content）
   - 当前的质量状态和分数
3. **批量更新数据库**（使用 `--update` 参数）：
   - 将 `quality_status` 设置为 `"needs_review"`
   - 在 `quality_issues` 中添加 `"incorrect_video_duration"`
   - 降低 `quality_score`（如果存在，减 20 分）

## 使用方法

### 1. 仅检查（不更新数据库）

```bash
node scripts/check-incorrect-video-duration.js
```

这会：
- 扫描所有使用场景
- 显示包含错误时长的内容列表
- **不会修改数据库**

### 2. 检查并更新数据库

```bash
node scripts/check-incorrect-video-duration.js --update
```

这会：
- 扫描所有使用场景
- 显示包含错误时长的内容列表
- **自动更新数据库**，标记有问题的内容

## 检测规则

脚本会检测以下错误时长模式：

- `2分钟`、`1分钟`、`3分钟` 等（中文）
- `2 minute`、`1 minute` 等（英文）
- 任何 1-60 分钟的数字

**注意**：脚本会检查 `title`、`description` 和 `content` 三个字段。

## 输出示例

### 仅检查模式

```
🔍 开始检查使用场景内容中的错误视频时长...

📊 总共找到 150 个使用场景

⚠️  发现 5 个包含错误时长的使用场景

📋 问题列表：

1. [wildlife-giant-squid-documentary]
   标题: AI Video Generation for giant squid documentary in Wildlife
   错误时长: 2分钟
   涉及字段: content
   当前状态: approved
   当前分数: 85

2. [marketing-product-demo]
   标题: Create product demo videos
   错误时长: 1分钟, 3分钟
   涉及字段: description, content
   当前状态: pending
   当前分数: 70

...

💡 提示: 使用 --update 参数来实际更新数据库
   例如: node scripts/check-incorrect-video-duration.js --update
```

### 更新模式

```
🔍 开始检查使用场景内容中的错误视频时长...

📊 总共找到 150 个使用场景

⚠️  发现 5 个包含错误时长的使用场景

📋 问题列表：
...

🔄 开始更新数据库...

✅ 已更新 [wildlife-giant-squid-documentary]
✅ 已更新 [marketing-product-demo]
...

📊 更新完成：
   ✅ 成功: 5
   ❌ 失败: 0
   📝 总计: 5

✅ 检查完成
```

## 环境变量要求

脚本需要以下环境变量（通常在 `.env.local` 文件中）：

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务角色密钥

## 后续操作

更新后，你可以在管理界面：

1. **查看标记的内容**：
   - 筛选 `quality_status = "needs_review"`
   - 查看 `quality_issues` 包含 `"incorrect_video_duration"` 的记录

2. **批量处理**：
   - 使用批量审核功能，批量拒绝或标记为需要审核
   - 或者手动编辑，将错误的时长改为正确的描述

3. **重新生成**：
   - 删除有问题的内容
   - 使用更新后的模板重新生成

## 注意事项

- ⚠️ 脚本会修改数据库，建议先备份
- ⚠️ 使用 `--update` 参数前，建议先运行一次不带参数的检查
- ⚠️ 更新后的内容需要手动审核或重新生成

## 相关文件

- `scripts/check-incorrect-video-duration.js` - 检查脚本
- `lib/utils/content-quality.ts` - 质量检查工具（包含时长检查）
- `lib/prompts/seo-content-templates.ts` - 内容生成模板（已更新，禁止错误时长）
- `app/admin/IndustrySceneBatchGenerator.tsx` - 批量生成器（已更新，使用正确时长）

