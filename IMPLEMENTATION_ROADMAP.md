# 三模型智能内容生成系统 — 实施路线图

## 📋 当前状态

### ✅ 已实现（90%）

1. **调度层（Task Dispatcher）** ✅
   - 按行业拆分任务
   - 批量处理（10～50条/批）
   - 任务状态管理
   - 链式调用（避免超时）

2. **模型选择层（Model Selector）** ✅
   - 三级模型自动选择
   - 行业难度判断
   - 极端专业领域检测

3. **内容生成层** ✅
   - 根据模型调用 API
   - 支持联网搜索
   - JSON 解析和修复

4. **缺陷检测层（Quality Checker）** ✅
   - 数量检查
   - 重复率检查
   - 空内容检查
   - 错误响应检查

5. **自适应 Fallback** ✅
   - 三级自动升级
   - 基于质量评分自动决定

6. **内容合成层（Aggregator）** ✅
   - 过滤无效内容
   - 去重（基于 slug）
   - 保存到数据库

7. **输出层（Output Layer）** ✅
   - 保存到数据库
   - 包含行业分类、场景词内容

### ⚠️ 待实现（10%）

8. **成本监控层（Billing Monitor）** ⚠️
   - Token 用量统计（需要 API 支持）
   - 模型成本计算
   - 任务成本汇总

## 🎯 实施建议

### 阶段 1：基础成本监控（简单实现）

**目标：** 记录模型使用情况，便于后续分析

**实施步骤：**

1. **在 `batch_generation_tasks` 表中添加字段：**
   ```sql
   ALTER TABLE batch_generation_tasks
   ADD COLUMN model_usage_stats JSONB DEFAULT '{}'::jsonb;
   -- 格式：{"gemini-2.5-flash": 2500, "gemini-3-flash": 400, "gemini-3-pro": 50}
   ```

2. **在生成场景词时记录模型使用：**
   ```typescript
   // app/api/admin/batch-generation/process/generate-scenes.ts
   // 在每次调用 createChatCompletion 后记录
   const modelUsed = 'gemini-2.5-flash' // 或 3-flash 或 3-pro
   // 更新任务统计
   ```

3. **创建成本统计 API：**
   ```typescript
   // app/api/admin/batch-generation/stats/route.ts
   // 返回模型使用统计和成本估算
   ```

**优点：**
- 实现简单，不需要修改 API 响应
- 可以立即开始收集数据
- 便于后续分析和优化

**缺点：**
- 无法获取精确的 token 用量
- 成本估算基于平均值

### 阶段 2：精确成本监控（需要 API 支持）

**目标：** 获取精确的 token 用量和成本

**实施步骤：**

1. **检查 API 响应是否包含 token 信息：**
   ```typescript
   // 在 createChatCompletion 中检查响应
   const response = await fetch(...)
   const data = await response.json()
   // 检查是否有 usage 字段
   if (data.usage) {
     // 记录 token 用量
   }
   ```

2. **更新 `ChatCompletionResponse` 接口：**
   ```typescript
   export interface ChatCompletionResponse {
     // ... 现有字段
     usage?: {
       prompt_tokens: number
       completion_tokens: number
       total_tokens: number
     }
   }
   ```

3. **在任务表中记录 token 用量：**
   ```sql
   ALTER TABLE batch_generation_tasks
   ADD COLUMN token_usage JSONB DEFAULT '{}'::jsonb;
   -- 格式：{"input_tokens": 10000, "output_tokens": 5000, "total_tokens": 15000}
   ```

4. **计算精确成本：**
   ```typescript
   // 根据模型和 token 数量计算成本
   const cost = calculateCost(model, inputTokens, outputTokens)
   ```

**优点：**
- 精确的成本计算
- 可以优化模型选择策略
- 可以设置成本预警

**缺点：**
- 需要 API 支持 token 统计
- 实现复杂度较高

### 阶段 3：高级功能（可选）

1. **内容相似度检查**
   - 使用文本相似度算法（如余弦相似度）
   - 避免重复内容（即使 slug 不同）

2. **失败重试机制**
   - 任务级别的重试（最多 3 次）
   - 行业级别的重试（失败行业单独重试）

3. **关键词聚类**
   - 基于内容相似度聚类
   - 行业 → 主题 → 场景词 三层结构

4. **导出功能**
   - CSV 导出
   - JSON 导出
   - 按行业/模型筛选导出

## 🚀 快速开始

### 立即可以做的：

1. **添加模型使用统计（阶段 1）**
   - 在 `generate-scenes.ts` 中记录每次使用的模型
   - 在 `batch_generation_tasks` 表中更新统计
   - 创建统计 API 查看结果

2. **优化日志输出**
   - 添加更详细的模型使用日志
   - 记录每个行业的模型选择原因

3. **创建成本估算函数**
   - 基于平均 token 数量估算成本
   - 提供成本预警功能

## 📊 预期效果

### 实施阶段 1 后：

- ✅ 可以查看每个任务使用的模型分布
- ✅ 可以估算任务成本
- ✅ 可以分析哪些行业成本高
- ✅ 可以优化模型选择策略

### 实施阶段 2 后：

- ✅ 精确的成本计算
- ✅ 实时的成本监控
- ✅ 成本预警功能
- ✅ 自动成本优化

## 🎯 总结

**当前系统已经实现了 90% 的核心功能，剩余 10% 主要是成本监控。**

**建议优先实施阶段 1（基础成本监控），因为：**
- 实现简单，不需要修改 API
- 可以立即开始收集数据
- 为后续优化提供基础

**阶段 2（精确成本监控）可以等 API 支持 token 统计后再实施。**

