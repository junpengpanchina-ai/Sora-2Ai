# 混合方案 GEO 更新指南

## 🎯 方案概述

**混合方案**：方案1（主要）+ 只更新最关键 5,000-10,000 条

- **方案1（主要）**：不更新现有内容，让新内容自然替换
- **补充更新**：只更新最关键的高价值行业 × 高流量关键词内容

## 📋 执行步骤

### 步骤 1：识别优先更新的 Use Case

运行识别脚本：

```bash
# 识别前 10,000 条优先更新的内容
node scripts/identify-priority-use-cases.js --limit=10000 --output=priority-use-cases.json
```

**输出**：
- `priority-use-cases.json` - 包含优先更新的 Use Case 列表
- 显示行业分布、场景类型分布、优先级分数

### 步骤 2：选择要更新的内容

从 `priority-use-cases.json` 中选择：

**推荐选择标准**：
1. **优先级分数 ≥ 70**（高价值行业 + 高流量场景）
2. **S级行业**（前10个行业）
3. **高流量场景类型**（advertising-promotion, social-media-content, product-demo-showcase）

**建议数量**：
- 保守：5,000 条（约 ￥15）
- 标准：10,000 条（约 ￥30）
- 激进：20,000 条（约 ￥60）

### 步骤 3：批量更新（先测试）

**先测试 10 条**：

```bash
# 从 priority-use-cases.json 中提取前 10 个 ID
node scripts/batch-update-geo-content.js \
  --ids=id1,id2,id3,id4,id5,id6,id7,id8,id9,id10 \
  --dry-run \
  --batch=5
```

**检查结果**：
- 查看生成的内容是否符合 GEO 标准
- 确认数据库更新成功
- 检查成本是否在预期范围内

### 步骤 4：正式批量更新

**小批量开始**（100条）：

```bash
# 提取前 100 个 ID（从 priority-use-cases.json）
node scripts/batch-update-geo-content.js \
  --ids=id1,id2,...,id100 \
  --batch=10
```

**逐步扩大**：
- 如果前 100 条成功，继续更新 500 条
- 如果 500 条成功，继续更新 1,000 条
- 依此类推，直到完成目标数量

### 步骤 5：验证更新结果

**检查更新后的内容**：

```sql
-- 在 Supabase SQL Editor 中执行
SELECT 
  id,
  title,
  industry,
  use_case_type,
  -- 检查是否包含 GEO-1
  CASE 
    WHEN content ~* 'In .* AI-generated videos are commonly used' THEN '✅ GEO-1'
    ELSE '❌ 缺少GEO-1'
  END as geo1_status,
  -- 检查是否包含列表
  CASE 
    WHEN content ~* '^- ' OR content ~* '^\d+\. ' THEN '✅ 有列表'
    ELSE '❌ 缺少列表'
  END as list_status,
  -- 检查是否包含FAQ
  CASE 
    WHEN content ~* '(Frequently Asked|FAQ|Questions?)' THEN '✅ 有FAQ'
    ELSE '❌ 缺少FAQ'
  END as faq_status,
  updated_at
FROM use_cases
WHERE id IN ('id1', 'id2', 'id3', ...) -- 替换为实际更新的ID
ORDER BY updated_at DESC
LIMIT 100;
```

## 💰 成本控制

### 分批更新策略

**建议分批大小**：
- 测试：10 条
- 小批量：100 条
- 中批量：500 条
- 大批量：1,000 条

**成本监控**：
- 每批更新后检查 API 使用量
- 计算实际成本 vs 预期成本
- 如果成本超出预期，暂停并调整策略

### 成本估算

| 更新数量 | 预计成本 | 建议批次 |
|---------|---------|---------|
| 1,000 条 | ￥3 | 10批 × 100条 |
| 5,000 条 | ￥15 | 10批 × 500条 |
| 10,000 条 | ￥30 | 10批 × 1,000条 |

## 🎯 优先级选择标准

### 高价值行业（S级 + A+级）

**S级（必须优先）**：
1. Social Media Marketing
2. TikTok Creators
3. Instagram Creators
4. YouTube Creators
5. Digital Marketing Agencies
6. E-commerce Stores
7. Dropshipping Businesses
8. SaaS Companies
9. Product Marketing
10. Personal Branding

**A+级（第二梯队）**：
1. Online Courses
2. Coaches & Consultants
3. Real Estate Marketing
4. Fitness Trainers
5. Beauty & Skincare Brands

### 高流量场景类型

1. **advertising-promotion** - 广告转化
2. **social-media-content** - 短视频内容
3. **product-demo-showcase** - 产品演示

### 优先级分数计算

- **行业价值**：40分（S级）/ 30分（A+级）/ 10分（其他）
- **场景类型**：30分（高流量）/ 15分（其他）
- **已发布状态**：20分
- **质量状态**：10分（approved）/ 5分（pending）
- **SEO关键词**：最多10分

**总分 ≥ 70**：优先更新

## 📊 执行示例

### 示例 1：更新 5,000 条（保守）

```bash
# 1. 识别优先内容
node scripts/identify-priority-use-cases.js --limit=5000 --output=priority-5k.json

# 2. 提取 ID（手动或脚本）
# 假设提取了前 5,000 个 ID

# 3. 分批更新（10批 × 500条）
for i in {1..10}; do
  echo "批次 $i/10"
  node scripts/batch-update-geo-content.js \
    --ids=id1,id2,...,id500 \
    --batch=50
  sleep 60  # 批次间休息1分钟
done
```

**预计成本**：￥15
**预计时间**：2-3 小时

### 示例 2：更新 10,000 条（标准）

```bash
# 1. 识别优先内容
node scripts/identify-priority-use-cases.js --limit=10000 --output=priority-10k.json

# 2. 分批更新（10批 × 1,000条）
for i in {1..10}; do
  echo "批次 $i/10"
  node scripts/batch-update-geo-content.js \
    --ids=id1,id2,...,id1000 \
    --batch=100
  sleep 120  # 批次间休息2分钟
done
```

**预计成本**：￥30
**预计时间**：4-6 小时

## ✅ 验证清单

- [ ] 识别脚本运行成功
- [ ] 选择了合适的更新数量（5,000-10,000条）
- [ ] 测试更新 10 条成功
- [ ] 小批量更新 100 条成功
- [ ] 检查更新后的内容符合 GEO 标准
- [ ] 成本在预期范围内
- [ ] 数据库同步成功

## 🎯 最终建议

**推荐执行方案**：

1. **先测试 100 条**（约 ￥0.3）
   - 验证流程
   - 检查成本
   - 确认效果

2. **如果测试成功，更新 5,000 条**（约 ￥15）
   - 高价值行业 × 高流量关键词
   - 成本可控
   - 快速见效

3. **根据效果决定是否继续**
   - 如果效果好，可以继续更新到 10,000 条
   - 如果效果一般，停止更新，让新内容自然替换

## 📌 注意事项

1. **API 限流**：脚本已包含延迟，避免触发限流
2. **成本监控**：每批更新后检查成本
3. **内容质量**：更新后检查内容是否符合 GEO 标准
4. **数据库备份**：更新前建议备份数据库
5. **逐步扩大**：不要一次性更新太多，先小批量测试

