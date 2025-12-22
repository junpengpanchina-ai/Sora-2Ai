# Supabase Pro 计划升级指南

## 🎯 升级步骤

### 步骤 1: 访问 Supabase Dashboard

1. 访问：https://supabase.com/dashboard/org/afwecwqmahxrgmicbpem/settings/billing
2. 或者：
   - 登录 Supabase Dashboard
   - 选择组织 "junpengpanchina-ai's Org"
   - 进入 **Settings** → **Billing**

### 步骤 2: 选择 Pro 计划

1. 在 Billing 页面，找到 **"Upgrade Plan"** 或 **"Change Plan"** 按钮
2. 选择 **Pro Plan** ($25/月)
3. 确认升级

### 步骤 3: 添加支付方式

1. 添加信用卡或 PayPal
2. 确认支付信息
3. 完成订阅

### 步骤 4: 等待生效

- 升级通常立即生效
- 可能需要几分钟刷新配额

## ✅ 升级后的好处

### 立即获得的资源提升

| 资源 | 免费计划 | Pro 计划 | 提升 |
|------|---------|---------|------|
| **数据库大小** | 500 MB | 8 GB | **16倍** ⬆️ |
| **带宽/月** | 5 GB | 50 GB | **10倍** ⬆️ |
| **存储** | 1 GB | 100 GB | **100倍** ⬆️ |
| **最大连接数** | 60 | 200 | **3.3倍** ⬆️ |
| **SLA 保证** | 无 | 99.9% | ⬆️ |
| **备份保留** | 1 天 | 7 天 | ⬆️ |
| **支持** | 社区 | 优先支持 | ⬆️ |

### 解决构建连接错误

- ✅ **连接数从 60 增加到 200**
  - 构建时生成 706 个页面，并发请求不再受限制
  - 解决 `ECONNRESET` 错误

- ✅ **更高的请求速率限制**
  - 减少速率限制导致的错误

- ✅ **更好的性能保证**
  - 99.9% SLA，更稳定的服务

## 💰 费用说明

### Pro 计划费用
- **基础费用**：$25/月
- **按使用量计费**：
  - 超出 8 GB 的磁盘：$0.125/GB/月
  - 超出 50 GB 的带宽：按量计费
  - 其他资源按使用量计费

### 当前使用情况（预计费用）
基于你的使用情况：
- **数据库大小**：0.226 GB（远低于 8 GB，无额外费用）
- **带宽**：0.386 GB（远低于 50 GB，无额外费用）
- **存储**：0 GB（远低于 100 GB，无额外费用）

**预计月度费用**：$25/月（基础费用，无额外费用）

## 🔍 升级后验证

### 1. 检查配额更新

升级后，访问：
https://supabase.com/dashboard/org/afwecwqmahxrgmicbpem/usage?projectRef=hgzpzsiafycwlqrkzbis

确认：
- ✅ 计划显示为 "Pro Plan"
- ✅ 配额已更新（数据库 8 GB，带宽 50 GB，连接 200）

### 2. 测试构建

运行构建命令，验证连接错误是否解决：

```bash
npm run build
```

预期结果：
- ✅ 不再出现 `ECONNRESET` 错误
- ✅ 构建成功完成
- ✅ 所有 706 个页面正常生成

### 3. 监控使用情况

升级后，定期检查使用情况：

```bash
npm run monitor:supabase
```

或访问 Dashboard 查看：
- 数据库大小使用率
- 带宽使用率
- 连接数使用率

## 📊 升级后的优势

### 1. 解决构建问题
- ✅ 200 个连接足够处理构建时的并发请求
- ✅ 更高的请求速率限制
- ✅ 更稳定的服务

### 2. 未来扩展空间
- ✅ 数据库可扩展到 8 GB
- ✅ 带宽可扩展到 50 GB/月
- ✅ 存储可扩展到 100 GB

### 3. 更好的服务
- ✅ 99.9% SLA 保证
- ✅ 7 天备份保留
- ✅ 优先支持

## ⚠️ 注意事项

### 1. 费用管理
- 设置使用量提醒（在 Dashboard 中配置）
- 定期检查使用情况
- 避免意外超出配额

### 2. 监控使用量
- 每周检查一次使用情况
- 确保在配额范围内
- 如有异常，及时调整

### 3. 优化代码（仍然建议）
- 虽然升级解决了资源限制，但优化代码仍然有益：
  - 减少不必要的数据库请求
  - 使用缓存减少带宽
  - 优化查询性能

## 🔗 相关链接

- [Supabase 定价页面](https://supabase.com/pricing)
- [Supabase Dashboard - Billing](https://supabase.com/dashboard/org/afwecwqmahxrgmicbpem/settings/billing)
- [Supabase Dashboard - Usage](https://supabase.com/dashboard/org/afwecwqmahxrgmicbpem/usage?projectRef=hgzpzsiafycwlqrkzbis)
- [Supabase 使用量计费文档](https://supabase.com/docs/guides/platform/usage-based-billing)

## 📝 升级检查清单

- [ ] 访问 Billing 页面
- [ ] 选择 Pro Plan ($25/月)
- [ ] 添加支付方式
- [ ] 确认订阅
- [ ] 等待配额更新（几分钟）
- [ ] 验证计划显示为 "Pro Plan"
- [ ] 运行 `npm run build` 测试
- [ ] 确认构建成功，无连接错误
- [ ] 设置使用量提醒

## 🎉 升级完成后的下一步

1. **测试构建**：运行 `npm run build` 验证问题解决
2. **监控使用**：定期检查使用情况
3. **优化代码**：虽然升级了，但优化代码仍然有益
4. **享受服务**：享受更稳定的服务和更好的性能

---

**升级后，你的 Supabase 项目将拥有：**
- ✅ 200 个并发连接（足够处理构建时的并发请求）
- ✅ 8 GB 数据库空间（16倍提升）
- ✅ 50 GB/月带宽（10倍提升）
- ✅ 99.9% SLA 保证
- ✅ 优先支持

**预计可以解决构建时的连接错误问题！** 🚀

