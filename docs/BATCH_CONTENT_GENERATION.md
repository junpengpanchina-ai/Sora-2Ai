# 🚀 SEO 内容批量生成系统使用指南

## 概述

这是一套完整的 SEO 内容生成框架，支持批量生成：
- **使用场景页面**（90% 内容）
- **长尾关键词页面**（提高收录）
- **博客文章**（Pillar + Cluster，抢竞争词流量）
- **行业页面**（可扩展）
- **对比页面**（Sora vs 其他工具）

## 🎯 核心优势

1. **可规模化**：一天可生成 300-500 个新页面
2. **成本可控**：使用 `gemini-2.5-flash`，性价比最高
3. **质量保证**：内容自然、不堆砌、可收录
4. **自动化**：CSV 批量导入，一键生成

## 📍 使用入口

### 方式 1：聊天界面（推荐用于单篇生成）

1. 访问 `/chat` 页面
2. 点击 **"📝 模板"** 按钮
3. 选择模板（使用场景/长尾词/博客文章等）
4. 填写参数
5. 预览并生成内容

### 方式 2：后台批量生成（推荐用于批量生产）

1. 访问 `/admin` 后台
2. 点击 **"批量生成"** 标签页
3. 选择模板
4. 上传或粘贴 CSV 数据
5. 点击 **"🚀 开始批量生成"**

## 📝 CSV 格式说明

### 使用场景页面 CSV 示例

```csv
scene,industry,keyword,style
健身课程视频,体育培训,ai fitness video generator,realistic
宠物短视频,宠物店,ai pet tiktok video,cute
亚马逊产品视频,电商,ai product video generator,studio
教育课程视频,在线教育,ai education video generator,professional
营销广告视频,广告公司,ai marketing video generator,commercial
```

### 长尾关键词页面 CSV 示例

```csv
keyword,scene,industry
ai fitness video generator,健身课程视频,体育培训
ai pet tiktok video,宠物短视频,宠物店
ai product video generator,亚马逊产品视频,电商
how to make ai birthday video,生日祝福视频,个人用户
sora ai text to video example,示例视频,通用
```

### 博客文章 CSV 示例

```csv
title,keyword,audience,scene
Best Sora Alternatives for Creators,sora alternative,内容创作者,YouTube 视频制作
Free Sora Alternatives Online,free sora alternative,预算有限的用户,通用
Text to Video AI Free,text to video ai free,个人用户,通用
```

### 对比页面 CSV 示例

```csv
tool_a,tool_b,keyword
OpenAI Sora,Runway,sora vs runway
OpenAI Sora,Pika Labs,sora vs pika
OpenAI Sora,Luma AI,sora vs luma
```

## 🎨 模板说明

### 1. 使用场景页面生成

**适用场景**：批量生成使用场景介绍页面（占网站 90% 内容）

**参数说明**：
- `scene`（必填）：使用场景名称，如"健身课程视频"
- `industry`（可选）：目标行业，如"体育培训"
- `keyword`（可选）：目标关键词，如"ai fitness video generator"
- `style`（可选）：视频风格，如"真实写实"、"动漫"、"商业"

**生成内容结构**：
- H2：这个使用场景的简介
- H2：为什么适合用 AI 视频来做（3–5 点）
- H2：在这个场景中 Sora2 可以做什么（分 3–6 个子场景）
- H2：可生成的视频示例
- H2：常见问题（3–5 个）
- H2：适用人群 / 适用行业

### 2. 长尾关键词页面生成

**适用场景**：批量生成长尾关键词解释页面（提高收录）

**参数说明**：
- `keyword`（必填）：长尾关键词，如"ai fitness video generator"
- `scene`（可选）：相关使用场景
- `industry`（可选）：行业

**生成内容结构**：
- H1：{{keyword}} 是什么？
- H2：它在实际业务中的用途
- H2：一个简单的例子
- H2：如何用 AI 视频（Sora2）来处理这个问题
- H2：常见问题（2–3 条）

**字数**：400–700 字（适合长尾词页面）

### 3. 博客文章生成

**适用场景**：生成高质量博客文章（Pillar + Cluster，抢竞争词流量）

**参数说明**：
- `title`（必填）：文章标题
- `keyword`（必填）：目标关键词
- `audience`（可选）：读者群体
- `scene`（可选）：相关场景

**生成内容结构**：
- H1：文章标题
- H2：这篇文章要解决什么问题
- H2：核心概念解释
- H2：常见误区（3–5 点）
- H2：如何真正解决这个问题
- H2：使用 AI 视频（Sora2）在这个场景中的应用
- H2：实际案例
- H2：总结

**字数**：1500–2500 字

### 4. 行业页面生成

**适用场景**：生成特定行业的介绍页面

**参数说明**：
- `industry`（必填）：行业名称，如"教育行业"、"电商行业"
- `keyword`（可选）：关键词

