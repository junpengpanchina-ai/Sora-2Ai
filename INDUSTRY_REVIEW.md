# 行业列表审查报告

## 📋 审查目的
评估 100 个行业列表中哪些行业适合 AI 视频生成，哪些可能存在合规风险或不适合。

## ✅ 完全适合的行业（约 70+ 个）
这些行业非常适合 AI 视频生成，主要用于营销、展示、教育等：

- E-commerce, Fashion, Beauty & Cosmetics
- Fitness, Health & Wellness
- Education, Online Courses
- Restaurants, Cafes, Hotels, Travel & Tourism
- Automotive, Technology, Software & SaaS
- Real Estate, Architecture, Interior Design
- Jewelry, Home Decor, Furniture
- Photography, Wedding Planning, Event Planning
- Music, Art, Animation
- ... 等等

## ⚠️ 需要谨慎的行业（建议移除或限制）

### 1. **医疗相关** - 高风险
- `Medical Clinics` - 可能涉及医疗建议，需要专业资质
- `Dental Clinics` - 虽然可以用于环境展示，但医疗内容需谨慎
- `Hospitals` - 医疗内容风险高，可能涉及医疗建议
- `Pharmacies` - 可能涉及药品宣传，需要合规审查

**建议**：如果保留，应严格限制生成内容，仅用于：
- 诊所/医院环境展示（不涉及具体治疗）
- 预约流程说明
- 通用健康科普（非医疗建议）

### 2. **金融相关** - 高风险
- `Finance` - 可能涉及投资建议，需要金融资质
- `Crypto` - 加密货币，许多平台限制，风险投资相关内容

**建议**：如果保留，应限制为：
- 产品功能介绍（非投资建议）
- 教育性内容（风险提示）

### 3. **法律相关** - 高风险
- `Legal Services` - 可能涉及法律建议，需要律师资质

**建议**：如果保留，应限制为：
- 律所介绍（非法律建议）
- 服务流程说明

### 4. **政府/公共机构** - 敏感
- `Government Agencies` - 可能涉及敏感政治内容

**建议**：移除或严格限制

### 5. **其他可能不适合的**
- `Industrial Manufacturing` - 可能太专业，B2B 场景有限
- `Logistics` - B2B 为主，C 端用户较少
- `Printing Companies` - 传统行业，视频需求可能较小

## 🎯 建议操作

### 方案 1：保守方案（推荐）
移除高风险行业，保留约 85-90 个安全的行业：
- 移除：Medical Clinics, Dental Clinics, Hospitals, Pharmacies
- 移除：Crypto（或改为更安全的金融产品）
- 移除：Legal Services
- 移除：Government Agencies

### 方案 2：保留但限制
保留所有行业，但在生成提示词中明确：
- 禁止生成医疗建议、投资建议、法律建议
- 仅用于营销展示、环境介绍、流程说明
- 添加合规提示

## 📊 统计
- 总行业数：100
- 建议保留：约 85-90 个
- 建议移除：约 10-15 个

## 🔍 备注
- **Jewelry（珠宝）**：完全合法，不是赌博，应保留
- **Dental Clinics**：虽然可用于环境展示，但建议移除以避免医疗内容风险

