# 执行GEO和模型配置迁移 - 详细步骤

## 📋 迁移文件

- **文件路径**: `supabase/migrations/042_create_geo_and_model_config.sql`
- **创建内容**:
  - `geo_configs` 表（GEO配置）
  - `industry_scene_model_configs` 表（行业×场景×模型配置）
  - 默认GEO配置数据（US, CN, GB, CA, AU）

## ✅ 执行步骤

### 步骤 1: 打开 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录你的账号
3. 选择你的项目

### 步骤 2: 进入 SQL Editor

1. 在左侧菜单中找到 **SQL Editor**
2. 点击 **SQL Editor**
3. 点击 **New query**（新建查询）

### 步骤 3: 检查依赖

在执行迁移前，确保 `admin_users` 表已存在：

```sql
-- 检查 admin_users 表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'admin_users';
```

**如果返回空结果**，需要先执行：
- `supabase/migrations/007_create_admin_users_and_sessions.sql`

### 步骤 4: 执行迁移 SQL

1. 打开项目文件：`supabase/migrations/042_create_geo_and_model_config.sql`
2. **复制全部 SQL 代码**（从第1行到第120行）
3. 粘贴到 Supabase SQL Editor 中
4. 点击 **Run** 按钮（或按 `Cmd+Enter` / `Ctrl+Enter`）

### 步骤 5: 验证迁移成功

执行后应该看到：
- ✅ "Success. No rows returned" 或类似成功消息
- ✅ 没有错误信息

#### 验证表创建

在 SQL Editor 中运行：

```sql
-- 检查 geo_configs 表
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'geo_configs'
ORDER BY ordinal_position;

-- 检查 industry_scene_model_configs 表
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'industry_scene_model_configs'
ORDER BY ordinal_position;
```

#### 验证默认数据

```sql
-- 检查默认GEO配置
SELECT * FROM geo_configs ORDER BY priority DESC;

-- 应该看到5条记录：US, CN, GB, CA, AU
```

#### 在 Table Editor 中验证

1. 进入 **Table Editor**
2. 应该能看到：
   - ✅ `geo_configs` 表
   - ✅ `industry_scene_model_configs` 表
3. 点击表名查看结构和数据

## 🧪 测试功能

### 测试 1: 访问 Admin 界面

1. 访问 `/admin` 页面
2. 登录管理员账号
3. 应该能看到新的 tab：
   - ✅ **"GEO配置"** tab
   - ✅ **"模型配置"** tab

### 测试 2: 测试 GEO 配置

1. 点击 **"GEO配置"** tab
2. 应该能看到默认的5个地区配置（US, CN, GB, CA, AU）
3. 尝试创建一个新的GEO配置：
   - 地区代码：`JP`（日本）
   - 地区名称：`Japan`
   - 默认模型：`gemini-2.5-flash`
   - 优先级：`50`
4. 点击 **"创建"** 按钮
5. 应该能看到新配置出现在列表中

### 测试 3: 测试行业×场景×模型配置

1. 点击 **"模型配置"** tab
2. 应该能看到配置矩阵视图
3. 选择一个行业（如 "E-commerce"）
4. 选择一个场景类型（如 "Marketing / Ads"）
5. 配置：
   - 默认模型：`gemini-2.5-flash`
   - Fallback模型：`gemini-3-flash`
   - 行业分类：`hot`
   - 行业层级：`A`
6. 点击 **"创建"** 按钮
7. 在矩阵视图中应该能看到配置已更新

### 测试 4: 测试模型选择逻辑

1. 进入 **"批量生成"** tab
2. 选择一个行业和场景类型
3. 查看日志，应该能看到：
   ```
   [行业名] 模型选择: gemini-2.5-flash, 原因: 使用配置的默认模型: gemini-2.5-flash
   ```

## 🐛 常见问题

### 问题 1: "relation 'admin_users' does not exist"

**原因**: `admin_users` 表还没有创建

**解决**: 
1. 先执行 `supabase/migrations/007_create_admin_users_and_sessions.sql`
2. 然后再执行 `042_create_geo_and_model_config.sql`

### 问题 2: "function update_updated_at_column() does not exist"

**原因**: 更新函数还没有创建

**解决**: 
1. 检查之前的迁移是否已执行
2. 通常这个函数在 `001_create_users_table.sql` 中创建
3. 如果不存在，可以手动创建：

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 问题 3: "permission denied"

**原因**: 权限不足

**解决**: 
1. 确保使用正确的 Supabase 项目
2. 检查 API 密钥是否正确
3. 确保使用 service_role 权限执行迁移

### 问题 4: "duplicate key value violates unique constraint"

**原因**: 默认GEO配置已存在

**解决**: 
- 这是正常的，`ON CONFLICT DO NOTHING` 会忽略重复插入
- 不影响迁移执行

### 问题 5: Admin 界面看不到新 tab

**原因**: 代码未更新或缓存问题

**解决**: 
1. 确认代码已保存
2. 重启开发服务器
3. 清除浏览器缓存
4. 检查 `AdminClient.tsx` 中是否添加了新 tab

## 📊 迁移后的数据结构

### geo_configs 表结构

```
id: UUID (主键)
geo_code: TEXT (唯一，如 'US', 'CN')
geo_name: TEXT (如 'United States')
is_active: BOOLEAN (默认 true)
default_model: TEXT (默认 'gemini-2.5-flash')
priority: INTEGER (默认 0)
notes: TEXT (可选)
created_by_admin_id: UUID (可选)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### industry_scene_model_configs 表结构

```
id: UUID (主键)
industry: TEXT (行业名称)
use_case_type: TEXT (6种场景类型之一)
default_model: TEXT (默认模型)
fallback_model: TEXT (可选)
ultimate_model: TEXT (可选)
industry_category: TEXT (hot/cold/professional/restricted)
industry_tier: TEXT (A/B/C)
is_enabled: BOOLEAN (默认 true)
priority: INTEGER (默认 0)
notes: TEXT (可选)
created_by_admin_id: UUID (可选)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

## 🎯 下一步

迁移完成后，你可以：

1. **配置 GEO 设置**：
   - 为不同地区设置默认模型
   - 调整优先级

2. **配置行业×场景×模型**：
   - 为热门行业配置 `gemini-2.5-flash`
   - 为冷门专业行业配置 `gemini-3-flash`
   - 为极端专业领域配置 `gemini-3-pro`

3. **测试批量生成**：
   - 使用不同行业和场景测试模型选择
   - 验证 Fallback 机制是否正常工作

4. **监控成本**：
   - 跟踪不同模型的使用情况
   - 根据效果调整配置

## ✅ 验证清单

- [ ] 迁移SQL执行成功
- [ ] `geo_configs` 表已创建
- [ ] `industry_scene_model_configs` 表已创建
- [ ] 默认GEO配置已插入（5条记录）
- [ ] Admin界面能看到新 tab
- [ ] 可以创建新的GEO配置
- [ ] 可以创建行业×场景×模型配置
- [ ] 模型选择逻辑正常工作

## 📚 相关文档

- `GEO_AND_MODEL_CONFIG_GUIDE.md` - 详细使用指南
- `supabase/migrations/042_create_geo_and_model_config.sql` - 迁移文件
- `app/admin/AdminGeoManager.tsx` - GEO管理组件
- `app/admin/AdminIndustryModelConfig.tsx` - 模型配置组件
- `lib/model-selector/industry-scene-selector.ts` - 模型选择逻辑


