# 场景应用配置 - 简化使用指南

## 🎯 简化后的配置方式

现在配置**超级简单**！只需要按**6个场景应用**来配置，系统会自动应用到所有行业。

## 📋 6大场景应用

### 1. 🎯 Marketing / Ads（广告转化）
- **适用**：电商、SaaS、本地服务
- **推荐模型**：热门行业用 `2.5-flash`，冷门专业用 `3-flash`

### 2. 📱 Social Media Shorts（短视频内容）
- **适用**：创作者、品牌、娱乐
- **推荐模型**：热门行业用 `2.5-flash`，冷门专业用 `3-flash`

### 3. 💼 Product Demo（产品演示）
- **适用**：SaaS、工具类、AI产品
- **推荐模型**：热门行业用 `2.5-flash`，专业行业用 `3-flash` 或 `3-pro`

### 4. 📚 Education（教学培训）
- **适用**：在线教育、企业培训
- **推荐模型**：热门行业用 `2.5-flash`，冷门专业用 `3-flash`

### 5. ✨ Branding（品牌叙事）
- **适用**：中大型企业、消费品牌
- **推荐模型**：热门行业用 `2.5-flash`，冷门专业用 `3-flash`

### 6. 📍 Local / Lead Gen（本地获客）
- **适用**：餐饮、牙科、房产、健身房
- **推荐模型**：热门行业用 `2.5-flash`，冷门专业用 `3-flash`

## 🚀 使用方法

### 第1步：执行数据库迁移

在 Supabase SQL Editor 中执行：

```sql
-- 文件：supabase/migrations/044_create_scene_model_configs.sql
-- 这会创建 scene_model_configs 表并插入默认配置
```

### 第2步：配置场景应用

1. 进入 **Admin后台** → **"场景配置"** tab
2. 你会看到6个场景应用卡片
3. 点击 **"配置"** 按钮
4. 设置：
   - **默认模型**：所有行业的默认模型
   - **Fallback模型**：如果默认失败，使用此模型
   - **终极模型**：如果Fallback也失败，使用此模型
   - **热门行业模型**（可选）：热门行业优先使用
   - **冷门行业模型**（可选）：冷门行业优先使用
   - **专业行业模型**（可选）：专业行业优先使用

### 第3步：开始批量生成

1. 进入 **批量生成** tab
2. 选择 **GEO地区**（如 US、CN）
3. 选择 **场景类型**（会自动使用配置的模型）
4. 选择行业并开始生成

## 💡 推荐配置示例

### Marketing / Ads
```
默认模型: gemini-2.5-flash
Fallback: gemini-3-flash
终极模型: gemini-3-pro
热门行业: gemini-2.5-flash（默认）
冷门行业: gemini-3-flash
专业行业: gemini-3-flash
```

### Product Demo
```
默认模型: gemini-2.5-flash
Fallback: gemini-3-flash
终极模型: gemini-3-pro
热门行业: gemini-2.5-flash
冷门行业: gemini-3-flash
专业行业: gemini-3-pro（重要！）
```

## 🎯 模型选择逻辑

系统会按以下优先级选择模型：

1. **场景应用配置**（优先级最高）
   - 如果有行业分类配置（热门/冷门/专业），优先使用
   - 否则使用默认模型

2. **GEO默认模型**（如果没有场景配置）

3. **默认策略**（如果都没有配置）
   - 热门行业 → `gemini-2.5-flash`
   - 冷门行业 → `gemini-3-flash`
   - 专业行业 → `gemini-3-pro`

## ✅ 优势

- ✅ **简单**：只需配置6个场景应用，不用配置100个行业
- ✅ **自动**：配置一次，自动应用到所有行业
- ✅ **灵活**：可以为不同行业类型设置不同模型
- ✅ **智能**：系统自动判断行业类型并选择模型

## 📊 数据库结构

### scene_model_configs 表

```
use_case_type: 场景类型（6种之一）
default_model: 默认模型
fallback_model: Fallback模型
ultimate_model: 终极模型
hot_industry_model: 热门行业模型（可选）
cold_industry_model: 冷门行业模型（可选）
professional_industry_model: 专业行业模型（可选）
is_enabled: 是否启用
```

## 🎉 完成！

现在你可以：
1. ✅ 按场景应用配置模型（6个配置）
2. ✅ 系统自动应用到所有行业
3. ✅ 在批量生成时选择GEO和场景
4. ✅ 系统自动选择最合适的模型

就是这么简单！🎉

