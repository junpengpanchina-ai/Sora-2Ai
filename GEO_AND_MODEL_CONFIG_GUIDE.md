# GEO配置和行业×场景×模型配置使用指南

## 📋 功能概述

本系统实现了基于GEO（地理位置）和行业×场景的智能模型选择机制，可以根据不同地区和行业场景自动选择最合适的Gemini模型。

### 核心功能

1. **GEO配置管理**：为不同地区配置默认模型
2. **行业×场景×模型配置**：为每个行业在不同场景下配置模型选择策略
3. **智能模型选择**：系统自动根据配置选择模型，支持Fallback机制

## 🗄️ 数据库结构

### 1. geo_configs 表

存储不同地区的配置：

- `geo_code`: 地区代码（如 'US', 'CN', 'GB'）
- `geo_name`: 地区名称
- `default_model`: 该地区的默认模型
- `is_active`: 是否启用
- `priority`: 优先级

### 2. industry_scene_model_configs 表

存储行业×场景×模型配置：

- `industry`: 行业名称
- `use_case_type`: 场景类型（6种固定类型）
- `default_model`: 默认模型
- `fallback_model`: Fallback模型（如果默认失败）
- `ultimate_model`: 终极模型（如果Fallback也失败）
- `industry_category`: 行业分类（hot/cold/professional/restricted）
- `industry_tier`: 行业层级（A/B/C）
- `is_enabled`: 是否启用

## 🎯 使用场景

### 场景1：热门行业使用 gemini-2.5-flash

**适用行业**：
- E-commerce
- SaaS
- Mobile Apps
- Creators
- Social Media

**配置示例**：
- 默认模型：`gemini-2.5-flash`
- Fallback模型：`gemini-3-flash`
- 行业分类：`hot`
- 行业层级：`A` 或 `B`

### 场景2：冷门但专业的行业使用 gemini-3-flash

**适用行业**：
- Medical Devices
- Legal Tech
- Engineering
- Manufacturing

**配置示例**：
- 默认模型：`gemini-3-flash`
- Fallback模型：`gemini-3-pro`
- 行业分类：`professional`
- 行业层级：`A`

### 场景3：极端专业领域使用 gemini-3-pro

**适用行业**：
- Medical Surgery
- Aerospace
- Advanced Manufacturing

**配置示例**：
- 默认模型：`gemini-3-flash`
- Fallback模型：`gemini-3-pro`
- 终极模型：`gemini-3-pro`
- 行业分类：`professional`
- 行业层级：`A`

## 📝 配置步骤

### 步骤1：执行数据库迁移

```bash
# 迁移文件已创建：supabase/migrations/042_create_geo_and_model_config.sql
# 在Supabase Dashboard中执行，或使用Supabase CLI
supabase migration up
```

### 步骤2：配置GEO设置

1. 进入管理员后台
2. 点击 **"GEO配置"** tab
3. 添加或编辑地区配置：
   - 地区代码：`US`、`CN`、`GB` 等
   - 地区名称：`United States`、`China` 等
   - 默认模型：选择适合该地区的模型
   - 优先级：数字越大优先级越高

### 步骤3：配置行业×场景×模型

1. 进入管理员后台
2. 点击 **"模型配置"** tab
3. 在配置矩阵中：
   - 选择行业
   - 选择场景类型
   - 配置默认模型、Fallback模型、终极模型
   - 设置行业分类和层级

### 步骤4：批量配置（推荐）

使用配置矩阵视图：
- 搜索行业
- 点击"配置"按钮快速配置
- 批量设置行业分类和层级

## 🔧 模型选择逻辑

### 自动选择流程

1. **优先使用配置表**：如果数据库中有配置，使用配置的模型
2. **Fallback机制**：
   - 第一次尝试：使用 `default_model`
   - 如果失败：使用 `fallback_model`
   - 如果还失败：使用 `ultimate_model`
