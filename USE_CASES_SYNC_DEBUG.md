# Use Cases 数据同步问题调试报告

## 🔍 问题诊断

根据调试脚本的结果，发现了以下问题：

### 数据统计
- **总数据量**: 216,273 条
- **已发布数据** (`is_published=true`): 215,697 条
- **quality_status='approved'**: 215,693 条
- **已发布 + approved**: 查询返回 0 条（异常！）

### 问题原因

1. **RLS 策略可能未更新**
   - 迁移文件 `057_relax_use_cases_rls_policy.sql` 可能未执行
   - 当前 RLS 策略可能只允许 `quality_status='approved'`，不允许 `null`

2. **查询超时**
   - 前端查询时出现超时错误：`canceling statement due to statement timeout`
   - 可能是数据量太大（21万条）导致查询超时

3. **查询条件组合问题**
   - 单独查询 `quality_status='approved'` 正常
   - 但 `is_published=true AND quality_status='approved'` 返回 0 条
   - 可能是索引或查询优化问题

## ✅ 解决方案

### 步骤 1: 执行 RLS 策略迁移

在 Supabase Dashboard > SQL Editor 执行以下 SQL：

```sql
-- 057_relax_use_cases_rls_policy.sql
-- 放宽 use_cases 表的 RLS 策略，允许 quality_status 为 null 或 'approved' 的记录显示

DROP POLICY IF EXISTS use_cases_public_select ON use_cases;
CREATE POLICY use_cases_public_select
  ON use_cases
  FOR SELECT
  TO anon, authenticated
  USING (
    is_published = TRUE 
    AND (quality_status = 'approved' OR quality_status IS NULL)
  );
```

### 步骤 2: 验证 RLS 策略

执行以下 SQL 验证策略是否正确：

```sql
SELECT 
  policyname, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'use_cases';
```

预期结果应该包含 `use_cases_public_select` 策略，条件为：
```
is_published = TRUE AND (quality_status = 'approved' OR quality_status IS NULL)
```

### 步骤 3: 检查索引

确保有适当的索引来优化查询：

```sql
-- 检查现有索引
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'use_cases'
ORDER BY indexname;

-- 如果需要，创建复合索引
CREATE INDEX IF NOT EXISTS idx_use_cases_published_quality 
ON use_cases(is_published, quality_status) 
WHERE is_published = TRUE;
```

### 步骤 4: 测试查询

在 Supabase Dashboard > SQL Editor 测试查询：

```sql
-- 测试 1: 检查数据
SELECT COUNT(*) 
FROM use_cases 
WHERE is_published = TRUE 
  AND (quality_status = 'approved' OR quality_status IS NULL);

-- 测试 2: 获取样本数据
SELECT id, title, is_published, quality_status
FROM use_cases
WHERE is_published = TRUE 
  AND (quality_status = 'approved' OR quality_status IS NULL)
LIMIT 10;
```

### 步骤 5: 检查前端日志

访问 `/use-cases` 页面，查看浏览器控制台和服务器日志：

1. **浏览器控制台**: 查看是否有错误信息
2. **服务器日志**: 查看 `[UseCasesPage]` 开头的调试日志

调试日志会显示：
- 查询参数
- 查询结果（数据长度、总数、错误信息）
- 最终数据统计

## 🔧 调试脚本

已创建以下调试脚本：

1. **`scripts/debug-use-cases-sync.js`**
   - 对比 Service Role 和 Anon Client 的查询结果
   - 检查 RLS 策略影响

2. **`scripts/check-quality-status-values.js`**
   - 检查 `quality_status` 的实际值分布
   - 查看样本数据

3. **`scripts/test-rls-policy.js`**
   - 测试不同的查询条件
   - 诊断 RLS 策略问题

4. **`scripts/check-data-directly.js`**
   - 直接检查数据，不使用复杂查询
   - 验证数据是否存在

运行调试脚本：
```bash
node scripts/debug-use-cases-sync.js
node scripts/check-quality-status-values.js
node scripts/test-rls-policy.js
node scripts/check-data-directly.js
```

## 📝 代码修改

已在 `app/use-cases/page.tsx` 中添加详细的调试日志：

```typescript
console.log('[UseCasesPage] 查询参数:', { type, industry, q, page, pageSize, offset })
console.log('[UseCasesPage] 查询结果:', { dataLength, count, error })
console.log('[UseCasesPage] 最终数据:', { useCasesCount, totalCount, totalPages })
```

这些日志会在服务器端输出，帮助诊断问题。

## 🚀 快速修复

如果急需显示数据，可以临时放宽查询条件（仅用于测试）：

```typescript
// 临时方案：只查询 is_published=true，不限制 quality_status
let query = supabase
  .from('use_cases')
  .select('id, slug, title, description, use_case_type, industry', { count: 'exact' })
  .eq('is_published', true)
  // 暂时移除 quality_status 限制
  .order('created_at', { ascending: false })
```

**注意**: 这只是临时方案，最终需要正确配置 RLS 策略。

## 📊 预期结果

修复后应该看到：
- 前端显示 215,697 条已发布的 use cases
- 查询不再超时
- RLS 策略正确允许访问数据

## ⚠️ 注意事项

1. **数据安全**: 确保 RLS 策略正确配置，不要暴露未审核的数据
2. **性能优化**: 如果数据量很大，考虑添加分页和索引
3. **缓存**: 页面有 1 小时缓存（`revalidate = 3600`），修改后可能需要等待缓存过期