**生成内容结构**：
- H1：AI 视频在 {{industry}} 行业的应用
- H2：行业面临的问题（4–6 点）
- H2：为什么 AI 视频适合这个行业
- H2：Sora2 在该行业的典型应用场景
- H2：可以生成的视频示例
- H2：结论（给出行业未来趋势）

### 5. 对比页面生成

**适用场景**：生成工具对比页面（Sora vs 其他工具）

**参数说明**：
- `tool_a`（可选）：工具 A，默认"OpenAI Sora"
- `tool_b`（必填）：工具 B，如"Runway"、"Pika"、"Luma"
- `keyword`（可选）：目标关键词，如"sora vs runway"

**生成内容结构**：
- H1：{{tool_a}} vs {{tool_b}}：哪个 AI 视频生成工具更好？
- H2：快速对比表
- H2：{{tool_a}} 的优势（3–5 点）
- H2：{{tool_b}} 的优势（3–5 点）
- H2：详细功能对比
- H2：适用场景推荐
- H2：结论与建议

## 🔧 最佳实践

### 1. 内容生成策略

**大量内容（90%）**：使用 `gemini-2.5-flash`
- 使用场景页面
- 长尾关键词页面
- 对比文章
- 教程指南

**核心内容（10%）**：使用 `gemini-2.5-pro`
- 首页主框架
- 重点流量词（"AI video generator"）
- 顶级 pillar page（5000+ 字）
- 高竞争关键词文章

### 2. 批量生成流程

1. **准备 CSV 数据**
   - 使用 Excel 或 Google Sheets
   - 确保第一行为表头（参数名）
   - 每行一条数据

2. **选择模板**
   - 根据内容类型选择对应模板
   - 查看模板描述和参数说明

3. **上传 CSV**
   - 可以直接粘贴 CSV 文本
   - 或点击"📁 上传 CSV"上传文件

4. **开始生成**
   - 点击"🚀 开始批量生成"
   - 系统会逐个处理任务
   - 每个任务之间有 1 秒延迟（避免 API 限流）

5. **导出结果**
   - 生成完成后，点击"📥 导出结果"
   - 导出为 JSON 格式，包含参数和生成内容

### 3. 内容优化建议

1. **标题优化**
   - 包含目标关键词
   - 吸引点击（如"Best"、"Free"、"How to"）

2. **内容质量**
   - 不堆砌关键词
   - 每段 60-120 字
   - 结构清晰，易读

3. **内部链接**
   - 生成的内容中自动包含内链建议
   - 链接到 `/sora-alternative` 和 `/text-to-video-ai`

4. **SEO 优化**
   - H1 = 主关键词
   - URL 包含关键词
   - 第一段 100 字内出现主关键词

## 📊 生成效率

- **单篇生成**：约 10-30 秒（取决于内容长度）
- **批量生成**：100 条约 20-30 分钟（含延迟）
- **一天可生成**：300-500 个新页面

## ⚠️ 注意事项

1. **API 限流**：批量生成时，系统会自动添加 1 秒延迟，避免触发限流
2. **内容审核**：生成的内容建议人工审核后再发布
3. **参数验证**：必填参数未填写时，会提示错误
4. **错误处理**：如果某个任务失败，不会影响其他任务

## 🎯 使用示例

### 示例 1：批量生成使用场景页面

**CSV 数据**：
```csv
scene,industry,keyword,style
健身课程视频,体育培训,ai fitness video generator,realistic
宠物短视频,宠物店,ai pet tiktok video,cute
教育课程视频,在线教育,ai education video generator,professional
```

**操作步骤**：
1. 选择"使用场景页面生成"模板
2. 粘贴 CSV 数据
3. 点击"🚀 开始批量生成"
4. 等待生成完成
5. 导出结果，复制内容到后台"使用场景"模块

### 示例 2：批量生成长尾关键词页面

**CSV 数据**：
```csv
keyword,scene,industry
ai fitness video generator,健身课程视频,体育培训
ai pet tiktok video,宠物短视频,宠物店
how to make ai birthday video,生日祝福视频,个人用户
```

**操作步骤**：
1. 选择"长尾关键词页面生成"模板
2. 粘贴 CSV 数据
3. 点击"🚀 开始批量生成"
4. 导出结果，复制内容到后台"长尾词"模块

## 🔗 相关链接

- [聊天界面](/chat) - 单篇内容生成
- [后台管理](/admin) - 批量生成和内容管理
- [使用场景管理](/admin?tab=use-cases) - 管理使用场景页面
- [长尾词管理](/admin?tab=keywords) - 管理长尾关键词页面
- [博客管理](/admin?tab=blog) - 管理博客文章

## 💡 提示

- 建议先用少量数据测试，确认生成效果后再批量生产
- 生成的内容可以进一步优化和个性化
- 定期更新 CSV 数据，持续生成新内容
- 结合 SEO 工具分析生成内容的效果