3. **默认策略**：如果没有配置，使用启发式判断：
   - 热门行业 → `gemini-2.5-flash`
   - 冷门行业 → `gemini-3-flash`
   - 专业行业 → `gemini-3-flash` → `gemini-3-pro`

### 代码使用示例

```typescript
import { selectModelForIndustryScene } from '@/lib/model-selector/industry-scene-selector'

// 选择模型
const selection = await selectModelForIndustryScene(
  'E-commerce',
  'advertising-promotion',
  1 // 当前尝试次数
)

console.log(selection.model) // 'gemini-2.5-flash'
console.log(selection.reason) // '使用配置的默认模型: gemini-2.5-flash'
console.log(selection.nextFallback) // 'gemini-3-flash'
```

## 📊 行业分类建议

### A类（高价付费行业）

- SaaS / AI Tools
- B2B Software
- Medical Devices
- Fintech
- Cybersecurity
- HR Software
- Enterprise Services

**建议配置**：
- 默认：`gemini-2.5-flash` 或 `gemini-3-flash`
- Fallback：`gemini-3-flash` 或 `gemini-3-pro`

### B类（拉流量行业）

- Creators
- Influencers
- Fitness
- Restaurants
- Beauty
- Travel
- Education (C端)

**建议配置**：
- 默认：`gemini-2.5-flash`
- Fallback：`gemini-3-flash`

### C类（限制行业）

- Gambling（合规风险）
- Government
- Pure Accounting

**建议配置**：
- 只做1-2个教育型场景
- 使用 `gemini-3-flash` 或 `gemini-3-pro`

## 🎨 6大场景类型

1. **advertising-promotion** (Marketing / Ads)
   - 广告转化、获客、投放
   - 适合：电商、SaaS、本地服务

2. **social-media-content** (Social Media Shorts)
   - 曝光、增长、涨粉
   - 适合：创作者、品牌、娱乐

3. **product-demo-showcase** (Product Demo)
   - 解释复杂产品
   - 适合：SaaS、工具类、AI产品

4. **education-explainer** (Education)
   - 教学、培训
   - 适合：在线教育、企业培训

5. **brand-storytelling** (Branding)
   - 品牌形象
   - 适合：中大型企业、消费品牌

6. **ugc-creator-content** (Local / Lead Gen)
   - 到店/咨询
   - 适合：餐饮、牙科、房产、健身房

## ⚠️ 注意事项

1. **成本控制**：
   - `gemini-2.5-flash`：最低成本，适合热门行业
   - `gemini-3-flash`：中等成本，适合冷门专业
   - `gemini-3-pro`：最高成本，仅用于极端情况

2. **配置优先级**：
   - 数据库配置 > 默认判断
   - 如果配置被禁用，使用默认策略

3. **批量生成**：
   - 系统会自动根据配置选择模型
   - 支持自动Fallback，无需手动干预

## 🔍 故障排查

### 问题1：模型选择不正确

**检查**：
1. 确认数据库配置是否正确
2. 检查 `is_enabled` 是否为 `true`
3. 查看日志中的模型选择原因

### 问题2：Fallback不工作

**检查**：
1. 确认配置了 `fallback_model` 和 `ultimate_model`
2. 检查错误日志，确认是否触发了Fallback

### 问题3：配置不生效

**检查**：
1. 确认执行了数据库迁移
2. 检查RLS策略是否允许访问
3. 确认使用了正确的行业名称和场景类型

## 📈 最佳实践

1. **热门行业**：优先使用 `gemini-2.5-flash`，降低成本
2. **专业行业**：使用 `gemini-3-flash`，确保质量
3. **极端情况**：配置 `gemini-3-pro` 作为终极Fallback
4. **定期审查**：根据实际效果调整配置
5. **批量配置**：使用矩阵视图批量设置行业分类

## 🚀 下一步

1. 根据实际使用情况调整配置
2. 监控模型使用情况和成本
3. 根据效果优化模型选择策略
4. 扩展更多行业和场景配置




