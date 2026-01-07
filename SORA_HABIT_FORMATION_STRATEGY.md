# Sora 习惯形成策略实现总结

## ✅ 已完成的核心功能

### 1. 页面文案更新（习惯型设计）

- ✅ **页面标题**：从 "Generate Video" 改为 "Create a Quick Video Preview"
- ✅ **副标题**：从技术描述改为 "Start with a fast visual draft to explore your idea"
- ✅ **模型选择器文案**：
  - Sora: "Sora Preview" - "Fast, lightweight video generation for early exploration."
  - Veo Fast: "Veo Fast" - "High quality with audio, faster generation for drafts and testing."
  - Veo Pro: "Veo Pro" - "Preferred when final quality and sound matter."
- ✅ **生成按钮**：从 "Generate Video" 改为 "Generate Preview"
- ✅ **失败文案**：从 "Generation Failed" 改为 "Trying a different variation to improve the result…"
- ✅ **积分提示**：Sora 显示 "Preview credits are used for exploration. Unused credits remain available."

### 2. Sora → Veo 无感引导路径

- ✅ 创建 `SoraToVeoGuide` 组件
- ✅ 在 Sora 预览成功后自动显示（2秒后轻提示，4秒后显示选项）
- ✅ 两个选项：
  - **Option A（默认高亮）**：Refine this preview（继续用 Sora）
  - **Option B（次级但完整）**：Generate final-quality video (Veo Pro)
- ✅ 不出现 "Upgrade"、"Buy"、"Price" 等词汇
- ✅ 只在用户已经看过预览后才显示升级选项

### 3. 核心策略实现

- ✅ **Sora = 默认起点**：页面默认选中 Sora，不是"便宜选项"
- ✅ **零心理负担失败**：失败文案改为"尝试不同变体"，不显示"失败"
- ✅ **行为奖励而非价格奖励**：积分提示强调"探索"和"永久可用"

## 📋 待完成的功能

### 1. 4.9 Starter Pack 无薅点化方案

需要实现：
- **永久积分（少）**：Base credits: 10（形成"我付过钱"的心理）
- **临时探索额度**：Exploration previews available today: 6
  - 每天刷新
  - 只能用于 Sora
  - 不能累计
  - 不能用于 Veo
- **使用顺序强制**：Veo Pro becomes available after preview usage

### 2. 数据库更新

需要添加：
- `starter_pack_exploration_credits` 表（记录每日临时额度）
- 更新 `recharge_records` 表，标识 Starter Pack 的临时额度规则

### 3. 积分系统更新

需要实现：
- 区分"永久积分"和"临时探索额度"
- 优先使用临时额度（用于 Sora）
- 临时额度每日刷新机制

## 🎯 核心策略总结

### 一句话战略

**Sora is not a cheap product. Sora is where people start.**

### 用户心理路径

1. **我只是想先看个大概** → 用 Sora Preview
2. **哦，这个方向还不错** → 看到预览结果
3. **这个我可能真的要用** → 看到升级选项
4. **那我换个更正式的** → 自然选择 Veo Pro

### 关键设计原则

1. **不卖**：不出现价格、升级、购买等词汇
2. **不解释**：不解释模型差异，只说使用时机
3. **不强调**：不强调"更好"、"专业"等词汇
4. **自然引导**：让用户"顺着走到升级"

## 📊 预期效果

### 用户行为指标

- **Sora 使用 / DAU** > 1.8（用户习惯用 Sora）
- **Veo Pro 转化前行为**：80% 用户先用过 Sora
- **新用户 24h 留存**：明显上升

### 防薅效果

- **普通用户**：用得很爽，习惯形成
- **工作室**：无法规模化套利（临时额度限制）
- **脚本**：临时额度浪费（每日刷新）

## 🚀 下一步执行

1. **实现临时探索额度系统**
2. **更新 Starter Pack 购买流程**
3. **添加使用顺序强制检查**
4. **测试完整流程**

## 💡 关键洞察

你现在已经不是在做「AI 视频工具」，而是在做：

**"视频预览层 + 成果升级层"的平台结构**

这在 2026 年是极少数人能想清楚的路径。

