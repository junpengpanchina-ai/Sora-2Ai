# 使用场景参数匹配验证

## ✅ 参数匹配机制

### 当前 Prompt 如何确保匹配

#### 1. **关键词匹配** ✅
```typescript
Use Case Keyword: ${task.keyword}
```
- **在 H1 中使用**：`AI Video Generation for ${task.keyword}`
- **在多个 H2 中使用**：`Why Sora2 is perfect for ${task.keyword}`
- **在内容要求中强调**：`Include specific use cases that Sora2 can handle for ${task.keyword}`

#### 2. **行业匹配** ✅
```typescript
Industry: ${task.industry || 'General'}
```
- **在内容要求中**：`Content must be highly relevant to Sora2's actual features AND the ${task.industry} industry context`
- **在 H1 中使用**：`AI Video Generation for ${task.keyword} in ${task.industry}`
- **在多个 H2 中使用**：`Introduction to ${task.keyword} for ${task.industry}`
- **行业特定指导**：`Emphasize how Sora2 solves real problems specific to ${task.industry} industry`

#### 3. **使用场景类型匹配** ✅
```typescript
Use Case Type: ${task.useCaseType}
```
- **类型特定指导**：
  - `marketing` → "Focus on marketing and promotional content..."
  - `social-media` → "Focus on social media content creation..."
  - `youtube` → "Focus on YouTube video production..."
  - `tiktok` → "Focus on TikTok video creation..."
  - 等等...

---

## 🎯 增强后的匹配机制

### 新增的匹配强化

#### 1. **行业上下文**
```typescript
const industryContext = task.industry 
  ? `This use case is specifically for the ${task.industry} industry. Focus on how AI video generation addresses unique challenges and opportunities in this industry.`
  : 'This is a general use case applicable across multiple industries.'
```

#### 2. **类型上下文**
```typescript
const useCaseTypeContext = {
  'marketing': 'Focus on marketing and promotional content. Emphasize brand storytelling, product showcases, and advertising campaigns.',
  'social-media': 'Focus on social media content creation. Emphasize short-form videos, viral content, and social engagement.',
  // ... 其他类型
}
```

#### 3. **三重强调**
在 Prompt 中多次强调参数：
- **Target Context** 部分明确列出所有参数
- **Content Requirements** 中强调必须匹配这些参数
- **Content Structure** 中每个 H2 都包含参数
- **IMPORTANT** 部分再次强调不能生成通用内容

---

## 📊 匹配验证示例

### 示例 1：健身行业 + 营销类型
**输入参数：**
- Keyword: "AI Video Generator"
- Industry: "Fitness & Sports"
- Type: "marketing"

**生成的内容会：**
- ✅ H1 包含："AI Video Generation for AI Video Generator in Fitness & Sports"
- ✅ 强调健身行业的营销需求
- ✅ 包含健身教程、运动产品推广等具体场景
- ✅ 步骤示例针对健身营销视频

### 示例 2：电商行业 + 产品演示类型
**输入参数：**
- Keyword: "Text to Video AI"
- Industry: "E-commerce & Retail"
- Type: "product-demo"

**生成的内容会：**
- ✅ H1 包含："AI Video Generation for Text to Video AI in E-commerce & Retail"
- ✅ 强调电商产品展示需求
- ✅ 包含产品演示、购物视频等具体场景
- ✅ 步骤示例针对产品演示视频

---

## 🔍 匹配度检查点

### 内容必须包含：
1. ✅ **关键词**：在 H1、H2、内容中多次出现
2. ✅ **行业**：在标题、介绍、示例中体现行业特色
3. ✅ **类型**：内容风格和结构符合选择的类型（营销/社交媒体/YouTube等）

### 禁止生成：
- ❌ 通用内容（不针对特定行业）
- ❌ 模糊描述（不针对特定关键词）
- ❌ 错误类型（营销类型却生成教育内容）

---

## 🎨 匹配强化措施

### 1. **明确禁止通用内容**
```
IMPORTANT: 
- Do NOT generate generic content - make it highly specific to these parameters
```

### 2. **多次强调参数**
- 在 Target Context 中列出
- 在 Content Requirements 中强调
- 在 Content Structure 中每个 H2 都包含
- 在结尾再次强调

### 3. **行业和类型特定指导**
- 根据行业提供上下文
- 根据类型提供内容方向
- 确保生成的内容符合选择的组合

---

## ✅ 结论

**匹配度：高**

通过以下机制确保匹配：
1. ✅ 参数在 Prompt 中多次出现
2. ✅ 行业和类型有专门的上下文指导
3. ✅ 明确禁止生成通用内容
4. ✅ 每个 H2 标题都包含参数
5. ✅ 内容要求中强调必须匹配参数

生成的内容会**高度匹配**选择的：
- 关键词（热搜词）
- 行业（如 Fitness & Sports）
- 使用场景类型（如 marketing）

