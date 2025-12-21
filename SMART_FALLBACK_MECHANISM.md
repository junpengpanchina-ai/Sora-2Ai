# 三级智能 Fallback 机制说明

## 🎯 核心策略

**三级模型自动选择机制：**

- **Level 1**: `gemini-2.5-flash`（默认，低成本）
- **Level 2**: `gemini-3-flash`（联网搜索，中等成本）
- **Level 3**: `gemini-3-pro`（最高质量，高成本，极端情况）

### 成本优化效果

- 🟢 **90% 内容** → `gemini-2.5-flash` 生成（超省钱）
- 🔵 **8% 内容** → `gemini-3-flash` 补充（确保真实、精准、专业）
- 🟣 **2% 内容** → `gemini-3-pro` 最高质量（极端专业领域）

## 🔄 三级 Fallback 触发机制

### Level 1 → Level 2 触发条件

#### 触发条件 A：2.5-Flash 返回无意义内容 / 无结果

**检测条件：**
- ✅ 输出重复、乱说、流水账
- ✅ 无法生成足够数量的场景词（少于期望的 50%）
- ✅ 返回 "No data"、"Not found"、"I don't know" 等错误响应
- ✅ 词数量不够（例如你需要 30 个，它只给 10 个）
- ✅ 检测到重复内容（超过 30%，但少于 80%）

**触发结果：** 立即切换到 `gemini-3-flash`（联网搜索）重新生成

#### 触发条件 B：内容中出现空数组 / 空列表

**检测条件：**
- ✅ 返回空数组 `[]`
- ✅ 返回包含空字符串的数组 `[""]`
- ✅ 包含空内容的场景词（超过 20%）

**触发结果：** 自动调用 `gemini-3-flash` 重新生成

#### 触发条件 C：判断「行业/词汇是否属于冷门」

**检测条件：**
- ✅ 行业名称包含冷门关键词（医学、工程、法律、研发等）
- ✅ 专业术语或专有名词
- ✅ 特种制造、航空航天、国防等特殊行业

**触发结果：** 直接跳过 `gemini-2.5-flash`，使用 `gemini-3-flash`（联网搜索）

### Level 2 → Level 3 触发条件（极端情况）

#### 触发条件 1：全部都是重复内容

**检测条件：**
- ✅ 重复内容超过 80%
- ✅ 所有场景词几乎完全相同

**触发结果：** 直接使用 `gemini-3-pro`（最高质量，联网搜索）

#### 触发条件 2：某些行业仍然无法生成

**检测条件：**
- ✅ 生成数量为 0
- ✅ 生成数量少于期望的 10%（且期望数量 ≥ 10）

**触发结果：** 直接使用 `gemini-3-pro`（最高质量，联网搜索）

#### 触发条件 3：需要非常专业领域解释

**检测条件：**
- ✅ 行业包含极端专业关键词：
  - 医学：surgery, diagnostic, pharmaceutical, clinical, therapeutic
  - 工程：aerospace, defense, nuclear, biomedical, nanotechnology
  - 金融：investment banking, quantitative, actuarial, risk management
  - 中文：手术、诊断、制药、临床、治疗、航空航天、国防、核能、生物医学、纳米技术、投资银行、量化、精算、风险管理

**触发结果：** 直接跳过 Level 1 和 Level 2，使用 `gemini-3-pro`（最高质量，联网搜索）

#### 触发条件 4：Level 2 也失败

**检测条件：**
- ✅ `gemini-3-flash` 生成失败或返回错误

**触发结果：** 自动切换到 `gemini-3-pro`（最高质量，联网搜索）

## 📋 冷门行业关键词列表

系统会自动检测以下关键词，直接使用 `gemini-3-flash`：

### 医学/医疗
- medical, healthcare, pharmaceutical, surgery, diagnostic
- 医疗, 制药

### 工程/制造
- manufacturing, engineering, industrial, machinery, automation
- 工程, 制造

### 专业服务
- legal, accounting, consulting, audit, compliance
- 法律, 审计

### 技术/研发
- research, development, laboratory, testing, quality control
- 研发, 实验室

### 特殊行业
- mining, petroleum, chemical, aerospace, defense
- 矿业, 石油, 化工, 航空航天, 国防

## 🔍 质量检查逻辑

系统会检查以下指标：

1. **数量检查**：生成数量是否达到期望的 50% 以上
2. **空内容检查**：是否有空数组或空字符串
3. **错误响应检查**：是否包含 "No data"、"Not found" 等错误信息
4. **重复内容检查**：重复内容是否超过 30%
5. **内容长度检查**：过短内容（< 30 字符）是否超过 20%

## 💰 成本对比（实际价格）

### 基础定价（每百万 tokens）

| 模型 | 输入成本 | 输出成本 | 联网搜索 |
|------|---------|---------|---------|
| **gemini-2.5-flash** | ￥***~*** /M | ￥***~*** /M | ❌ |
| **gemini-3-flash** | ￥***~*** /M | ￥***~*** /M | ✅ |

### 实际使用成本（生成 10,000 条场景词）

