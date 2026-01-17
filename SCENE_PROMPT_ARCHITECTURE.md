# 场景与提示词架构重构方案

## 📋 核心原则（必须遵守）

### 一句话结论
- **场景（Use Case）** = "用户为什么用" → 内容与SEO的第一公民
- **提示词（Prompt）** = "模型怎么做" → 内部资产/能力实现

### 绝对铁律
❌ **Prompt 永远不要**：
- 出现在 H1
- 出现在 Answer-first
- 出现在 sitemap
- 出现在 FAQ 中心句
- 作为可索引 URL 的主体

✅ **Prompt 可以（但只能）**：
- 作为 "How to" 的实现示例
- 作为代码块 / 折叠内容
- 作为非索引区块（noindex / client-only）
- 作为产品能力说明，不是内容主体

---

## 🏗️ 正确的关系模型

### 层级结构
```
Industry
  └─ Scene / Use Case   ← 内容与SEO核心（公开，进sitemap）
        └─ Prompt Template(s)  ← 内部资产/能力实现（半公开，不进sitemap）
              └─ Model (Sora / Veo / Gemini)
```

### 3层绑定关系

#### Level 1: Scene → Prompt（一对多）
```sql
Scene {
  id
  industry
  use_case
  description
}

PromptTemplate {
  id
  scene_id          -- 外键关联场景
  model             -- Sora / Veo / Gemini
  role              -- default / fast / high_quality / long_form / ads / social / compliance_safe
  template          -- 提示词内容
  version           -- 版本号
}
```

#### Level 2: Prompt 有"角色"，不是乱堆
Prompt 必须有 `role`（用途标签）：
- `default` - 推荐
- `fast` - 快速生成
- `high_quality` - 高质量
- `long_form` - 长视频
- `ads` - 广告优化
- `social` - 社交媒体优化
- `compliance_safe` - 合规安全

**页面/产品只暴露"用途"，不暴露 prompt 本体**

#### Level 3: 用户看到的是"选择结果"，不是 prompt
UI 上应该是：
```
Choose generation mode:
• Fast (short, lightweight)
• High Quality (cinematic)
• Social Media Optimized
```

而不是：
```
Prompt A
Prompt B
Prompt C
```

---

## 🔧 数据库重构

### 1. 重构 `prompt_library` 表

**新增字段**：
```sql
ALTER TABLE prompt_library
  -- 关联场景
  ADD COLUMN IF NOT EXISTS scene_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  
  -- Prompt 角色和用途
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'default' CHECK (
    role IN ('default', 'fast', 'high_quality', 'long_form', 'ads', 'social', 'compliance_safe')
  ),
  
  -- 模型支持
  ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'sora' CHECK (
    model IN ('sora', 'veo', 'gemini', 'universal')
  ),
  
  -- 版本管理
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  
  -- SEO 控制
  ADD COLUMN IF NOT EXISTS is_indexable BOOLEAN DEFAULT FALSE,  -- 默认不进索引
  ADD COLUMN IF NOT EXISTS is_in_sitemap BOOLEAN DEFAULT FALSE; -- 默认不进sitemap
```

**索引优化**：
```sql
CREATE INDEX IF NOT EXISTS idx_prompt_library_scene_id ON prompt_library(scene_id);
CREATE INDEX IF NOT EXISTS idx_prompt_library_role ON prompt_library(role);
CREATE INDEX IF NOT EXISTS idx_prompt_library_model ON prompt_library(model);
CREATE INDEX IF NOT EXISTS idx_prompt_library_scene_role ON prompt_library(scene_id, role);
```

### 2. 迁移现有数据

**将 `use_cases.featured_prompt_ids` 迁移到 `prompt_library.scene_id`**：
```sql
-- 为现有的 prompt 关联场景
UPDATE prompt_library p
SET scene_id = uc.id
FROM use_cases uc
WHERE p.id = ANY(uc.featured_prompt_ids)
  AND p.scene_id IS NULL;
```

**设置默认 role**：
```sql
-- 为没有 role 的 prompt 设置默认值
UPDATE prompt_library
SET role = 'default'
WHERE role IS NULL;
```

### 3. 废弃 `featured_prompt_ids`（可选）

