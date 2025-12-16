# R2 配置总结

## ✅ 当前默认配置（推荐，无需修改）

### 默认行为

**不设置 `R2_AUTO_UPLOAD_VIDEOS` 环境变量**（或设置为 `false`）

```env
# .env.local
# 选项 1: 完全不设置（推荐）
# 不添加 R2_AUTO_UPLOAD_VIDEOS

# 选项 2: 显式设置为 false（明确配置）
R2_AUTO_UPLOAD_VIDEOS=false
```

### 效果

✅ **使用原始 API URL**
- 视频生成后，直接使用 API 返回的原始视频 URL
- 例如：`https://api.example.com/video/xxx.mp4`

✅ **不占用 R2 存储空间**
- 视频文件不会自动上传到 R2
- R2 存储空间保持为空或只存储手动上传的文件

✅ **零存储成本**
- 不使用 R2 存储，因此不产生存储费用
- 成本：$0/月

✅ **灵活性强**
- 如果将来需要，可以随时切换到自动上传
- 或者按需手动上传特定视频到 R2

## 🔄 工作流程（默认配置）

```
1. 用户生成视频
   ↓
2. API 返回视频 URL（原始 API URL）
   ↓
3. 视频 URL 保存到数据库
   ↓
4. 用户通过原始 API URL 访问视频
   ↓
5. R2 存储：未使用（零成本）
```

## ⚙️ 如果需要切换到自动上传

### 设置 `R2_AUTO_UPLOAD_VIDEOS=true`

```env
# .env.local
R2_AUTO_UPLOAD_VIDEOS=true
```

### 效果变化

- ✅ 视频自动上传到 R2
- ⚠️ 占用 R2 存储空间
- 💰 产生存储费用（约 $0.015/GB/月）
- ✅ 视频质量保证（原始质量）

## 📊 配置对比

| 配置 | 存储位置 | R2 成本 | 视频质量 | 推荐场景 |
|------|---------|---------|---------|---------|
| `R2_AUTO_UPLOAD_VIDEOS=false`（默认）| 原始 API URL | $0/月 | 取决于 API | 大多数情况 |
| `R2_AUTO_UPLOAD_VIDEOS=true` | R2 存储 | 按使用量 | 原始质量 | 需要长期保存 |

## 🎯 最佳实践

### 推荐配置（当前默认）

1. **不设置 `R2_AUTO_UPLOAD_VIDEOS`**
   - 节省成本
   - 灵活性强
   - 适合大多数场景

2. **启用 R2 公共访问**
   - 如果将来需要上传视频，确保 R2 已启用公共访问
   - 设置方法见 `R2_ENABLE_PUBLIC_ACCESS.md`

### 何时考虑启用自动上传

- ✅ 需要长期保存所有视频
- ✅ 原始 API URL 可能过期
- ✅ 需要确保视频质量（R2 保持原始质量）
- ✅ 预算允许（存储成本）

### 何时保持默认（不自动上传）

- ✅ 成本控制优先
- ✅ 原始 API URL 稳定可用
- ✅ 不需要长期保存所有视频
- ✅ 测试/开发阶段

## 📝 配置检查清单

- [ ] `.env.local` 中没有设置 `R2_AUTO_UPLOAD_VIDEOS`（或设置为 `false`）
- [ ] R2 公共访问已启用（如需要时使用）
- [ ] R2 API Token 已配置（用于按需上传/管理）

## 🔗 相关文档

- `R2_STORAGE_MANAGEMENT.md` - 存储管理详细说明
- `R2_ENABLE_PUBLIC_ACCESS.md` - 启用公共访问指南
- `R2_STORAGE_LOCATION.md` - 存储位置说明