假设 90% 使用 2.5-flash，8% 使用 3-flash，2% 使用 3-pro：

| 场景 | 2.5-flash 成本 | 3-flash 成本 | 3-pro 成本 | **总成本** |
|------|---------------|-------------|-----------|-----------|
| **三级 Fallback** | ￥***~*** | ￥***~*** | ￥***~*** | **￥***~***** |
| **全部 2.5-flash** | ￥***~*** | - | - | **￥***~***** |
| **全部 3-flash** | - | ￥***~*** | - | **￥***~***** |
| **全部 3-pro** | - | - | ￥***~*** | **￥***~***** |

**结论：** 三级 Fallback 机制成本仅比全部使用 2.5-flash 高 **29~30%**，但能确保所有行业（包括极端专业领域）都能生成高质量场景词！

## 📊 工作流程

```
开始生成
    ↓
检测是否为极端专业领域？
    ├─ 是 → 直接使用 gemini-3-pro（最高质量，联网搜索）✅
    └─ 否 → 检测是否为冷门行业？
            ├─ 是 → 直接使用 gemini-3-flash（联网搜索）
            └─ 否 → 使用 gemini-2.5-flash（Level 1）
                    ↓
                生成成功？
                    ├─ 是 → 检查质量
                    │       ├─ 需要 Pro → 使用 gemini-3-pro ✅
                    │       ├─ 需要 Fallback → 切换到 gemini-3-flash
                    │       └─ 通过 → 使用结果 ✅
                    └─ 否 → 切换到 gemini-3-flash（Level 2）
                            ↓
                        使用 gemini-3-flash（联网搜索）重新生成
                            ↓
                        生成成功？
                            ├─ 是 → 返回结果 ✅
                            └─ 否 → 切换到 gemini-3-pro（Level 3）
                                    ↓
                                使用 gemini-3-pro（最高质量，联网搜索）✅
```

## 🎯 优势

1. **成本优化**：90% 内容使用低成本模型，仅 2% 使用高成本模型
2. **质量保证**：失败时自动升级到更高质量模型
3. **智能判断**：冷门行业和极端专业领域自动使用合适模型
4. **自动恢复**：无需人工干预，系统自动处理所有情况
5. **极端情况处理**：即使 Level 1 和 Level 2 都失败，Level 3 也能确保生成成功

## 📝 日志示例

系统会记录详细的日志，方便追踪：

### Level 1 成功示例
```
[Real Estate] 批次 1: 使用 gemini-2.5-flash 生成...
[Real Estate] 批次 1: 收到内容长度 15234 字符
[Real Estate] 批次 1: 成功解析 JSON，获得 50 条场景词
[Real Estate] 批次 1: gemini-2.5-flash 生成成功，添加 50 条场景词，累计 50 条
```

### Level 2 触发示例
```
[Medical Equipment] 检测到冷门行业，直接使用 gemini-3-flash（联网搜索）
[Medical Equipment] 批次 1: 切换到 gemini-3-flash（联网搜索）...
[Medical Equipment] 批次 1: gemini-3-flash 收到内容长度 18456 字符
[Medical Equipment] 批次 1: gemini-3-flash 成功解析 JSON，获得 50 条场景词
[Medical Equipment] 批次 1: gemini-3-flash 生成成功，添加 50 条场景词，累计 50 条
```

### Level 3 触发示例（极端专业领域）
```
[Aerospace Engineering] 检测到极端专业领域，直接使用 gemini-3-pro（最高质量）
[Aerospace Engineering] 批次 1: 使用 gemini-3-pro（最高质量，联网搜索）...
[Aerospace Engineering] 批次 1: gemini-3-pro 收到内容长度 21567 字符
[Aerospace Engineering] 批次 1: gemini-3-pro 成功解析 JSON，获得 50 条场景词
[Aerospace Engineering] 批次 1: gemini-3-pro 生成成功，添加 50 条场景词，累计 50 条
```

### Level 3 自动 Fallback 示例
```
[Complex Industry] 批次 1: 使用 gemini-2.5-flash 生成...
[Complex Industry] 批次 1: 质量检查失败，需要 fallback 到 gemini-3-flash
[Complex Industry] 批次 1: 切换到 gemini-3-flash（联网搜索）...
[Complex Industry] 批次 1: gemini-3-flash 失败，尝试 gemini-3-pro...
[Complex Industry] 批次 1: 切换到 gemini-3-pro（最高质量，联网搜索）...
[Complex Industry] 批次 1: gemini-3-pro 生成成功，添加 50 条场景词，累计 50 条
```

## ⚙️ 配置

系统默认启用智能 Fallback，无需额外配置。

如果需要强制使用某个模型，可以在 Vercel 环境变量中设置：

```bash
# 强制使用 gemini-3-flash（不推荐，成本较高）
BATCH_GENERATION_MODEL=gemini-3-flash
ENABLE_WEB_SEARCH=true

# 强制使用 gemini-2.5-flash（不推荐，可能失败）
BATCH_GENERATION_MODEL=gemini-2.5-flash
```

**建议：** 保持默认配置，让系统自动选择最优策略。