如果确认新结构稳定，可以：
```sql
-- 移除 use_cases 表中的 featured_prompt_ids 字段（可选）
-- ALTER TABLE use_cases DROP COLUMN featured_prompt_ids;
```

---

## 🚫 SEO/GEO 层面修复

### 1. Prompt 页面添加 noindex

**文件**: `app/prompts/[slug]/page.tsx`

```typescript
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const prompt = await getPromptBySlug(params.slug)
  
  if (!prompt) {
    return { title: 'Prompt Not Found' }
  }

  return {
    title: `${prompt.title} - AI Video Prompt`,
    description: prompt.description || '',
    robots: {
      index: false,  // ❌ 不索引
      follow: false, // ❌ 不跟踪
    },
    // ... 其他元数据
  }
}
```

### 2. 从 sitemap 中移除 prompt 页面

**检查所有 sitemap 文件**，确保不包含 `/prompts/` 路径：
- `app/sitemap.xml/route.ts`
- `app/sitemap-core.xml/route.ts`
- `app/sitemap-static.xml/route.ts`
- 其他 sitemap 文件

### 3. robots.txt 明确禁止

**文件**: `app/robots.ts` 或 `app/robots.txt`

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/prompts/',  // ❌ 禁止抓取 prompt 页面
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap-index.xml`,
  }
}
```

### 4. Prompt 页面移除 H1 中的 prompt 内容

**文件**: `app/prompts/[slug]/page.tsx`

```typescript
// ❌ 错误：H1 包含 prompt 标题
<h1>{prompt.title}</h1>

// ✅ 正确：H1 应该是场景/用途，不是 prompt
<h1>AI Video Generation Tools</h1>
<h2>{prompt.title}</h2>  // 或者移除，只作为工具说明
```

---

## 🎨 UI 层面重构

### 1. Use Case 页面：显示"选择结果"，不显示 prompt

**文件**: `app/use-cases/[slug]/page.tsx`

**当前问题**：直接显示 prompt 内容

**修复方案**：
```typescript
// ❌ 错误：直接显示 prompt
<UseCaseToolEmbed defaultPrompt={prompt.prompt} />

// ✅ 正确：显示"生成模式选择"
<UseCaseToolEmbed 
  useCaseId={useCase.id}
  generationModes={[
    { role: 'fast', label: 'Fast (short, lightweight)', description: 'Quick generation for testing' },
    { role: 'high_quality', label: 'High Quality (cinematic)', description: 'Best visual quality' },
    { role: 'social', label: 'Social Media Optimized', description: 'Optimized for platforms' },
  ]}
/>
```

### 2. Prompt 作为折叠内容/代码块

**在 Use Case 页面中**，prompt 应该：
- 放在 `<details>` 折叠区块
- 或者放在 `<pre>` 代码块中
- 添加 `data-noindex` 属性

```typescript
<details className="mt-4">
  <summary className="cursor-pointer text-sm text-gray-500">
    View Prompt Template (Technical)
  </summary>
  <pre className="mt-2 rounded bg-gray-100 p-4 text-xs" data-noindex>
    {prompt.template}
  </pre>
</details>
```

### 3. 移除 Prompt 独立页面（或改为 noindex）

**选项 A**：完全移除 `/prompts/[slug]` 路由
- 删除 `app/prompts/[slug]/page.tsx`
- 删除 `app/prompts/[slug]/` 目录

**选项 B**：保留但改为内部工具页面
- 添加 `noindex`
- 移除所有 SEO 元数据
- 只作为管理员/内部工具使用

---

## 📊 Admin 后台调整

### 1. Prompt 库定位

**正确理解**：
- Prompt 库是"武器库"，不是产品内容
- 服务于 Scene / Generation，不参与 SEO/GEO

### 2. Admin 结构建议

**保留（核心）**：
- ✅ 使用场景（Use Cases）
- ✅ 提示词库（Prompt Templates）
- ✅ 首页管理
- ✅ 积分 / 消耗

**合并 / 降权**：
- SEO 助手 → 并入「使用场景」内容预览
- AI 助手 → ❌ 删除（Prompt 是能力，不是产品）
- 聊天调试 → 隐藏到 Tools
- 批量生成 → Content → Batches
- 场景配置 → Tools（模型级）

