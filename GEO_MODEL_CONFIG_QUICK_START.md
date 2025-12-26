# GEO和模型配置 - 快速开始

## 🚀 3步快速开始

### 第1步：执行数据库迁移（5分钟）

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor** → **New query**
4. 打开文件：`supabase/migrations/042_create_geo_and_model_config.sql`
5. **复制全部内容**并粘贴到 SQL Editor
6. 点击 **Run** 按钮

✅ 应该看到："Success. No rows returned"

### 第2步：验证迁移（可选）

运行验证脚本：

```bash
node scripts/verify-geo-model-config.js
```

或者手动检查：

```sql
-- 在 Supabase SQL Editor 中运行
SELECT * FROM geo_configs;
SELECT COUNT(*) FROM industry_scene_model_configs;
```

### 第3步：开始使用

1. **访问 Admin 界面**：
   - 打开 `/admin`
   - 登录管理员账号

2. **配置 GEO**：
   - 点击 **"GEO配置"** tab
   - 查看默认配置（US, CN, GB, CA, AU）
   - 可以添加新地区或修改现有配置

3. **配置行业×场景×模型**：
   - 点击 **"模型配置"** tab
   - 在矩阵视图中选择行业和场景
   - 配置模型选择策略

## 📋 推荐配置示例

### 热门行业（E-commerce, SaaS, Creators）

```
默认模型: gemini-2.5-flash
Fallback模型: gemini-3-flash
行业分类: hot
行业层级: A 或 B
```

### 冷门专业（Medical Devices, Legal Tech）

```
默认模型: gemini-3-flash
Fallback模型: gemini-3-pro
行业分类: professional
行业层级: A
```

### 极端专业（Medical Surgery, Aerospace）

```
默认模型: gemini-3-flash
Fallback模型: gemini-3-pro
终极模型: gemini-3-pro
行业分类: professional
行业层级: A
```

## 🎯 核心功能

### 1. GEO配置
- 为不同地区设置默认模型
- 支持优先级排序
- 可以启用/禁用

### 2. 行业×场景×模型配置
- 6大场景类型：
  - Marketing / Ads
  - Social Media Shorts
  - Product Demo
  - Education
  - Branding
  - Local / Lead Gen
- 三级Fallback机制
- 行业分类和层级标记

### 3. 智能模型选择
- 自动根据配置选择模型
- 支持Fallback机制
- 如果没有配置，使用默认策略

## 📚 详细文档

- **执行指南**: `EXECUTE_GEO_MODEL_CONFIG_MIGRATION.md`
- **使用指南**: `GEO_AND_MODEL_CONFIG_GUIDE.md`
- **迁移文件**: `supabase/migrations/042_create_geo_and_model_config.sql`

## ⚠️ 常见问题

### Q: 迁移失败怎么办？
A: 检查 `admin_users` 表是否存在，如果不存在先执行 `007_create_admin_users_and_sessions.sql`

### Q: Admin界面看不到新tab？
A: 
1. 确认代码已保存
2. 重启开发服务器
3. 清除浏览器缓存

### Q: 如何批量配置？
A: 在"模型配置"tab的矩阵视图中，可以快速配置多个行业×场景组合

## ✅ 验证清单

执行迁移后，确认：
- [ ] `geo_configs` 表已创建
- [ ] `industry_scene_model_configs` 表已创建
- [ ] 默认GEO配置已插入（5条）
- [ ] Admin界面能看到新tab
- [ ] 可以创建和编辑配置

## 🎉 完成！

现在你可以：
1. 根据行业热度配置不同的模型
2. 为不同地区设置默认模型
3. 使用智能Fallback机制
4. 降低成本并提高质量

开始配置你的第一个行业×场景×模型组合吧！

