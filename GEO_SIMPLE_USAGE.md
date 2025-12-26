# GEO简化使用指南

## 🎯 简化后的GEO功能

现在GEO功能已经**直接集成到批量生成界面**，不需要单独配置！

## 📋 使用方法

### 在批量生成界面选择GEO

1. 进入 **Admin后台** → **批量生成** tab
2. 在批量生成界面，你会看到：
   - **每个行业生成数量**：100条（默认）
   - **使用场景类型**：选择场景类型
   - **GEO地区**：选择地区（新增！）
   - **快速选择**：选择行业

3. **选择GEO地区**：
   - 🇺🇸 United States（默认）
   - 🇨🇳 China
   - 🇬🇧 United Kingdom
   - 🇨🇦 Canada
   - 🇦🇺 Australia
   - 🇯🇵 Japan
   - 🇩🇪 Germany
   - 🇫🇷 France
   - 🇮🇳 India
   - 🇧🇷 Brazil

4. **点击开始生成**，系统会自动：
   - 根据选择的GEO和行业×场景选择模型
   - 热门行业 → `gemini-2.5-flash`
   - 冷门专业 → `gemini-3-flash`
   - 极端专业 → `gemini-3-pro`

## 🔧 模型选择逻辑

系统会根据以下优先级选择模型：

1. **行业×场景配置**（如果配置了）
   - 在"模型配置"tab中配置的优先级最高
   
2. **GEO默认模型**（如果没有行业配置）
   - 每个GEO地区有默认模型
   - 默认都是 `gemini-2.5-flash`
   
3. **默认策略**（如果都没有配置）
   - 热门行业 → `gemini-2.5-flash`
   - 冷门专业 → `gemini-3-flash`
   - 极端专业 → `gemini-3-pro`

## 📊 示例

### 示例1：生成1万条内容（100行业 × 100条）

1. 选择GEO：**US**
2. 选择场景：**Social Media Content**
3. 选择行业：**全选（100个）**
4. 点击生成

系统会自动：
- 热门行业（E-commerce, SaaS）→ 使用 `gemini-2.5-flash`
- 冷门专业（Medical Devices）→ 使用 `gemini-3-flash`
- 极端专业（Medical Surgery）→ 使用 `gemini-3-pro`

### 示例2：为中国市场生成内容

1. 选择GEO：**CN**
2. 选择场景：**Advertising & Promotion**
3. 选择行业：**前50个**
4. 点击生成

## 🗄️ 数据库迁移

需要执行一个简单的迁移来添加GEO字段：

```sql
-- 文件：supabase/migrations/043_add_geo_to_batch_generation_tasks.sql
ALTER TABLE batch_generation_tasks
ADD COLUMN IF NOT EXISTS geo TEXT DEFAULT 'US';
```

在Supabase SQL Editor中执行即可。

## ✅ 完成！

现在你可以：
1. ✅ 在批量生成界面直接选择GEO
2. ✅ 系统自动根据GEO和行业选择模型
3. ✅ 无需单独配置，开箱即用

就是这么简单！🎉