### 3. Prompt 管理界面

**应该显示**：
- Scene 关联（必选）
- Role（用途标签）
- Model（模型支持）
- Version（版本号）
- 是否可索引（默认 false）

**不应该显示**：
- SEO 关键词
- sitemap 状态
- 公开 URL

---

## ✅ 执行检查清单

### 数据库层面
- [ ] 添加 `scene_id` 字段到 `prompt_library`
- [ ] 添加 `role` 字段（default/fast/high_quality等）
- [ ] 添加 `model` 字段（sora/veo/gemini）
- [ ] 添加 `version` 字段
- [ ] 添加 `is_indexable` 和 `is_in_sitemap` 字段
- [ ] 迁移现有 `featured_prompt_ids` 数据
- [ ] 创建索引优化查询

### SEO 层面
- [ ] Prompt 页面添加 `robots: { index: false }`
- [ ] 从所有 sitemap 中移除 `/prompts/` 路径
- [ ] robots.txt 禁止 `/prompts/`
- [ ] Prompt 页面移除 H1 中的 prompt 标题
- [ ] 移除 Prompt 页面的结构化数据（或改为工具页面）

### UI 层面
- [ ] Use Case 页面显示"生成模式选择"，不直接显示 prompt
- [ ] Prompt 内容放在折叠区块/代码块中
- [ ] 添加 `data-noindex` 到 prompt 显示区域
- [ ] 移除或降权 Prompt 独立页面

### Admin 层面
- [ ] Prompt 管理界面显示 scene_id、role、model
- [ ] 移除 Prompt 的 SEO 相关字段
- [ ] 更新 Prompt 创建/编辑表单

### 验证
- [ ] 检查所有 Use Case 页面，确保 prompt 不在 H1
- [ ] 检查 sitemap，确保没有 prompt URL
- [ ] 检查 robots.txt，确保禁止 prompt 路径
- [ ] 测试生成流程，确保用户看到的是"选择结果"

---

## 🎯 判断公式（以后不纠结）

**如果一个页面离开"场景 + 行业"，单独存在是否有意义？**

- ❌ **没意义** → 这是 Prompt / 工具 / 内部资产
- ✅ **有意义** → 才配成为一个页面

**针对 21 万场景词的关键建议**：

- ❌ 不要再让 prompt 扩张
- ❌ 不要 prompt → 页面
- ✅ 继续用 Scene 承载内容
- ✅ Prompt 只做"场景的实现层"

---

## 📝 迁移脚本示例

```sql
-- 1. 添加新字段
ALTER TABLE prompt_library
  ADD COLUMN IF NOT EXISTS scene_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'sora',
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_indexable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_in_sitemap BOOLEAN DEFAULT FALSE;

-- 2. 迁移数据：将 featured_prompt_ids 关联到 scene_id
UPDATE prompt_library p
SET scene_id = uc.id
FROM use_cases uc
WHERE p.id = ANY(uc.featured_prompt_ids)
  AND p.scene_id IS NULL;

-- 3. 设置默认值
UPDATE prompt_library SET role = 'default' WHERE role IS NULL;
UPDATE prompt_library SET model = 'sora' WHERE model IS NULL;
UPDATE prompt_library SET version = 1 WHERE version IS NULL;

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_prompt_library_scene_id ON prompt_library(scene_id);
CREATE INDEX IF NOT EXISTS idx_prompt_library_role ON prompt_library(role);
CREATE INDEX IF NOT EXISTS idx_prompt_library_model ON prompt_library(model);
CREATE INDEX IF NOT EXISTS idx_prompt_library_scene_role ON prompt_library(scene_id, role);
```

---

## 🔗 相关文件

- 数据库迁移: `supabase/migrations/063_refactor_prompt_scene_relationship.sql`
- Use Case 页面: `app/use-cases/[slug]/page.tsx`
- Prompt 页面: `app/prompts/[slug]/page.tsx` (需要修改或删除)
- Sitemap: `app/sitemap*.xml/route.ts`
- Robots: `app/robots.ts`
- Admin Prompt 管理: `app/admin/prompts/AdminPromptsPage.tsx`
