# P0 + P1 + P2 实现完成

## ✅ 已完成的功能

### P0: OAuth 快速修复指南
**文件**: `./OAUTH_P0_QUICK_FIX.md`

**内容**：
- 10分钟止血步骤（添加 Test users）
- DNS 验证修复 Homepage requirements
- OAuth consent screen URL 检查
- 改为 In production 的完整流程

**立即执行**：
1. 打开 `./OAUTH_P0_QUICK_FIX.md`
2. 按步骤 1-4 执行（10-15 分钟）
3. 客户立刻可以登录

---

### P1: Tier1 Sitemap 分片（基于 AI Citation Score）

**文件**：
- `./app/sitemap-index.xml/route.ts` - 主索引（自动计算分片数）
- `./app/sitemaps/tier1-[n]/route.ts` - 分片 sitemap（每片最多 20k URL）

**功能**：
- ✅ 自动从 `page_scores` 表读取 Tier1 页面数量
- ✅ 自动计算需要多少个分片（每片 20k URL）
- ✅ 按 AI Citation Score 降序排列
- ✅ 包含 `lastmod` 时间戳
- ✅ 缓存 1 小时（避免频繁查询）

**URL 结构**：
- `/sitemap-index.xml` - 主索引（指向所有分片）
- `/sitemaps/tier1-1.xml` - 第 1 片（Top 20k，按 AI Citation Score 降序）
- `/sitemaps/tier1-2.xml` - 第 2 片（Next 20k）
- ...

**使用前准备**：
1. 运行 `npm run calculate:ai-scores:batch` 计算所有页面的 AI Citation Score
2. 确保 `page_scores` 表有数据

---

### P2: AI Citation Score 批处理脚本

**文件**: `./scripts/recalculate-ai-citation-scores.ts`

**功能**：
- ✅ 批量计算所有 `use_cases` 的 AI Citation Score
- ✅ 自动写入 `page_scores` 表
- ✅ 支持分批处理（避免超时）
- ✅ 统计 Tier1/Tier2/Tier3 分布

**使用方法**：
```bash
npm run calculate:ai-scores:batch
```

**输出**：
- 所有页面的 AI Citation Score 写入 `page_scores` 表
- 控制台显示统计信息（Tier1/Tier2/Tier3 数量）

---

## 🚀 立即执行步骤

### 步骤 1: 修复 OAuth（P0，10分钟）

```bash
# 打开修复指南
cat ./OAUTH_P0_QUICK_FIX.md

# 按步骤执行：
# 1. 添加客户邮箱到 Test users（立刻止血）
# 2. DNS 验证（修复 Homepage requirements）
# 3. 检查 3 个 URL 可访问
# 4. 改为 In production
```

---

### 步骤 2: 计算 AI Citation Score（P2，5-10分钟）

```bash
# 确保数据库迁移已应用
# （如果还没应用，见 ./APPLY_MIGRATION_MANUAL.md）

# 运行批处理脚本
npm run calculate:ai-scores:batch

# 等待完成（可能需要几分钟，取决于页面数量）
# 输出示例：
# ✅ 完成！统计结果:
#    总页面: 4000
#    Tier1 (≥80分): 1000 页
#    Tier2 (55-79分): 2000 页
#    Tier3 (<55分): 1000 页
```

---

### 步骤 3: 验证 Tier1 Sitemap（P1，1分钟）

```bash
# 访问主索引
curl https://sora2aivideos.com/sitemap-index.xml

# 应该看到：
# - <sitemap><loc>.../sitemaps/tier1-1.xml</loc></sitemap>
# - <sitemap><loc>.../sitemaps/tier1-2.xml</loc></sitemap>
# - ...

# 访问分片（注意：URL 格式是 tier1-1.xml，不是 tier1/1）
curl https://sora2aivideos.com/sitemaps/tier1-1.xml

# 应该看到 Tier1 页面的 URL 列表（按分数降序）
```

---

## 📊 预期结果

### OAuth（P0）
- ✅ 客户可以登录（不再报 `access_denied`）
- ✅ OAuth consent screen 状态：`In production`
- ✅ Verification Center → Homepage requirements：绿色 ✅

### AI Citation Score（P2）
- ✅ `page_scores` 表有数据
- ✅ Tier1 页面数量：5k~20k（取决于你的内容质量）
- ✅ 所有页面都有分数（0-100）

### Tier1 Sitemap（P1）
- ✅ `/sitemap-index.xml` 自动指向分片
- ✅ `/sitemaps/tier1-1.xml` 包含 Top 20k Tier1 页面
- ✅ 所有 URL 按 AI Citation Score 降序排列
- ✅ 包含 `lastmod` 时间戳

---

## 🔍 验证清单

- [ ] OAuth 修复完成（无痕模式测试登录）
- [ ] AI Citation Score 批处理完成（`page_scores` 表有数据）
- [ ] Tier1 sitemap 可访问（`/sitemap-index.xml` 返回分片列表）
- [ ] Tier1 分片包含 URL（`/sitemaps/tier1-1.xml` 返回 URL 列表）
- [ ] Google Search Console 提交新的 sitemap index

---

## 📝 下一步（可选）

1. **提交 sitemap 到 Google Search Console**：
   - 打开 Google Search Console
   - Sitemaps → 提交 `https://sora2aivideos.com/sitemap-index.xml`

2. **监控索引率**：
   - 等待 1-2 周
   - 检查 Tier1 页面的索引率是否提升到 ≥60%

3. **定期重算 AI Citation Score**：
   - 每周运行一次 `npm run calculate:ai-scores:batch`
   - 确保新页面也被评分

---

## 🆘 故障排除

### 问题 1: `calculate:ai-scores:batch` 报错 "缺少 Supabase 环境变量"
**解决**：确保 `.env.local` 包含：
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 问题 2: `page_scores` 表不存在
**解决**：应用数据库迁移（见 `./APPLY_MIGRATION_MANUAL.md`）

### 问题 3: Tier1 sitemap 返回空
**解决**：
1. 确认 `page_scores` 表有 `tier=1` 的数据
2. 检查查询日志（查看控制台错误）

### 问题 4: OAuth 还是失败
**解决**：
1. 检查 Test users 是否包含客户邮箱
2. 检查 Redirect URIs 是否正确
3. 使用无痕模式测试

---

**完成时间**：约 20-30 分钟  
**优先级**：P0（OAuth）> P2（AI Score）> P1（Sitemap）
